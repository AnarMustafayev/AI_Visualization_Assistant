// src/hooks/useDataAnalysis.js
import { useState, useEffect, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';

export const useDataAnalysis = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Get chat functions from our new context - with safe defaults
  const { 
    chats = [],
    activeChat = null,
    activeChatDetail = null,
    loading: chatLoading = false,
    processQuery: contextProcessQuery
  } = useChat() || {};

  // Check database connection and get tables
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Try to fetch tables from your API
      const response = await fetch('http://localhost:8000/api/tables');
      if (response.ok) {
        const tables = await response.json();
        setAvailableTables(tables || []);
        setIsConnected(tables && tables.length > 0);
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      setIsConnected(false);
      console.error('Database connection failed:', err);
    }
  };

  const analyzeAndProcessData = useCallback((apiData) => {
    // Add logging at the very beginning
    
    if (!apiData || !apiData.data) {
      return {
        type: 'empty',
        data: [],
        generated_sql: apiData?.generated_sql || '',
        message: 'Sorğunuz nəticə qaytarmadı',
        statistics: {
          totalRows: 0,
          totalColumns: 0,
          dataTypes: {}
        }
      };
    }

    const { data, generated_sql, visualization_type, ai_reasoning } = apiData;
    
    // Add logging here, AFTER the empty check

    
    if (!data || data.length === 0) {
      return {
        type: 'empty',
        data: [],
        generated_sql,
        message: 'Bu sorğu üçün məlumat tapılmadı',
        statistics: {
          totalRows: 0,
          totalColumns: 0,
          dataTypes: {},
          numericStats: {},
          categoryStats: {}
        }
      };
    }

    // Use AI recommendation instead of complex logic
    let finalVisualizationType = visualization_type || 'table';
    
    
    // Log AI decision for debugging
    if (ai_reasoning) {

    }

    // Prepare data based on visualization type
    let chartData = data;
    
    
    // Basic data preparation for specific chart types
    if (finalVisualizationType === 'pie' || finalVisualizationType === 'bar') {
      const columns = Object.keys(data[0] || {});
      
      const categoryColumn = columns.find(col => isNaN(parseFloat(data[0][col]))) || columns[0];
      const valueColumn = columns.find(col => !isNaN(parseFloat(data[0][col]))) || columns[1];
      

      
      if (categoryColumn && valueColumn) {
        chartData = data.map(row => ({
          category: row[categoryColumn] || 'Unknown',
          value: parseFloat(row[valueColumn]) || 0,
          ...row
        }));
      }
    }
    
    // For timeseries, try to detect date column
    if (finalVisualizationType === 'timeseries') {
      const columns = Object.keys(data[0] || {});
      const dateColumn = columns.find(col => !isNaN(Date.parse(data[0][col]))) || columns[0];
      
      chartData = data.map(row => ({
        ...row,
        date: dateColumn ? new Date(row[dateColumn]).toLocaleDateString('az-AZ') : row[dateColumn]
      }));
    }
    
    // For ranking, sort by first numeric column
    if (finalVisualizationType === 'ranking') {
      const columns = Object.keys(data[0] || {});
      const numericColumn = columns.find(col => !isNaN(parseFloat(data[0][col])));
      
      if (numericColumn) {
        chartData = data
          .sort((a, b) => (parseFloat(b[numericColumn]) || 0) - (parseFloat(a[numericColumn]) || 0))
          .map((row, index) => ({ ...row, rank: index + 1 }));
      }
    }

    // Calculate basic statistics
    const statistics = calculateBasicStatistics(data);

    const finalResult = {
      type: finalVisualizationType,
      data: chartData,
      originalData: data,
      generated_sql,
      visualization_type: finalVisualizationType,
      ai_reasoning: ai_reasoning,
      statistics,
      // Keep these for compatibility
      primaryNumericColumn: statistics.numericColumns?.[0],
      primaryCategoryColumn: statistics.categoryColumns?.[0],
      primaryDateColumn: statistics.dateColumns?.[0]
    };



    return finalResult;
  }, []);

  // Simplified statistics calculation
  const calculateBasicStatistics = (data) => {
    const stats = {
      totalRows: data.length,
      totalColumns: Object.keys(data[0] || {}).length,
      dataTypes: {},
      numericColumns: [],
      categoryColumns: [],
      dateColumns: [],
      numericStats: {},
      categoryStats: {}
    };

    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      
      columns.forEach(col => {
        const sampleValues = data.slice(0, 10).map(row => row[col]).filter(val => val !== null && val !== undefined);
        
        if (sampleValues.length === 0) return;

        // Check if numeric
        if (sampleValues.every(val => !isNaN(parseFloat(val)) && isFinite(val))) {
          stats.numericColumns.push(col);
          stats.dataTypes[col] = 'numeric';
          
          // Calculate numeric statistics
          const values = data.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
          if (values.length > 0) {
            stats.numericStats[col] = {
              sum: values.reduce((a, b) => a + b, 0),
              avg: values.reduce((a, b) => a + b, 0) / values.length,
              min: Math.min(...values),
              max: Math.max(...values),
              count: values.length
            };
          }
        }
        // Check if date
        else if (sampleValues.some(val => !isNaN(Date.parse(val)))) {
          stats.dateColumns.push(col);
          stats.dataTypes[col] = 'date';
        }
        // Otherwise it's categorical/text
        else {
          stats.categoryColumns.push(col);
          stats.dataTypes[col] = 'text';
          
          // Calculate category statistics
          const values = data.map(row => row[col]).filter(val => val !== null && val !== undefined);
          const counts = {};
          values.forEach(val => {
            counts[val] = (counts[val] || 0) + 1;
          });
          stats.categoryStats[col] = {
            uniqueCount: Object.keys(counts).length,
            topValues: Object.entries(counts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([value, count]) => ({ value, count }))
          };
        }
      });
    }

    return stats;
  };

  const processQuery = async (userQuery = query) => {
    if (!userQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Use the new chat context to process query
      if (contextProcessQuery) {
        const response = await contextProcessQuery(userQuery);
        
        // Process the data using the updated analysis logic
        const processedResult = analyzeAndProcessData({
          data: response.data,
          generated_sql: response.generated_sql,
          visualization_type: response.visualization_type,
          ai_reasoning: response.ai_reasoning
        });
        
        
        // Set the result for your existing Dashboard component
        setResult(processedResult);
        
        // Clear the query input
        setQuery('');
      }
      
    } catch (err) {
      console.error('❌ Error in processQuery:', err);
      setError(err.message || 'Sorğu işlənərkən xəta baş verdi');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Legacy functions for backward compatibility
  const clearHistory = () => {
  };

  // Convert new chat format to legacy format for existing components - with safe checks
  const chatHistory = Array.isArray(chats) ? chats.map(chat => ({
    id: chat.chat_id,
    query: chat.title,
    timestamp: new Date(chat.updated_at),
    results: chat.message_count > 0
  })) : [];
  
  // Active chat in legacy format - with safe check
  const activeChatLegacy = activeChat ? {
    id: activeChat.chat_id,
    query: activeChat.title,
    timestamp: new Date(activeChat.updated_at),
    results: activeChatDetail?.messages?.length > 0
  } : null;

  const setActiveChat = (chat) => {
  };

  return {
    // Database connection
    isConnected,
    availableTables,
    
    // Query processing
    query,
    setQuery,
    isLoading: isLoading || chatLoading,
    result,
    error,
    processQuery,
    clearError,
    
    // Data analysis functions
    analyzeAndProcessData,
    
    // Legacy chat support (for backward compatibility)
    chatHistory,
    activeChat: activeChatLegacy,
    setActiveChat,
    clearHistory
  };
};
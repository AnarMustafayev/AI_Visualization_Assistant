import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Database, MessageSquare, BarChart3, TrendingUp, Users, Calendar, User } from 'lucide-react';

// Import components
import Sidebar from './Sidebar';
import Header from './Header';
import WelcomeSection from './WelcomeSection';
import ProcessingLoader from './ProcessingLoader';
import ErrorDisplay from './ErrorDisplay';
import StatisticsCards from './StatisticsCards';
import SqlQueryDisplay from './SqlQueryDisplay';
import InputArea from './InputArea';
import { VisualizationRenderer } from './visualizations/VisualizationRenderer';

// Import hooks and context
import { useDataAnalysis } from '../hooks/useDataAnalysis';
import { useChat } from '../contexts/ChatContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Dashboard = () => {
  // Context
  const {
    activeChat,
    activeChatDetail,
    loading: chatLoading,
    error: chatError,
    processQuery,
    hasMessages,
    clearActiveChat
  } = useChat();

  // State management
  console.log("dashboard render");
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [availableTables, setAvailableTables] = useState([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isProcessingNewQuery, setIsProcessingNewQuery] = useState(false);
  
  // Refs
  const textareaRef = useRef(null);
  
  // Hooks
  const { analyzeAndProcessData } = useDataAnalysis();

  // Process steps for loader
  const processSteps = [
    {
      title: 'NLP Analizi',
      description: 'Sorğunuz təbii dil emalı ilə analiz edilir',
      icon: MessageSquare
    },
    {
      title: 'SQL Generasiyası',
      description: 'AI optimal SQL sorğusu yaradır',
      icon: Database
    },
    {
      title: 'Məlumat Çıxarışı',
      description: 'Verilənlər bazasından məlumat alınır',
      icon: BarChart3
    },
    {
      title: 'Ağıllı Vizualizasiya',
      description: 'Məlumat strukturuna görə ən uyğun qrafik seçilir',
      icon: TrendingUp
    }
  ];

  // Quick prompt suggestions
  const quickPrompts = [
    { 
      text: "Kreditlərin statuslara görə faiz bölgüsünü göstər.", 
      icon: Database, 
      category: "schema" 
    },
    { 
      text: "Son 2 ildə müştərilərin orta kredit balının zaman üzrə dəyişməsini göstər.", 
      icon: TrendingUp, 
      category: "trend" 
    },
    { 
      text: "Müştərilərin illik gəliri ilə götürdüyü kredit məbləği arasında qrafik qur", 
      icon: Users, 
      category: "analysis" 
    },
    { 
      text: "Risk kateqoriyalarına görə müştəri sayını müqayisə et.", 
      icon: Calendar, 
      category: "summary" 
    }
  ];

  // Load available tables on component mount
  useEffect(() => {
    fetchAvailableTables();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [prompt]);

  // Update results when active chat changes with debug logging and forced clearing
  useEffect(() => {
  
    
    // FORCE clear all states when chat IDs don't match
    if (activeChat?.chat_id !== activeChatDetail?.chat_id && activeChatDetail?.chat_id) {
      setResults(null);
      setCurrentQuery('');
      setError(null);
    }

    // If no active chat and not processing, clear all states
    if (!activeChat && !isProcessingNewQuery && !loading) {
      setResults(null);
      setCurrentQuery('');
      setError(null);
      setIsProcessingNewQuery(false);
      return;
    }

    // Don't interfere with current processing
    if (isProcessingNewQuery || loading) {
      return;
    }

    // Only show stored results when selecting an existing chat (not processing new ones)
    if (activeChat && activeChatDetail?.messages && !isProcessingNewQuery && !loading) {
      const lastMessage = activeChatDetail.messages[activeChatDetail.messages.length - 1];
      if (lastMessage && lastMessage.visualizations?.length > 0) {
        const lastViz = lastMessage.visualizations[0];
        try {
          const reconstructedResults = {
            generated_sql: lastMessage.generated_sql,
            data: lastViz.data_json,
            type: lastViz.visualization_type,
            visualization_type: lastViz.visualization_type,
            visualization_config: lastViz.chart_config,
            statistics: calculateBasicStats(lastViz.data_json)
          };
          setResults(reconstructedResults);
        } catch (error) {
          setResults(null);
        }
      } else {
        setResults(null);
      }
    }
  }, [activeChat, activeChatDetail, isProcessingNewQuery, loading]);

  // Helper function to calculate basic statistics without heavy processing
  const calculateBasicStats = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return {
        totalRows: 0,
        totalColumns: 0,
        dataTypes: {},
        numericColumns: [],
        categoryColumns: [],
        dateColumns: [],
        numericStats: {},
        categoryStats: {}
      };
    }

    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    return {
      totalRows: data.length,
      totalColumns: columns.length,
      dataTypes: columns.reduce((acc, col) => {
        const value = firstRow[col];
        if (typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value))) {
          acc[col] = 'numeric';
        } else {
          acc[col] = 'text';
        }
        return acc;
      }, {}),
      numericColumns: [],
      categoryColumns: [],
      dateColumns: [],
      numericStats: {},
      categoryStats: {}
    };
  };

  // Helper function to format dates consistently
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} - ${hours}:${minutes}`;
  };

  // Process messages with strict validation and debug logging
  const processedMessages = useMemo(() => {

    
    // STRICT: Only show messages if we have a matching chat and chat detail
    if (!activeChat || !activeChatDetail || activeChat.chat_id !== activeChatDetail.chat_id) {
      return [];
    }
    
    if (!activeChatDetail.messages || activeChatDetail.messages.length === 0) {
      return [];
    }
    
    // Double filter: ensure messages belong to the EXACT current chat
    const validMessages = activeChatDetail.messages.filter(message => {
      const messageValid = !message.chat_id || message.chat_id === activeChat.chat_id;
      if (!messageValid) {
        console.warn('⚠️ Filtering out message from wrong chat:', message.chat_id, 'vs', activeChat.chat_id);
      }
      return messageValid;
    });
    
    
    const processed = validMessages.map(message => {
      if (!message.visualizations || message.visualizations.length === 0) {
        return { ...message, processedVisualizations: [] };
      }
      
      const processedVisualizations = message.visualizations.map(viz => ({
        ...viz,
        reconstructedResults: {
          generated_sql: message.generated_sql,
          data: viz.data_json,
          type: viz.visualization_type,
          visualization_type: viz.visualization_type,
          visualization_config: viz.chart_config,
          statistics: calculateBasicStats(viz.data_json)
        }
      }));
      
      return { ...message, processedVisualizations };
    });
    
    return processed;
  }, [activeChatDetail?.messages, activeChat?.chat_id, activeChatDetail?.chat_id]);

  // Fetch available tables from API
  const fetchAvailableTables = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tables`);
      if (response.ok) {
        const tables = await response.json();
        setAvailableTables(tables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  // Validate query before processing
  const isValidQuery = (query) => {
    const trimmed = query.trim().toLowerCase();
    // Check for empty or very short queries
    if (trimmed.length < 3) return false;
    // Check for generic greetings that won't produce SQL
    const greetings = ['salam', 'hello', 'hi', 'hey', 'necəsən', 'necesen'];
    return !greetings.includes(trimmed);
  };

  // Handle form submission
  const handleSubmit = async () => {
    const query=textareaRef.current?.value || '';
    if (!query.trim()) return;
    
    const userQuery = query.trim();
    
    // Validate query
    if (!isValidQuery(userQuery)) {
      setError('Zəhmət olmasa məlumat bazası haqqında konkret sual yazın. Məsələn: "Müştəri sayını göstər" və ya "Son ayın satışlarını göstər"');
      return;
    }
    
    // Clear current states for new query
    setCurrentQuery(userQuery);
    setLoading(true);
    setError(null);
    setResults(null);
    setCurrentStep(0);
    setIsProcessingNewQuery(true);

    // Clear the prompt immediately after starting submission

    try {
      // Step 1: NLP Analysis
      setCurrentStep(0);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: SQL Generation
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Data Extraction
      setCurrentStep(2);
      
      // Use the context's processQuery method which now ALWAYS creates new chat
      const data = await processQuery(userQuery);

      // Step 4: Smart Visualization
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Analyze data and determine best visualization
      const processedResults = analyzeAndProcessData(data);
      
      setCurrentStep(4);
      setResults(processedResults);
      
    } catch (err) {
      // Handle different types of errors
      let errorMessage = 'Sorğu işlənərkən xəta baş verdi';
      
      if (err.message.includes('empty query')) {
        errorMessage = 'Zəhmət olmasa daha spesifik sual yazın';
      } else if (err.message.includes('500')) {
        errorMessage = 'Server xətası. Zəhmət olmasa yenidən cəhd edin';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Şəbəkə xətası. İnternet bağlantınızı yoxlayın';
      }
      
      setError(errorMessage);
      setCurrentStep(0);
    } finally {
      setLoading(false);
      setIsProcessingNewQuery(false);
    }
  };

  // Handle key press in textarea
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle quick prompt selection
  const handlePromptClick = (promptText) => {
    setPrompt(promptText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.value = promptText; // <-- Add this
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Handle new chat creation - clear local states and context
  const handleNewChat = () => {
    setResults(null);
    setCurrentQuery('');
    setError(null);
    setPrompt('');
    setIsProcessingNewQuery(false);
    // Clear active chat in context
    clearActiveChat();
  };

  // Determine if we should show welcome section - don't show if we're loading a chat or switching chats
  const shouldShowWelcome = (!hasMessages || !hasMessages()) && !results && !loading && !currentQuery && !chatLoading;
  
  // Get current error (prioritize local error over chat error)
  const currentError = error || chatError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex h-screen overflow-hidden">
        {/* Responsive Sidebar - Hidden on smaller screens */}
        <div className="hidden lg:block">
          <Sidebar availableTables={availableTables} onNewChat={handleNewChat} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <Header results={results} />

          {/* Content Area with bottom padding for fixed input */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
            <div className="p-6">
              {/* Error Display */}
              <ErrorDisplay error={currentError} />

              {/* Welcome Section or Results */}
              {shouldShowWelcome ? (
                <WelcomeSection 
                  quickPrompts={quickPrompts} 
                  onPromptClick={handlePromptClick} 
                />
              ) : (
                <div className="space-y-6">
                  {/* Show loading spinner when switching chats to prevent welcome flash */}
                  {chatLoading && processedMessages.length === 0 && !currentQuery && (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-3 text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Chat yüklənir...</span>
                      </div>
                    </div>
                  )}

                  {/* Chat Messages History */}
                  {processedMessages.length > 0 && (
                    <div className="space-y-6">
                      {processedMessages.map((message, index) => (
                        <div key={`${message.message_id}-${activeChat?.chat_id}`} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                          {/* Cleaner Message Header - Icon next to message */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {formatDate(message.created_at)}
                              </span>
                              <span className="text-xs text-gray-400">
                                Chat: {activeChat?.chat_id}
                              </span>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-2.5 flex-shrink-0 shadow-sm">
                                <User className="h-4 w-4 text-white" />
                              </div>
                              <p className="text-gray-900 font-medium text-base leading-relaxed bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500 flex-1">{message.message_text}</p>
                            </div>
                          </div>
                          
                          {/* SQL Query Display */}
                          {message.generated_sql && (
                            <div className="mb-4">
                              <SqlQueryDisplay sql={message.generated_sql} />
                            </div>
                          )}
                          
                          {/* Visualizations */}
                          {message.processedVisualizations?.length > 0 && (
                            <div className="space-y-4">
                              {message.processedVisualizations.map((viz, vizIndex) => (
                                <div key={vizIndex}>
                                  {/* Visualization Header */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <BarChart3 className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-gray-700">
                                      Vizualizasiya: {viz.visualization_type}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({viz.reconstructedResults.statistics.totalRows} sətir)
                                    </span>
                                  </div>
                                  
                                  <VisualizationRenderer results={viz.reconstructedResults} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Current Processing Message */}
                  {currentQuery && !activeChatDetail?.messages?.some(m => m.message_text === currentQuery) && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {formatDate(new Date())}
                          </span>
                          <span className="text-xs text-gray-400">
                            Yeni sorğu
                          </span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-2.5 flex-shrink-0 shadow-sm">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <p className="text-gray-900 font-medium text-base leading-relaxed bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500 flex-1">{currentQuery}</p>
                        </div>
                      </div>

                      {/* Processing Loader */}
                      {loading && (
                        <div className="mt-4">
                          <ProcessingLoader 
                            currentStep={currentStep} 
                            processSteps={processSteps} 
                          />
                        </div>
                      )}

                      {/* Results when processing is complete */}
                      {!loading && results && (
                        <div className="space-y-4 mt-4">
                          <SqlQueryDisplay sql={results.generated_sql} />

                          {results.statistics && results.statistics.totalRows > 0 && results.statistics.dataTypes && (
                            <StatisticsCards statistics={results.statistics} />
                          )}

                          <VisualizationRenderer results={results} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Input Area - Responsive positioning */}
      <div className="fixed bottom-0 left-0 lg:left-80 right-0 z-10">
        <InputArea
          // prompt={prompt}
          // onPromptChange={setPrompt}
          onKeyPress={handleKeyPress}
          onSubmit={handleSubmit}
          loading={loading || chatLoading}
          textareaRef={textareaRef}
        />
      </div>
    </div>
  );
};

export default Dashboard;
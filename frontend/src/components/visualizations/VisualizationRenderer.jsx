import React from 'react';
import TimeSeriesChart from './TimeSeriesChart';
import PieChartView from './PieChartView';
import BarChartView from './BarChartView';
import ScatterChartView from './ScatterChartView';
import RankingTable from './RankingTable';
import DataTable from './DataTable';
import EmptyState from './EmptyState';

export const VisualizationRenderer = ({ results }) => {
  // Handle null/undefined results
  if (!results || !results.data) {
    console.log('VisualizationRenderer: No results or data provided');
    return <EmptyState results={results} />;
  }

  // Handle missing or empty data, or data with an error
  if (results.error || !Array.isArray(results.data) || results.data.length === 0) {
    console.log('VisualizationRenderer: Empty, invalid data or error:', results);
    return <EmptyState results={results} />;
  }

  // Extract visualization type - handle both direct type and nested structure
  const visualizationType = results.type || results.visualization_type || 'table';
  
  console.log('VisualizationRenderer: Rendering type:', visualizationType);
  console.log('VisualizationRenderer: Data sample:', results.data[0]);

  // Transform data based on visualization type
  const transformedResults = transformDataForVisualization(results, visualizationType);

  try {
    switch (visualizationType) {
      case 'timeseries':
        return <TimeSeriesChart results={transformedResults} />;
      case 'pie':
        return <PieChartView results={transformedResults} />;
      case 'bar':
        return <BarChartView results={transformedResults} />;
      case 'scatter':
        return <ScatterChartView results={transformedResults} />;
      case 'ranking':
        return <RankingTable results={transformedResults} />;
      case 'empty':
        return <EmptyState results={results} />;
      case 'table':
      default:
        return <DataTable results={transformedResults} />;
    }
  } catch (error) {
    console.error('VisualizationRenderer: Error rendering component:', error);
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">Vizualizasiya xətası</div>
          <div className="text-sm text-gray-500">
            {visualizationType} komponenti yüklənə bilmədi
          </div>
          <div className="mt-4">
            <DataTable results={transformedResults} />
          </div>
        </div>
      </div>
    );
  }
};

// Transform data to match what each visualization component expects
const transformDataForVisualization = (results, visualizationType) => {
  const { data } = results;
  
  if (!data || data.length === 0) {
    return results;
  }

  const sampleRow = data[0];
  const columns = Object.keys(sampleRow);
  
  // Identify column types
  const numericColumns = columns.filter(col => 
    typeof sampleRow[col] === 'number' || 
    (!isNaN(parseFloat(sampleRow[col])) && isFinite(sampleRow[col]))
  );
  
  const dateColumns = columns.filter(col => {
    const value = sampleRow[col];
    if (!value) return false;
    const dateValue = new Date(value);
    return !isNaN(dateValue.getTime()) && (
      value.toString().includes('-') || 
      value.toString().includes('/') ||
      value.toString().match(/^\d{4}-\d{2}$/) // YYYY-MM format
    );
  });
  
  const textColumns = columns.filter(col => 
    !numericColumns.includes(col) && !dateColumns.includes(col)
  );

  console.log('Column analysis:', {
    numeric: numericColumns,
    date: dateColumns,
    text: textColumns,
    total: columns.length
  });

  let transformedData = [...data];
  let additionalProps = {};

  try {
    switch (visualizationType) {
      case 'bar':
      case 'pie':
        // Transform to category/value format expected by charts
        const categoryCol = textColumns[0] || columns[0];
        const valueCol = numericColumns[0] || columns[1];
        
        if (categoryCol && valueCol) {
          transformedData = data.map(row => ({
            category: row[categoryCol]?.toString() || 'N/A',
            value: parseFloat(row[valueCol]) || 0,
            ...row // Keep original data
          }));
        }
        break;

      case 'timeseries':
        const dateCol = dateColumns[0];
        const numericCol = numericColumns[0];
        
        if (dateCol && numericCol) {
          transformedData = data.map(row => ({
            ...row,
            [dateCol]: formatDateForChart(row[dateCol])
          })).sort((a, b) => new Date(a[dateCol]) - new Date(b[dateCol]));
          
          additionalProps = {
            primaryDateColumn: dateCol,
            primaryNumericColumn: numericCol
          };
        }
        break;

      case 'ranking':
        // Sort by first numeric column and add rank
        const rankingNumCol = numericColumns[0];
        if (rankingNumCol) {
          transformedData = data
            .sort((a, b) => (parseFloat(b[rankingNumCol]) || 0) - (parseFloat(a[rankingNumCol]) || 0))
            .map((row, index) => ({
              ...row,
              rank: index + 1
            }));
        } else {
          transformedData = data.map((row, index) => ({
            ...row,
            rank: index + 1
          }));
        }
        break;

      case 'scatter':
        if (numericColumns.length >= 2) {
          additionalProps = {
            column_info: {
              numeric: numericColumns
            }
          };
        }
        break;
    }
  } catch (error) {
    console.error('Error transforming data:', error);
    // Return original data if transformation fails
    transformedData = data;
  }

  return {
    ...results,
    data: transformedData,
    ...additionalProps
  };
};

// Helper function to format dates consistently
const formatDateForChart = (dateValue) => {
  if (!dateValue) return 'N/A';
  
  // Handle YYYY-MM format (keep as is)
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}$/)) {
    return dateValue;
  }
  
  // Handle full dates
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return dateValue?.toString() || 'N/A';
  
  // Return in YYYY-MM format for monthly data
  return date.toISOString().substring(0, 7);
};
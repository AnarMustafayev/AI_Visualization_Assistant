import React from 'react';
import { BarChart3, TrendingUp, Target, Calculator, Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const BarChartView = ({ results }) => {
  const { data } = results;

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-12 text-gray-500">
          Bar chart məlumatları tapılmadı
        </div>
      </div>
    );
  }

  console.log('BarChart raw data:', data[0]);

  // Auto-detect or use pre-formatted data
  let chartData = data;
  let categoryKey = 'category';
  let valueKey = 'value';

  // If data doesn't have category/value format, detect and transform it
  if (!data[0].hasOwnProperty('category') || !data[0].hasOwnProperty('value')) {
    const sampleRow = data[0];
    const columns = Object.keys(sampleRow);
    
    // Find text column for categories
    const textColumns = columns.filter(col => {
      const value = sampleRow[col];
      return typeof value === 'string' || 
             (value !== null && value !== undefined && isNaN(parseFloat(value)));
    });
    
    // Find numeric column for values
    const numericColumns = columns.filter(col => {
      const value = sampleRow[col];
      return typeof value === 'number' || 
             (!isNaN(parseFloat(value)) && isFinite(value));
    });

    console.log('BarChart column detection:', {
      text: textColumns,
      numeric: numericColumns,
      allColumns: columns
    });

    // Use detected columns or fall back to first available
    categoryKey = textColumns[0] || columns[0];
    valueKey = numericColumns[0] || columns[1] || columns[0];

    // Transform data to standard format
    chartData = data.map(row => ({
      category: row[categoryKey]?.toString() || 'N/A',
      value: parseFloat(row[valueKey]) || 0,
      originalData: row // Keep original for tooltip
    }));
  }

  // Sort by value for better visualization
  const sortedData = [...chartData].sort((a, b) => b.value - a.value);

  // Calculate statistics
  const totalValue = chartData.reduce((sum, d) => sum + d.value, 0);
  const maxValue = Math.max(...chartData.map(d => d.value));
  const avgValue = Math.round(totalValue / chartData.length);
  const categoriesCount = chartData.length;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((payload[0].value / totalValue) * 100).toFixed(1);
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm">
          <div className="font-semibold text-gray-800 mb-2">{label}</div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dəyər:</span>
              <span className="font-semibold text-blue-600">
                {payload[0].value.toLocaleString('az-AZ')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Faiz:</span>
              <span className="font-medium text-green-600">{percentage}%</span>
            </div>
          </div>
          {/* Show additional data if available */}
          {data.originalData && Object.keys(data.originalData).filter(key => 
            key !== categoryKey && key !== valueKey
          ).slice(0, 1).map(key => (
            <div key={key} className="text-gray-500 text-sm mt-2 pt-2 border-t border-gray-100">
              {key}: {data.originalData[key]}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Statistics Cards */}
      <div className="p-6 pb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <Layers className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {categoriesCount}
                </div>
                <div className="text-sm text-gray-600 font-medium">Kateqoriya</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {maxValue.toLocaleString('az-AZ')}
                </div>
                <div className="text-sm text-gray-600 font-medium">Maksimum</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-lg p-2">
                <Target className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {avgValue.toLocaleString('az-AZ')}
                </div>
                <div className="text-sm text-gray-600 font-medium">Orta hədd</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <Calculator className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {totalValue.toLocaleString('az-AZ')}
                </div>
                <div className="text-sm text-gray-600 font-medium">Cəm</div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Source Info */}
        <div className="mb-6 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
          <div className="font-medium text-gray-700 mb-1">Məlumat mənbəyi:</div>
          <div className="flex items-center gap-4">
            <span><span className="font-semibold text-blue-600">{categoryKey}</span> (kateqoriya)</span>
            <span>•</span>
            <span><span className="font-semibold text-green-600">{valueKey}</span> (dəyər)</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <ResponsiveContainer width="100%" height={420}>
            <BarChart 
              data={sortedData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={1}/>
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="category"
                stroke="#6B7280" 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                angle={-45}
                textAnchor="end"
                height={90}
                interval={0}
              />
              <YAxis 
                stroke="#6B7280" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => value.toLocaleString('az-AZ')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
                name="Dəyər"
                stroke="#1D4ED8"
                strokeWidth={0}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Insight */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <span>
            <span className="font-semibold text-gray-700">{sortedData[0]?.category}</span> 
            {' '}ən yüksək dəyərə sahib kateqoriyadır 
            ({sortedData[0]?.value.toLocaleString('az-AZ')})
          </span>
        </div>
      </div>
    </div>
  );
};

export default BarChartView;
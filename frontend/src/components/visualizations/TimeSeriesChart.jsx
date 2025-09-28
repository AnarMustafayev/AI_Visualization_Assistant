import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, Calendar, Activity, BarChart3 } from 'lucide-react';

const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#F8E71C', '#9B9B9B', '#4A4A4A'];

const CustomTooltip = ({ active, payload, label, dateColumn, numericColumn }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200 rounded-xl shadow-lg">
        <div className="font-semibold text-gray-800 mb-2">{label}</div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{numericColumn}:</span>
            <span className="font-semibold text-blue-600">
              {payload[0].value.toLocaleString('az-AZ')}
            </span>
          </div>
          {/* Display other relevant data if available */}
          {Object.keys(data).filter(key => 
            key !== dateColumn && 
            key !== numericColumn && 
            key !== 'originalDate' &&
            data[key] !== undefined && data[key] !== null
          ).slice(0, 2).map(key => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">{key}:</span>
              <span className="text-gray-700 text-sm">{data[key]?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const TimeSeriesChart = ({ results }) => {
  const { data } = results;

  // Auto-detect date and numeric columns from the data
  const sampleRow = data && data.length > 0 ? data[0] : {};
  const columns = Object.keys(sampleRow);
  
  // Find date column
  const dateColumn = results.primaryDateColumn || 
    columns.find(col => {
      const value = sampleRow[col];
      if (!value) return false;
      
      const dateValue = new Date(value);
      return !isNaN(dateValue.getTime()) && (
        value.toString().includes('-') || 
        value.toString().includes('/') ||
        value.toString().match(/^\d{4}-\d{2}$/)
      );
    }) || 
    columns.find(col => /date|time|month|year/i.test(col));

  // Find numeric column for Y-axis
  const numericColumn = results.primaryNumericColumn || 
    columns.find(col => 
      typeof sampleRow[col] === 'number' || 
      (!isNaN(parseFloat(sampleRow[col])) && isFinite(sampleRow[col]))
    ) ||
    columns.find(col => /count|total|sum|amount|value/i.test(col));

  if (!data || data.length === 0 || !dateColumn || !numericColumn) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center py-12 text-gray-500">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Zaman seriyası məlumatı tapılmadı</h3>
          <p className="text-gray-600 mb-2">Tarix və rəqəm sütunları tələb olunur</p>
          {columns.length > 0 && (
            <p className="text-xs text-gray-400 mt-4">
              Mövcud sütunlar: {columns.join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Format data for the chart
  const chartData = data.map(row => ({
    [dateColumn]: formatDateForDisplay(row[dateColumn]),
    [numericColumn]: parseFloat(row[numericColumn]) || 0,
    originalDate: new Date(row[dateColumn]), 
    ...row 
  })).sort((a, b) => a.originalDate - b.originalDate);

  // Calculate statistics
  const values = chartData.map(d => d[numericColumn]);
  const totalValue = values.reduce((sum, val) => sum + val, 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const avgValue = Math.round(totalValue / values.length);
  const dataPointsCount = chartData.length;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Statistics Cards */}
      <div className="p-6 pb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {dataPointsCount}
                </div>
                <div className="text-sm text-gray-600 font-medium">Nöqtə</div>
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
                <Activity className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {avgValue.toLocaleString('az-AZ')}
                </div>
                <div className="text-sm text-gray-600 font-medium">Ortalama</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 rounded-lg p-2">
                <BarChart3 className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {minValue.toLocaleString('az-AZ')}
                </div>
                <div className="text-sm text-gray-600 font-medium">Minimum</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <ResponsiveContainer width="100%" height={450}>
            <AreaChart 
              data={chartData} 
              margin={{ top: 40, right: 30, left: 60, bottom: 80 }}
            >
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey={dateColumn}
                stroke="#6B7280" 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval="preserveStartEnd"
                minTickGap={30}
                label={{ 
                  value: dateColumn, 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { textAnchor: 'middle', fontSize: '14px', fontWeight: '600', fill: '#374151' }
                }}
              />
              <YAxis 
                stroke="#6B7280" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => value.toLocaleString('az-AZ')}
                label={{ 
                  value: numericColumn, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '14px', fontWeight: '600', fill: '#374151' }
                }}
              />
              <Tooltip content={<CustomTooltip dateColumn={dateColumn} numericColumn={numericColumn} />} />
              <Area 
                type="monotone" 
                dataKey={numericColumn}
                stroke={COLORS[0]} 
                fillOpacity={1} 
                fill="url(#colorGradient)" 
                strokeWidth={3}
                dot={{ fill: COLORS[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: COLORS[0], strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Insight */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <span>
            <span className="font-semibold text-blue-600">{dateColumn}</span> əsasında{' '}
            <span className="font-semibold text-green-600">{numericColumn}</span> dəyişimi
            ({dataPointsCount} məlumat nöqtəsi)
          </span>
        </div>
      </div>
    </div>
  );
};

const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return 'N/A';
  
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}$/)) {
    return dateValue;
  }
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    return dateValue?.toString() || 'N/A';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (dateValue.toString().match(/^\d{4}-\d{2}-\d{2}$/)) {
    return `${day}.${month}.${year}`;
  }
  return `${year}-${month}`;
};

export default TimeSeriesChart;
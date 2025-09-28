import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, Target, Activity, Layers } from 'lucide-react';

const ScatterChartView = ({ results }) => {
  const { data, column_info } = results;
  const numericCols = column_info?.numeric || [];

  // Handle empty data or insufficient columns
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-12 text-gray-500">
          Scatter chart məlumatları tapılmadı
        </div>
      </div>
    );
  }

  if (numericCols.length < 2) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-12 text-gray-500">
          Scatter chart üçün ən azı 2 rəqəm sütunu lazımdır
        </div>
      </div>
    );
  }

  const xColumn = numericCols[0];
  const yColumn = numericCols[1];

  // Calculate statistics
  const xValues = data.map(d => parseFloat(d[xColumn]) || 0).filter(v => !isNaN(v));
  const yValues = data.map(d => parseFloat(d[yColumn]) || 0).filter(v => !isNaN(v));
  
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  
  const xAvg = xValues.reduce((a, b) => a + b, 0) / xValues.length;
  const yAvg = yValues.reduce((a, b) => a + b, 0) / yValues.length;
  
  const dataPoints = data.length;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200 rounded-xl shadow-lg">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">{xColumn}:</span>
              <span className="font-semibold text-blue-600">
                {parseFloat(data[xColumn]).toLocaleString('az-AZ', { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">{yColumn}:</span>
              <span className="font-semibold text-green-600">
                {parseFloat(data[yColumn]).toLocaleString('az-AZ', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Chart Container */}
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <ResponsiveContainer width="100%" height={450}>
            <ScatterChart 
              data={data}
              margin={{ top: 40, right: 30, left: 60, bottom: 60 }}
            >
              <defs>
                <radialGradient id="scatterGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.6}/>
                </radialGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey={xColumn}
                stroke="#6B7280" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                name={xColumn}
                label={{ 
                  value: xColumn, 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { textAnchor: 'middle', fontSize: '14px', fontWeight: '600', fill: '#374151' }
                }}
                tickFormatter={(value) => parseFloat(value).toLocaleString('az-AZ', { maximumFractionDigits: 1 })}
              />
              <YAxis 
                dataKey={yColumn}
                stroke="#6B7280" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                name={yColumn}
                label={{ 
                  value: yColumn, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '14px', fontWeight: '600', fill: '#374151' }
                }}
                tickFormatter={(value) => parseFloat(value).toLocaleString('az-AZ', { maximumFractionDigits: 1 })}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                dataKey={yColumn} 
                fill="url(#scatterGradient)"
                stroke="#1D4ED8"
                strokeWidth={1}
                r={6}
                fillOpacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Insight */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Activity className="h-4 w-4 text-blue-500" />
          <span>
            <span className="font-semibold text-blue-600">{xColumn}</span> və{' '}
            <span className="font-semibold text-green-600">{yColumn}</span> arasındakı{' '}
            əlaqəni göstərən {dataPoints} məlumat nöqtəsi
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScatterChartView;
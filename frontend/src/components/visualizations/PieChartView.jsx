import React from 'react';
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#7ED321', '#F8E71C', '#9B9B9B', '#4A4A4A'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-200/50 text-sm">
        <p className="font-semibold text-gray-800">{data.category}</p>
        <p className="text-gray-600">
          <span className="font-medium">{data.value.toLocaleString()}</span> 
          <span className="text-gray-500 ml-2">({(data.percent * 100).toFixed(1)}%)</span>
        </p>
      </div>
    );
  }
  return null;
};

const PieChartView = ({ results }) => {
  const { data } = results;

  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  const dataWithPercent = data.map(entry => ({ 
    ...entry, 
    percent: total > 0 ? entry.value / total : 0 
  }));

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-3xl shadow-xl border border-gray-100/50 overflow-hidden">
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            
            {/* Chart Section */}
            <div className="lg:col-span-3 flex justify-center">
              <div className="relative">
                <ResponsiveContainer width={360} height={360}>
                  <RechartsPie>
                    <Pie
                      data={dataWithPercent}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={150}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {dataWithPercent.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          className="hover:opacity-80 transition-opacity duration-200"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPie>
                </ResponsiveContainer>
                

              </div>
            </div>
            
            {/* Legend Cards */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Kateqoriyalar</h3>
              <div className="space-y-4">
                {dataWithPercent.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-base mb-1">
                          {item.category}
                        </p>
                        <div className="flex items-baseline gap-3">
                          <span className="text-2xl font-bold text-gray-800">
                            {item.value.toLocaleString()}
                          </span>
                          <span className="text-sm font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                            {(item.percent * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default PieChartView;
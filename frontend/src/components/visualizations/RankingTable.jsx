import React from 'react';

const RankingTable = ({ results }) => {
  const { data } = results;

  const getRankBadge = (index, rank) => {
    const position = rank || index + 1;
    
    if (position <= 3) {
      return (
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-md">
          #{position}
        </div>
      );
    } else if (position <= 10) {
      return (
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-sm shadow-sm">
          #{position}
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium text-sm">
          #{position}
        </div>
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden">
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Reytinq Cədvəli</h2>
        </div>
        
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Reytinq
                </th>
                {Object.keys(data[0] || {}).filter(key => key !== 'rank').map((key) => (
                  <th key={key} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {data.slice(0, 50).map((row, index) => (
                <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-all duration-200">
                  <td className="px-6 py-4">
                    {getRankBadge(index, row.rank)}
                  </td>
                  {Object.entries(row).filter(([key]) => key !== 'rank').map(([key, value], i) => (
                    <td key={i} className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {typeof value === 'number' 
                        ? value.toLocaleString('az-AZ', { 
                            minimumFractionDigits: 0, 
                            maximumFractionDigits: 2 
                          }) 
                        : value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RankingTable;
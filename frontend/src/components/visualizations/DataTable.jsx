import React from 'react';
import { Database, FileText, Eye, Grid } from 'lucide-react';

const DataTable = ({ results }) => {
  const { data } = results;

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center py-12 text-gray-500">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Database className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Məlumat tapılmadı</h3>
          <p className="text-gray-600">Göstəriləcək heç bir məlumat yoxdur</p>
        </div>
      </div>
    );
  }

  const columns = Object.keys(data[0] || {});
  const displayedData = data.slice(0, 100);
  const totalRows = data.length;
  const totalColumns = columns.length;

  // Detect column types for better styling
  const getColumnType = (column) => {
    const sampleValues = data.slice(0, 5).map(row => row[column]);
    const numericCount = sampleValues.filter(val => 
      typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val))
    ).length;
    
    if (numericCount >= 3) return 'numeric';
    
    const dateCount = sampleValues.filter(val => 
      val && !isNaN(Date.parse(val))
    ).length;
    
    if (dateCount >= 3) return 'date';
    return 'text';
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Table Container */}
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                <tr>
                  {columns.map((key) => {
                    const columnType = getColumnType(key);
                    return (
                      <th 
                        key={key} 
                        className="px-6 py-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-200"
                      >
                        <div className="flex items-center gap-2">
                          <span>{key.replace(/_/g, ' ')}</span>
                          {columnType === 'numeric' && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full" title="Rəqəm" />
                          )}
                          {columnType === 'date' && (
                            <div className="w-2 h-2 bg-green-400 rounded-full" title="Tarix" />
                          )}
                          {columnType === 'text' && (
                            <div className="w-2 h-2 bg-gray-400 rounded-full" title="Mətn" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white">
                {displayedData.map((row, index) => (
                  <tr 
                    key={index} 
                    className="border-b border-gray-100 hover:bg-gray-50/80 transition-all duration-150"
                  >
                    {columns.map((key, i) => {
                      const columnType = getColumnType(key);
                      const value = row[key];
                      
                      return (
                        <td key={i} className="px-6 py-4 text-sm">
                          <div className={`${
                            columnType === 'numeric' 
                              ? 'text-right font-medium text-blue-700' 
                              : columnType === 'date'
                              ? 'text-gray-700'
                              : 'text-gray-900'
                          }`}>
                            {typeof value === 'number' 
                              ? value.toLocaleString('az-AZ', { 
                                  minimumFractionDigits: 0, 
                                  maximumFractionDigits: 2 
                                }) 
                              : String(value || '-')}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      {data.length > 100 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Eye className="h-4 w-4 text-orange-500" />
            <span>
              <span className="font-semibold text-orange-600">100</span> sətirdən{' '}
              <span className="font-semibold text-gray-700">{totalRows}</span> sətir göstərilir.
              Tam məlumat üçün sorğunuzu dəqiqləşdirin.
            </span>
          </div>
        </div>
      )}
      
      {data.length <= 100 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Database className="h-4 w-4 text-blue-500" />
            <span>
              <span className="font-semibold text-blue-600">{totalRows}</span> sətir,{' '}
              <span className="font-semibold text-green-600">{totalColumns}</span> sütun məlumat
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
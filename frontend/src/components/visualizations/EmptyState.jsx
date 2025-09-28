import React from 'react';
import { Search, Database, AlertCircle } from 'lucide-react';

const EmptyState = ({ results }) => {
  const hasQuery = results?.query_info?.query;
  const hasError = results?.error;

  let icon = <Search className="h-8 w-8 text-gray-400" />;
  let title = "Məlumat tapılmadı";
  let message = "Bu sorğu üçün məlumat yoxdur.";

  if (hasError) {
    icon = <AlertCircle className="h-8 w-8 text-red-500" />;
    title = "Xəta Baş verdi";
    message = results.error || "Məlumatı yükləyərkən bir xəta baş verdi. Zəhmət olmasa, yenidən cəhd edin.";
  } else if (hasQuery) {
    icon = <Database className="h-8 w-8 text-blue-400" />;
    title = "Sorğu Nəticəsi Yoxdur";
    message = `"${results.query_info.query}" sorğusu üçün heç bir nəticə tapılmadı.`;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center min-h-[200px]">
      <div className="text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
          {icon}
        </div>
        
        {/* Title and Message */}
        <h3 className="text-xl font-semibold text-gray-800 mb-3">
          {title}
        </h3>
        <p className="text-gray-600 mb-6 max-w-sm">
          {message}
        </p>

        {/* Optional: Add a call to action or suggestion if no data */}
        {!hasError && !hasQuery && (
          <p className="text-sm text-gray-500">
            Zəhmət olmasa, fərqli bir sorğu ilə cəhd edin və ya məlumat mənbəyini yoxlayın.
          </p>
        )}

        {hasError && results.query_info?.query && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm break-all">
            <p className="font-semibold">Sorğu:</p>
            <p className="font-mono text-xs mt-1">{results.query_info.query}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default EmptyState;
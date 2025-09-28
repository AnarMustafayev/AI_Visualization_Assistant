import React, { useState } from 'react';
import { Database, Copy, Check, Eye, EyeOff } from 'lucide-react';

const SqlQueryDisplay = ({ sql }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sql) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL:', err);
    }
  };

  // Format SQL for better readability
  const formatSql = (sqlString) => {
    return sqlString
      .replace(/\bSELECT\b/gi, 'SELECT')
      .replace(/\bFROM\b/gi, '\nFROM')
      .replace(/\bJOIN\b/gi, '\nJOIN')
      .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN')
      .replace(/\bRIGHT JOIN\b/gi, '\nRIGHT JOIN')
      .replace(/\bINNER JOIN\b/gi, '\nINNER JOIN')
      .replace(/\bWHERE\b/gi, '\nWHERE')
      .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
      .replace(/\bHAVING\b/gi, '\nHAVING')
      .replace(/\bORDER BY\b/gi, '\nORDER BY')
      .replace(/\bLIMIT\b/gi, '\nLIMIT')
      .replace(/\bUNION\b/gi, '\nUNION')
      .replace(/\bAND\b/g, '\n  AND')
      .replace(/\bOR\b/g, '\n  OR')
      .trim();
  };

  const formattedSql = formatSql(sql);
  const sqlLines = formattedSql.split('\n');
  const shouldShowToggle = sqlLines.length > 5;
  const displaySql = isExpanded || !shouldShowToggle 
    ? formattedSql 
    : sqlLines.slice(0, 3).join('\n') + '\n...';

  return (
    <div className="bg-gray-900 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Database className="h-4 w-4" />
          Yaradılan SQL Sorğusu
        </h4>
        <div className="flex items-center gap-2">
          {shouldShowToggle && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-gray-300 hover:text-white transition-colors"
            >
              {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {isExpanded ? 'Gizlət' : 'Tam göstər'}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-gray-300 hover:text-white transition-colors"
          >
            {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {isCopied ? 'Kopyalandı' : 'Kopyala'}
          </button>
        </div>
      </div>
      <pre className="text-sm bg-gray-800 rounded-lg p-4 overflow-x-auto">
        <code className="whitespace-pre-wrap">{displaySql}</code>
      </pre>
    </div>
  );
};

export default SqlQueryDisplay;
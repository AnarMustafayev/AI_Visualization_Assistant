import React from 'react';
import { Send } from 'lucide-react';

const InputArea = ({ 

  onKeyPress, 
  onSubmit, 
  loading, 
  textareaRef 
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-t border-slate-200/30 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50">
            <textarea
              ref={textareaRef}
              onKeyDown={onKeyPress}
              placeholder="Sualınızı yazın..."
              className="w-full resize-none bg-transparent px-4 py-3 focus:outline-none placeholder-gray-500 text-gray-800 rounded-2xl min-h-[48px] max-h-32"
              rows={1}
              disabled={loading}
            />
          </div>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl transition-colors shadow-sm"
            aria-label={loading ? "İşlənir..." : "Mesaj göndər"}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
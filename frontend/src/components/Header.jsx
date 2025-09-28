import React from 'react';
import { BarChart3 } from 'lucide-react';

const Header = ({ results }) => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-4">
      <div className="flex items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">
            Vizualizasiya Assistenti
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Header;
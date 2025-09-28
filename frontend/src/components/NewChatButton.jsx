import React from 'react';
import { Plus } from 'lucide-react';

const NewChatButton = ({ onClick, isCreatingNewChat = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={isCreatingNewChat}
      className={`
        w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed 
        transition-all duration-200 mb-4
        ${isCreatingNewChat 
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed text-gray-400' 
          : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-600 hover:text-blue-700'
        }
      `}
    >
      <div className={`
        p-1.5 rounded-full 
        ${isCreatingNewChat ? 'bg-gray-200' : 'bg-blue-100'}
      `}>
        <Plus className={`h-4 w-4 ${isCreatingNewChat ? 'animate-spin' : ''}`} />
      </div>
      <span className="font-medium">
        {isCreatingNewChat ? 'Yeni chat yaradılır...' : 'Yeni Chat'}
      </span>
    </button>
  );
};

export default NewChatButton;
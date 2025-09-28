import React, { useState } from 'react';
import { History, Database, Loader } from 'lucide-react';
import NewChatButton from './NewChatButton';
import ChatListItem from './ChatListItem';
import { useChat } from '../contexts/ChatContext';

const Sidebar = ({ availableTables = [] }) => {
  const {
    chats,
    activeChat,
    loading,
    error,
    selectChat,
    deleteChat,
    updateChatTitle,
    clearActiveChat
  } = useChat();

  // Handle starting a new chat
  const handleStartNewChat = () => {
    clearActiveChat();
  };

  return (
    <div className="w-80 bg-white/95 backdrop-blur-sm shadow-xl border-r border-gray-200/50 flex flex-col flex-shrink-0 h-full">
      {/* Header with New Chat Button */}
      <div className="p-4 border-b border-gray-100/80 flex-shrink-0">
        <NewChatButton 
          onClick={handleStartNewChat} 
          loading={loading}
        />
      </div>
      
      {/* Chat History Section - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Section Header */}
        <div className="p-4 pb-2 flex-shrink-0">
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <History className="h-4 w-4" />
            Chat Tarixi
          </h3>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 mx-4 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && chats.length === 0 && (
          <div className="flex items-center justify-center py-8 flex-shrink-0">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader className="h-5 w-5 animate-spin" />
              <span className="text-sm">Chatlar yüklənir...</span>
            </div>
          </div>
        )}

        {/* Scrollable Chat List */}
        <div className="px-4 pb-4 space-y-1 flex-shrink-0">
          {chats.length === 0 && !loading ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Hələ heç bir chat yoxdur</p>
              <p className="text-gray-400 text-xs mt-1">İlk sorğunuzu yazın</p>
            </div>
          ) : (
            chats.map((chat) => (
              <ChatListItem
                key={chat.chat_id}
                chat={chat}
                isActive={activeChat?.chat_id === chat.chat_id}
                onSelect={selectChat}
                onDelete={deleteChat}
                onUpdateTitle={updateChatTitle}
                loading={loading && activeChat?.chat_id === chat.chat_id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 
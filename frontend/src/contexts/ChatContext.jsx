import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useChatPersistence } from '../hooks/useChatPersistence';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  // State management
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatDetail, setActiveChatDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hook for database operations
  const {
    loadChats,
    loadChatDetail,
    createChat,
    deleteChat: deleteChatFromDB,
    updateChatTitle,
    processAndSaveQuery,
    clearError
  } = useChatPersistence();

  // Load all chats on mount
  useEffect(() => {
    loadAllChats();
  }, []);

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Load all chats from database
  const loadAllChats = useCallback(async () => {
    try {
      setLoading(true);
      const loadedChats = await loadChats();
      setChats(loadedChats);
    } catch (err) {
      setError(err.message || 'Chatlar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, [loadChats]);

  // Create new chat (only when actually needed)
  const handleCreateChat = useCallback(async (title = null) => {
    try {
      const newChat = await createChat(title);
      
      // Add to local state
      setChats(prevChats => [newChat, ...prevChats]);
      
      // Set as active chat
      setActiveChat(newChat);
      setActiveChatDetail({
        ...newChat,
        messages: []
      });
      
      return newChat;
    } catch (err) {
      setError(err.message || 'Yeni chat yaradıla bilmədi');
      throw err;
    }
  }, [createChat]);

  // Select and load chat detail with complete state isolation
  const handleSelectChat = useCallback(async (chat) => {
    if (activeChat?.chat_id === chat.chat_id) return;

    try {
      setLoading(true);
      
      // COMPLETE state reset - ensure no contamination
      setActiveChat(null);
      setActiveChatDetail(null);
      
      // Longer delay to ensure React state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now set the new chat and load its data
      setActiveChat(chat);
      const chatDetail = await loadChatDetail(chat.chat_id);
      
      // Validate that the loaded chat detail matches the requested chat
      if (chatDetail.chat_id !== chat.chat_id) {
        console.error('❌ Chat detail mismatch! Requested:', chat.chat_id, 'Got:', chatDetail.chat_id);
        throw new Error('Chat məlumatları uyğun gəlmir');
      }
      
      setActiveChatDetail(chatDetail);
      
    } catch (err) {
      console.error('❌ Error loading chat:', err);
      setError(err.message || 'Chat məlumatları yüklənərkən xəta baş verdi');
      // Reset states on error
      setActiveChat(null);
      setActiveChatDetail(null);
    } finally {
      setLoading(false);
    }
  }, [loadChatDetail]);

  // Delete chat
  const handleDeleteChat = useCallback(async (chatId) => {
    try {
      await deleteChatFromDB(chatId);
      
      // Remove from local state
      setChats(prevChats => prevChats.filter(chat => chat.chat_id !== chatId));
      
      // If deleted chat was active, clear active chat
      if (activeChat?.chat_id === chatId) {
        setActiveChat(null);
        setActiveChatDetail(null);
      }
    } catch (err) {
      setError(err.message || 'Chat silinərkən xəta baş verdi');
      throw err;
    }
  }, [activeChat, deleteChatFromDB]);

  // Update chat title
  const handleUpdateChatTitle = useCallback(async (chatId, newTitle) => {
    try {
      await updateChatTitle(chatId, newTitle);
      
      // Update local state
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.chat_id === chatId 
            ? { ...chat, title: newTitle, updated_at: new Date().toISOString() }
            : chat
        )
      );
      
      // Update active chat if it's the same one
      if (activeChat?.chat_id === chatId) {
        setActiveChat(prev => ({ ...prev, title: newTitle }));
      }
      
      // Update active chat detail if it's the same one
      if (activeChatDetail?.chat_id === chatId) {
        setActiveChatDetail(prev => ({ ...prev, title: newTitle }));
      }
    } catch (err) {
      setError(err.message || 'Chat başlığı yenilənərkən xəta baş verdi');
      throw err;
    }
  }, [activeChat, activeChatDetail, updateChatTitle]);

  // Process query with smart chat management - new chat only when needed
  const handleProcessQuery = useCallback(async (query) => {
    try {
      setLoading(true);
      
      let chatToUse = activeChat;
      let isNewChat = false;
      
      // Only create a new chat if there's no active chat
      if (!activeChat) {
        chatToUse = await handleCreateChat("Sorğu işlənir...");
        isNewChat = true;
      }
      
      // Process query and save to the chat (existing or new)
      const processedResults = await processAndSaveQuery(query, chatToUse.chat_id);
      
      // If this is a new chat and we got a title from AI, update it
      if (isNewChat && processedResults.chat_title) {
        try {
          await handleUpdateChatTitle(chatToUse.chat_id, processedResults.chat_title);
        } catch (titleError) {
          console.warn('Failed to update chat title:', titleError);
        }
      }
      
      // Reload active chat detail to get the new message
      const updatedChatDetail = await loadChatDetail(chatToUse.chat_id);
      setActiveChatDetail(updatedChatDetail);
      
      // Update chat list (move to top and update message count)
      await loadAllChats();
      
      return processedResults;
      
    } catch (err) {
      // If processing failed and this was a new chat, clean up
      if (activeChat?.chat_id && activeChat.title === "Sorğu işlənir...") {
        try {
          await handleDeleteChat(activeChat.chat_id);
        } catch (cleanupError) {
          console.error('Failed to cleanup empty chat:', cleanupError);
        }
      }
      
      setError(err.message || 'Sorğu işlənərkən xəta baş verdi');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeChat, handleCreateChat, processAndSaveQuery, loadChatDetail, loadAllChats, handleUpdateChatTitle, handleDeleteChat]);

  // Clear active chat (start fresh) - WITHOUT creating a new chat in DB
  const handleClearActiveChat = useCallback(() => {
    setActiveChat(null);
    setActiveChatDetail(null);
  }, []);

  // Clear all error states
  const handleClearError = useCallback(() => {
    setError(null);
    clearError();
  }, [clearError]);

  // Check if there are any messages in active chat
  const hasMessages = useCallback(() => {
    return activeChatDetail?.messages && activeChatDetail.messages.length > 0;
  }, [activeChatDetail]);

  const contextValue = {
    // State
    chats,
    activeChat,
    activeChatDetail,
    loading,
    error,
    
    // Chat management
    createChat: handleCreateChat,
    selectChat: handleSelectChat,
    deleteChat: handleDeleteChat,
    updateChatTitle: handleUpdateChatTitle,
    clearActiveChat: handleClearActiveChat,
    
    // Message/Query processing
    processQuery: handleProcessQuery,
    
    // Utility functions
    refreshChats: loadAllChats,
    clearError: handleClearError,
    hasMessages,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};
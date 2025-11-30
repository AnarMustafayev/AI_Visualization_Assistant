const API_BASE_URL = 'http://localhost:8000';

class ChatService {
  // Chat CRUD operations
  async createChat(title = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Chat yaradıla bilmədi');
      }

      return await response.json();
    } catch (error) {
      console.error('Chat yaradılarkən xəta:', error);
      throw error;
    }
  }

  async getAllChats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats`);
      
      if (!response.ok) {
        throw new Error('Chatlər alına bilmədi');
      }

      return await response.json();
    } catch (error) {
      console.error('Chatlər alınarkən xəta:', error);
      throw error;
    }
  }

  async getChatDetail(chatId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Chat tapılmadı');
        }
        throw new Error('Chat məlumatları alına bilmədi');
      }

      return await response.json();
    } catch (error) {
      console.error('Chat məlumatları alınarkən xəta:', error);
      throw error;
    }
  }

  async deleteChat(chatId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Chat silinə bilmədi');
      }

      return await response.json();
    } catch (error) {
      console.error('Chat silinərkən xəta:', error);
      throw error;
    }
  }

  async updateChatTitle(chatId, title) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/title`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('Chat başlığı yenilənə bilmədi');
      }

      return await response.json();
    } catch (error) {
      console.error('Chat başlığı yenilənərkən xəta:', error);
      throw error;
    }
  }

  async autoUpdateChatTitle(chatId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/auto-title`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Avtomatik başlıq yenilənə bilmədi');
      }

      return await response.json();
    } catch (error) {
      console.error('Avtomatik başlıq yenilənərkən xəta:', error);
      throw error;
    }
  }

  // Message operations
  async createMessage(chatId, messageText, generatedSql = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_text: messageText,
          generated_sql: generatedSql,
        }),
      });

      if (!response.ok) {
        throw new Error('Mesaj yaradıla bilmədi');
      }

      return await response.json();
    } catch (error) {
      console.error('Mesaj yaradılarkən xəta:', error);
      throw error;
    }
  }

  async createMessageWithVisualization(chatId, messageText, generatedSql = null, visualization = null) {
    try {
      const payload = {
        message_text: messageText,
        generated_sql: generatedSql,
      };

      if (visualization) {
        payload.visualization = {
          visualization_type: visualization.type,
          data_json: visualization.data,
          chart_config: visualization.config || null,
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages-with-viz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Mesaj və vizualizasiya yaradıla bilmədi');
      }

      return await response.json();
    } catch (error) {
      console.error('Mesaj və vizualizasiya yaradılarkən xəta:', error);
      throw error;
    }
  }

  async createVisualization(messageId, visualizationType, dataJson, chartConfig = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}/visualizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visualization_type: visualizationType,
          data_json: dataJson,
          chart_config: chartConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('Vizualizasiya yaradıla bilmədi');
      }

      return await response.json();
    } catch (error) {
      console.error('Vizualizasiya yaradılarkən xəta:', error);
      throw error;
    }
  }

  // Combined operation: Create chat with first message and visualization
  async createChatWithMessage(messageText, generatedSql, visualization = null) {
    try {
      // First create a new chat
      const chat = await this.createChat();
      
      // Then create message with visualization
      const message = await this.createMessageWithVisualization(
        chat.chat_id, 
        messageText, 
        generatedSql, 
        visualization
      );

      // Auto-update chat title based on first message
      try {
        await this.autoUpdateChatTitle(chat.chat_id);
      } catch (titleError) {
        console.warn('Chat başlığı avtomatik yenilənə bilmədi:', titleError);
      }

      return { chat, message };
    } catch (error) {
      console.error('Chat və mesaj yaradılarkən xəta:', error);
      throw error;
    }
  }

  // Data analysis endpoint (existing functionality)
  async processQuery(query, chatId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query,
          analyze_structure: true 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Sorğu zamanı xəta baş verdi');
      }

      const data = await response.json();
      
      // If we have a chatId, save this to the database
      if (chatId) {
        try {
          // Create the payload in the exact format the backend expects
          const payload = {
            message_text: query,
            generated_sql: data.generated_sql || null,
            visualization: {
              visualization_type: data.visualization_type || 'table',
              data_json: data.data || [],
              chart_config: data.visualization_config || null
            }
          };


          const saveResponse = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages-with-viz`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            console.error('Mesaj saxlama xətası:', errorData);
            console.error('Full error details:', JSON.stringify(errorData, null, 2));
            // Don't throw, just log the error
          } else {
          }
          
        } catch (saveError) {
          console.error('Chat-ə saxlanarkən xəta:', saveError);
          // Don't throw here, return the data anyway
        }
      }

      return data;
    } catch (error) {
      console.error('Sorğu icra edilərkən xəta:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
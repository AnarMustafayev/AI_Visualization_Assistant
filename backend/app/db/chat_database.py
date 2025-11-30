import psycopg2
import psycopg2.extras
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path='.env')


DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT'),
    'database': os.getenv('DB_DATABASE_chat'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD')
}


def get_db_connection():
    """PostgreSQL verilənlər bazasına əlaqə yaradır."""
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

class ChatDatabaseManager:
    """Chat verilənlər bazası əməliyyatlarını idarə edir."""
    
    def __init__(self):
        pass
    
    def create_chat(self, title: Optional[str] = None) -> Dict[str, Any]:
        """Yeni chat yaradır."""
        try:
            conn = get_db_connection()
            if not conn:
                return {"error": "Database connection failed"}
            
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            
            if not title:
                title = f"Yeni Chat - {datetime.now().strftime('%d.%m.%Y %H:%M')}"
            
            cursor.execute("""
                INSERT INTO chats (title) 
                VALUES (%s) 
                RETURNING chat_id, title, created_at, updated_at
            """, (title,))
            
            chat = cursor.fetchone()
            conn.commit()
            conn.close()
            
            return dict(chat)
            
        except Exception as e:
            print(f"Chat yaradılarkən xəta: {e}")
            if conn:
                conn.close()
            return {"error": f"Chat yaradılarkən xəta: {str(e)}"}
    
    def get_all_chats(self) -> List[Dict[str, Any]]:
        """Bütün chatləri qaytarır (message sayı ilə)."""
        try:
            conn = get_db_connection()
            if not conn:
                return []
            
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute("""
                SELECT 
                    c.chat_id, 
                    c.title, 
                    c.created_at, 
                    c.updated_at,
                    COUNT(cm.message_id) as message_count
                FROM chats c
                LEFT JOIN chat_messages cm ON c.chat_id = cm.chat_id
                GROUP BY c.chat_id, c.title, c.created_at, c.updated_at
                ORDER BY c.updated_at DESC
            """)
            
            chats = cursor.fetchall()
            conn.close()
            
            return [dict(chat) for chat in chats]
            
        except Exception as e:
            print(f"Chatlər alınarkən xəta: {e}")
            return []
    
    def get_chat_detail(self, chat_id: int) -> Optional[Dict[str, Any]]:
        """Müəyyən chat-in bütün məlumatlarını qaytarır."""
        try:
            conn = get_db_connection()
            if not conn:
                return None
            
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get Chat info
            cursor.execute("""
                SELECT chat_id, title, created_at, updated_at 
                FROM chats 
                WHERE chat_id = %s
            """, (chat_id,))
            
            chat = cursor.fetchone()
            if not chat:
                conn.close()
                return None
            
            # Get Chat messages
            cursor.execute("""
                SELECT 
                    message_id, chat_id, message_text, 
                    generated_sql, message_order, created_at
                FROM chat_messages 
                WHERE chat_id = %s 
                ORDER BY message_order ASC
            """, (chat_id,))
            
            messages = cursor.fetchall()
            
            # Get all visualizations for each message
            chat_data = dict(chat)
            chat_data['messages'] = []
            
            for message in messages:
                message_data = dict(message)
                
                cursor.execute("""
                    SELECT viz_id, message_id, visualization_type, 
                           data_json, chart_config, created_at
                    FROM chat_visualizations 
                    WHERE message_id = %s 
                    ORDER BY created_at ASC
                """, (message['message_id'],))
                
                visualizations = cursor.fetchall()
                message_data['visualizations'] = [dict(viz) for viz in visualizations]
                chat_data['messages'].append(message_data)
            
            conn.close()
            return chat_data
            
        except Exception as e:
            print(f"Chat detalları alınarkən xəta: {e}")
            if conn:
                conn.close()
            return None
    
    def create_message(self, chat_id: int, message_text: str, 
                      generated_sql: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Chat-ə yeni mesaj əlavə edir."""
        try:
            conn = get_db_connection()
            if not conn:
                return None
            
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
           
            cursor.execute("""
                SELECT COALESCE(MAX(message_order), 0) + 1 as next_order 
                FROM chat_messages 
                WHERE chat_id = %s
            """, (chat_id,))
            
            next_order = cursor.fetchone()['next_order']
            
            # Mesagge 
            cursor.execute("""
                INSERT INTO chat_messages (chat_id, message_text, generated_sql, message_order)
                VALUES (%s, %s, %s, %s)
                RETURNING message_id, chat_id, message_text, generated_sql, message_order, created_at
            """, (chat_id, message_text, generated_sql, next_order))
            
            message = cursor.fetchone()
            
            # Chat update 
            cursor.execute("""
                UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE chat_id = %s
            """, (chat_id,))
            
            conn.commit()
            conn.close()
            
            message_data = dict(message)
            message_data['visualizations'] = []
            return message_data
            
        except Exception as e:
            print(f"Mesaj yaradılarkən xəta: {e}")
            if conn:
                conn.close()
            return None
    
    def create_visualization(self, message_id: int, visualization_type: str,
                           data_json: Dict[str, Any], 
                           chart_config: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """Mesaja vizualizasiya əlavə edir."""
        try:
            conn = get_db_connection()
            if not conn:
                return None
            
            cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            cursor.execute("""
                INSERT INTO chat_visualizations 
                (message_id, visualization_type, data_json, chart_config)
                VALUES (%s, %s, %s, %s)
                RETURNING viz_id, message_id, visualization_type, data_json, chart_config, created_at
            """, (message_id, visualization_type, json.dumps(data_json), 
                  json.dumps(chart_config) if chart_config else None))
            
            visualization = cursor.fetchone()
            conn.commit()
            conn.close()
            
            return dict(visualization)
            
        except Exception as e:
            print(f"Vizualizasiya yaradılarkən xəta: {e}")
            if conn:
                conn.close()
            return None
    
    def update_chat_title(self, chat_id: int, title: str) -> bool:
        """Chat başlığını yeniləyir."""
        try:
            conn = get_db_connection()
            if not conn:
                return False
            
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE chats 
                SET title = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE chat_id = %s
            """, (title, chat_id))
            
            success = cursor.rowcount > 0
            conn.commit()
            conn.close()
            
            return success
            
        except Exception as e:
            print(f"Chat başlığı yenilənərkən xəta: {e}")
            if conn:
                conn.close()
            return False
    
    def delete_chat(self, chat_id: int) -> bool:
        """Chat-i silir (CASCADE ilə bütün mesaj və vizualizasiyalar da silinir)."""
        try:
            conn = get_db_connection()
            if not conn:
                return False
            
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM chats WHERE chat_id = %s", (chat_id,))
            
            success = cursor.rowcount > 0
            conn.commit()
            conn.close()
            
            return success
            
        except Exception as e:
            print(f"Chat silinərkən xəta: {e}")
            if conn:
                conn.close()
            return False
    
    def generate_title_from_message(self, message_text: str) -> str:
        """Mesajdan avtomatik başlıq yaradır."""
        # Select first 8 words from the message
        words = message_text.strip().split()[:8]  # İlk 8 söz
        title = " ".join(words)
        
        if len(title) > 50:
            title = title[:50] + "..."
        elif len(title) == 0:
            title = "Yeni Chat"
            
        return title

    def delete_empty_chats(self):
        """Boş chat-ləri silir (mesajı olmayan)."""
        try:
            conn = get_db_connection()
            if not conn:
                return False
            
            cursor = conn.cursor()
            
            # Delete chats with no messages
            cursor.execute("""
                DELETE FROM chats 
                WHERE chat_id NOT IN (
                    SELECT DISTINCT chat_id FROM chat_messages
                )
            """)
            
            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            print(f"Deleted {deleted_count} empty chats")
            return deleted_count > 0
            
        except Exception as e:
            print(f"Empty chat cleanup error: {e}")
            if conn:
                conn.close()
            return False

    def cleanup_failed_chats(self):
        """Temporary titles ilə qalan chat-ləri təmizləyir."""
        try:
            conn = get_db_connection()
            if not conn:
                return False
            
            cursor = conn.cursor()
            
            
            cursor.execute("""
                DELETE FROM chats 
                WHERE (title LIKE '%işlənir%' OR title LIKE 'Yeni sorğu%')
                AND chat_id NOT IN (
                    SELECT DISTINCT chat_id FROM chat_messages
                )
            """)
            
            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            print(f"Cleaned up {deleted_count} failed chats")
            return deleted_count > 0
            
        except Exception as e:
            print(f"Failed chat cleanup error: {e}")
            if conn:
                conn.close()
            return False

# Singleton instance
chat_db = ChatDatabaseManager()
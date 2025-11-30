from fastapi import APIRouter, HTTPException
from typing import List
from app.models.chat_models import (
    CreateChatRequest, CreateMessageRequest, CreateVisualizationRequest,
    UpdateChatTitleRequest, CreateMessageWithVisualizationRequest,
    Chat, ChatDetail, ChatMessage, ChatVisualization
)
from app.db.chat_database import chat_db

router = APIRouter(tags=["Chat Management"])

@router.post("/chats", response_model=Chat)
async def create_chat(request: CreateChatRequest):
    """Yeni chat yaradır."""
    try:
        result = chat_db.create_chat(request.title)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Message count 0 
        result['message_count'] = 0
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat yaradılarkən xəta: {str(e)}")

@router.get("/chats", response_model=List[Chat])
async def get_all_chats():
    """Bütün chatləri qaytarır."""
    try:
        chats = chat_db.get_all_chats()
        return chats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatlər alınarkən xəta: {str(e)}")

@router.get("/chats/{chat_id}", response_model=ChatDetail)
async def get_chat_detail(chat_id: int):
    """Müəyyən chat-in bütün məlumatlarını qaytarır."""
    try:
        chat = chat_db.get_chat_detail(chat_id)
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat tapılmadı")
        
        return chat
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat məlumatları alınarkən xəta: {str(e)}")

@router.post("/chats/{chat_id}/messages", response_model=ChatMessage)
async def create_message(chat_id: int, request: CreateMessageRequest):
    """Chat-ə yeni mesaj əlavə edir."""
    try:
        # Check if chat exists
        chat = chat_db.get_chat_detail(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat tapılmadı")
        
        message = chat_db.create_message(
            chat_id=chat_id,
            message_text=request.message_text,
            generated_sql=request.generated_sql
        )
        
        if not message:
            raise HTTPException(status_code=500, detail="Mesaj yaradıla bilmədi")
        
        return message
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mesaj yaradılarkən xəta: {str(e)}")

@router.post("/chats/{chat_id}/messages-with-viz", response_model=ChatMessage)
async def create_message_with_visualization(chat_id: int, request: CreateMessageWithVisualizationRequest):
    """Chat-ə mesaj və vizualizasiya birlikdə əlavə edir."""
    try:
        # Check if chat exists
        chat = chat_db.get_chat_detail(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat tapılmadı")
        
        # Create message first
        message = chat_db.create_message(
            chat_id=chat_id,
            message_text=request.message_text,
            generated_sql=request.generated_sql
        )
        
        if not message:
            raise HTTPException(status_code=500, detail="Mesaj yaradıla bilmədi")
        
        # Then create visualization if provided
        if request.visualization:
            visualization = chat_db.create_visualization(
                message_id=message['message_id'],
                visualization_type=request.visualization.visualization_type,
                data_json=request.visualization.data_json,
                chart_config=request.visualization.chart_config
            )
            
            if visualization:
                message['visualizations'] = [visualization]
        
        return message
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mesaj və vizualizasiya yaradılarkən xəta: {str(e)}")

@router.post("/messages/{message_id}/visualizations", response_model=ChatVisualization)
async def create_visualization(message_id: int, request: CreateVisualizationRequest):
    """Mesaja vizualizasiya əlavə edir."""
    try:
        visualization = chat_db.create_visualization(
            message_id=message_id,
            visualization_type=request.visualization_type,
            data_json=request.data_json,
            chart_config=request.chart_config
        )
        
        if not visualization:
            raise HTTPException(status_code=500, detail="Vizualizasiya yaradıla bilmədi")
        
        return visualization
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vizualizasiya yaradılarkən xəta: {str(e)}")

@router.put("/chats/{chat_id}/title")
async def update_chat_title(chat_id: int, request: UpdateChatTitleRequest):
    """Chat başlığını yeniləyir."""
    try:
        success = chat_db.update_chat_title(chat_id, request.title)
        
        if not success:
            raise HTTPException(status_code=404, detail="Chat tapılmadı və ya yenilənə bilmədi")
        
        return {"message": "Chat başlığı uğurla yeniləndi"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat başlığı yenilənərkən xəta: {str(e)}")

@router.put("/chats/{chat_id}/auto-title")
async def auto_update_chat_title(chat_id: int):
    """Chat-in ilk mesajından avtomatik başlıq yaradır."""
    try:
        chat = chat_db.get_chat_detail(chat_id)
        
        if not chat:
            raise HTTPException(status_code=404, detail="Chat tapılmadı")
        
        if not chat['messages']:
            raise HTTPException(status_code=400, detail="Chat-də mesaj yoxdur")
        
        # Get first message text to generate title
        first_message = chat['messages'][0]['message_text']
        new_title = chat_db.generate_title_from_message(first_message)
        
        success = chat_db.update_chat_title(chat_id, new_title)
        
        if not success:
            raise HTTPException(status_code=500, detail="Chat başlığı yenilənə bilmədi")
        
        return {"message": "Chat başlığı avtomatik olaraq yeniləndi", "title": new_title}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Avtomatik başlıq yenilənərkən xəta: {str(e)}")

@router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: int):
    """Chat-i silir."""
    try:
        success = chat_db.delete_chat(chat_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Chat tapılmadı və ya silinə bilmədi")
        
        return {"message": "Chat uğurla silindi"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat silinərkən xəta: {str(e)}")
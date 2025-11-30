import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(dotenv_path='.env')

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY tapılmadı. Zəhmət olmasa, backend/.env faylını yoxlayın.")

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

def convert_natural_language_to_sql(natural_language_query, db_schema):
    """Təbii dil sorğusunu SQL-ə çevirir, vizualizasiya tövsiyyəsi və chat başlığı verir."""
    prompt = f"""
    Sən Azərbaycan dilində yazılmış təbii dil sorğularını PostgreSQL koduna çevirən və ən uyğun vizualizasiya növünü təyin edən peşəkar köməkçisən.
    
    Verilənlər bazasının sxemi:
    {db_schema}
    
    İstifadəçinin sorğusu: "{natural_language_query}"
    
    Aşağıdakı JSON formatında cavab ver:
    {{
        "sql": "SQL sorğusu buraya",
        "visualization_type": "vizualizasiya növü",
        "chat_title": "qısa və aydın başlıq",
        "reasoning": "qısa izahat"
    }}
    
    Mövcud vizualizasiya növləri:
    - "table": Ətraflı məlumat cədvəli, çox sütun və ya mətn məlumatları üçün
    - "bar": Kateqoriyalar arasında müqayisə, rəqəmsal dəyərlər üçün
    - "pie": Faizli paylaşım, az kateqoriya (2-8 arası) üçün
    - "timeseries": Vaxt üzrə dəyişiklik, tarix məlumatları üçün
    - "scatter": İki rəqəmsal dəyər arasında əlaqə
    - "ranking": Sıralama və reytinq üçün
    
    Chat başlığı qaydaları:
    - 2-4 söz, qısa və məzmunlu
    - Sorğunun əsas məqsədini əks etdirsin
    - Nümunələr: "Filial Balansları", "Müştəri Analizi", "Aylıq Trend", "Kart Növləri"
    
    Vizualizasiya seçimi qaydaları:
    - Kateqoriyalar + rəqəmsal dəyərlər = "bar"
    - Faizlik paylaşım sorğuları = "pie"  
    - Tarix/vaxt + dəyərlər = "timeseries"
    - "Top", "ən yaxşı", "sıralama" sorğuları = "ranking"
    - İki rəqəmsal sütun = "scatter"
    - Əks halda = "table"
    
    YALNIZ JSON formatında cavab ver, əlavə mətn yox.
    """
    
    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        
        if "```json" in response_text:
            response_text = response_text.replace("```json", "").replace("```", "")
        
        
        try:
            result = json.loads(response_text)
            return {
                "sql": result.get("sql", "").strip(),
                "visualization_type": result.get("visualization_type", "table"),
                "chat_title": result.get("chat_title", "Yeni Chat"),
                "reasoning": result.get("reasoning", "")
            }
        except json.JSONDecodeError:
            sql_only = response_text
            if "```sql" in sql_only:
                sql_only = sql_only.replace("```sql", "").replace("```", "")
            
            return {
                "sql": sql_only.strip(),
                "visualization_type": "table",
                "chat_title": "Yeni Chat",
                "reasoning": "JSON parse xətası, default values"
            }
            
    except Exception as e:
        return {
            "sql": f"Gemini API xətası: {str(e)}",
            "visualization_type": "table",
            "chat_title": "Xətalı Chat",
            "reasoning": "API xətası"
        }
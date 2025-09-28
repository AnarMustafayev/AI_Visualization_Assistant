import psycopg2
import pandas as pd
import os
from sqlalchemy import create_engine
from urllib.parse import quote_plus
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path='.env')



DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT'),
    'database': os.getenv('DB_DATABASE'),
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

def get_sqlalchemy_engine():
    """SQLAlchemy engine yaradır (pandas üçün)."""
    try:
        # Password-də xüsusi simvollar varsa, onları encode edirik
        password = quote_plus(DB_CONFIG['password'])
        
        connection_string = f"postgresql://{DB_CONFIG['user']}:{password}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
        engine = create_engine(connection_string)
        return engine
    except Exception as e:
        print(f"SQLAlchemy engine creation error: {e}")
        return None

def get_db_schema():
    """PostgreSQL verilənlər bazasının sxemini qaytarır."""
    schema = ""
    try:
        conn = get_db_connection()
        if not conn:
            return None
            
        cursor = conn.cursor()
        
        # PostgreSQL-də cədvəllərin siyahısını alırıq
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE';
        """)
        tables = cursor.fetchall()
        
        if not tables:
            print("No tables found in database")
            conn.close()
            return None
        
        # Hər cədvəlin strukturunu alırıq
        for table_name in tables:
            cursor.execute(f"""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = '{table_name[0]}'
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            
            schema += f"\nTable: {table_name[0]}\n"
            schema += "-" * 50 + "\n"
            for col in columns:
                schema += f"  {col[0]} | {col[1]} | Nullable: {col[2]} | Default: {col[3]}\n"
            schema += "\n"
                
        conn.close()
        print(f"Schema retrieved successfully: {len(tables)} tables found")
        return schema
        
    except Exception as e:
        print(f"Sxem alınarkən xəta baş verdi: {e}")
        return None

def execute_sql_query(sql_query):
    """SQL sorğusunu icra edir və nəticəni JSON formatında qaytarır."""
    try:
        print(f"Executing SQL: {sql_query}")
        
        # SQLAlchemy engine ilə pandas istifadə edirik
        engine = get_sqlalchemy_engine()
        if not engine:
            return {"error": "Database engine creation failed"}
        
        df = pd.read_sql_query(sql_query, engine)
        
        # Pandas DataFrame-i JSON-a çeviririk
        result = df.to_dict(orient='records')
        print(f"Query executed successfully, returned {len(result)} rows")
        return result
        
    except Exception as e:
        error_msg = f"SQL icrası zamanı xəta: {str(e)}"
        print(error_msg)
        return {"error": error_msg}

def execute_sql_query_with_psycopg2(sql_query):
    """Alternativ: Yalnız psycopg2 istifadə edərək SQL sorğusu icra edir."""
    try:
        print(f"Executing SQL with psycopg2: {sql_query}")
        
        conn = get_db_connection()
        if not conn:
            return {"error": "Database connection failed"}
        
        cursor = conn.cursor()
        cursor.execute(sql_query)
        
        # Sütun adlarını alırıq
        column_names = [desc[0] for desc in cursor.description]
        
        # Məlumatları alırıq
        rows = cursor.fetchall()
        
        # Dictionary formatına çeviririk
        result = []
        for row in rows:
            result.append(dict(zip(column_names, row)))
        
        conn.close()
        print(f"Query executed successfully, returned {len(result)} rows")
        return result
        
    except Exception as e:
        error_msg = f"SQL icrası zamanı xəta: {str(e)}"
        print(error_msg)
        return {"error": error_msg}

# Test funksiyası
def test_connection():
    """Verilənlər bazasına əlaqəni test edir."""
    try:
        conn = get_db_connection()
        if conn:
            print("PostgreSQL connection successful!")
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"PostgreSQL version: {version[0]}")
            conn.close()
            return True
        else:
            print("PostgreSQL connection failed!")
            return False
    except Exception as e:
        print(f"Connection test error: {e}")
        return False

# Usage example
if __name__ == "__main__":
    # Test connection
    if test_connection():
        # Get database schema
        schema = get_db_schema()
        if schema:
            print("Database Schema:")
            print(schema)
        
        
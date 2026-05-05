import httpx
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

def get_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

async def db_get(table: str, params: dict = {}):
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=get_headers(),
            params=params
        )
        r.raise_for_status()
        return r.json()

async def db_post(table: str, data: dict):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=get_headers(),
            json=data
        )
        r.raise_for_status()
        return r.json()

async def db_patch(table: str, id: str, data: dict):
    async with httpx.AsyncClient() as client:
        r = await client.patch(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers=get_headers(),
            params={"id": f"eq.{id}"},
            json=data
        )
        r.raise_for_status()
        return r.json()
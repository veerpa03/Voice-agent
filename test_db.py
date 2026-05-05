import asyncio
from db.client import db_get

async def test():
    result = await db_get("menu_items")
    print(result)

asyncio.run(test())
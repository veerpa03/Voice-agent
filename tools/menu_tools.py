from db.client import db_get

async def get_menu() -> dict:
    items = await db_get("menu_items", {"available": "eq.true", "select": "*,customizations(*)"})
    
    menu = {}
    for item in items:
        category = item["category"]
        if category not in menu:
            menu[category] = []
        
        menu[category].append({
            "name": item["name"],
            "description": item["description"],
            "price": item["price"],
            "customizations": [
                {
                    "name": c["name"],
                    "options": c["options"],
                    "extra_cost": c["price_delta"]
                }
                for c in item.get("customizations", [])
            ]
        })
    
    return {"menu": menu}
from db.client import db_get, db_post
import uuid

# In-memory cart per call session
# key = phone_number or session_id, value = list of items
_carts: dict = {}

def get_cart(session_id: str) -> list:
    return _carts.get(session_id, [])

def clear_cart(session_id: str):
    _carts[session_id] = []

async def add_item(session_id: str, item_name: str, quantity: int, customizations: dict = {}) -> dict:
    # Look up item in DB
    results = await db_get("menu_items", {
        "name": f"ilike.{item_name}",
        "available": "eq.true"
    })

    if not results:
        return {"success": False, "message": f"Sorry, {item_name} is not available or not on the menu."}

    item = results[0]

    # Add to cart
    if session_id not in _carts:
        _carts[session_id] = []

    _carts[session_id].append({
        "item_id": item["id"],
        "item_name": item["name"],
        "quantity": quantity,
        "unit_price": item["price"],
        "customizations_chosen": customizations
    })

    total_for_item = item["price"] * quantity
    return {
        "success": True,
        "message": f"Added {quantity}x {item['name']} for ${total_for_item:.2f}",
        "cart_size": len(_carts[session_id])
    }

async def get_order_summary(session_id: str) -> dict:
    cart = get_cart(session_id)

    if not cart:
        return {"success": False, "message": "No items in order yet."}

    total = sum(item["unit_price"] * item["quantity"] for item in cart)
    lines = [f"{i['quantity']}x {i['item_name']} ${i['unit_price'] * i['quantity']:.2f}" for i in cart]

    return {
        "success": True,
        "items": lines,
        "total": f"${total:.2f}"
    }

async def place_order(session_id: str, phone_number: str = "") -> dict:
    cart = get_cart(session_id)

    if not cart:
        return {"success": False, "message": "No items to place."}

    total = sum(item["unit_price"] * item["quantity"] for item in cart)

    # Create order in DB
    order = await db_post("orders", {
        "phone_number": phone_number,
        "status": "pending",
        "total": total
    })

    order_id = order[0]["id"]

    # Insert each line item
    for item in cart:
        await db_post("order_items", {
            "order_id": order_id,
            "item_id": item["item_id"],
            "item_name": item["item_name"],
            "quantity": item["quantity"],
            "unit_price": item["unit_price"],
            "customizations_chosen": item["customizations_chosen"]
        })

    clear_cart(session_id)

    return {
        "success": True,
        "order_id": order_id,
        "total": f"${total:.2f}",
        "message": f"Order placed! Your total is ${total:.2f}. Please pull forward."
    }
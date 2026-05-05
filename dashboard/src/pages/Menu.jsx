import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Menu() {
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", category: "" })

  const fetchItems = async () => {
    const { data } = await supabase.from("menu_items").select("*").order("category")
    if (data) setItems(data)
  }

  useEffect(() => { fetchItems() }, [])

  const toggleAvailable = async (id, current) => {
    await supabase.from("menu_items").update({ available: !current }).eq("id", id)
    fetchItems()
  }

  const addItem = async () => {
    if (!newItem.name || !newItem.price) return
    await supabase.from("menu_items").insert({
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
      category: newItem.category,
      available: true
    })
    setNewItem({ name: "", description: "", price: "", category: "" })
    fetchItems()
  }

  const deleteItem = async (id) => {
    await supabase.from("menu_items").delete().eq("id", id)
    fetchItems()
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Menu Manager</h2>

      {/* Add new item */}
      <div style={{ background: "#f9f9f9", borderRadius: 12, padding: 16, marginBottom: 24, border: "1px solid #eee" }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Add Item</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[["name", "Name"], ["description", "Description"], ["price", "Price"], ["category", "Category"]].map(([key, label]) => (
            <input key={key} placeholder={label} value={newItem[key]}
              onChange={e => setNewItem({ ...newItem, [key]: e.target.value })}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
            />
          ))}
        </div>
        <button onClick={addItem} style={{
          marginTop: 10, padding: "8px 20px", borderRadius: 8,
          background: "#000", color: "#fff", border: "none", cursor: "pointer", fontWeight: 500
        }}>Add to Menu</button>
      </div>

      {/* Menu items list */}
      {items.map(item => (
        <div key={item.id} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px", borderRadius: 10, border: "1px solid #eee",
          marginBottom: 8, background: item.available ? "#fff" : "#f9f9f9",
          opacity: item.available ? 1 : 0.6
        }}>
          <div>
            <span style={{ fontWeight: 500 }}>{item.name}</span>
            <span style={{ marginLeft: 8, color: "#888", fontSize: 13 }}>{item.category}</span>
            <span style={{ marginLeft: 8, fontSize: 13 }}>${item.price}</span>
            {item.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#aaa" }}>{item.description}</p>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => toggleAvailable(item.id, item.available)} style={{
              padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
              background: item.available ? "#dcfce7" : "#fee2e2",
              color: item.available ? "#16a34a" : "#dc2626", fontSize: 13, fontWeight: 500
            }}>{item.available ? "Available" : "Unavailable"}</button>
            <button onClick={() => deleteItem(item.id)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none",
              cursor: "pointer", background: "#fee2e2", color: "#dc2626", fontSize: 13
            }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
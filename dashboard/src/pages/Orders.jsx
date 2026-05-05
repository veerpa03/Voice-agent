import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  ready: "#10b981",
  done: "#6b7280"
}

export default function Orders() {
  const [orders, setOrders] = useState([])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
    if (data) setOrders(data)
  }

  useEffect(() => {
    fetchOrders()

    // realtime updates
    const channel = supabase
      .channel("orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const updateStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id)
    fetchOrders()
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Live Orders</h2>
      {orders.length === 0 && <p style={{ color: "#888" }}>No orders yet.</p>}
      {orders.map(order => (
        <div key={order.id} style={{
          border: "1px solid #eee", borderRadius: 12, padding: 16,
          marginBottom: 12, background: "#fafafa"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 600 }}>#{order.id.slice(0, 8)}</span>
              <span style={{ marginLeft: 8, color: "#888", fontSize: 13 }}>
                {new Date(order.created_at).toLocaleTimeString()}
              </span>
              {order.phone_number && (
                <span style={{ marginLeft: 8, fontSize: 13, color: "#555" }}>
                  📞 {order.phone_number}
                </span>
              )}
            </div>
            <span style={{
              background: STATUS_COLORS[order.status] + "22",
              color: STATUS_COLORS[order.status],
              padding: "4px 10px", borderRadius: 20, fontSize: 13, fontWeight: 500
            }}>{order.status}</span>
          </div>

          <div style={{ marginTop: 8 }}>
            {order.order_items?.map(item => (
              <div key={item.id} style={{ fontSize: 14, color: "#333", marginTop: 4 }}>
                {item.quantity}x {item.item_name} — ${item.unit_price}
                {item.customizations_chosen && Object.keys(item.customizations_chosen).length > 0 && (
                  <span style={{ color: "#888", marginLeft: 6 }}>
                    ({Object.entries(item.customizations_chosen).map(([k, v]) => `${k}: ${v}`).join(", ")})
                  </span>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <strong style={{ fontSize: 15 }}>Total: ${order.total}</strong>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {["pending", "confirmed", "ready", "done"].map(s => (
                <button key={s} onClick={() => updateStatus(order.id, s)} style={{
                  padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 500,
                  background: order.status === s ? "#000" : "#eee",
                  color: order.status === s ? "#fff" : "#333"
                }}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
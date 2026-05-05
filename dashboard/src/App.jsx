import { useState } from "react"
import Orders from "./pages/Orders"
import Menu from "./pages/Menu"
import Offers from "./pages/Offers"

export default function App() {
  const [page, setPage] = useState("orders")

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>🍔 Burger Palace Dashboard</h1>
      
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
        {["orders", "menu", "offers"].map(p => (
          <button key={p} onClick={() => setPage(p)} style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: page === p ? "#000" : "#f0f0f0",
            color: page === p ? "#fff" : "#000",
            fontWeight: 500,
            textTransform: "capitalize"
          }}>{p}</button>
        ))}
      </div>

      {page === "orders" && <Orders />}
      {page === "menu" && <Menu />}
      {page === "offers" && <Offers />}
    </div>
  )
}
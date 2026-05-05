import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Offers() {
  const [offers, setOffers] = useState([])
  const [newOffer, setNewOffer] = useState({ title: "", description: "", discount_percent: "" })

  const fetchOffers = async () => {
    const { data } = await supabase.from("offers").select("*").order("created_at", { ascending: false })
    if (data) setOffers(data)
  }

  useEffect(() => { fetchOffers() }, [])

  const addOffer = async () => {
    if (!newOffer.title) return
    await supabase.from("offers").insert({
      title: newOffer.title,
      description: newOffer.description,
      discount_percent: parseFloat(newOffer.discount_percent) || 0,
      active: true
    })
    setNewOffer({ title: "", description: "", discount_percent: "" })
    fetchOffers()
  }

  const toggleOffer = async (id, current) => {
    await supabase.from("offers").update({ active: !current }).eq("id", id)
    fetchOffers()
  }

  const deleteOffer = async (id) => {
    await supabase.from("offers").delete().eq("id", id)
    fetchOffers()
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Offers Manager</h2>

      <div style={{ background: "#f9f9f9", borderRadius: 12, padding: 16, marginBottom: 24, border: "1px solid #eee" }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>New Offer</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[["title", "Title"], ["description", "Description"], ["discount_percent", "Discount %"]].map(([key, label]) => (
            <input key={key} placeholder={label} value={newOffer[key]}
              onChange={e => setNewOffer({ ...newOffer, [key]: e.target.value })}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
            />
          ))}
        </div>
        <button onClick={addOffer} style={{
          marginTop: 10, padding: "8px 20px", borderRadius: 8,
          background: "#000", color: "#fff", border: "none", cursor: "pointer", fontWeight: 500
        }}>Add Offer</button>
      </div>

      {offers.length === 0 && <p style={{ color: "#888" }}>No offers yet.</p>}
      {offers.map(offer => (
        <div key={offer.id} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px", borderRadius: 10, border: "1px solid #eee",
          marginBottom: 8, opacity: offer.active ? 1 : 0.5
        }}>
          <div>
            <span style={{ fontWeight: 500 }}>{offer.title}</span>
            {offer.discount_percent > 0 && (
              <span style={{ marginLeft: 8, background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 20, fontSize: 12 }}>
                {offer.discount_percent}% off
              </span>
            )}
            {offer.description && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#aaa" }}>{offer.description}</p>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => toggleOffer(offer.id, offer.active)} style={{
              padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
              background: offer.active ? "#dcfce7" : "#fee2e2",
              color: offer.active ? "#16a34a" : "#dc2626", fontSize: 13, fontWeight: 500
            }}>{offer.active ? "Active" : "Inactive"}</button>
            <button onClick={() => deleteOffer(offer.id)} style={{
              padding: "4px 10px", borderRadius: 6, border: "none",
              cursor: "pointer", background: "#fee2e2", color: "#dc2626", fontSize: 13
            }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
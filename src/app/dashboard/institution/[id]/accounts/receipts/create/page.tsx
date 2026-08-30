// "use client"

// import { useEffect, useState } from "react"
// import { useParams, useRouter } from "next/navigation"
// import { accountingApi } from "@/lib/api"
// import { Account, ReceiptItemCreate } from "@/types/accounting"
// import styles from "./create.module.css"

// const PAYMENT_METHODS = ["cash", "card", "upi", "bank_transfer", "cheque", "online"]
// const emptyItem = (): ReceiptItemCreate => ({ account_id: 0, description: "", amount: 0, discount: 0 })

// export default function CreateReceiptPage() {
//   const { id } = useParams()
//   const router  = useRouter()
//   const [accounts,   setAccounts]   = useState<Account[]>([])
//   const [submitting, setSubmitting] = useState(false)
//   const [error,      setError]      = useState("")
//   const [items,      setItems]      = useState<ReceiptItemCreate[]>([emptyItem()])

//   const [form, setForm] = useState({
//     user_id: "", receipt_date: new Date().toISOString().split("T")[0],
//     payment_method: "cash", reference_number: "", bank_name: "",
//     discount: "0", description: "", academic_year: "",
//   })

//   useEffect(() => { accountingApi.getAccounts().then(setAccounts).catch(() => {}) }, [])

//   const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
//   const setItem  = (i: number, k: keyof ReceiptItemCreate, v: string | number) =>
//     setItems(p => p.map((it, idx) => idx === i ? { ...it, [k]: v } : it))

//   const subtotal    = items.reduce((s, it) => s + (Number(it.amount) - Number(it.discount)), 0)
//   const totalAmount = subtotal - Number(form.discount)

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!form.user_id) { setError("User ID is required"); return }
//     if (items.some(it => !it.account_id || !it.description || !it.amount)) {
//       setError("Fill all item fields"); return
//     }
//     setSubmitting(true)
//     try {
//       const receipt = await accountingApi.createReceipt({
//         user_id:          Number(form.user_id),
//         receipt_date:     form.receipt_date,
//         payment_method:   form.payment_method,
//         reference_number: form.reference_number || null,
//         bank_name:        form.bank_name || null,
//         discount:         Number(form.discount),
//         description:      form.description || null,
//         academic_year:    form.academic_year || null,
//         issued_by:        null,
//         items: items.map(it => ({
//           account_id: Number(it.account_id), description: it.description,
//           amount: Number(it.amount), discount: Number(it.discount),
//         })),
//       })
//       router.push(`/dashboard/institution/${id}/accounts/receipts/${receipt.id}`)
//     } catch (err: any) {
//       setError(err.message || "Failed to create receipt")
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   return (
//     <div className={styles.page}>
//       <div className={styles.header}>
//         <div>
//           <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
//           <h1 className={styles.title}>Create Receipt</h1>
//         </div>
//       </div>

//       <form onSubmit={handleSubmit} className={styles.form}>

//         <div className={styles.card}>
//           <h2 className={styles.cardTitle}>Payment Details</h2>
//           <div className={styles.grid2}>
//             <div className={styles.field}>
//               <label className={styles.label}>User ID *</label>
//               <input className={styles.input} type="number" placeholder="Enter user ID"
//                 value={form.user_id} onChange={e => setField("user_id", e.target.value)} required />
//             </div>
//             <div className={styles.field}>
//               <label className={styles.label}>Receipt Date *</label>
//               <input className={styles.input} type="date"
//                 value={form.receipt_date} onChange={e => setField("receipt_date", e.target.value)} required />
//             </div>
//             <div className={styles.field}>
//               <label className={styles.label}>Payment Method *</label>
//               <select className={styles.input} value={form.payment_method}
//                 onChange={e => setField("payment_method", e.target.value)}>
//                 {PAYMENT_METHODS.map(m => (
//                   <option key={m} value={m}>{m.replace("_", " ").toUpperCase()}</option>
//                 ))}
//               </select>
//             </div>
//             <div className={styles.field}>
//               <label className={styles.label}>Reference No</label>
//               <input className={styles.input} placeholder="Cheque / UTR / UPI ref"
//                 value={form.reference_number} onChange={e => setField("reference_number", e.target.value)} />
//             </div>
//             <div className={styles.field}>
//               <label className={styles.label}>Bank Name</label>
//               <input className={styles.input} placeholder="Bank name"
//                 value={form.bank_name} onChange={e => setField("bank_name", e.target.value)} />
//             </div>
//             <div className={styles.field}>
//               <label className={styles.label}>Academic Year</label>
//               <input className={styles.input} placeholder="e.g. 2024-25"
//                 value={form.academic_year} onChange={e => setField("academic_year", e.target.value)} />
//             </div>
//           </div>
//           <div className={styles.field} style={{ marginTop: "1rem" }}>
//             <label className={styles.label}>Description</label>
//             <input className={styles.input} placeholder="e.g. June 2025 Monthly Fee"
//               value={form.description} onChange={e => setField("description", e.target.value)} />
//           </div>
//         </div>

//         <div className={styles.card}>
//           <div className={styles.itemsHeader}>
//             <h2 className={styles.cardTitle}>Payment Items</h2>
//             <button type="button" className={styles.addItemBtn}
//               onClick={() => setItems(p => [...p, emptyItem()])}>+ Add Item</button>
//           </div>
//           <div className={styles.itemsHead}>
//             <span>Account Head</span><span>Description</span>
//             <span>Amount (₹)</span><span>Discount (₹)</span><span>Net (₹)</span><span></span>
//           </div>
//           {items.map((item, i) => (
//             <div key={i} className={styles.itemRow}>
//               <select className={styles.input} value={item.account_id}
//                 onChange={e => setItem(i, "account_id", e.target.value)}>
//                 <option value={0}>Select account</option>
//                 {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
//               </select>
//               <input className={styles.input} placeholder="Description"
//                 value={item.description} onChange={e => setItem(i, "description", e.target.value)} />
//               <input className={styles.input} type="number" min="0" placeholder="0.00"
//                 value={item.amount || ""} onChange={e => setItem(i, "amount", e.target.value)} />
//               <input className={styles.input} type="number" min="0" placeholder="0.00"
//                 value={item.discount || ""} onChange={e => setItem(i, "discount", e.target.value)} />
//               <span className={styles.net}>₹{(Number(item.amount) - Number(item.discount)).toLocaleString()}</span>
//               {items.length > 1 && (
//                 <button type="button" className={styles.removeBtn}
//                   onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}>✕</button>
//               )}
//             </div>
//           ))}
//         </div>

//         <div className={styles.card}>
//           <h2 className={styles.cardTitle}>Summary</h2>
//           <div className={styles.totals}>
//             <div className={styles.totalRow}><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
//             <div className={styles.totalRow}>
//               <span>Overall Discount</span>
//               <div className={styles.discountInput}>
//                 <span>₹</span>
//                 <input type="number" min="0" value={form.discount}
//                   onChange={e => setField("discount", e.target.value)} />
//               </div>
//             </div>
//             <div className={`${styles.totalRow} ${styles.totalFinal}`}>
//               <span>Total Amount</span><span>₹{totalAmount.toLocaleString()}</span>
//             </div>
//           </div>
//         </div>

//         {error && <div className={styles.error}>{error}</div>}

//         <div className={styles.actions}>
//           <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>Cancel</button>
//           <button type="submit" className={styles.submitBtn} disabled={submitting}>
//             {submitting ? "Creating..." : "Create Receipt"}
//           </button>
//         </div>
//       </form>
//     </div>
//   )
// }

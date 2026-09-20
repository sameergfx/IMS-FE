"use client"

import { useEffect, useRef, useState } from "react"
import { institutionsApi, usersApi } from "@/lib/api"
import { Institution } from "@/types/institution"
import { UserResponse } from "@/types"
import { Invoice, Receipt } from "@/types/accounting"
import styles from "./BillDocument.module.css"

const money = (value: number | string) => Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const date = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-GB")

export default function BillDocument({ invoice, receipt }: { invoice: Invoice; receipt?: Receipt }) {
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [party, setParty] = useState<UserResponse | null>(null)
  const [error, setError] = useState("")
  const [printing, setPrinting] = useState(false)
  const paper = useRef<HTMLDivElement>(null)
  const printFrame = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    let active = true
    setInstitution(null); setParty(null); setError("")
    Promise.all([institutionsApi.getOne(invoice.institution_id), invoice.user_id ? usersApi.getUser(invoice.user_id) : Promise.resolve(null)])
      .then(([inst, user]) => { if (active) { setInstitution(inst); setParty(user) } })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "Could not load bill details") })
    return () => { active = false }
  }, [invoice.institution_id, invoice.user_id])
  useEffect(() => () => { printFrame.current?.remove() }, [])

  const print = () => {
    if (!paper.current || !institution || (!party && !invoice.donor_name)) return
    setPrinting(true)
    printFrame.current?.remove()
    const frame = document.createElement("iframe")
    frame.title = "Print bill"
    frame.style.cssText = "position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0"
    printFrame.current = frame
    const sheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(node => node.outerHTML).join("")
    frame.onload = async () => {
      const doc = frame.contentDocument
      const win = frame.contentWindow
      if (!doc || !win) { setPrinting(false); return }
      await Promise.all(Array.from(doc.images).map(img => img.decode().catch(() => {})))
      await doc.fonts.ready
      win.focus()
      win.print()
      setPrinting(false)
    }
    frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${receipt ? "Receipt" : "Invoice"}</title>${sheets}<style>@page{size:A4;margin:12mm}html,body{margin:0!important;padding:0!important;background:white!important}body{font-family:Arial,sans-serif}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}</style></head><body>${paper.current.outerHTML}</body></html>`
    document.body.appendChild(frame)
  }

  const cancelled = receipt ? receipt.status === "cancelled" : invoice.status === "cancelled"
  return <section className={styles.wrapper}>
    <div className={styles.toolbar}>
      <button type="button" onClick={print} disabled={!institution || (!party && !invoice.donor_name) || printing}>{printing ? "Preparing…" : "Print / Save PDF"}</button>
    </div>
    {error ? <p role="alert">{error}</p> : !institution || (!party && !invoice.donor_name) ? <p>Loading bill details…</p> :
      <div hidden aria-hidden="true"><div ref={paper} className={styles.paper}>
        <div className={styles.caption}><strong>{receipt ? "PAYMENT RECEIPT" : "INVOICE"}</strong><span>ORIGINAL FOR RECIPIENT</span>{cancelled && <strong className={styles.cancelled}>CANCELLED</strong>}</div>
        <header className={styles.school}>
          {institution.logo && <img src={institution.logo} alt={`${institution.name} logo`} />}
          <div><h2>{institution.name}</h2><p>{institution.address || institution.place}</p>
            {institution.phone && <p><strong>Mobile: </strong>{institution.phone}</p>}
            {institution.email && <p>{institution.email}</p>}
          </div>
        </header>
        <div className={styles.parties}>
          <div><small>{receipt ? "RECEIVED FROM" : "BILL TO"}</small>
            <strong>{[party?.ref_number || party?.admission_number, invoice.donor_name || party?.full_name].filter(Boolean).join(" / ")}</strong>
            {(invoice.donor_phone || party?.phone) && <p>Mobile: {invoice.donor_phone || party?.phone}</p>}
            {invoice.donor_address && <p>{invoice.donor_address}</p>}
          </div>
          <div><strong>{receipt ? "Receipt" : "Invoice"} No.</strong><p>{receipt?.receipt_number || invoice.invoice_number}</p>
            {receipt && <p>Invoice: {invoice.invoice_number}</p>}</div>
          <div><strong>{receipt ? "Receipt" : "Invoice"} Date</strong><p>{date(receipt?.receipt_date || invoice.invoice_date)}</p>
            {!receipt && invoice.due_date && <p>Due: {date(invoice.due_date)}</p>}</div>
        </div>
        {receipt ? <>
          <table className={styles.items}><thead><tr><th>S.NO.</th><th>PARTICULARS</th><th>AMOUNT (₹)</th></tr></thead>
            <tbody><tr><td>1</td><td>Payment against invoice {invoice.invoice_number}<br />{receipt.payment_method.replaceAll("_", " ").toUpperCase()}
              {receipt.reference_number && <p>Reference: {receipt.reference_number}</p>}{receipt.bank_name && <p>Bank: {receipt.bank_name}</p>}{receipt.notes && <p>{receipt.notes}</p>}</td><td>{money(receipt.amount_paid)}</td></tr></tbody>
            <tfoot><tr><th colSpan={2}>{cancelled ? "CANCELLED RECEIPT AMOUNT" : "TOTAL RECEIVED"}</th><th>₹ {money(receipt.amount_paid)}</th></tr></tfoot></table>
          {!!receipt.allocations?.length && <table className={styles.items}><thead><tr><th>Category / Item</th><th>Received</th></tr></thead><tbody>{receipt.allocations.map(allocation => {
            const item = invoice.items.find(item => item.id === allocation.invoice_item_id)
            return <tr key={allocation.invoice_item_id}><td>{item?.category_name || "Item"} — {item?.description}</td><td>{money(allocation.amount)}</td></tr>
          })}</tbody></table>}
          {receipt.cancellation_reason && <p className={styles.note}>Cancellation reason: {receipt.cancellation_reason}</p>}
        </> : <table className={styles.items}>
          <thead><tr><th>S.NO.</th><th>ITEMS / FEE CATEGORY</th><th>AMOUNT (₹)</th><th>DISCOUNT (₹)</th><th>NET (₹)</th></tr></thead>
          <tbody>{invoice.items.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><strong>{item.category_name}</strong><p>{item.description}</p></td><td>{money(item.amount)}</td><td>{money(item.discount)}</td><td>{money(item.net_amount)}</td></tr>)}</tbody>
          <tfoot>{Number(invoice.discount) > 0 && <><tr><th colSpan={4}>SUBTOTAL</th><th>₹ {money(invoice.subtotal)}</th></tr><tr><th colSpan={4}>OVERALL DISCOUNT</th><th>₹ {money(invoice.discount)}</th></tr></>}
            <tr><th colSpan={4}>TOTAL</th><th>₹ {money(invoice.total_amount)}</th></tr></tfoot>
        </table>}
        {!receipt && invoice.description && <p className={styles.note}>{invoice.description}</p>}
        <div className={styles.balances}><p><strong>{receipt ? "Invoice total" : "Received amount"}: </strong>₹ {money(receipt ? invoice.total_amount : invoice.paid_amount)}</p><p><strong>{receipt ? "Current invoice balance" : "Balance amount"}: </strong>₹ {money(invoice.balance_due)}</p></div>
        <footer className={styles.footer}><div><strong>Bank Details</strong><dl>
          {[["Name", institution.account_name], ["IFSC Code", institution.ifsc_code], ["Account No", institution.account_number], ["Bank", institution.bank_name], ["Branch", institution.bank_branch]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}:</dt><dd>{value}</dd></div>)}
        </dl></div><div className={styles.signature}><span>Authorised Signatory For</span><strong>{institution.name}</strong></div></footer>
      </div></div>}
  </section>
}

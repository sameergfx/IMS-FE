"use client"
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { assistanceApi, accountingApi, AssistanceApplication } from '@/lib/api'
import { ExpenseCategory } from '@/types/accounting'
import { useUiAccess } from '@/components/access/PermissionGate'
import MoneyAccountSelect from '@/components/accounting/MoneyAccountSelect'
import styles from '@/app/dashboard/institution/[id]/accounts/invoices/create/create.module.css'
import table from '@/app/dashboard/institution/[id]/accounts/statements/page.module.css'
const money=(value:string|number|undefined|null)=>`₹${Number(value||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export default function DisbursementPanel({application,institutionId,onSaved}:{application:AssistanceApplication;institutionId:number;onSaved:()=>void}){
 const {can}=useUiAccess();const [busy,setBusy]=useState(false);const [error,setError]=useState('')
 const [categories,setCategories]=useState<ExpenseCategory[]>([])
 const [form,setForm]=useState({amount:'',payment_date:today(),payment_method:'cash',category_id:'',money_account_id:'',reference:'',acknowledgement:''})
 const requestId=useRef<string|null>(null)
 useEffect(()=>{let active=true;if(can('applications.disburse'))accountingApi.getExpenseCategories().then(rows=>{if(active)setCategories(rows.filter(r=>r.is_active))}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[institutionId,can('applications.disburse')])
 const run=async(work:()=>Promise<void>)=>{if(busy)return;setBusy(true);setError('');try{await work();onSaved()}catch(e){setError(e instanceof Error?e.message:'Payment action failed')}finally{setBusy(false)}}
 return <section className={styles.card}><h2 className={styles.cardTitle}>Fund Release</h2>
 <div className={table.summary}><div><span>Approved</span><strong>{money(application.approved_amount)}</strong></div><div><span>Released</span><strong>{money(application.paid_amount)}</strong></div><div><span>Remaining approved amount</span><strong>{money(application.remaining_amount)}</strong></div></div>
 {error&&<p className={styles.error} role="alert">{error}</p>}
 {can('applications.disburse')&&['approved','partially_paid'].includes(application.status)&&<form onSubmit={e=>{e.preventDefault();if(!form.money_account_id){setError('Select a cash or bank account');return}if(!window.confirm(`Record ${money(form.amount)} paid to ${application.applicant_name}? A linked expense will be created.`))return;void run(async()=>{requestId.current ||= crypto.randomUUID();await assistanceApi.pay(institutionId,application.id,{...form,request_id:requestId.current,money_account_id:Number(form.money_account_id),category_id:Number(form.category_id),reference:form.reference||null});requestId.current=null;setForm({...form,amount:'',reference:'',acknowledgement:''})})}}>
 <fieldset disabled={busy} style={{border:0,padding:0}}><div className={styles.grid2}>
 <label className={styles.field}>Amount *<input className={styles.input} required type="number" min=".01" max={Number(application.remaining_amount)} step=".01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
 <label className={styles.field}>Payment date *<input className={styles.input} required type="date" min={application.application_date} max={today()} value={form.payment_date} onChange={e=>setForm({...form,payment_date:e.target.value})}/></label>
 <label className={styles.field}>Expense category *<select className={styles.input} required value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label className={styles.field}>Payment method *<select className={styles.input} value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value,money_account_id:''})}>{['cash','bank_transfer','upi','card','cheque','online'].map(m=><option key={m} value={m}>{m.replaceAll('_',' ')}</option>)}</select></label>
 <MoneyAccountSelect institutionId={institutionId} method={form.payment_method} value={form.money_account_id} onChange={value=>setForm({...form,money_account_id:value})}/>
 <label className={styles.field}>Payment reference<input className={styles.input} maxLength={100} value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})}/></label>
 </div><label className={styles.field}>Recipient acknowledgement / payment confirmation *<textarea className={styles.input} rows={3} required maxLength={2000} value={form.acknowledgement} onChange={e=>setForm({...form,acknowledgement:e.target.value})}/></label>
 <p className={styles.hint}>Record money already paid. This creates an expense; it does not send money through the bank. Attach the acknowledgement in Private Documents after saving.</p>
 <button className={styles.submitBtn} disabled={busy}>{busy?'Saving…':'Record Fund Release'}</button></fieldset></form>}
 <div className={table.tableWrap} style={{marginTop:'1rem'}}><table className={table.table}><thead><tr><th>Date</th><th>Expense</th><th>Amount</th><th>Method / Reference</th><th>Status</th><th>Acknowledgement</th><th>Action</th></tr></thead><tbody>{application.payments?.map(p=><tr key={p.id}><td>{p.date}</td><td>{can('expenses.read')?<Link href={`/dashboard/institution/${institutionId}/accounts/expenses/${p.id}`}>{p.number}</Link>:p.number}</td><td>{money(p.amount)}</td><td>{p.payment_method.replaceAll('_',' ')} {p.reference}</td><td>{p.status}{p.cancellation_reason&&`: ${p.cancellation_reason}`}</td><td>{p.acknowledgement}</td><td>{p.status==='active'&&can('applications.disburse')&&<button className={styles.cancelBtn} disabled={busy} onClick={()=>{const reason=window.prompt('Reason for cancelling this payment? The expense will be cancelled and the approved balance restored.');if(reason?.trim())void run(async()=>{await assistanceApi.cancelPayment(institutionId,application.id,p.id,reason.trim())})}}>Cancel Payment</button>}</td></tr>)}</tbody></table></div>
 {!application.payments?.length&&<p>No payments recorded.</p>}
 {application.status==='paid'&&can('applications.update')&&<button className={styles.changeBtn} disabled={busy} onClick={()=>{const reason=window.prompt('Completion notes for closing this fully paid application:');if(reason?.trim())void run(async()=>{await assistanceApi.close(institutionId,application.id,reason.trim())})}}>Close Application</button>}
 </section>
}

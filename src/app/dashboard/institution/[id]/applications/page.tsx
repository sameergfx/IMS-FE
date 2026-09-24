"use client"
import Link from "next/link"
import { usePermissions } from "@/lib/permissions-context"
import DisbursementPanel from "@/components/assistance/DisbursementPanel"
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { assistanceApi, AssistanceApplication } from '@/lib/api'
import { useUiAccess } from '@/components/access/PermissionGate'
import styles from '../accounts/invoices/create/create.module.css'
import { ChevronLeft, ChevronRight } from "lucide-react"
import pageStyles from "./page.module.css"
import table from '../accounts/statements/page.module.css'
const statuses=['received','under_enquiry','needs_information','awaiting_approval','approved','partially_paid','paid','closed','rejected','withdrawn']
const label=(s:string)=>s.replaceAll('_',' ')
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
const empty=()=>({applicant_name:'',phone:'',address:'',household_details:'',assistance_type:'',application_date:today(),requested_amount:'',purpose:''})
export default function ApplicationsPage(){
 const {id}=useParams();const institution=Number(id);const {can}=useUiAccess();const {isSuperadmin}=usePermissions()
 const [rows,setRows]=useState<AssistanceApplication[]>([]);const [total,setTotal]=useState(0);const [skip,setSkip]=useState(0)
 const [filters,setFilters]=useState({q:'',status:'',assigned_to:'',start:'',end:''})
 const [officers,setOfficers]=useState<{id:number;name:string}[]>([])
 const [selected,setSelected]=useState<number|null>(null);const [detail,setDetail]=useState<AssistanceApplication|null>(null)
 useEffect(()=>{const app=new URLSearchParams(window.location.search).get('application');setSelected(app && /^\d+$/.test(app)?Number(app):null)},[institution])
 const [version,setVersion]=useState(0);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false)
 const [showForm,setShowForm]=useState(false);const [editing,setEditing]=useState(false);const [form,setForm]=useState(empty)
 const [action,setAction]=useState('assign');const [notes,setNotes]=useState('');const [officer,setOfficer]=useState('');const [visit,setVisit]=useState(today());const [recommendation,setRecommendation]=useState('recommend');const [approved,setApproved]=useState('')
 const [preview,setPreview]=useState<{url:string;name:string;type:string}|null>(null);const urlRef=useRef<string|null>(null)
 useEffect(()=>{
  let active=true
  const refresh=()=>{assistanceApi.officers(institution).then(r=>{if(active){setOfficers(r);setOfficer(previous=>r.some(o=>String(o.id)===previous)?previous:'')}}).catch(e=>{if(active)setError(e.message)})}
  refresh();window.addEventListener('focus',refresh)
  return()=>{active=false;window.removeEventListener('focus',refresh)}
 },[institution,version])
 useEffect(()=>{let active=true;setLoading(true);setRows([]);const timer=setTimeout(()=>{const query=Object.fromEntries(Object.entries(filters).filter(([,v])=>v));assistanceApi.list(institution,{...query,skip:String(skip)}).then(r=>{if(active){setRows(r.items);setTotal(r.total)}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)})},250);return()=>{active=false;clearTimeout(timer)}},[institution,filters,skip,version])
 useEffect(()=>{let active=true;setDetail(null);setPreview(null);if(urlRef.current){URL.revokeObjectURL(urlRef.current);urlRef.current=null}setNotes('');setApproved('');if(selected)assistanceApi.detail(institution,selected).then(r=>{if(active)setDetail(r)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[institution,selected,version])
 useEffect(()=>()=>{if(urlRef.current)URL.revokeObjectURL(urlRef.current)},[])
 const run=async(fn:()=>Promise<void>)=>{setBusy(true);setError('');try{await fn();setVersion(v=>v+1)}catch(e){setError(e instanceof Error?e.message:'Request failed')}finally{setBusy(false)}}
 const choices=detail ? [
  ...(['received','under_enquiry','needs_information'].includes(detail.status)&&can('applications.assign')?['assign']:[]),
  ...(detail.status==='under_enquiry'&&can('applications.enquire')?['needs_information','submit_enquiry']:[]),
  ...(detail.status==='awaiting_approval'&&can('applications.approve')?['approve','reject']:[]),
  ...(['received','under_enquiry','needs_information','awaiting_approval'].includes(detail.status)&&can('applications.update')?['withdraw']:[]),
 ]:[]
 const currentAction=choices.includes(action)?action:choices[0] || ''
 const openDocument=async(document:{id:number;filename:string;mime_type:string})=>{if(!detail)return;setError('');try{const blob=await assistanceApi.document(institution,detail.id,document.id);if(urlRef.current)URL.revokeObjectURL(urlRef.current);const url=URL.createObjectURL(blob);urlRef.current=url;setPreview({url,name:document.filename,type:document.mime_type})}catch(e){setError(e instanceof Error?e.message:'Document failed to load')}}
 return <div className={table.page}><div className={table.header}><div><h1 className={styles.title}>Applications & Assistance</h1><p className={styles.sub}>Receive applications, record enquiries and track approval decisions.</p></div>{can('applications.create')&&<button className={styles.submitBtn} disabled={busy} onClick={()=>{setShowForm(true);setEditing(false);setForm(empty());setSelected(null)}}>+ New Application</button>}</div>
 {error&&<p className={styles.error} role="alert">{error}</p>}
 {showForm&&<section className={styles.card}><h2 className={styles.cardTitle}>{editing?'Edit':'New'} Application</h2><form onSubmit={e=>{e.preventDefault();void run(async()=>{const result=editing&&selected?await assistanceApi.update(institution,selected,form):await assistanceApi.create(institution,form);setSelected(result.id);setShowForm(false)})}}><fieldset disabled={busy} style={{border:0,padding:0}}><div className={styles.grid2}>
 {(['applicant_name','phone','assistance_type','application_date','requested_amount'] as const).map(key=><label className={styles.field} key={key}>{label(key)}{key!=='phone'?' *':''}<input className={styles.input} required={key!=='phone'} type={key==='application_date'?'date':key==='requested_amount'?'number':'text'} min={key==='requested_amount'?'.01':undefined} step={key==='requested_amount'?'.01':undefined} maxLength={key==='phone'?50:key==='assistance_type'?100:200} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}</div>
 {(['address','household_details','purpose'] as const).map(key=><label className={styles.field} key={key}>{label(key)}<textarea className={styles.input} required={key!=='household_details'} maxLength={key==='address'?1000:5000} rows={3} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}
 <div className={styles.actions}><button type="button" className={styles.cancelBtn} onClick={()=>setShowForm(false)}>Cancel</button><button className={styles.submitBtn}>Save Application</button></div></fieldset></form></section>}
 <div className={table.filters} style={{margin:'1rem 0'}}>{(['q','status','assigned_to','start','end'] as const).map(key=><label key={key}>{{q:'Search name, phone or reference',status:'Status',assigned_to:'Enquiry officer',start:'From',end:'To'}[key]}
 {key==='status'||key==='assigned_to'?<select value={filters[key]} onChange={e=>{setFilters({...filters,[key]:e.target.value});setSkip(0)}}><option value="">All</option>{key==='status'?statuses.map(s=><option key={s} value={s}>{label(s)}</option>):officers.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select>:<input type={key==='q'?'search':'date'} value={filters[key]} onChange={e=>{setFilters({...filters,[key]:e.target.value});setSkip(0)}}/>}</label>)}</div>
 {loading?<p role="status">Loading applications…</p>:<><div className={table.tableWrap}><table className={table.table}><thead><tr><th>Reference</th><th>Date</th><th>Applicant</th><th>Assistance</th><th>Requested</th><th>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td><button className={styles.changeBtn} disabled={busy} onClick={()=>{setSelected(r.id);setShowForm(false)}}>{r.reference}</button></td><td>{r.application_date}</td><td>{r.applicant_name}</td><td>{r.assistance_type}</td><td>₹{r.requested_amount}</td><td>{label(r.status)}</td></tr>)}</tbody></table></div>{!rows.length&&<p>No matching applications.</p>}<nav className={pageStyles.pagination} aria-label="Application pages">
 <p className={pageStyles.range} aria-live="polite">{total === 0 ? "0 applications" : <>Showing <strong>{rows.length ? skip + 1 : 0}–{rows.length ? skip + rows.length : 0}</strong> of <strong>{total}</strong> applications</>}</p>
 <div className={pageStyles.pageControls}>
 <button type="button" className={pageStyles.pageButton} disabled={skip===0 || busy} onClick={()=>setSkip(Math.max(0,skip-50))}><ChevronLeft size={16} aria-hidden="true" />Previous</button>
 <span className={pageStyles.pageNumber}>Page <strong>{Math.floor(skip/50)+1}</strong> of {Math.max(1,Math.ceil(total/50))}</span>
 <button type="button" className={pageStyles.pageButton} disabled={skip+50>=total || busy} onClick={()=>setSkip(skip+50)}>Next<ChevronRight size={16} aria-hidden="true" /></button>
 </div></nav></>}
 {selected&&!detail&&<p role="status">Loading application…</p>}
 {detail&&<div className={styles.form} style={{marginTop:'1.5rem'}}><section className={styles.card}><h2 className={styles.cardTitle}>{detail.reference} · {label(detail.status)}</h2><h3>{detail.applicant_name}</h3><p>{detail.phone} · {detail.address}</p><p style={{whiteSpace:'pre-wrap'}}>{detail.household_details}</p><p>{detail.assistance_type} · Requested ₹{detail.requested_amount}{detail.approved_amount&&` · Approved ₹${detail.approved_amount}`}</p><p style={{whiteSpace:'pre-wrap'}}>{detail.purpose}</p><p>Assigned officer: {officers.find(o=>o.id===detail.assigned_to)?.name || (detail.assigned_to?`#${detail.assigned_to}`:'Not assigned')}</p>
 {can('applications.update')&&['received','needs_information'].includes(detail.status)&&<button className={styles.changeBtn} disabled={busy} onClick={()=>{setForm({applicant_name:detail.applicant_name,phone:detail.phone||'',address:detail.address,household_details:detail.household_details||'',assistance_type:detail.assistance_type,application_date:detail.application_date,requested_amount:String(detail.requested_amount),purpose:detail.purpose});setEditing(true);setShowForm(true)}}>Edit Application</button>}
 </section>
 {detail.approved_amount && <DisbursementPanel key={detail.id} application={detail} institutionId={institution} onSaved={()=>setVersion(v=>v+1)} />}
 <section className={styles.card}><h2 className={styles.cardTitle}>Private Documents</h2><p className={styles.sub}>Application scans and supporting documents: PDF, JPEG or PNG, up to 8 MB each.</p>
 {can('applications.upload')&&!['approved','partially_paid','paid','closed','rejected','withdrawn'].includes(detail.status)&&<label className={styles.field}>Upload document<input type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file){if(file.size>8*1024*1024){setError('Maximum file size is 8 MB');return}void run(async()=>{await assistanceApi.upload(institution,detail.id,file)})}}}/></label>}
 {can('applications.upload')&&['partially_paid','paid','closed'].includes(detail.status)&&<label className={styles.field}>Upload payment acknowledgement<input type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file){if(file.size>8*1024*1024){setError('Maximum file size is 8 MB');return}void run(async()=>{await assistanceApi.upload(institution,detail.id,file,'acknowledgement')})}}}/></label>}
 {detail.documents?.map(d=><button type="button" className={styles.changeBtn} key={d.id} onClick={()=>void openDocument(d)}>{d.filename} ({Math.ceil(d.size/1024)} KB)</button>)}
 {preview&&<div><p>{preview.name} · <a href={preview.url} download={preview.name}>Download</a></p>{preview.type==='application/pdf'?<iframe title={preview.name} src={preview.url} style={{width:'100%',height:500,border:0}}/>:<img alt={preview.name} src={preview.url} style={{maxWidth:'100%',maxHeight:600}}/>}</div>}</section>
 {choices.length>0&&<section className={styles.card}><h2 className={styles.cardTitle}>Enquiry / Decision</h2><form onSubmit={e=>{e.preventDefault();if(['approve','reject','withdraw'].includes(currentAction)&&!window.confirm(`${label(currentAction)} this application? This decision locks further edits.`))return;void run(async()=>{await assistanceApi.action(institution,detail.id,{action:currentAction,notes,assigned_to:currentAction==='assign'?Number(officer):null,visit_date:currentAction==='submit_enquiry'?visit:null,recommendation:currentAction==='submit_enquiry'?recommendation:null,approved_amount:currentAction==='approve'?approved:null})})}}><fieldset disabled={busy} style={{border:0,padding:0}}><div className={styles.grid2}><label className={styles.field}>Action<select className={styles.input} value={currentAction} onChange={e=>setAction(e.target.value)}>{choices.map(c=><option key={c} value={c}>{label(c)}</option>)}</select></label>
 {currentAction==='assign'&&<div className={styles.field}><label className={styles.field}>Enquiry officer<select className={styles.input} required value={officer} onChange={e=>setOfficer(e.target.value)}><option value="">Select officer</option>{officers.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
 <p className={styles.hint}>Officers need an active role at this institution with application read and enquiry permissions. Masjid members can be assigned here without creating another user.</p>
 {isSuperadmin ? <Link href={`/dashboard/institution/${institution}/settings/roles`}>Manage institution responsibilities →</Link> : <p className={styles.hint}>Ask a superadmin to assign an enquiry officer to this institution.</p>}
 <button type="button" className={styles.changeBtn} onClick={()=>setVersion(v=>v+1)}>Refresh officers</button>
 </div>}
 {currentAction==='submit_enquiry'&&<><label className={styles.field}>Visit date<input className={styles.input} type="date" required min={detail.application_date} max={today()} value={visit} onChange={e=>setVisit(e.target.value)}/></label><label className={styles.field}>Recommendation<select className={styles.input} value={recommendation} onChange={e=>setRecommendation(e.target.value)}>{['recommend','do_not_recommend','further_review'].map(v=><option key={v} value={v}>{label(v)}</option>)}</select></label></>}
 {currentAction==='approve'&&<label className={styles.field}>Approved amount<input className={styles.input} type="number" min=".01" max={Number(detail.requested_amount)} step=".01" required value={approved} onChange={e=>setApproved(e.target.value)}/></label>}</div><label className={styles.field}>Findings / reason / notes<textarea className={styles.input} required rows={4} maxLength={5000} value={notes} onChange={e=>setNotes(e.target.value)}/></label><button className={styles.submitBtn}>Save Action</button></fieldset></form></section>}
 <section className={styles.card}><h2 className={styles.cardTitle}>Activity History</h2>{detail.events?.map(e=><article key={e.id} style={{padding:'1rem 0',borderBottom:'1px solid var(--border)'}}><strong>{label(e.action)} — {e.actor_name}</strong><p>{new Date(e.created_at.endsWith('Z')?e.created_at:`${e.created_at}Z`).toLocaleString()} {e.visit_date&&` · Visit: ${e.visit_date}`} {e.recommendation&&` · ${label(e.recommendation)}`}</p><p style={{whiteSpace:'pre-wrap'}}>{e.notes}</p></article>)}</section></div>}
 </div>
}

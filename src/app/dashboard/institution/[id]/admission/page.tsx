"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { admissionApi, AdmissionApplication } from '@/lib/api'
import { useUiAccess } from '@/components/access/PermissionGate'
import table from '../accounts/statements/page.module.css'
import form from '../accounts/invoices/create/create.module.css'
import styles from './page.module.css'
const statuses=['submitted','verified','admitted','rejected','withdrawn']
export default function AdmissionPage(){
 const {id}=useParams();const router=useRouter();const institution=Number(id);const {can}=useUiAccess()
 const [filters,setFilters]=useState({q:'',status:'',academic_year:'',grade:''});const [skip,setSkip]=useState(0)
 const [rows,setRows]=useState<AdmissionApplication[]>([]);const [total,setTotal]=useState(0);const [loading,setLoading]=useState(true);const [error,setError]=useState('')
 useEffect(()=>{const value=new URLSearchParams(window.location.search).get('application');if(value&&/^\d+$/.test(value))router.replace(`/dashboard/institution/${id}/admission/${value}`)},[id,router])
 useEffect(()=>{let live=true;setLoading(true);const timer=setTimeout(()=>{admissionApi.list(institution,{...filters,skip:String(skip)}).then(r=>{if(live){setRows(r.items);setTotal(r.total)}}).catch(e=>{if(live)setError(e.message)}).finally(()=>{if(live)setLoading(false)})},250);return()=>{live=false;clearTimeout(timer)}},[institution,filters,skip])
 return <div className={table.page}><div className={table.header}><div><h1 className={table.title}>Admission Applications</h1><p className={table.sub}>Track submission, verification and admission.</p></div>{can('admission.create')&&<Link className={table.button} href={`/dashboard/institution/${id}/admission/apply`}>+ New Application</Link>}</div>
 {error&&<p className={form.error} role="alert">{error}</p>}
 <div className={`${table.filters} ${styles.filters}`}>{(['q','status','academic_year','grade'] as const).map(key=><label key={key}>{{q:'Search applicant, guardian, phone or reference',status:'Status',academic_year:'Academic year',grade:'Class / course'}[key]}{key==='status'?<select value={filters[key]} onChange={e=>{setFilters({...filters,[key]:e.target.value});setSkip(0)}}><option value="">All statuses</option>{statuses.map(s=><option key={s}>{s}</option>)}</select>:<input type={key==='q'?'search':'text'} value={filters[key]} onChange={e=>{setFilters({...filters,[key]:e.target.value});setSkip(0)}}/>}</label>)}</div>
 {loading?<p role="status">Loading applications…</p>:<><div className={table.tableWrap}><table className={table.table}><thead><tr><th>Application</th><th>Applicant</th><th>Academic year</th><th>Class / course</th><th>Status</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><Link href={`/dashboard/institution/${id}/admission/${row.id}`}>{row.reference}</Link></td><td>{row.applicant_name}</td><td>{row.academic_year}</td><td>{row.grade}</td><td><span className={`${styles.badge} ${styles[row.status]}`}>{row.status}</span></td></tr>)}</tbody></table>{!rows.length&&<p className={table.state}>No matching applications.</p>}</div><nav className={styles.pagination} aria-label="Application pages"><span>{total} applications · Page {Math.floor(skip/50)+1} of {Math.max(1,Math.ceil(total/50))}</span><button className={form.cancelBtn} disabled={!skip} onClick={()=>setSkip(Math.max(0,skip-50))}>Previous</button><button className={form.cancelBtn} disabled={skip+50>=total} onClick={()=>setSkip(skip+50)}>Next</button></nav></>}
 </div>
}

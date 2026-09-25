"use client"
import { useEffect, useState } from 'react'
import { admissionApi } from '@/lib/api'
import { useUiAccess } from '@/components/access/PermissionGate'
import AdmissionProfile from './AdmissionProfile'
import styles from '@/app/dashboard/institution/[id]/accounts/invoices/create/create.module.css'
export default function StudentAdmissionProfile({institutionId,userId}:{institutionId:number;userId:number}){
 const {can}=useUiAccess();const allowed=can('students.read')||can('admission.read')
 const [data,setData]=useState<Awaited<ReturnType<typeof admissionApi.studentProfile>>>(null)
 const [error,setError]=useState('')
 useEffect(()=>{if(!allowed)return;let live=true;admissionApi.studentProfile(institutionId,userId).then(d=>{if(live)setData(d)}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[institutionId,userId,allowed])
 if(!allowed)return null
 if(error)return <p role="alert">Could not load admission profile: {error}</p>
 if(!data)return null
 const download=async(doc:{id:number;filename:string})=>{try{const blob=await admissionApi.studentDocument(institutionId,userId,doc.id);const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=doc.filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){setError(e instanceof Error?e.message:'Download failed')}}
 return <section className={styles.card} style={{marginTop:'1.5rem'}}><h2 className={styles.cardTitle}>Admission profile</h2><p className={styles.hint}>Details preserved from the confirmed admission application.</p><AdmissionProfile data={data.extra_data}/><h3>Admission documents and photo</h3>{data.documents.map(doc=><button type="button" className={styles.changeBtn} key={doc.id} onClick={()=>void download(doc)}>{doc.document_type.replaceAll('_',' ')}: {doc.filename}</button>)}</section>
}

"use client"
import AdmissionBasicFields, { emptyAdmissionBasicData } from '@/components/admission/AdmissionBasicFields'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CustomAdmissionFields from './CustomAdmissionFields'
import { admissionApi, AdmissionFormConfig } from '@/lib/api'
import { useUiAccess } from '@/components/access/PermissionGate'
import styles from '@/app/dashboard/institution/[id]/accounts/invoices/create/create.module.css'

export default function AdmissionForm({applicationId}:{applicationId?:number}){
 const {id}=useParams();const router=useRouter();const {can}=useUiAccess()
 const [template,setTemplate]=useState<{version:string;declaration:string[];configuration?:AdmissionFormConfig|null;revision?:number|null}|null>(null)
 const [answers,setAnswers]=useState<Record<string,unknown>>({})
 const [extra,setExtra]=useState(emptyAdmissionBasicData)
 useEffect(()=>{
  let live=true;setTemplate(null);setError('')
  const load=async()=>{
   if(applicationId===undefined){const t=await admissionApi.template(Number(id));if(live)setTemplate(t);return}
   if(!Number.isSafeInteger(applicationId)||applicationId<=0)throw new Error('Invalid application number')
   const detail=await admissionApi.detail(Number(id),applicationId)
   if(detail.status!=='submitted')throw new Error('Only submitted applications can be edited.')
   if(!live)return
   setForm(previous=>Object.fromEntries(Object.keys(previous).map(key=>[key,detail[key as keyof typeof detail]??''])) as typeof previous)
   const defaults=emptyAdmissionBasicData();const saved=detail.extra_data||{}
   setExtra(Object.fromEntries(Object.entries(defaults).map(([key,value])=>[key,saved[key]??value])) as ReturnType<typeof emptyAdmissionBasicData>)
   setAnswers((saved._answers||{}) as Record<string,unknown>)
   setTemplate({configuration:saved._form as AdmissionFormConfig|undefined,version:detail.template_version,declaration:Array.isArray(saved.declaration_text)?saved.declaration_text.map(String):[]})
  }
  void load().catch(e=>{if(live)setError(e.message)})
  return()=>{live=false}
 },[id,applicationId])
 const isCommon=template?.version==='common_v1'
 const usesBasicFields=isCommon||template?.version==='alfitrah_v1'
 const [form,setForm]=useState({applicant_name:'',email:'',phone:'',date_of_birth:'',gender:'',address:'',guardian_name:'',guardian_phone:'',academic_year:'',grade:'',notes:''})
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [submitted,setSubmitted]=useState<string|null>(null)
 const fields:{key:keyof typeof form;label:string;type?:string;max:number;optional?:boolean}[]=[
 {key:'applicant_name',label:'Applicant name (BLOCK LETTERS)',max:200},{key:'email',label:'Student email / login identity',type:'email',max:255},{key:'phone',label:'Phone',max:20,optional:true},{key:'date_of_birth',label:'Date of birth',type:'date',max:10},{key:'gender',label:'Gender',max:20,optional:true},{key:'academic_year',label:'Academic year (e.g. 2026-27)',max:20},{key:'grade',label:'Class / course',max:20},{key:'guardian_name',label:'Guardian name',max:200},{key:'guardian_phone',label:'Guardian phone',max:20}]
 return <div className={`${styles.page} ${styles.invoicePage}`}><div className={styles.header}><h1 className={styles.title}>{applicationId!==undefined?'Edit Admission Application':'New Admission Application'}</h1><p className={styles.sub}>Submit applicant details for verification. A student record is created only after admission.</p></div>
 {error&&<p className={styles.error} role="alert">{error}</p>}{submitted?<p role="status">Application {submitted} submitted successfully. Staff with admission read permission can review it and upload documents.</p>:<form onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{const payload={...form,form_revision:template?.revision??null,email:form.email||null,...(usesBasicFields?{extra_data:{...extra,parent_email:extra.parent_email||null,declaration_date:extra.declaration_date||null}}:{}),...(template?.configuration?{extra_data:{...(usesBasicFields?{...extra,parent_email:extra.parent_email||null,declaration_date:extra.declaration_date||null}:{}),_answers:answers}}:{})};const result=applicationId!==undefined?await admissionApi.update(Number(id),applicationId,payload):await admissionApi.create(Number(id),payload);if(can('admission.read'))router.push(`/dashboard/institution/${id}/admission/${result.id}`);else setSubmitted(result.reference)}catch(e){setError(e instanceof Error?e.message:'Submission failed')}finally{setBusy(false)}}}><fieldset disabled={busy||!template} className={styles.card} style={{border:0}}><div className={styles.grid2}>
 {fields.filter(f=>(!usesBasicFields||f.key!=='email')&&(!isCommon||f.key!=='phone')&&template?.configuration?.common[f.key]?.visible!==false).map(f=><label className={styles.field} key={f.key}>{f.label}{!f.optional&&' *'}<input className={styles.input} type={f.type||'text'} maxLength={f.max} required={!f.optional||template?.configuration?.common[f.key]?.required} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:f.key==='applicant_name'?e.target.value.toUpperCase():e.target.value})}/></label>)}</div>
 <p className={styles.hint}>{usesBasicFields?'No student email or password is required. Parent contact email is separate. Enter the main guardian contact above.':'Use a unique student email. For an existing student, enter their registered email to link their record at admission.'}</p>
 {(['address','notes'] as const).filter(key=>(!isCommon||key!=='notes')&&template?.configuration?.common[key]?.visible!==false).map(key=><label className={styles.field} key={key} style={{marginTop:'1rem'}}>{key==='address'?'Address *':'Additional notes'}<textarea className={styles.input} required={key==='address'||template?.configuration?.common[key]?.required} rows={3} maxLength={key==='address'?2000:5000} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}
 {usesBasicFields&&<AdmissionBasicFields value={extra} onChange={setExtra} dob={form.date_of_birth} year={form.academic_year} declaration={template?.declaration||[]}/>}
 {template?.configuration&&<><CustomAdmissionFields config={template.configuration} answers={answers} onChange={setAnswers}/>{!usesBasicFields&&<section><h2 className={styles.cardTitle}>Declaration</h2>{template.configuration.declaration.map((line,i)=><p key={i}>{line}</p>)}</section>}<p className={styles.hint}>Required documents before verification: {template.configuration.required_documents.map(d=>d.replaceAll('_',' ')).join(', ')||'None'}</p></>}
 <p className={styles.hint}>Upload supporting documents from the application details after submitting.</p><div className={styles.actions} style={{marginTop:'1rem'}}><button type="button" className={styles.cancelBtn} onClick={()=>router.back()}>Cancel</button><button className={styles.submitBtn}>{busy?'Saving…':applicationId!==undefined?'Save Changes':'Submit Application'}</button></div></fieldset></form>}</div>
}

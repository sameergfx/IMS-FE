"use client"
import { useEffect, useRef, useState, ReactNode, CSSProperties } from 'react'
import { admissionApi, institutionsApi, AdmissionApplication, AdmissionFormConfig } from '@/lib/api'
import { Institution } from '@/types/institution'
import styles from './AdmissionFormView.module.css'

const text=(value:unknown)=>typeof value==='string'||typeof value==='number'?String(value):''
const record=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
const date=(value:unknown)=>{const v=text(value);return /^\d{4}-\d{2}-\d{2}$/.test(v)?v.split('-').reverse().join('/'):v}
function Field({label,children}:{label:string;children:ReactNode}){return <div className={styles.field}><span>{label}</span><div className={styles.value}>{children || '\u00a0'}</div></div>}
export default function AdmissionFormView({application:a}:{application:AdmissionApplication}){
 const [institution,setInstitution]=useState<Institution|null>(null)
 const [photo,setPhoto]=useState<string|null>(null)
 const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [printing,setPrinting]=useState(false)
 const paper=useRef<HTMLDivElement>(null);const frame=useRef<HTMLIFrameElement|null>(null)
 const photoId=[...(a.documents||[])].reverse().find(d=>d.document_type==='photo')?.id
 useEffect(()=>{
  let active=true;let objectUrl:string|null=null
  setLoading(true);setError('');setPhoto(null);setInstitution(null)
  Promise.all([institutionsApi.getOne(a.institution_id),photoId?admissionApi.document(a.institution_id,a.id,photoId):Promise.resolve(null)])
   .then(([inst,blob])=>{if(!active)return;setInstitution(inst);if(blob){objectUrl=URL.createObjectURL(blob);setPhoto(objectUrl)}})
   .catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)})
  return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)}
 },[a.institution_id,a.id,photoId])
 useEffect(()=>()=>{frame.current?.remove()},[])
 const print=()=>{
  if(!paper.current||loading||error||printing)return
  setPrinting(true);frame.current?.remove()
  const iframe=document.createElement('iframe');iframe.title='Print admission application';iframe.style.cssText='position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0'
  frame.current=iframe
  const sheets=Array.from(document.querySelectorAll('link[rel="stylesheet"],style')).map(n=>n.outerHTML).join('')
  iframe.onload=async()=>{try{const doc=iframe.contentDocument;const win=iframe.contentWindow;if(!doc||!win)throw new Error('Could not open print document');doc.title=`${institution?.name||'Institution'}_${a.reference}`;await Promise.all(Array.from(doc.images).map(img=>img.decode().catch(()=>{})));await doc.fonts.ready;win.focus();win.print()}catch(e){setError(e instanceof Error?e.message:'Printing failed')}finally{setPrinting(false)}}
  iframe.srcdoc=`<!doctype html><html><head><meta charset="utf-8">${sheets}<style>@page{size:A4;margin:10mm}html,body{margin:0!important;padding:0!important;background:white!important}*{box-sizing:border-box;print-color-adjust:exact;-webkit-print-color-adjust:exact}</style></head><body>${paper.current.outerHTML}</body></html>`
  document.body.appendChild(iframe)
 }
 const x=a.extra_data||{};const father=record(x.father);const mother=record(x.mother)
 const siblings=Array.isArray(x.siblings)?x.siblings.map(record):[]
 const siblingRows=Array.from({length:Math.max(4,siblings.length)},(_,i)=>siblings[i]||{})
 const declaration=Array.isArray(x.declaration_text)?x.declaration_text:[]
 const config=x._form as AdmissionFormConfig|undefined
 const selectedTheme=a.print_theme_color||config?.theme_color||'#ed1722'
 const theme=/^#[0-9a-f]{6}$/i.test(selectedTheme)?selectedTheme:'#ed1722'
 const rgb=[1,3,5].map(i=>{const c=parseInt(theme.slice(i,i+2),16)/255;return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4})
 const luminance=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722
 const themeText=luminance>.179?'#111111':'#ffffff'
 const answers=(x._answers||{}) as Record<string,unknown>
 const customRows=config?.fields.filter(f=>f.show_in_print)||[]
 const renderCustom=()=>customRows.length>0&&<><h2 className={styles.band}>ADDITIONAL DETAILS</h2><table><tbody>{customRows.map(f=><tr key={f.id}><th>{f.label}</th><td>{typeof answers[f.id]==='boolean'?(answers[f.id]?'Yes':'No'):text(answers[f.id])||'—'}</td></tr>)}</tbody></table></>
 const footer=[institution?.address||institution?.place,institution?.phone,institution?.email].filter(Boolean).join(' | ')
 return <section><div className={styles.toolbar}><div><h2>Admission Form View</h2><p>Institution admission application · A4 print layout.</p></div><button type="button" onClick={print} disabled={loading||!!error||printing}>{printing?'Preparing…':'Print / Save PDF'}</button></div>
 {loading&&<p role="status">Loading form and photo…</p>}{error&&<p role="alert">{error}</p>}
 {!loading&&!error&&<div className={styles.preview}><div ref={paper} className={styles.document} style={{'--admission-theme':theme,'--admission-theme-text':themeText} as CSSProperties}>
 <article className={styles.sheet}>
 <header className={styles.header}><div className={styles.brand}>{institution?.logo?<img src={institution.logo} alt={institution.name||'Institution logo'}/>:<h2>{institution?.name||'Institution'}</h2>}</div><div className={styles.applicationNumber}><Field label="Application No:">{a.reference}</Field></div><div className={styles.photo}>{photo?<img src={photo} alt={`${a.applicant_name} photograph`}/>:<span>Affix<br/>Photo</span>}</div></header>
 <h1 className={styles.band}>APPLICATION FOR ADMISSION</h1>
 <div className={styles.body}>
 <Field label="1. Name of the pupil:">{a.applicant_name}</Field>
 <div className={styles.row}><Field label="Class / course applied for:">{a.grade}</Field><Field label="Academic year:">{a.academic_year}</Field></div>
 <div className={styles.row}><Field label="2. Aadhaar no:">{text(x.aadhaar)}</Field><Field label="3. Sex:">{a.gender}</Field><Field label="4. Nationality:">{text(x.nationality)}</Field></div>
 <div className={styles.row}><Field label="5. Religion:">{text(x.religion)}</Field><Field label="6. Caste:">{text(x.caste)}</Field><Field label="7. Date of birth:">{date(a.date_of_birth)}</Field></div>
 <Field label="8. Date of birth in words:">{text(x.date_of_birth_words)}</Field>
 <Field label={`9. Age as on ${date(x.age_as_of)}:`}>{x.age_years!=null?`${text(x.age_years)} years, ${text(x.age_months)} completed months`:''}</Field>
 <p className={styles.sectionTitle}>10. Details of parents:</p><table><thead><tr><th></th><th>Name</th><th>Occupation</th><th>Educational qualification</th><th>Mobile / landline</th></tr></thead><tbody>{[['Father',father],['Mother',mother]].map(([label,parent])=>{const p=record(parent);return <tr key={String(label)}><th>{String(label)}</th>{['name','occupation','qualification','phone'].map(k=><td key={k}>{text(p[k])}</td>)}</tr>})}</tbody></table>
 <p className={styles.sectionTitle}>11. Address of parent:</p><table><thead><tr><th>Permanent</th><th>Official</th><th>For communication</th></tr></thead><tbody><tr className={styles.addressRow}><td>{a.address}</td><td>{text(x.official_address)}</td><td>{text(x.communication_address)}</td></tr></tbody></table>
 <div className={styles.row}><Field label="Main guardian:">{a.guardian_name}</Field><Field label="Contact phone:">{a.guardian_phone}</Field></div><Field label="Parent contact email:">{text(x.parent_email)}</Field>
 <p className={styles.sectionTitle}>12. Local guardian (if the child does not stay with parents):</p><div className={styles.guardian}>{x.stays_with_parents?'Child stays with parents':<><p>{text(x.local_guardian_name)}</p><p>{text(x.local_guardian_address)}</p><p>Mobile: {text(x.local_guardian_mobile)} · Landline: {text(x.local_guardian_landline)}</p></>}</div>
 <div className={styles.row}><Field label="13. Mother tongue:">{text(x.mother_tongue)}</Field><Field label="14. Blood group:">{text(x.blood_group)}</Field></div>
 <p className={styles.sectionTitle}>15. Identification marks:</p><div className={styles.row}><Field label="1.">{text(x.identification_mark_1)}</Field><Field label="2.">{text(x.identification_mark_2)}</Field></div>
 </div><footer>{footer}</footer></article>
 <article className={styles.sheet}>
 <div className={styles.body}><p className={styles.sectionTitle}>16. Details of brothers / sisters studying in this school:</p><table><thead><tr><th>No.</th><th>Name</th><th>Class & division</th></tr></thead><tbody>{siblingRows.map((s,i)=><tr key={i}><td>{i+1}</td><td>{text(s.name)}</td><td>{text(s.class_division)}</td></tr>)}</tbody></table>
 {renderCustom()}<h2 className={styles.band}>DECLARATION</h2><p className={styles.declarationIntro}>I, <strong>{text(x.declaration_parent)||'________________'}</strong>, parent / guardian of <strong>{a.applicant_name}</strong>, hereby certify that:</p>
 <ol className={styles.declaration} type="a">{(config?.declaration||declaration).map((line,i)=><li key={i}>{text(line)}</li>)}</ol>
 <div className={styles.signatureRow}><div><Field label="Date:">{date(x.declaration_date)}</Field><Field label="Place:">{text(x.declaration_place)}</Field></div><div><div className={styles.signatureBox}/><p>{config?.signature_label||'Signature of the Parent'}</p></div></div>
 <p className={styles.receiptNote}>Signed declaration received: {x.signed_declaration_received?'Yes':'No'} · The signed document, when supplied, is retained separately.</p>
 </div>
 <section className={styles.office}><h2 className={styles.band}>FOR OFFICE USE</h2><div className={styles.body}><div className={styles.row}><Field label="Date of admission:">{date(a.admitted_on)}</Field><Field label="Admission No:">{a.admission_number||''}</Field></div><Field label="Standard to which admitted:">{a.status==='admitted'?a.grade:''}</Field><Field label="Academic year:">{a.academic_year}</Field></div></section>
 <footer>{footer}</footer></article>
 </div></div>}
 </section>
}

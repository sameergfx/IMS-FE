import {AdmissionFormConfig} from '@/lib/api'
import styles from './AdmissionProfile.module.css'
const title=(key:string)=>key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())
function Value({value}:{value:unknown}){
 if(value===null||value===undefined||value==='')return <>—</>
 if(typeof value==='boolean')return <>{value?'Yes':'No'}</>
 if(Array.isArray(value))return value.length?<ul>{value.map((v,i)=><li key={i}><Value value={v}/></li>)}</ul>:<>—</>
 if(typeof value==='object')return <DataTable data={value as Record<string,unknown>}/>
 return <>{String(value)}</>
}
function DataTable({data}:{data:Record<string,unknown>}){
 return <table className={styles.table}><tbody>{Object.entries(data).map(([key,value])=><tr key={key}><th scope="row">{title(key)}</th><td><Value value={value}/></td></tr>)}</tbody></table>
}
export default function AdmissionProfile({data}:{data:Record<string,unknown>}){
 const config=data._form as AdmissionFormConfig|undefined
 const answers=(data._answers||{}) as Record<string,unknown>
 const base=Object.fromEntries(Object.entries(data).filter(([key])=>!key.startsWith('_')))
 return <><DataTable data={base}/>{config&&<table className={styles.table}><tbody>{config.fields.map(f=><tr key={f.id}><th scope="row">{f.label}</th><td><Value value={answers[f.id]}/></td></tr>)}</tbody></table>}</>
}

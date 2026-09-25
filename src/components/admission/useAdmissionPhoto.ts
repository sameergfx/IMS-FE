"use client"
import {useEffect,useState} from 'react'
import {admissionApi} from '@/lib/api'
export default function useAdmissionPhoto(institutionId?:number,userId?:number){
 const [photo,setPhoto]=useState<string|null>(null)
 const [error,setError]=useState('')
 useEffect(()=>{
  let active=true;let url:string|null=null;setPhoto(null);setError('')
  if(!institutionId||!userId)return
  void admissionApi.studentProfile(institutionId,userId).then(async profile=>{
   const doc=profile?.documents.filter(d=>d.document_type==='photo').sort((a,b)=>b.id-a.id)[0]
   if(!doc||!active)return
   const blob=await admissionApi.studentDocument(institutionId,userId,doc.id)
   if(active){url=URL.createObjectURL(blob);setPhoto(url)}
  }).catch(()=>{if(active)setError('Could not load admission photo.')})
  return()=>{active=false;if(url)URL.revokeObjectURL(url)}
 },[institutionId,userId])
 return {photo,error}
}

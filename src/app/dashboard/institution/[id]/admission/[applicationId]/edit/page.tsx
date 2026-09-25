"use client"
import {useParams} from 'next/navigation'
import AdmissionForm from '@/components/admission/AdmissionForm'
export default function EditApplicationPage(){
 const {applicationId}=useParams()
 return <AdmissionForm applicationId={Number(applicationId)}/>
}

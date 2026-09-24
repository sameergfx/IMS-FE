import { redirect } from "next/navigation"

export default async function CreateReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/dashboard/institution/${id}/accounts/invoices`)
}

import type { Metadata } from "next"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { PermissionsProvider } from "@/lib/permissions-context";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "School Management System",
  description: "Admin portal",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <AuthProvider>
          <PermissionsProvider>
            {children}
          </PermissionsProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}

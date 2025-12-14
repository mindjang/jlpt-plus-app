'use client'

import React from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-page flex">
      <AdminSidebar />
      <main className="flex-1 ml-16 md:ml-20">
        {children}
      </main>
    </div>
  )
}


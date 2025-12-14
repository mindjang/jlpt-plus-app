'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

type AdminSection = 'dashboard' | 'users' | 'content' | 'codes' | 'stats' | 'settings'

interface AdminContextType {
  activeSection: AdminSection
  setActiveSection: (section: AdminSection) => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')

  return (
    <AdminContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}

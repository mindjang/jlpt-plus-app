'use client'

import React from 'react'
import { AppBar } from '@/components/ui/AppBar'
import { PrivacyContent } from '@/data/legal/privacy'

export default function PrivacyPage() {
  return (
    <div className="w-full min-h-screen bg-page">
      <AppBar title="개인정보 처리방침" />
      <div className="px-4 py-6 pb-24">
        <PrivacyContent />
      </div>
    </div>
  )
}

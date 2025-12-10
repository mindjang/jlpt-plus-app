'use client'

import React from 'react'
import { AppBar } from '@/components/ui/AppBar'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="w-full min-h-screen overflow-hidden">
      <AppBar title="로그인" />
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 bg-page">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}


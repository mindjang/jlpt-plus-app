'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  BookOpen,
  Ticket,
  BarChart2,
  LayoutDashboard,
  Settings,
  LogOut
} from 'lucide-react'

type AdminSection = 'dashboard' | 'users' | 'content' | 'codes' | 'settings'

interface AdminSidebarProps {
  activeSection: string
  onNavigate: (section: AdminSection) => void
}

export function AdminSidebar({ activeSection, onNavigate }: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: BarChart2 },
    { id: 'users', label: '사용자 관리', icon: Users },
    { id: 'content', label: '콘텐츠 관리', icon: BookOpen },
    { id: 'codes', label: '쿠폰 코드', icon: Ticket },
    // { id: 'settings', label: '설정', icon: Settings },
  ]

  return (
    <div className="w-64 bg-surface border-r border-divider h-screen fixed left-0 top-0 flex flex-col z-40 hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-divider">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          JLPT ONE Admin
        </h1>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = activeSection === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as AdminSection)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${isActive
                  ? 'text-white font-bold'
                  : 'text-text-sub active:bg-gray-100'
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <Icon size={20} className={`relative z-10 ${isActive ? 'text-white' : 'text-text-sub'}`} />
              <span className="relative z-10">{item.label}</span>
            </button>
          )
        })}
      </div>

      <div className="p-4 border-t border-divider">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-text-sub active:bg-gray-100 active:text-red-500">
          <LogOut size={20} />
          <span>나가기</span>
        </button>
      </div>
    </div>
  )
}

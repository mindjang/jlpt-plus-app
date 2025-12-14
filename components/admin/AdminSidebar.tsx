'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users,
  BookOpen,
  Ticket,
  BarChart2,
  LogOut,
  Settings,
  Flag
} from 'lucide-react'

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  
  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: BarChart2, path: '/admin/dashboard' },
    { id: 'users', label: '사용자', icon: Users, path: '/admin/users' },
    { id: 'content', label: '콘텐츠 관리', icon: BookOpen, path: '/admin/content' },
    { id: 'codes', label: '쿠폰', icon: Ticket, path: '/admin/codes' },
    { id: 'reports', label: '신고', icon: Flag, path: '/admin/reports' },
    { id: 'stats', label: '통계', icon: BarChart2, path: '/admin/stats' },
    { id: 'settings', label: '설정', icon: Settings, path: '/admin/settings' },
  ]
  
  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return (
    <div className="w-16 md:w-20 bg-surface border-r border-divider h-screen fixed left-0 top-0 flex flex-col z-40">
      {/* 로고/헤더 - 최소화 */}
      <div className="h-14 flex items-center justify-center border-b border-divider">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">A</span>
        </div>
      </div>

      {/* 메뉴 아이템 - 아이콘만 표시 */}
      <div className="flex-1 py-4 flex flex-col items-center gap-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (item.id === 'dashboard' && pathname === '/admin')
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className={`relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-text-sub hover:bg-gray-100 active:bg-gray-200'
              }`}
              title={item.label}
            >
              <Icon size={22} className="relative z-10" />
            </button>
          )
        })}
      </div>

      {/* 하단 로그아웃 */}
      <div className="p-2 border-t border-divider">
        <button 
          className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-lg text-text-sub hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors"
          title="나가기"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  )
}

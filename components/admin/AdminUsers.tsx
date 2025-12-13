'use client'

import React, { useState, useEffect } from 'react'
import { getAllUsers } from '@/lib/firebase/firestore'
import { UserProfile } from '@/lib/types/user'
import { handleFirestoreError } from '@/lib/utils/error/errorHandler'

export function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await getAllUsers()
      // Sort by createdAt desc
      const sorted = data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      setUsers(sorted)
    } catch (error) {
      handleFirestoreError(error, '사용자 목록 로드')
      setMessage({ type: 'error', text: '사용자 목록을 불러오는데 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Optional: show toast
  }

  if (loading) return <div>로딩 중...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-subtitle font-semibold text-text-main">사용자 관리</h3>
        <span className="text-body text-text-sub">총 {users.length}명</span>
      </div>

      {message && (
        <div className={`p-3 rounded-card text-body ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-surface rounded-card shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-page">
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">이름</th>
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">이메일</th>
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">전화번호</th>
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">가입일</th>
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">UID</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className="border-b border-divider hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-body text-text-main font-medium">{user.displayName || '-'}</td>
                  <td className="py-3 px-4 text-body text-text-main">{user.email || '-'}</td>
                  <td className="py-3 px-4 text-body text-text-main">{user.phoneNumber || '-'}</td>
                  <td className="py-3 px-4 text-body text-text-sub">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => copyToClipboard(user.uid || '')}
                      className="text-xs text-text-sub bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                      title="UID 복사"
                    >
                      복사
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-sub">
                    사용자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

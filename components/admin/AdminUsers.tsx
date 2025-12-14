'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { getAllUsers } from '@/lib/firebase/firestore'
import { UserProfile } from '@/lib/types/user'
import { handleFirestoreError } from '@/lib/utils/error/errorHandler'
import { Search, ArrowUpDown, Copy, Check } from 'lucide-react'

type SortField = 'displayName' | 'email' | 'createdAt'
type SortOrder = 'asc' | 'desc'

export function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [copiedUid, setCopiedUid] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await getAllUsers()
      setUsers(data)
    } catch (error) {
      handleFirestoreError(error, '사용자 목록 로드')
      setMessage({ type: 'error', text: '사용자 목록을 불러오는데 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  // 필터링 및 정렬
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users

    // 검색 필터
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.displayName?.toLowerCase().includes(lower) ||
          user.email?.toLowerCase().includes(lower) ||
          user.phoneNumber?.toLowerCase().includes(lower) ||
          user.uid?.toLowerCase().includes(lower)
      )
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''

      switch (sortField) {
        case 'displayName':
          aValue = a.displayName || ''
          bValue = b.displayName || ''
          break
        case 'email':
          aValue = a.email || ''
          bValue = b.email || ''
          break
        case 'createdAt':
          aValue = a.createdAt || 0
          bValue = b.createdAt || 0
          break
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
      }
    })

    return sorted
  }, [users, searchTerm, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedUid(text)
      setTimeout(() => setCopiedUid(null), 2000)
    } catch (error) {
      console.error('복사 실패:', error)
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-primary transition-colors"
    >
      {children}
      {sortField === field && (
        <ArrowUpDown
          size={14}
          className={sortOrder === 'asc' ? 'rotate-180' : ''}
        />
      )}
    </button>
  )

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-body text-text-sub">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-sub" />
          <input
            type="text"
            placeholder="이름, 이메일, 전화번호, UID로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-divider rounded-lg text-body focus:outline-none focus:border-primary"
          />
        </div>
        <div className="text-body text-text-sub">
          총 {users.length}명 / 검색 결과: {filteredAndSortedUsers.length}명
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-body ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 테이블 */}
      <div className="bg-surface rounded-lg border border-divider overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-page">
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">
                  <SortButton field="displayName">이름</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">
                  <SortButton field="email">이메일</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">전화번호</th>
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">
                  <SortButton field="createdAt">가입일</SortButton>
                </th>
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">UID</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.map((user) => (
                <tr key={user.uid} className="border-b border-divider hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-body text-text-main font-medium">{user.displayName || '-'}</td>
                  <td className="py-3 px-4 text-body text-text-main">{user.email || '-'}</td>
                  <td className="py-3 px-4 text-body text-text-main">{user.phoneNumber || '-'}</td>
                  <td className="py-3 px-4 text-body text-text-sub">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => copyToClipboard(user.uid || '')}
                      className="flex items-center gap-2 text-label text-text-sub bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200 active:bg-gray-300 transition-colors"
                      title="UID 복사"
                    >
                      {copiedUid === user.uid ? (
                        <>
                          <Check size={14} className="text-green-600" />
                          <span className="text-green-600">복사됨</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>복사</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAndSortedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-sub">
                    {searchTerm ? '검색 결과가 없습니다.' : '사용자가 없습니다.'}
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

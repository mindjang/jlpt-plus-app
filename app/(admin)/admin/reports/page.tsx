'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import type { ContentReport } from '@/lib/firebase/firestore/reports'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ContentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all')
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadReports()
  }, [filter])

  const loadReports = async () => {
    setLoading(true)
    try {
      const status = filter === 'all' ? undefined : filter
      const response = await fetch(`/api/admin/reports?status=${status || ''}`)
      if (!response.ok) {
        throw new Error('신고 목록을 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (reportId: string, status: ContentReport['status']) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          status,
          adminNote: adminNote.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('상태 업데이트에 실패했습니다.')
      }

      // 목록 새로고침
      await loadReports()
      setSelectedReport(null)
      setAdminNote('')
    } catch (error) {
      console.error('Error updating report status:', error)
      alert('상태 업데이트에 실패했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: ContentReport['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      reviewed: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700',
      dismissed: 'bg-gray-100 text-gray-700',
    }
    const labels = {
      pending: '대기중',
      reviewed: '검토중',
      resolved: '해결됨',
      dismissed: '기각',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-display-s font-bold text-text-main mb-6">신고 관리</h1>

          {/* 필터 */}
          <div className="flex gap-2 mb-6">
            {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-body font-medium ${
                  filter === status
                    ? 'bg-primary text-surface'
                    : 'bg-surface border border-divider text-text-main'
                }`}
              >
                {status === 'all' ? '전체' : getStatusBadge(status).props.children}
              </button>
            ))}
          </div>

          {/* 신고 목록 */}
          {loading ? (
            <div className="text-center py-12 text-body text-text-sub">로딩 중...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-body text-text-sub">
              신고 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-surface rounded-lg border border-divider p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-title font-semibold text-text-main">
                          {report.contentText}
                        </span>
                        {getStatusBadge(report.status)}
                        <span className="text-label text-text-sub">
                          {report.contentType === 'word' ? '단어' : '한자'} · {report.level}
                        </span>
                      </div>
                      <p className="text-body text-text-sub mb-2 line-clamp-2">
                        {report.reason}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-text-sub">
                        <span>신고자: {report.userName || report.userEmail || report.uid}</span>
                        <span>신고일: {formatDate(report.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-title font-semibold text-text-main">신고 상세</h2>
              <button
                onClick={() => {
                  setSelectedReport(null)
                  setAdminNote('')
                }}
                className="text-text-sub hover:text-text-main"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 기본 정보 */}
              <div>
                <label className="block text-label font-medium text-text-main mb-1">
                  {selectedReport.contentType === 'word' ? '단어' : '한자'}
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-md text-body text-text-main">
                  {selectedReport.contentText}
                </div>
              </div>

              <div>
                <label className="block text-label font-medium text-text-main mb-1">
                  레벨
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-md text-body text-text-main">
                  {selectedReport.level}
                </div>
              </div>

              <div>
                <label className="block text-label font-medium text-text-main mb-1">
                  신고 사유
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-md text-body text-text-main whitespace-pre-wrap">
                  {selectedReport.reason}
                </div>
              </div>

              <div>
                <label className="block text-label font-medium text-text-main mb-1">
                  신고자 정보
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-md text-body text-text-main">
                  {selectedReport.userName && <div>이름: {selectedReport.userName}</div>}
                  {selectedReport.userEmail && <div>이메일: {selectedReport.userEmail}</div>}
                  <div className="text-xs text-text-sub mt-1">
                    UID: {selectedReport.uid}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-label font-medium text-text-main mb-1">
                  신고일시
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-md text-body text-text-main">
                  {formatDate(selectedReport.createdAt)}
                </div>
              </div>

              {selectedReport.reviewedAt && (
                <div>
                  <label className="block text-label font-medium text-text-main mb-1">
                    검토일시
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-body text-text-main">
                    {formatDate(selectedReport.reviewedAt)}
                  </div>
                </div>
              )}

              {selectedReport.adminNote && (
                <div>
                  <label className="block text-label font-medium text-text-main mb-1">
                    관리자 메모
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-body text-text-main whitespace-pre-wrap">
                    {selectedReport.adminNote}
                  </div>
                </div>
              )}

              {/* 관리자 메모 입력 */}
              <div>
                <label className="block text-label font-medium text-text-main mb-1">
                  관리자 메모
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="검토 내용이나 처리 사항을 기록하세요"
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-divider bg-surface text-body text-text-main focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* 상태 변경 버튼 */}
              <div className="flex gap-2 pt-4">
                {selectedReport.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedReport.id!, 'reviewed')}
                      disabled={updating}
                      className="flex-1 py-2 px-4 rounded-lg bg-blue-500 text-white text-body font-medium disabled:opacity-50"
                    >
                      검토중으로 변경
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReport.id!, 'resolved')}
                      disabled={updating}
                      className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white text-body font-medium disabled:opacity-50"
                    >
                      해결됨으로 변경
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReport.id!, 'dismissed')}
                      disabled={updating}
                      className="flex-1 py-2 px-4 rounded-lg bg-gray-500 text-white text-body font-medium disabled:opacity-50"
                    >
                      기각
                    </button>
                  </>
                )}
                {selectedReport.status === 'reviewed' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedReport.id!, 'resolved')}
                      disabled={updating}
                      className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white text-body font-medium disabled:opacity-50"
                    >
                      해결됨으로 변경
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReport.id!, 'dismissed')}
                      disabled={updating}
                      className="flex-1 py-2 px-4 rounded-lg bg-gray-500 text-white text-body font-medium disabled:opacity-50"
                    >
                      기각
                    </button>
                  </>
                )}
                {(selectedReport.status === 'resolved' || selectedReport.status === 'dismissed') && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReport.id!, 'pending')}
                    disabled={updating}
                    className="flex-1 py-2 px-4 rounded-lg bg-yellow-500 text-white text-body font-medium disabled:opacity-50"
                  >
                    대기중으로 변경
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

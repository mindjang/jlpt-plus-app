'use client'

import { AdminContent } from '@/components/admin/AdminContent'
import { AdminUsers } from '@/components/admin/AdminUsers'
import { AdminStats } from '@/components/admin/AdminStats'
import React, { useState, useEffect, useCallback } from 'react'
import { AppBar } from '@/components/ui/AppBar'
import { Modal } from '@/components/ui/Modal'
import {
  createGiftCode,
  getAllGiftCodes,
  updateGiftCode,
  deleteGiftCode,
} from '@/lib/firebase/firestore'
import { generateRandomCode, validateCodeFormat, formatCode } from '@/lib/utils/codeUtils'
import type { GiftCode } from '@/lib/types/membership'
import { handleFirestoreError } from '@/lib/utils/error/errorHandler'

interface CodeItem {
  code: string
  data: GiftCode & { createdAt?: number }
}

type CodeGenerationMode = 'auto' | 'manual'

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [codes, setCodes] = useState<CodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 코드 생성 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [generationMode, setGenerationMode] = useState<CodeGenerationMode>('auto')
  const [newCode, setNewCode] = useState('')
  const [durationDays, setDurationDays] = useState(30)
  const [remainingUses, setRemainingUses] = useState<number | null>(null)
  const [unlimitedUses, setUnlimitedUses] = useState(true)
  const [note, setNote] = useState('')
  const [creating, setCreating] = useState(false)

  // 코드 수정 모달 상태
  const [editingCode, setEditingCode] = useState<CodeItem | null>(null)
  const [editDurationDays, setEditDurationDays] = useState(30)
  const [editRemainingUses, setEditRemainingUses] = useState<number | null>(null)
  const [editUnlimitedUses, setEditUnlimitedUses] = useState(true)
  const [editNote, setEditNote] = useState('')
  const [updating, setUpdating] = useState(false)

  // 코드 삭제 확인 모달 상태
  const [deletingCode, setDeletingCode] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 통계 계산
  const stats = {
    total: codes.length,
    active: codes.filter((c) => {
      const uses = c.data.remainingUses
      return uses === null || uses === undefined || uses > 0
    }).length,
    expired: codes.filter((c) => {
      const uses = c.data.remainingUses
      return uses !== null && uses !== undefined && uses <= 0
    }).length,
    totalUses: codes.reduce((sum, c) => {
      const uses = c.data.remainingUses
      if (uses === null || uses === undefined) return sum
      // 초기 사용 횟수를 알 수 없으므로 현재 remainingUses만 표시
      return sum
    }, 0),
  }

  const loadCodes = useCallback(async () => {
    try {
      setLoading(true)
      const allCodes = await getAllGiftCodes()
      setCodes(allCodes)
    } catch (error) {
      handleFirestoreError(error, '코드 목록 로드')
      setMessage({ type: 'error', text: '코드 목록을 불러오는데 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeSection === 'codes') {
      loadCodes()
    }
  }, [activeSection, loadCodes])

  const handleGenerateCode = () => {
    if (generationMode === 'auto') {
      const code = generateRandomCode(8, true)
      setNewCode(code)
    }
  }

  const handleCreateCode = async () => {
    if (generationMode === 'manual' && !validateCodeFormat(newCode)) {
      setMessage({ type: 'error', text: '올바른 8자리 코드 형식이 아닙니다.' })
      return
    }

    if (durationDays <= 0) {
      setMessage({ type: 'error', text: '기간은 1일 이상이어야 합니다.' })
      return
    }

    if (!unlimitedUses && (!remainingUses || remainingUses <= 0)) {
      setMessage({ type: 'error', text: '사용 횟수를 입력해주세요.' })
      return
    }

    try {
      setCreating(true)
      setMessage(null)

      const codeToUse = generationMode === 'auto' ? generateRandomCode(8, false) : newCode.replace(/-/g, '').toUpperCase()
      const giftCode: GiftCode = {
        durationDays,
        remainingUses: unlimitedUses ? null : remainingUses,
        type: 'gift',
        note: note || undefined,
      }

      await createGiftCode(codeToUse, giftCode)
      setMessage({ type: 'success', text: '코드가 생성되었습니다.' })
      setShowCreateModal(false)
      resetCreateForm()
      loadCodes()
    } catch (error) {
      const errorMessage = handleFirestoreError(error, '코드 생성')
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setCreating(false)
    }
  }

  const resetCreateForm = () => {
    setNewCode('')
    setDurationDays(30)
    setRemainingUses(null)
    setUnlimitedUses(true)
    setNote('')
    setGenerationMode('auto')
  }

  const handleEditCode = (codeItem: CodeItem) => {
    setEditingCode(codeItem)
    setEditDurationDays(codeItem.data.durationDays)
    setEditRemainingUses(codeItem.data.remainingUses ?? null)
    setEditUnlimitedUses(codeItem.data.remainingUses === null || codeItem.data.remainingUses === undefined)
    setEditNote(codeItem.data.note || '')
  }

  const handleUpdateCode = async () => {
    if (!editingCode) return

    if (editDurationDays <= 0) {
      setMessage({ type: 'error', text: '기간은 1일 이상이어야 합니다.' })
      return
    }

    if (!editUnlimitedUses && (!editRemainingUses || editRemainingUses <= 0)) {
      setMessage({ type: 'error', text: '사용 횟수를 입력해주세요.' })
      return
    }

    try {
      setUpdating(true)
      setMessage(null)

      await updateGiftCode(editingCode.code, {
        durationDays: editDurationDays,
        remainingUses: editUnlimitedUses ? null : editRemainingUses,
        note: editNote || undefined,
      })

      setMessage({ type: 'success', text: '코드가 수정되었습니다.' })
      setEditingCode(null)
      loadCodes()
    } catch (error) {
      const errorMessage = handleFirestoreError(error, '코드 수정')
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteCode = async () => {
    if (!deletingCode) return

    try {
      setDeleting(true)
      setMessage(null)

      await deleteGiftCode(deletingCode)
      setMessage({ type: 'success', text: '코드가 삭제되었습니다.' })
      setDeletingCode(null)
      loadCodes()
    } catch (error) {
      const errorMessage = handleFirestoreError(error, '코드 삭제')
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setDeleting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: 'success', text: '코드가 복사되었습니다.' })
    setTimeout(() => setMessage(null), 2000)
  }

  return (
    <>
      <AppBar title="관리자 대시보드" />

      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-title font-semibold text-text-main mb-6">관리자 페이지</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div
              className="bg-surface rounded-card p-6 shadow-soft cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveSection(activeSection === 'users' ? null : 'users')}
            >
              <h3 className="text-subtitle font-semibold text-text-main mb-2">사용자 관리</h3>
              <p className="text-body text-text-sub">사용자 목록 및 권한 관리</p>
            </div>

            <div
              className="bg-surface rounded-card p-6 shadow-soft cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveSection(activeSection === 'content' ? null : 'content')}
            >
              <h3 className="text-subtitle font-semibold text-text-main mb-2">콘텐츠 관리</h3>
              <p className="text-body text-text-sub">단어, 한자, 예문 관리</p>
            </div>

            <div
              className="bg-surface rounded-card p-6 shadow-soft cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveSection(activeSection === 'codes' ? null : 'codes')}
            >
              <h3 className="text-subtitle font-semibold text-text-main mb-2">쿠폰 코드 관리</h3>
              <p className="text-body text-text-sub">기간제 쿠폰 코드 생성 및 관리</p>
            </div>

            <div
              className="bg-surface rounded-card p-6 shadow-soft cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveSection(activeSection === 'stats' ? null : 'stats')}
            >
              <h3 className="text-subtitle font-semibold text-text-main mb-2">통계 분석</h3>
              <p className="text-body text-text-sub">학습 통계 및 분석</p>
            </div>
          </div>

          {/* 섹션 렌더링 */}
          {activeSection === 'users' && <AdminUsers />}
          {activeSection === 'content' && <AdminContent />}
          {activeSection === 'stats' && <AdminStats />}

          {/* 쿠폰 코드 관리 섹션 */}
          {activeSection === 'codes' && (
            <div className="bg-surface rounded-card p-6 shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-subtitle font-semibold text-text-main">쿠폰 코드 관리</h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-primary text-surface rounded-card text-body font-medium button-press"
                >
                  코드 생성
                </button>
              </div>

              {/* 통계 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-page rounded-card p-4">
                  <div className="text-label text-text-sub mb-1">총 코드 수</div>
                  <div className="text-title font-semibold text-text-main">{stats.total}</div>
                </div>
                <div className="bg-page rounded-card p-4">
                  <div className="text-label text-text-sub mb-1">활성 코드</div>
                  <div className="text-title font-semibold text-text-main">{stats.active}</div>
                </div>
                <div className="bg-page rounded-card p-4">
                  <div className="text-label text-text-sub mb-1">만료된 코드</div>
                  <div className="text-title font-semibold text-text-main">{stats.expired}</div>
                </div>
                <div className="bg-page rounded-card p-4">
                  <div className="text-label text-text-sub mb-1">사용 가능 횟수</div>
                  <div className="text-title font-semibold text-text-main">
                    {codes.reduce((sum, c) => {
                      const uses = c.data.remainingUses
                      return sum + (uses === null || uses === undefined ? 999 : uses)
                    }, 0)}
                  </div>
                </div>
              </div>

              {/* 메시지 */}
              {message && (
                <div
                  className={`mb-4 p-3 rounded-card text-body ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                >
                  {message.text}
                </div>
              )}

              {/* 코드 목록 */}
              {loading ? (
                <div className="text-center py-8 text-text-sub">로딩 중...</div>
              ) : codes.length === 0 ? (
                <div className="text-center py-8 text-text-sub">생성된 코드가 없습니다.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-divider">
                        <th className="text-left py-3 px-4 text-label font-semibold text-text-main">코드</th>
                        <th className="text-left py-3 px-4 text-label font-semibold text-text-main">기간</th>
                        <th className="text-left py-3 px-4 text-label font-semibold text-text-main">사용 횟수</th>
                        <th className="text-left py-3 px-4 text-label font-semibold text-text-main">생성일</th>
                        <th className="text-left py-3 px-4 text-label font-semibold text-text-main">메모</th>
                        <th className="text-left py-3 px-4 text-label font-semibold text-text-main">액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((item) => {
                        const formattedCode = formatCode(item.code)
                        const createdAt = item.data.createdAt
                          ? new Date(item.data.createdAt).toLocaleDateString('ko-KR')
                          : '-'
                        const uses = item.data.remainingUses
                        const usesText = uses === null || uses === undefined ? '무제한' : `${uses}회 남음`

                        return (
                          <tr key={item.code} className="border-b border-divider">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-body font-mono text-text-main">{formattedCode}</span>
                                <button
                                  onClick={() => copyToClipboard(formattedCode)}
                                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-page transition-colors"
                                  aria-label="복사"
                                >
                                  <svg
                                    className="w-4 h-4 text-text-sub"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-body text-text-main">{item.data.durationDays}일</td>
                            <td className="py-3 px-4 text-body text-text-main">{usesText}</td>
                            <td className="py-3 px-4 text-body text-text-sub">{createdAt}</td>
                            <td className="py-3 px-4 text-body text-text-sub">{item.data.note || '-'}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditCode(item)}
                                  className="px-3 py-1 text-label bg-page rounded-card hover:bg-divider transition-colors button-press"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => setDeletingCode(item.code)}
                                  className="px-3 py-1 text-label bg-red-100 text-red-700 rounded-card hover:bg-red-200 transition-colors button-press"
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 코드 생성 모달 */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="쿠폰 코드 생성">
        <div className="space-y-4">
          {/* 생성 방식 선택 */}
          <div>
            <label className="text-label text-text-main mb-2 block">생성 방식</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={generationMode === 'auto'}
                  onChange={() => {
                    setGenerationMode('auto')
                    setNewCode('')
                  }}
                  className="w-4 h-4"
                />
                <span className="text-body text-text-main">자동 생성</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={generationMode === 'manual'}
                  onChange={() => {
                    setGenerationMode('manual')
                    setNewCode('')
                  }}
                  className="w-4 h-4"
                />
                <span className="text-body text-text-main">수동 입력</span>
              </label>
            </div>
          </div>

          {/* 코드 입력 */}
          <div>
            <label className="text-label text-text-main mb-2 block">코드</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                placeholder={generationMode === 'auto' ? '자동 생성됨' : 'ABCD-1234'}
                maxLength={9}
                disabled={generationMode === 'auto'}
                className="flex-1 border border-divider rounded-card px-3 py-2 text-body font-mono"
              />
              {generationMode === 'auto' && (
                <button
                  onClick={handleGenerateCode}
                  className="px-4 py-2 bg-page border border-divider rounded-card text-body font-medium button-press"
                >
                  생성
                </button>
              )}
            </div>
          </div>

          {/* 기간 */}
          <div>
            <label className="text-label text-text-main mb-2 block">기간 (일)</label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full border border-divider rounded-card px-3 py-2 text-body"
            />
          </div>

          {/* 사용 횟수 */}
          <div>
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={unlimitedUses}
                onChange={(e) => {
                  setUnlimitedUses(e.target.checked)
                  if (e.target.checked) {
                    setRemainingUses(null)
                  }
                }}
                className="w-4 h-4"
              />
              <span className="text-label text-text-main">무제한 사용</span>
            </label>
            {!unlimitedUses && (
              <input
                type="number"
                value={remainingUses || ''}
                onChange={(e) => setRemainingUses(parseInt(e.target.value) || null)}
                min="1"
                placeholder="사용 횟수"
                className="w-full border border-divider rounded-card px-3 py-2 text-body"
              />
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="text-label text-text-main mb-2 block">메모 (선택)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="코드에 대한 메모를 입력하세요"
              rows={3}
              className="w-full border border-divider rounded-card px-3 py-2 text-body resize-none"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => {
                setShowCreateModal(false)
                resetCreateForm()
              }}
              className="flex-1 py-3 bg-page border border-divider rounded-card text-body font-medium button-press"
            >
              취소
            </button>
            <button
              onClick={handleCreateCode}
              disabled={creating}
              className="flex-1 py-3 bg-primary text-surface rounded-card text-body font-medium button-press disabled:opacity-50"
            >
              {creating ? '생성 중...' : '생성'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 코드 수정 모달 */}
      <Modal
        isOpen={editingCode !== null}
        onClose={() => setEditingCode(null)}
        title={`코드 수정: ${editingCode ? formatCode(editingCode.code) : ''}`}
      >
        {editingCode && (
          <div className="space-y-4">
            {/* 기간 */}
            <div>
              <label className="text-label text-text-main mb-2 block">기간 (일)</label>
              <input
                type="number"
                value={editDurationDays}
                onChange={(e) => setEditDurationDays(parseInt(e.target.value) || 0)}
                min="1"
                className="w-full border border-divider rounded-card px-3 py-2 text-body"
              />
            </div>

            {/* 사용 횟수 */}
            <div>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editUnlimitedUses}
                  onChange={(e) => {
                    setEditUnlimitedUses(e.target.checked)
                    if (e.target.checked) {
                      setEditRemainingUses(null)
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-label text-text-main">무제한 사용</span>
              </label>
              {!editUnlimitedUses && (
                <input
                  type="number"
                  value={editRemainingUses || ''}
                  onChange={(e) => setEditRemainingUses(parseInt(e.target.value) || null)}
                  min="1"
                  placeholder="사용 횟수"
                  className="w-full border border-divider rounded-card px-3 py-2 text-body"
                />
              )}
            </div>

            {/* 메모 */}
            <div>
              <label className="text-label text-text-main mb-2 block">메모 (선택)</label>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="코드에 대한 메모를 입력하세요"
                rows={3}
                className="w-full border border-divider rounded-card px-3 py-2 text-body resize-none"
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setEditingCode(null)}
                className="flex-1 py-3 bg-page border border-divider rounded-card text-body font-medium button-press"
              >
                취소
              </button>
              <button
                onClick={handleUpdateCode}
                disabled={updating}
                className="flex-1 py-3 bg-primary text-surface rounded-card text-body font-medium button-press disabled:opacity-50"
              >
                {updating ? '수정 중...' : '저장'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 코드 삭제 확인 모달 */}
      <Modal
        isOpen={deletingCode !== null}
        onClose={() => setDeletingCode(null)}
        title="코드 삭제 확인"
      >
        <div className="space-y-4">
          <p className="text-body text-text-main">
            코드 <span className="font-mono font-semibold">{deletingCode ? formatCode(deletingCode) : ''}</span>를
            삭제하시겠습니까?
          </p>
          <p className="text-label text-text-sub">이 작업은 되돌릴 수 없습니다.</p>
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => setDeletingCode(null)}
              className="flex-1 py-3 bg-page border border-divider rounded-card text-body font-medium button-press"
            >
              취소
            </button>
            <button
              onClick={handleDeleteCode}
              disabled={deleting}
              className="flex-1 py-3 bg-red-500 text-surface rounded-card text-body font-medium button-press disabled:opacity-50"
            >
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

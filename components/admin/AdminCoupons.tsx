'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
import { Copy, RefreshCw, Trash2, Edit2, Plus } from 'lucide-react'

interface CodeItem {
  code: string
  data: GiftCode & { createdAt?: number }
}

type CodeGenerationMode = 'auto' | 'manual'

export function AdminCoupons() {
  const [codes, setCodes] = useState<CodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [generationMode, setGenerationMode] = useState<CodeGenerationMode>('auto')
  const [newCode, setNewCode] = useState('')
  const [durationDays, setDurationDays] = useState(30)
  const [remainingUses, setRemainingUses] = useState<number | null>(null)
  const [unlimitedUses, setUnlimitedUses] = useState(true)
  const [note, setNote] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit Modal
  const [editingCode, setEditingCode] = useState<CodeItem | null>(null)
  const [editDurationDays, setEditDurationDays] = useState(30)
  const [editRemainingUses, setEditRemainingUses] = useState<number | null>(null)
  const [editUnlimitedUses, setEditUnlimitedUses] = useState(true)
  const [editNote, setEditNote] = useState('')
  const [updating, setUpdating] = useState(false)

  // Delete Modal
  const [deletingCode, setDeletingCode] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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
    loadCodes()
  }, [loadCodes])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: 'success', text: '코드가 복사되었습니다.' })
    setTimeout(() => setMessage(null), 2000)
  }

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
      const codeToUse = generationMode === 'auto' ? generateRandomCode(8, false) : newCode.replace(/-/g, '').toUpperCase()
      const giftCode: GiftCode = {
        durationDays,
        remainingUses: unlimitedUses ? null : remainingUses,
        type: 'gift',
        note: note || undefined,
        createdAt: Date.now()
      }

      await createGiftCode(codeToUse, giftCode)
      setMessage({ type: 'success', text: '코드가 생성되었습니다.' })
      setShowCreateModal(false)
      setNewCode('')
      setDurationDays(30)
      setRemainingUses(null)
      setUnlimitedUses(true)
      setNote('')
      loadCodes()
    } catch (error) {
      handleFirestoreError(error, '코드 생성')
    } finally {
      setCreating(false)
    }
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
    try {
      setUpdating(true)
      const updates: Partial<GiftCode> = {
        durationDays: editDurationDays,
        remainingUses: editUnlimitedUses ? null : editRemainingUses,
        note: editNote || undefined
      }
      await updateGiftCode(editingCode.code, updates)
      setMessage({ type: 'success', text: '수정되었습니다.' })
      setEditingCode(null)
      loadCodes()
    } catch (e) {
      handleFirestoreError(e, '수정')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteCode = async () => {
    if (!deletingCode) return
    try {
      setDeleting(true)
      await deleteGiftCode(deletingCode)
      setMessage({ type: 'success', text: '삭제되었습니다.' })
      setDeletingCode(null)
      loadCodes()
    } catch (e) { handleFirestoreError(e, '삭제') }
    finally { setDeleting(false) }
  }

  if (loading) return <div>로딩 중...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-subtitle font-semibold text-text-main">쿠폰 코드 관리</h3>
        <button
          onClick={() => {
            handleGenerateCode()
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-soft hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 text-sm font-bold"
        >
          <Plus size={16} />
          <span>코드 생성</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-card text-body ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Code List Table */}
      <div className="bg-surface rounded-card shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-page">
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">코드</th>
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">기간</th>
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">남은 횟수</th>
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">비고</th>
                <th className="text-left py-3 px-4 text-label font-semibold text-text-main">관리</th>
              </tr>
            </thead>
            <tbody>
              {codes.map(item => (
                <tr key={item.code} className="border-b border-divider hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-medium text-primary cursor-pointer flex items-center gap-2" onClick={() => copyToClipboard(formatCode(item.code))}>
                    {formatCode(item.code)}
                    <Copy size={12} className="opacity-50" />
                  </td>
                  <td className="py-3 px-4 text-body text-text-main">{item.data.durationDays}일</td>
                  <td className="py-3 px-4 text-body text-text-main">
                    {item.data.remainingUses === null || item.data.remainingUses === undefined ? '무제한' : `${item.data.remainingUses}회`}
                  </td>
                  <td className="py-3 px-4 text-xs text-text-sub max-w-[150px] truncate">{item.data.note || '-'}</td>
                  <td className="py-3 px-4 flex gap-2">
                    <button onClick={() => handleEditCode(item)} className="p-1.5 hover:bg-gray-200 rounded text-text-sub"><Edit2 size={16} /></button>
                    <button onClick={() => setDeletingCode(item.code)} className="p-1.5 hover:bg-red-100 rounded text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="새 쿠폰 코드 생성">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-sub mb-1">생성 방식</label>
            <div className="flex gap-2">
              <button onClick={() => { setGenerationMode('auto'); handleGenerateCode(); }} className={`flex-1 py-2 rounded text-sm ${generationMode === 'auto' ? 'bg-primary text-white' : 'bg-gray-100 text-text-sub'}`}>자동 생성</button>
              <button onClick={() => { setGenerationMode('manual'); setNewCode(''); }} className={`flex-1 py-2 rounded text-sm ${generationMode === 'manual' ? 'bg-primary text-white' : 'bg-gray-100 text-text-sub'}`}>직접 입력</button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-sub mb-1">코드</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                readOnly={generationMode === 'auto'}
                className="flex-1 px-3 py-2 border border-divider rounded bg-page text-text-main font-mono"
                placeholder="XXXX-XXXX"
              />
              {generationMode === 'auto' && (
                <button onClick={handleGenerateCode} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">
                  <RefreshCw size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-sub mb-1">혜택 기간 (일)</label>
              <input type="number" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} className="w-full px-3 py-2 border border-divider rounded" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-sub mb-1">사용 가능 횟수</label>
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={unlimitedUses} onChange={e => setUnlimitedUses(e.target.checked)} id="unlimited" />
                <label htmlFor="unlimited" className="text-sm">무제한</label>
              </div>
              {!unlimitedUses && (
                <input type="number" value={remainingUses || ''} onChange={e => setRemainingUses(Number(e.target.value))} className="w-full px-3 py-2 border border-divider rounded" placeholder="횟수 입력" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-sub mb-1">비고 (선택)</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} className="w-full px-3 py-2 border border-divider rounded" placeholder="메모..." />
          </div>

          <button onClick={handleCreateCode} disabled={creating} className="w-full py-3 bg-primary text-white rounded font-bold hover:bg-primary-dark transition-colors disabled:opacity-50">
            {creating ? '생성 중...' : '코드 생성하기'}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingCode} onClose={() => setEditingCode(null)} title="코드 수정">
        {editingCode && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded font-mono text-center text-lg font-bold">{formatCode(editingCode.code)}</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-sub mb-1">혜택 기간 (일)</label>
                <input type="number" value={editDurationDays} onChange={e => setEditDurationDays(Number(e.target.value))} className="w-full px-3 py-2 border border-divider rounded" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-sub mb-1">남은 횟수</label>
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" checked={editUnlimitedUses} onChange={e => setEditUnlimitedUses(e.target.checked)} id="edit-unlimited" />
                  <label htmlFor="edit-unlimited" className="text-sm">무제한</label>
                </div>
                {!editUnlimitedUses && (
                  <input type="number" value={editRemainingUses ?? ''} onChange={e => setEditRemainingUses(Number(e.target.value))} className="w-full px-3 py-2 border border-divider rounded" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-sub mb-1">비고</label>
              <input type="text" value={editNote} onChange={e => setEditNote(e.target.value)} className="w-full px-3 py-2 border border-divider rounded" />
            </div>
            <button onClick={handleUpdateCode} disabled={updating} className="w-full py-3 bg-primary text-white rounded font-bold hover:bg-primary-dark transition-colors disabled:opacity-50">
              {updating ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deletingCode} onClose={() => setDeletingCode(null)} title="코드 삭제">
        <div className="space-y-4">
          <p className="text-body text-text-main text-center">정말로 이 코드를 삭제하시겠습니까?<br />삭제 후에는 복구할 수 없습니다.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeletingCode(null)} className="flex-1 py-3 bg-gray-100 text-text-main rounded font-bold hover:bg-gray-200">취소</button>
            <button onClick={handleDeleteCode} disabled={deleting} className="flex-1 py-3 bg-red-500 text-white rounded font-bold hover:bg-red-600 disabled:opacity-50">
              {deleting ? '삭제 중...' : '삭제하기'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

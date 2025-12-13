/**
 * 전화번호 모달 관리 커스텀 훅
 */
import { useState, useCallback } from 'react'
import { updateUserProfile } from '@/lib/firebase/firestore'
import { handleFirestoreError } from '@/lib/utils/error/errorHandler'
import type { User } from 'firebase/auth'

interface UsePhoneModalOptions {
  user: User | null
  onSuccess?: (phoneNumber: string, displayName: string) => void | Promise<void>
}

interface UsePhoneModalResult {
  showPhoneModal: boolean
  phoneInput: string
  nameInput: string
  countryCode: string
  phoneError: string | null
  phoneLoading: boolean
  setShowPhoneModal: (show: boolean) => void
  setPhoneInput: (value: string) => void
  setNameInput: (value: string) => void
  setCountryCode: (value: string) => void
  setPhoneError: (error: string | null) => void
  savePhoneAndContinue: () => Promise<void>
  reset: () => void
}

/**
 * 전화번호 모달을 관리하는 커스텀 훅
 */
export function usePhoneModal({
  user,
  onSuccess,
}: UsePhoneModalOptions): UsePhoneModalResult {
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [countryCode, setCountryCode] = useState('82') // 기본 한국
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [phoneLoading, setPhoneLoading] = useState(false)

  const normalizePhone = useCallback((raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.startsWith('0') && countryCode === '82') {
      // 한국 로컬번호 010xxxx → +8210xxxx
      return `+82${digits.slice(1)}`
    }
    if (digits.startsWith(countryCode)) {
      return `+${digits}`
    }
    if (raw.startsWith('+')) {
      return raw
    }
    return `+${countryCode}${digits}`
  }, [countryCode])

  const savePhoneAndContinue = useCallback(async () => {
    if (!user) {
      setPhoneError('로그인이 필요합니다.')
      return
    }

    const normalized = normalizePhone(phoneInput)
    if (!normalized) {
      setPhoneError('전화번호를 입력해주세요. 예: 01012345678')
      return
    }
    if (!nameInput.trim()) {
      setPhoneError('이름을 입력해주세요.')
      return
    }

    setPhoneLoading(true)
    setPhoneError(null)

    try {
      await updateUserProfile(user.uid, {
        phoneNumber: normalized,
        displayName: nameInput.trim(),
      })

      if (onSuccess) {
        await onSuccess(normalized, nameInput.trim())
      }

      setShowPhoneModal(false)
      setPhoneInput('')
    } catch (error) {
      const errorMessage = handleFirestoreError(error, '전화번호 저장')
      setPhoneError(errorMessage)
    } finally {
      setPhoneLoading(false)
    }
  }, [user, phoneInput, nameInput, normalizePhone, onSuccess])

  const reset = useCallback(() => {
    setShowPhoneModal(false)
    setPhoneInput('')
    setNameInput('')
    setPhoneError(null)
    setPhoneLoading(false)
  }, [])

  return {
    showPhoneModal,
    phoneInput,
    nameInput,
    countryCode,
    phoneError,
    phoneLoading,
    setShowPhoneModal,
    setPhoneInput,
    setNameInput,
    setCountryCode,
    setPhoneError,
    savePhoneAndContinue,
    reset,
  }
}

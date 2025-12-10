'use client'

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from '../auth/AuthProvider'
import type { Membership, DailyUsage } from '@/lib/types/membership'
import {
  getMembership,
  getDailyUsage,
  incrementDailySession,
  redeemGiftCode,
} from '@/lib/firebase/firestore'

type MembershipStatus = 'guest' | 'nonMember' | 'member' | 'expired'

interface MembershipContextValue {
  loading: boolean
  membership: Membership | null
  usage: DailyUsage | null
  status: MembershipStatus
  isMember: boolean
  remainingSessions: number // Infinity for member, 0 for guest, 0/1 for non-member
  canStartSession: boolean
  refresh: () => Promise<void>
  recordSession: () => Promise<void>
  redeemCode: (code: string) => Promise<Membership>
}

const MembershipContext = createContext<MembershipContextValue>({
  loading: true,
  membership: null,
  usage: null,
  status: 'guest',
  isMember: false,
  remainingSessions: 0,
  canStartSession: false,
  refresh: async () => {},
  recordSession: async () => {},
  redeemCode: async () => {
    throw new Error('Not initialized')
  },
})

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [usage, setUsage] = useState<DailyUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionRecorded, setSessionRecorded] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setMembership(null)
      setUsage(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [m, u] = await Promise.all([getMembership(user.uid), getDailyUsage(user.uid)])
      setMembership(m)
      setUsage(u)
    } catch (error) {
      console.error('[MembershipProvider] failed to load membership:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
    setSessionRecorded(false)
  }, [refresh])

  const status: MembershipStatus = useMemo(() => {
    if (!user) return 'guest'
    if (!membership) return 'nonMember'
    if (membership.expiresAt <= Date.now()) return 'expired'
    return 'member'
  }, [membership, user])

  const isMember = status === 'member'
  const sessionsUsed = usage?.sessionsUsed ?? 0
  const maxSessions = isMember ? Number.POSITIVE_INFINITY : user ? 1 : 0
  const remainingSessions =
    maxSessions === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Math.max(maxSessions - sessionsUsed, 0)
  const canStartSession = isMember || (user != null && sessionsUsed < 1)

  const recordSession = useCallback(async () => {
    if (!user) throw new Error('로그인이 필요합니다.')
    if (isMember) return
    if (sessionRecorded) return
    const updated = await incrementDailySession(user.uid)
    setUsage(updated)
    setSessionRecorded(true)
  }, [user, isMember, sessionRecorded])

  const handleRedeem = useCallback(
    async (code: string) => {
      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }
      const result = await redeemGiftCode(user.uid, code)
      setMembership(result.membership)
      return result.membership
    },
    [user]
  )

  const value: MembershipContextValue = {
    loading,
    membership,
    usage,
    status,
    isMember,
    remainingSessions,
    canStartSession,
    refresh,
    recordSession,
    redeemCode: handleRedeem,
  }

  return <MembershipContext.Provider value={value}>{children}</MembershipContext.Provider>
}

export function useMembership() {
  return useContext(MembershipContext)
}

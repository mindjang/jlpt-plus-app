/**
 * 신고 관리 (Firestore CRUD)
 */
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  doc,
  updateDoc,
  Timestamp,
  type Firestore 
} from 'firebase/firestore'
import { getDbInstance } from './utils'
import type { JlptLevel } from '@/lib/types/content'

export interface ContentReport {
  id?: string
  uid: string
  userEmail?: string
  userName?: string
  contentType: 'word' | 'kanji'
  contentText: string
  level: JlptLevel
  reason: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  createdAt: number
  reviewedAt?: number
  reviewedBy?: string
  adminNote?: string
}

/**
 * 신고 제출
 */
export async function submitReport(
  uid: string,
  data: {
    contentType: 'word' | 'kanji'
    contentText: string
    level: JlptLevel
    reason: string
  }
): Promise<string> {
  const dbInstance = getDbInstance()
  const reportsRef = collection(dbInstance, 'reports')
  
  const reportData: Omit<ContentReport, 'id'> = {
    uid,
    contentType: data.contentType,
    contentText: data.contentText,
    level: data.level,
    reason: data.reason,
    status: 'pending',
    createdAt: Date.now(),
  }

  const docRef = await addDoc(reportsRef, reportData)
  return docRef.id
}

/**
 * 모든 신고 가져오기 (관리자용)
 */
export async function getAllReports(
  options?: {
    status?: ContentReport['status']
    limit?: number
  }
): Promise<ContentReport[]> {
  const dbInstance = getDbInstance()
  const reportsRef = collection(dbInstance, 'reports')
  
  let q = query(reportsRef, orderBy('createdAt', 'desc'))
  
  if (options?.status) {
    q = query(q, where('status', '==', options.status))
  }
  
  const snapshot = await getDocs(q)
  const reports: ContentReport[] = []
  
  snapshot.forEach((doc) => {
    const data = doc.data()
    reports.push({
      id: doc.id,
      ...data,
    } as ContentReport)
  })
  
  // 사용자 정보 가져오기 (선택적)
  if (reports.length > 0) {
    const { getUserData } = await import('./users')
    const userIds = [...new Set(reports.map(r => r.uid))]
    
    const userDataMap = new Map<string, { email?: string; displayName?: string }>()
    await Promise.all(
      userIds.map(async (userId) => {
        try {
          const userData = await getUserData(userId)
          if (userData?.profile) {
            userDataMap.set(userId, {
              email: userData.profile.email,
              displayName: userData.profile.displayName,
            })
          }
        } catch (error) {
          console.error(`Failed to fetch user data for ${userId}:`, error)
        }
      })
    )
    
    // 사용자 정보 추가
    reports.forEach((report) => {
      const userData = userDataMap.get(report.uid)
      if (userData) {
        report.userEmail = userData.email
        report.userName = userData.displayName
      }
    })
  }
  
  return options?.limit ? reports.slice(0, options.limit) : reports
}

/**
 * 신고 상태 업데이트 (관리자용)
 */
export async function updateReportStatus(
  reportId: string,
  status: ContentReport['status'],
  adminNote?: string
): Promise<void> {
  const dbInstance = getDbInstance()
  const reportRef = doc(dbInstance, 'reports', reportId)
  
  await updateDoc(reportRef, {
    status,
    reviewedAt: Date.now(),
    adminNote: adminNote || '',
  })
}

/**
 * Firebase Admin SDK 초기화
 * 서버 사이드 전용 - API 라우트에서 사용
 */
import * as admin from 'firebase-admin'

/**
 * Firebase Admin 초기화 (싱글톤)
 * - 빌드 시 환경변수가 없더라도 빌드는 통과하도록 하고,
 *   런타임 호출 시에만 에러를 발생시킨다.
 */
let adminApp: admin.app.App | null = null

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  const projectId = process.env.FIREBASE_PROJECT_ID

  try {
    if (serviceAccount) {
      // Service Account JSON이 환경변수로 제공된 경우
      // 환경변수에서 따옴표 제거 (큰따옴표 또는 작은따옴표로 감싸진 경우)
      const cleanedServiceAccount = serviceAccount.trim().replace(/^['"]|['"]$/g, '')
      const serviceAccountObj = JSON.parse(cleanedServiceAccount)
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountObj),
      })
    } else if (projectId) {
      // 개발 환경: Application Default Credentials 사용
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      })
    } else {
      // 환경변수가 없으면 빌드 시에는 통과, 런타임에서만 확인
      console.warn('[firebase-admin] credentials not configured. API routes will reject requests until configured.')
    }
  } catch (error) {
    console.error('[firebase-admin] initialization failed:', error)
  }
} else {
  adminApp = admin.app()
}

export const adminAuth = adminApp ? admin.auth(adminApp) : null
export const adminDb = adminApp ? admin.firestore(adminApp) : null
export const isAdminConfigured = !!adminApp

export default admin

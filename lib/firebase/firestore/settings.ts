/**
 * 학습 설정 관리 (Firestore CRUD)
 */
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore'
import { getDbInstance } from './utils'

export interface StudySettings {
  [level: string]: {
    word: boolean
    kanji: boolean
  }
}

const studySettingsRef = (dbInstance: Firestore) => doc(dbInstance, 'settings', 'study')

/**
 * 학습 설정 가져오기
 */
export async function getStudySettings(): Promise<StudySettings | null> {
  const dbInstance = getDbInstance()
  const snap = await getDoc(studySettingsRef(dbInstance))
  if (!snap.exists()) return null
  return snap.data() as StudySettings
}

/**
 * 학습 설정 업데이트
 */
export async function updateStudySettings(settings: StudySettings): Promise<void> {
  const dbInstance = getDbInstance()
  await setDoc(studySettingsRef(dbInstance), settings, { merge: true })
}


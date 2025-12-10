import * as fs from 'fs'
import * as path from 'path'
import { KanjiAliveEntry } from '../data/types'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '5bacc8bb82msh444081c0b2aa85cp1c6aadjsnbdac63aa4cee'

// 재시도가 필요한 한자 목록
const RETRY_KANJI_LIST = [
  '乞', '侯', '侶', '俸', '傲', '僅', '冶', '凸', '刹', '劾',
  '勅', '升', '吏', '吟', '唄', '唾', '嚇', '坑', '坪', '堆',
  '塡', '奔', '媛', '嫡', '宵', '寡', '尺', '屯', '岬', '峠',
  '峡', '巾', '弧', '怨', '愁', '慨', '戴', '斑', '斤', '昧',
  '桁', '楼', '款', '殉', '毀', '泌', '璃', '瓦', '甚', '瞭',
  '碑', '禍', '籠', '繕', '繭', '罵', '羞', '耗', '腺', '臼',
  '舷', '艶', '芋', '芯', '萎', '蔑', '蔽', '薪', '藩', '虞',
  '裾', '襟', '詔', '諮', '謁', '貌', '賜', '逐', '逓', '遍',
  '遜', '遵', '酎', '醸', '錮', '閑', '韻', '頰', '麓'
]

// 한자-한글 뜻 매핑 (원본 스크립트에서 가져온 데이터)
const KOREAN_MEANINGS: Record<string, string> = {
  '乞': '구걸하다',
  '侯': '후작',
  '侶': '동반자',
  '俸': '봉급',
  '傲': '자랑스러워하다',
  '僅': '조금',
  '冶': '녹는',
  '凸': '볼록한',
  '刹': '사원',
  '劾': '비난',
  '勅': '제국 명령',
  '升': '측정 상자',
  '吏': '장교',
  '吟': '운문으로 만들다',
  '唄': '노래',
  '唾': '침',
  '嚇': '위협적인',
  '坑': '구덩이',
  '坪': '두 장의 다다미 공간',
  '堆': '높게 쌓인',
  '塡': '채우기',
  '奔': '달리다',
  '媛': '아름다운 여자',
  '嫡': '적법한 아내',
  '宵': '새벽 시간',
  '寡': '과부',
  '尺': '샤쿠',
  '屯': '막사',
  '岬': '곶',
  '峠': '산봉우리',
  '峡': '협곡',
  '巾': '수건',
  '弧': '호弧',
  '怨': '원한',
  '愁': '고통',
  '慨': '진실',
  '戴': '~로 왕관을 씌우다',
  '斑': '장소',
  '斤': '도끼',
  '昧': '어두운',
  '桁': '빔',
  '楼': '감시탑',
  '款': '호의',
  '殉': '순교',
  '毀': '깨다',
  '泌': '스며나오다',
  '璃': '유리 같은',
  '瓦': '타일',
  '甚': '엄청나게',
  '瞭': '맑은',
  '碑': '묘비',
  '禍': '재난',
  '籠': '바구니',
  '繕': '짜깁기',
  '繭': '고치',
  '罵': '남용',
  '羞': '부끄러워하다',
  '耗': '감소',
  '腺': '샘',
  '臼': '박격포',
  '舷': '건월',
  '艶': '광택 있는',
  '芋': '감자',
  '芯': '심지',
  '萎': '시들다',
  '蔑': '무시하다',
  '蔽': '덮다',
  '薪': '연료',
  '藩': '씨족',
  '虞': '두려움',
  '裾': '소매',
  '襟': '칼라',
  '詔': '칙령',
  '諮': '상담하다',
  '謁': '청중',
  '貌': '형태',
  '賜': '부여하다',
  '逐': '추구하다',
  '逓': '중계',
  '遍': '도처에',
  '遜': '겸손한',
  '遵': '준수하다',
  '酎': '사케',
  '醸': '양조하다',
  '錮': '감금',
  '閑': '여가',
  '韻': '운율',
  '頰': '뺨',
  '麓': '산기슭'
}

async function fetchKanjiData(kanji: string, retryCount = 0): Promise<any | null> {
  const url = `https://kanjialive-api.p.rapidapi.com/api/public/kanji/${encodeURIComponent(kanji)}`
  const MAX_RETRIES = 3
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'kanjialive-api.p.rapidapi.com'
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ⚠ ${kanji}: 데이터를 찾을 수 없습니다`)
        return null
      }
      if (response.status === 429) {
        if (retryCount < MAX_RETRIES) {
          const waitTime = (retryCount + 1) * 5000
          console.log(`  ⚠ ${kanji}: API 호출 제한 (429), ${waitTime/1000}초 대기 후 재시도... (${retryCount + 1}/${MAX_RETRIES})`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          return fetchKanjiData(kanji, retryCount + 1)
        }
        console.log(`  ✗ ${kanji}: API 호출 제한 (429), 재시도 횟수 초과`)
        return null
      }
      console.error(`  ✗ ${kanji}: API 호출 실패 (${response.status})`)
      return null
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const waitTime = (retryCount + 1) * 2000
      console.log(`  ⚠ ${kanji}: 오류 발생, ${waitTime/1000}초 대기 후 재시도... (${retryCount + 1}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return fetchKanjiData(kanji, retryCount + 1)
    }
    console.error(`  ✗ ${kanji}: 오류 발생 (재시도 횟수 초과)`, error)
    return null
  }
}

function filterKanjiAliveEntry(data: any, koreanMeaning?: string): KanjiAliveEntry {
  // 인터페이스에 정의된 필드만 추출
  const entry: KanjiAliveEntry = {
    _id: data._id,
    _rev: data._rev,
    ka_utf: data.ka_utf,
    kanji: data.kanji,
    radical: data.radical,
  }
  
  // kanji.meaning.korean 필드 추가
  if (data.kanji && data.kanji.meaning) {
    // meaning이 문자열인 경우 객체로 변환
    if (typeof data.kanji.meaning === 'string') {
      entry.kanji = {
        ...data.kanji,
        meaning: {
          english: data.kanji.meaning,
          korean: koreanMeaning || ''
        }
      }
    } else {
      // meaning이 이미 객체인 경우 korean 필드 추가
      entry.kanji = {
        ...data.kanji,
        meaning: {
          ...data.kanji.meaning,
          korean: koreanMeaning || data.kanji.meaning.korean || ''
        }
      }
    }
  }
  
  // 선택적 필드들
  if (data.grade !== undefined) entry.grade = data.grade
  if (data.hint_group !== undefined) entry.hint_group = data.hint_group
  if (data.onyomi !== undefined) entry.onyomi = data.onyomi
  if (data.onyomi_ja !== undefined) entry.onyomi_ja = data.onyomi_ja
  if (data.kunyomi !== undefined) entry.kunyomi = data.kunyomi
  if (data.kunyomi_ja !== undefined) entry.kunyomi_ja = data.kunyomi_ja
  if (data.kunyomi_ka_display !== undefined) entry.kunyomi_ka_display = data.kunyomi_ka_display
  if (data.meaning !== undefined) entry.meaning = data.meaning
  if (data.kstroke !== undefined) entry.kstroke = data.kstroke
  if (data.rad_stroke !== undefined) entry.rad_stroke = data.rad_stroke
  if (data.rad_utf !== undefined) entry.rad_utf = data.rad_utf
  if (data.rad_name !== undefined) entry.rad_name = data.rad_name
  if (data.rad_name_ja !== undefined) entry.rad_name_ja = data.rad_name_ja
  if (data.rad_name_file !== undefined) entry.rad_name_file = data.rad_name_file
  if (data.rad_order !== undefined) entry.rad_order = data.rad_order
  if (data.rad_position !== undefined) entry.rad_position = data.rad_position
  if (data.rad_position_ja !== undefined) entry.rad_position_ja = data.rad_position_ja
  if (data.examples !== undefined) entry.examples = data.examples
  if (data.stroketimes !== undefined) entry.stroketimes = data.stroketimes
  if (data.ka_id !== undefined) entry.ka_id = data.ka_id
  if (data.kname !== undefined) entry.kname = data.kname
  if (data.dick !== undefined) entry.dick = data.dick
  if (data.dicn !== undefined) entry.dicn = data.dicn
  if (data.mn_hint !== undefined) entry.mn_hint = data.mn_hint
  
  return entry
}

async function main() {
  console.log(`총 ${RETRY_KANJI_LIST.length}개 한자 재시도 시작...\n`)
  
  // 기존 n1.ts 파일 읽기
  const n1FilePath = path.join(__dirname, '../data/kanji/n1.ts')
  let existingEntries: KanjiAliveEntry[] = []
  
  try {
    const fileContent = fs.readFileSync(n1FilePath, 'utf-8')
    // export const n1Kanji: KanjiAliveEntry[] = ... 부분 추출
    // 배열 시작 위치 찾기
    const arrayStart = fileContent.indexOf('export const n1Kanji: KanjiAliveEntry[] = [')
    if (arrayStart === -1) {
      console.log('기존 파일에서 배열을 찾을 수 없습니다. 새로 생성합니다.\n')
      existingEntries = []
    } else {
      // 배열 시작 부분부터 찾기
      const arrayContentStart = fileContent.indexOf('[', arrayStart)
      // 파일 끝에서부터 ] 찾기 (마지막 배열 닫는 괄호)
      const arrayContentEnd = fileContent.lastIndexOf(']')
      
      if (arrayContentStart !== -1 && arrayContentEnd !== -1 && arrayContentEnd > arrayContentStart) {
        const jsonArray = fileContent.substring(arrayContentStart, arrayContentEnd + 1)
        existingEntries = JSON.parse(jsonArray)
        console.log(`기존 파일에서 ${existingEntries.length}개 한자 로드 완료\n`)
      } else {
        console.log('기존 파일 파싱 실패. 새로 생성합니다.\n')
        existingEntries = []
      }
    }
  } catch (error) {
    console.error('기존 파일 읽기 실패:', error)
    console.log('기존 파일을 무시하고 새로 생성합니다.\n')
    existingEntries = []
  }
  
  const updatedEntries: KanjiAliveEntry[] = []
  let successCount = 0
  let failCount = 0
  let updateCount = 0
  let addCount = 0
  
  // 각 한자에 대해 API 호출
  for (let i = 0; i < RETRY_KANJI_LIST.length; i++) {
    const kanji = RETRY_KANJI_LIST[i]
    const koreanMeaning = KOREAN_MEANINGS[kanji] || ''
    
    console.log(`[${i + 1}/${RETRY_KANJI_LIST.length}] ${kanji} 처리 중... (한글 뜻: ${koreanMeaning})`)
    
    const apiData = await fetchKanjiData(kanji)
    
    if (!apiData) {
      failCount++
      // 실패한 경우 기존 데이터 유지
      const existing = existingEntries.find(e => e.kanji?.character === kanji)
      if (existing) {
        updatedEntries.push(existing)
        console.log(`  ⚠ 실패 - 기존 데이터 유지`)
      } else {
        console.log(`  ✗ 실패 - 데이터 없음`)
      }
      await new Promise(resolve => setTimeout(resolve, 2000))
      continue
    }
    
    // 인터페이스에 정의된 필드만 추출하고 한글 뜻 추가
    const filteredData = filterKanjiAliveEntry(apiData, koreanMeaning)
    
    // 기존 데이터에서 해당 한자 찾기
    const existingIndex = existingEntries.findIndex(e => e.kanji?.character === kanji)
    if (existingIndex >= 0) {
      // 기존 데이터 업데이트
      existingEntries[existingIndex] = filteredData
      updateCount++
      console.log(`  ✓ 업데이트 완료`)
    } else {
      // 새로 추가
      existingEntries.push(filteredData)
      addCount++
      console.log(`  ✓ 추가 완료`)
    }
    
    successCount++
    
    // API 호출 제한을 피하기 위해 딜레이
    await new Promise(resolve => setTimeout(resolve, 1500))
  }
  
  // 업데이트된 데이터를 파일에 저장
  const fileContent = `import { KanjiAliveEntry } from '../types'

// N1 한자 데이터 (${existingEntries.length}개)
export const n1Kanji: KanjiAliveEntry[] = ${JSON.stringify(existingEntries, null, 2)}
`
  
  fs.writeFileSync(n1FilePath, fileContent, 'utf-8')
  
  console.log(`\n✅ 파일 업데이트 완료!`)
  console.log(`   성공: ${successCount}개`)
  console.log(`   실패: ${failCount}개`)
  console.log(`   업데이트: ${updateCount}개`)
  console.log(`   추가: ${addCount}개`)
  console.log(`   총: ${existingEntries.length}개`)
  console.log(`\n업데이트된 파일: ${n1FilePath}`)
}

main().catch(console.error)

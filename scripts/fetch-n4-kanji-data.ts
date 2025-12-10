import * as fs from 'fs'
import * as path from 'path'
import { KanjiAliveEntry } from '../data/types'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '5bacc8bb82msh444081c0b2aa85cp1c6aadjsnbdac63aa4cee'

// N4 한자 목록 (사용자 제공)
const N4_KANJI_LIST = [
  '事', '会', '自', '手', '言', '者', '同', '方', '目', '理',
  '力', '場', '思', '動', '家', '地', '体', '作', '持', '明',
  '私', '発', '心', '意', '度', '知', '立', '通', '不', '員',
  '物', '的', '問', '用', '新', '田', '代', '世', '死', '開',
  '社', '無', '強', '野', '教', '正', '業', '題', '使', '考',
  '界', '別', '以', '元', '待', '安', '近', '真', '少', '切',
  '主', '終', '楽', '音', '道', '親', '着', '始', '多', '早',
  '仕', '海', '悪', '止', '重', '画', '口', '味', '空', '身',
  '運', '帰', '集', '急', '足', '売', '起', '夜', '料', '特',
  '品', '計', '店', '送', '族', '文', '院', '朝', '転', '公',
  '可', '病', '住', '屋', '買', '試', '有', '質', '医', '映',
  '室', '台', '験', '歌', '去', '風', '歩', '広', '週', '写',
  '花', '黒', '答', '赤', '色', '町', '銀', '工', '字', '飲',
  '注', '走', '京', '古', '英', '習', '兄', '服', '建', '青',
  '研', '紙', '究', '春', '図', '旅', '肉', '夏', '弟', '犬',
  '飯', '館', '貸', '堂', '借', '秋', '姉', '曜', '鳥', '夕',
  '茶', '魚', '妹', '勉', '洋', '昼', '牛', '冬', '駅', '漢'
]

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
          const waitTime = (retryCount + 1) * 5000 // 5초, 10초, 15초
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

function filterKanjiAliveEntry(data: any): KanjiAliveEntry {
  // 인터페이스에 정의된 필드만 추출
  const entry: KanjiAliveEntry = {
    _id: data._id,
    _rev: data._rev,
    ka_utf: data.ka_utf,
    kanji: data.kanji,
    radical: data.radical,
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
  console.log(`총 ${N4_KANJI_LIST.length}개 한자 처리 시작...\n`)
  
  const kanjiDataArray: KanjiAliveEntry[] = []
  let successCount = 0
  let failCount = 0
  
  // 각 한자에 대해 API 호출
  for (let i = 0; i < N4_KANJI_LIST.length; i++) {
    const kanji = N4_KANJI_LIST[i]
    
    console.log(`[${i + 1}/${N4_KANJI_LIST.length}] ${kanji} 처리 중...`)
    
    const apiData = await fetchKanjiData(kanji)
    
    if (!apiData) {
      failCount++
      // 실패 시에도 랜덤 딜레이
      const delay = Math.floor(Math.random() * 5000) // 0~5초
      if (delay > 0) {
        console.log(`  ⏳ ${(delay / 1000).toFixed(1)}초 대기 후 다음 한자 처리...`)
        await sleep(delay)
      }
      continue
    }
    
    // 인터페이스에 정의된 필드만 추출
    const filteredData = filterKanjiAliveEntry(apiData)
    kanjiDataArray.push(filteredData)
    
    successCount++
    console.log(`  ✓ 완료`)
    
    // 마지막 한자가 아니면 0~5초 랜덤 딜레이
    if (i < N4_KANJI_LIST.length - 1) {
      const delay = Math.floor(Math.random() * 5000) // 0~5초
      if (delay > 0) {
        console.log(`  ⏳ ${(delay / 1000).toFixed(1)}초 대기 후 다음 한자 처리...`)
        await sleep(delay)
      }
    }
  }
  
  // 파일 생성
  const outputFilePath = path.join(__dirname, '../data/kanji/n4.ts')
  
  const fileContent = `import { KanjiAliveEntry } from '../types'

// N4 한자 데이터 (${kanjiDataArray.length}개)
export const n4Kanji: KanjiAliveEntry[] = ${JSON.stringify(kanjiDataArray, null, 2)}
`
  
  fs.writeFileSync(outputFilePath, fileContent, 'utf-8')
  
  console.log(`\n✅ 파일 생성 완료!`)
  console.log(`   성공: ${successCount}개`)
  console.log(`   실패: ${failCount}개`)
  console.log(`   총: ${kanjiDataArray.length}개`)
  console.log(`\n생성된 파일: ${outputFilePath}`)
}

main().catch(console.error)

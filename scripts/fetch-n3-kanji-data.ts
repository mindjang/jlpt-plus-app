import * as fs from 'fs'
import * as path from 'path'
import { KanjiAliveEntry } from '../data/types'

const RAPIDAPI_KEY: string = process.env.RAPIDAPI_KEY ?? ''
if (!RAPIDAPI_KEY) {
  throw new Error('RAPIDAPI_KEY 환경변수가 설정되지 않았습니다.')
}

// N3 한자 목록 (사용자 제공)
const N3_KANJI_LIST = [
  '部', '合', '最', '当', '全', '回', '戦', '実', '性', '連',
  '取', '要', '対', '決', '変', '所', '相', '関', '信', '感',
  '勝', '解', '調', '初', '法', '違', '現', '夫', '内', '選',
  '次', '機', '面', '必', '定', '成', '引', '声', '確', '続',
  '向', '受', '約', '報', '平', '数', '好', '番', '神', '直',
  '任', '情', '様', '件', '助', '化', '供', '記', '指', '配',
  '務', '残', '彼', '得', '落', '警', '組', '原', '殺', '失',
  '能', '係', '進', '経', '美', '表', '付', '利', '伝', '加',
  '反', '過', '然', '置', '官', '命', '由', '認', '点', '放',
  '期', '優', '告', '民', '議', '治', '乗', '達', '状', '予',
  '消', '活', '果', '備', '流', '守', '愛', '呼', '歳', '判',
  '頭', '断', '説', '役', '負', '追', '在', '他', '太', '葉',
  '政', '君', '頼', '和', '王', '術', '込', '支', '産', '交',
  '察', '難', '想', '常', '望', '打', '制', '談', '共', '市',
  '構', '位', '式', '戻', '覚', '飛', '返', '念', '済', '客',
  '格', '顔', '危', '首', '良', '投', '権', '両', '演', '師',
  '害', '石', '完', '光', '突', '求', '球', '渡', '緒', '婚',
  '資', '捕', '苦', '絶', '昨', '容', '参', '収', '願', '職',
  '座', '争', '限', '退', '許', '形', '局', '息', '疑', '逃',
  '笑', '船', '育', '働', '若', '馬', '破', '与', '満', '号',
  '際', '罪', '存', '観', '増', '険', '犯', '深', '幸', '単',
  '薬', '示', '抜', '速', '未', '米', '痛', '倒', '論', '都',
  '敗', '寝', '夢', '側', '遅', '探', '妻', '例', '降', '割',
  '科', '段', '遠', '種', '恐', '責', '申', '差', '忘', '冷',
  '払', '園', '席', '欲', '徒', '束', '礼', '静', '労', '娘',
  '識', '熱', '皆', '処', '遊', '除', '寄', '末', '喜', '岡',
  '精', '類', '登', '似', '具', '迎', '押', '路', '居', '怖',
  '閉', '余', '困', '値', '曲', '亡', '悲', '怒', '非', '俺',
  '酒', '盗', '商', '誰', '越', '宅', '横', '昔', '鳴', '費',
  '婦', '背', '舞', '絵', '規', '吸', '因', '散', '福', '留',
  '訪', '程', '辞', '宿', '迷', '浮', '雪', '暮', '腹', '庭',
  '適', '抱', '候', '刻', '景', '疲', '途', '財', '更', '老',
  '暗', '眠', '互', '杯', '雑', '給', '便', '御', '積', '洗',
  '港', '晴', '陽', '否', '折', '招', '掛', '等', '吹', '努',
  '髪', '富', '欠', '才', '草', '到', '誤', '歯', '慣', '祖',
  '忙', '耳', '勤', '列', '恥', '賛', '箱', '晩', '窓', '靴',
  '頂', '偉', '寒', '猫', '泳', '貧', '易', '煙', '偶', '幾'
]

async function fetchKanjiData(kanji: string, retryCount = 0): Promise<any | null> {
  const url = `https://kanjialive-api.p.rapidapi.com/api/public/kanji/${encodeURIComponent(kanji)}`
  const MAX_RETRIES = 3
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'kanjialive-api.p.rapidapi.com',
      } satisfies HeadersInit,
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
  const outputFilePath = path.join(__dirname, '../data/kanji/n3.ts')
  
  // 기존 파일에서 한자 데이터 읽기
  let existingKanjiData: KanjiAliveEntry[] = []
  let existingKanjiSet = new Set<string>()
  
  if (fs.existsSync(outputFilePath)) {
    try {
      // 기존 파일을 동적으로 import
      delete require.cache[require.resolve(outputFilePath)]
      const existingModule = require(outputFilePath)
      existingKanjiData = existingModule.n3Kanji || []
      
      // 기존 한자들의 ka_utf를 Set에 저장
      existingKanjiData.forEach((entry: KanjiAliveEntry) => {
        if (entry.ka_utf) {
          existingKanjiSet.add(entry.ka_utf)
        }
      })
      
      console.log(`기존 파일에서 ${existingKanjiData.length}개 한자 데이터를 찾았습니다.\n`)
    } catch (error) {
      console.log('기존 파일을 읽는 중 오류 발생, 새로 시작합니다.\n')
    }
  }
  
  // 누락된 한자 찾기
  const missingKanji = N3_KANJI_LIST.filter(kanji => !existingKanjiSet.has(kanji))
  
  if (missingKanji.length === 0) {
    console.log('✅ 모든 한자가 이미 존재합니다. 업데이트할 항목이 없습니다.')
    return
  }
  
  console.log(`누락된 한자 ${missingKanji.length}개를 찾았습니다:`)
  console.log(missingKanji.join(', '))
  console.log(`\n누락된 한자 처리 시작...\n`)
  
  let successCount = 0
  let failCount = 0
  const newKanjiData: KanjiAliveEntry[] = []
  
  // 누락된 한자들만 API 호출
  for (let i = 0; i < missingKanji.length; i++) {
    const kanji = missingKanji[i]
    
    console.log(`[${i + 1}/${missingKanji.length}] ${kanji} 처리 중...`)
    
    const apiData = await fetchKanjiData(kanji)
    
    if (!apiData) {
      failCount++
      // 실패 시에도 랜덤 딜레이 (5~25초)
      const delay = Math.floor(Math.random() * 20000) + 5000 // 5~25초
      console.log(`  ⏳ ${(delay / 1000).toFixed(1)}초 대기 후 다음 한자 처리...`)
      await sleep(delay)
      continue
    }
    
    // 인터페이스에 정의된 필드만 추출
    const filteredData = filterKanjiAliveEntry(apiData)
    newKanjiData.push(filteredData)
    
    successCount++
    console.log(`  ✓ 완료`)
    
    // 마지막 한자가 아니면 5~25초 랜덤 딜레이
    if (i < missingKanji.length - 1) {
      const delay = Math.floor(Math.random() * 20000) + 5000 // 5~25초
      console.log(`  ⏳ ${(delay / 1000).toFixed(1)}초 대기 후 다음 한자 처리...`)
      await sleep(delay)
    }
  }
  
  // 기존 데이터와 새 데이터 합치기
  const allKanjiData = [...existingKanjiData, ...newKanjiData]
  
  // ka_utf 기준으로 정렬 (N3_KANJI_LIST 순서대로)
  const kanjiOrderMap = new Map<string, number>()
  N3_KANJI_LIST.forEach((kanji, index) => {
    kanjiOrderMap.set(kanji, index)
  })
  
  allKanjiData.sort((a, b) => {
    const orderA = kanjiOrderMap.get(a.ka_utf || '') ?? 9999
    const orderB = kanjiOrderMap.get(b.ka_utf || '') ?? 9999
    return orderA - orderB
  })
  
  // 파일 업데이트
  const fileContent = `import { KanjiAliveEntry } from '../types'

// N3 한자 데이터 (${allKanjiData.length}개)
export const n3Kanji: KanjiAliveEntry[] = ${JSON.stringify(allKanjiData, null, 2)}
`
  
  fs.writeFileSync(outputFilePath, fileContent, 'utf-8')
  
  console.log(`\n✅ 파일 업데이트 완료!`)
  console.log(`   기존: ${existingKanjiData.length}개`)
  console.log(`   새로 추가: ${successCount}개`)
  console.log(`   실패: ${failCount}개`)
  console.log(`   총: ${allKanjiData.length}개`)
  console.log(`\n업데이트된 파일: ${outputFilePath}`)
}

main().catch(console.error)

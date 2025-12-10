import * as fs from 'fs'
import * as path from 'path'
import { KanjiAliveEntry } from '../data/types'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '5bacc8bb82msh444081c0b2aa85cp1c6aadjsnbdac63aa4cee'

// N2 한자 목록 (사용자 제공)
const N2_KANJI_LIST = [
  '査', '村', '軍', '島', '捜', '兵', '準', '再', '設', '協',
  '団', '技', '領', '血', '線', '武', '介', '勢', '門', '復',
  '装', '星', '仲', '移', '減', '丈', '況', '造', '爆', '州',
  '了', '総', '接', '絡', '防', '久', '谷', '練', '低', '帯',
  '裏', '暴', '補', '録', '効', '改', '普', '将', '導', '超',
  '個', '被', '丸', '担', '量', '療', '辺', '像', '令', '階',
  '極', '細', '周', '管', '乱', '府', '根', '城', '狙', '香',
  '史', '触', '逆', '材', '禁', '脳', '象', '恋', '希', '境',
  '営', '宇', '戸', '歴', '森', '賞', '奥', '党', '型', '波',
  '焼', '簡', '課', '届', '区', '専', '副', '弱', '捨', '圧',
  '跡', '域', '巻', '橋', '里', '児', '算', '囲', '順', '骨',
  '汚', '玉', '鉄', '比', '片', '患', '永', '換', '蔵', '温',
  '額', '輪', '衣', '混', '刺', '栄', '軽', '替', '委', '芸',
  '印', '腕', '河', '署', '並', '植', '庫', '羽', '陸', '各',
  '角', '燃', '胸', '農', '紹', '殿', '臓', '秒', '固', '劇',
  '短', '競', '承', '韓', '荒', '清', '毒', '編', '岩', '巨',
  '宝', '油', '坂', '革', '停', '菜', '祝', '甘', '依', '詰',
  '省', '底', '荷', '損', '卒', '泉', '林', '億', '布', '毛',
  '枚', '延', '伸', '勇', '測', '倍', '雇', '輸', '岸', '略',
  '純', '採', '占', '央', '航', '悩', '頃', '針', '賢', '則',
  '砂', '踊', '乾', '含', '複', '税', '皮', '照', '築', '祭',
  '敬', '棒', '包', '昇', '預', '泊', '板', '袋', '訓', '諸',
  '誌', '虫', '寺', '氷', '黄', '竹', '快', '贈', '講', '祈',
  '律', '掃', '幼', '群', '叫', '池', '震', '豊', '乳', '埋',
  '績', '章', '卵', '封', '尊', '層', '県', '述', '般', '薄',
  '坊', '厚', '孫', '床', '販', '液', '札', '版', '紅', '齢',
  '雲', '浴', '鼻', '塩', '券', '双', '旧', '肩', '尻', '塗',
  '沈', '緑', '咲', '臣', '腰', '貨', '掘', '駐', '珍', '凍',
  '募', '湾', '涙', '泥', '童', '欧', '柔', '庁', '匹', '干',
  '阪', '辛', '仏', '械', '均', '拾', '幅', '寿', '季', '硬',
  '粉', '湯', '枝', '溶', '著', '筆', '翌', '傾', '浅', '濃',
  '召', '闇', '憎', '湖', '拝', '炭', '肌', '漁', '菓', '汗',
  '籍', '貯', '帽', '郵', '柱', '鋭', '磨', '麦', '灰', '皿',
  '糸', '斬', '兆', '軟', '灯', '鉱', '脂', '瓶', '詞', '刊',
  '濯', '塔', '缶', '蒸', '胃', '喫', '粒', '涼', '机', '鈍',
  '軒', '零', '湿', '貿', '貝', '挟', '筒', '隅', '冊', '郊',
  '刷', '脇', '銅', '綿', '膚', '滴', '隻', '符', '伺', '沸',
  '畜', '舟', '枯', '姓', '畳', '燥', '耕', '膝', '曇', '肯'
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
  console.log(`총 ${N2_KANJI_LIST.length}개 한자 처리 시작...\n`)
  
  const kanjiDataArray: KanjiAliveEntry[] = []
  let successCount = 0
  let failCount = 0
  
  // 각 한자에 대해 API 호출
  for (let i = 0; i < N2_KANJI_LIST.length; i++) {
    const kanji = N2_KANJI_LIST[i]
    
    console.log(`[${i + 1}/${N2_KANJI_LIST.length}] ${kanji} 처리 중...`)
    
    const apiData = await fetchKanjiData(kanji)
    
    if (!apiData) {
      failCount++
      // 실패 시에도 랜덤 딜레이 (10~33초)
      const delay = Math.floor(Math.random() * 23000) + 10000 // 10~33초
      console.log(`  ⏳ ${(delay / 1000).toFixed(1)}초 대기 후 다음 한자 처리...`)
      await sleep(delay)
      continue
    }
    
    // 인터페이스에 정의된 필드만 추출
    const filteredData = filterKanjiAliveEntry(apiData)
    kanjiDataArray.push(filteredData)
    
    successCount++
    console.log(`  ✓ 완료`)
    
    // 마지막 한자가 아니면 10~33초 랜덤 딜레이
    if (i < N2_KANJI_LIST.length - 1) {
      const delay = Math.floor(Math.random() * 23000) + 10000 // 10~33초
      console.log(`  ⏳ ${(delay / 1000).toFixed(1)}초 대기 후 다음 한자 처리...`)
      await sleep(delay)
    }
  }
  
  // 파일 생성
  const outputFilePath = path.join(__dirname, '../data/kanji/n2.ts')
  
  const fileContent = `import { KanjiAliveEntry } from '../types'

// N2 한자 데이터 (${kanjiDataArray.length}개)
export const n2Kanji: KanjiAliveEntry[] = ${JSON.stringify(kanjiDataArray, null, 2)}
`
  
  fs.writeFileSync(outputFilePath, fileContent, 'utf-8')
  
  console.log(`\n✅ 파일 생성 완료!`)
  console.log(`   성공: ${successCount}개`)
  console.log(`   실패: ${failCount}개`)
  console.log(`   총: ${kanjiDataArray.length}개`)
  console.log(`\n생성된 파일: ${outputFilePath}`)
}

main().catch(console.error)

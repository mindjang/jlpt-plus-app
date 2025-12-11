import * as fs from 'fs'
import * as path from 'path'
import { KanjiAliveEntry } from '../data/types'
import { fetchKanjiData, filterKanjiAliveEntry } from './shared/fetchKanjiHelpers'

// N5 한자 목록 (사용자 제공)
const N5_KANJI_LIST = [
  '人', '大', '分', '一', '見', '出', '日', '行', '前', '時',
  '生', '本', '中', '今', '間', '年', '子', '長', '上', '入',
  '後', '気', '来', '話', '女', '国', '金', '高', '下', '学',
  '先', '外', '何', '男', '名', '月', '小', '聞', '食', '書',
  '山', '電', '二', '車', '水', '木', '母', '校', '父', '白',
  '語', '十', '万', '友', '川', '三', '天', '東', '半', '北',
  '火', '土', '南', '千', '西', '毎', '休', '八', '読', '五',
  '四', '百', '円', '午', '七', '左', '右', '雨', '六', '九'
]

async function main() {
  console.log(`총 ${N5_KANJI_LIST.length}개 한자 처리 시작...\n`)
  
  const kanjiDataArray: KanjiAliveEntry[] = []
  let successCount = 0
  let failCount = 0
  
  // 각 한자에 대해 API 호출
  for (let i = 0; i < N5_KANJI_LIST.length; i++) {
    const kanji = N5_KANJI_LIST[i]
    
    console.log(`[${i + 1}/${N5_KANJI_LIST.length}] ${kanji} 처리 중...`)
    
    const apiData = await fetchKanjiData(kanji)
    
    if (!apiData) {
      failCount++
      await new Promise(resolve => setTimeout(resolve, 1000))
      continue
    }
    
    // 인터페이스에 정의된 필드만 추출
    const filteredData = filterKanjiAliveEntry(apiData)
    kanjiDataArray.push(filteredData)
    
    successCount++
    console.log(`  ✓ 완료`)
    
    // API 호출 제한을 피하기 위해 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // 파일 생성
  const outputFilePath = path.join(__dirname, '../data/kanji/n5.ts')
  
  const fileContent = `import { KanjiAliveEntry } from '../types'

// N5 한자 데이터 (${kanjiDataArray.length}개)
export const n5Kanji: KanjiAliveEntry[] = ${JSON.stringify(kanjiDataArray, null, 2)}
`
  
  fs.writeFileSync(outputFilePath, fileContent, 'utf-8')
  
  console.log(`\n✅ 파일 생성 완료!`)
  console.log(`   성공: ${successCount}개`)
  console.log(`   실패: ${failCount}개`)
  console.log(`   총: ${kanjiDataArray.length}개`)
  console.log(`\n생성된 파일: ${outputFilePath}`)
}

main().catch(console.error)

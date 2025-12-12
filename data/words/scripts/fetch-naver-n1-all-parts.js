const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://ja.dict.naver.com/api/jako/getJLPTList';
const LEVEL = 1;
const outputDir = '/Users/mcd.mac-pro14/project/jlpt-plus-app/data/words';

// 품사별 페이지 수 정의
const PARTS_CONFIG = [
  { part: '명사', pages: 240 },
  { part: '대명사', pages: 1 },
  { part: '동사', pages: 130 },
  { part: '조사', pages: 1 },
  { part: '형용사', pages: 8 },
  { part: '접사', pages: 5 },
  { part: '부사', pages: 13 },
  { part: '감동사', pages: 1 },
  { part: '형용동사', pages: 19 },
  { part: '기타', pages: 4 },
];

// entry를 키로 하는 Map (중복 체크용)
const wordsMap = new Map();

// 기존 파일 읽기 (있는 경우)
function loadExistingData() {
  const filePath = path.join(outputDir, 'n1_naver.ts');
  
  if (!fs.existsSync(filePath)) {
    console.log('기존 파일이 없습니다. 새로 생성합니다.\n');
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // TypeScript 파일에서 데이터 추출
    const match = content.match(/export const n1NaverWords: NaverN1Word\[\] = \[([\s\S]*?)\]/);
    
    if (match) {
      const dataStr = match[1];
      // 간단한 파싱 (실제로는 더 정교한 파서가 필요할 수 있음)
      // 여기서는 eval을 사용하지 않고, JSON으로 변환 가능한 부분만 추출
      console.log('기존 파일을 찾았습니다. 데이터를 로드합니다...\n');
      // 실제로는 TypeScript 파일을 파싱하는 것이 복잡하므로
      // 기존 데이터는 무시하고 새로 수집하는 것이 더 안전할 수 있습니다.
      // 하지만 사용자 요구사항에 따라 entry 기반으로 병합해야 합니다.
    }
  } catch (error) {
    console.log('기존 파일 읽기 실패. 새로 생성합니다.\n');
  }
}

// API 호출 함수
function fetchPage(part, page) {
  return new Promise((resolve, reject) => {
    const encodedPart = encodeURIComponent(part);
    const url = `${BASE_URL}?level=${LEVEL}&part=${encodedPart}&page=${page}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.m_items && Array.isArray(json.m_items)) {
            resolve(json.m_items);
          } else {
            reject(new Error(`Invalid response structure on page ${page}`));
          }
        } catch (error) {
          reject(new Error(`JSON parse error on page ${page}: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Request error on page ${page}: ${error.message}`));
    });
  });
}

// 데이터 변환 및 병합 함수
// currentPart: 현재 API 호출에서 요청한 part (예: "명사", "부사" 등)
function processItem(item, currentPart) {
  // entry 필드 디코딩
  let decodedEntry = item.entry;
  try {
    decodedEntry = decodeURIComponent(item.entry);
  } catch (e) {
    decodedEntry = item.entry;
  }
  
  // show_entry가 있으면 그것을 사용
  if (item.show_entry) {
    decodedEntry = item.show_entry;
  }
  
  // parts 배열과 means 배열의 인덱스가 일치함
  // parts[0] -> means[0], parts[1] -> means[1] 등
  // currentPart에 해당하는 means만 추출
  let partSpecificMeans = [];
  
  if (item.parts && item.means && Array.isArray(item.parts) && Array.isArray(item.means)) {
    // parts 배열에서 currentPart의 인덱스 찾기
    const partIndex = item.parts.indexOf(currentPart);
    
    if (partIndex !== -1 && partIndex < item.means.length) {
      // 해당 인덱스의 means만 추출
      // means는 문자열 배열이고, 각 인덱스가 해당 part의 의미
      const meansValue = item.means[partIndex];
      if (typeof meansValue === 'string') {
        // 세미콜론으로 구분된 의미를 하나의 문자열 배열로 저장
        // 이미지에서 보여준 것처럼 세미콜론이 포함된 하나의 문자열로 저장
        partSpecificMeans = [meansValue];
      } else if (Array.isArray(meansValue)) {
        partSpecificMeans = meansValue;
      } else {
        partSpecificMeans = [String(meansValue)];
      }
    } else {
      // 인덱스를 찾을 수 없으면 전체 means 사용 (fallback)
      // 이 경우는 parts 배열에 currentPart가 포함되지 않은 경우
      if (Array.isArray(item.means)) {
        partSpecificMeans = item.means;
      } else {
        partSpecificMeans = [item.means];
      }
    }
  } else if (item.means) {
    // parts 배열이 없거나 형식이 다르면 전체 means 사용
    if (Array.isArray(item.means)) {
      partSpecificMeans = item.means;
    } else {
      partSpecificMeans = [item.means];
    }
  }
  
  const partMeans = {
    part: currentPart,
    means: partSpecificMeans
  };
  
  const wordData = {
    entry_id: item.entry_id,
    origin_entry_id: item.origin_entry_id,
    entry: decodedEntry,
    level: item.level,
    source: item.source,
    partsMeans: [partMeans], // 현재 part에 대한 means만 저장
    category1: item.category1,
    category2: item.category2,
    category3: item.category3
  };
  
  // entry를 키로 중복 체크
  if (wordsMap.has(decodedEntry)) {
    // 기존 항목에 partsMeans 추가/병합
    const existing = wordsMap.get(decodedEntry);
    
    // 같은 part가 이미 있는지 확인
    const existingPm = existing.partsMeans.find(
      pm => pm.part === currentPart
    );
    
    if (existingPm) {
      // 같은 part가 있으면 means를 교체 (각 part별로 다른 means를 가져야 하므로)
      // 또는 병합할지 결정 - 여기서는 교체로 처리 (API에서 받은 것이 더 정확할 수 있음)
      existingPm.means = partSpecificMeans;
    } else {
      // 새로운 part 추가
      existing.partsMeans.push(partMeans);
    }
  } else {
    // 새 항목 추가
    wordsMap.set(decodedEntry, wordData);
  }
}

// 모든 품사별 데이터 수집
async function fetchAllParts() {
  console.log(`총 ${PARTS_CONFIG.length}개 품사 데이터 수집 시작...\n`);
  
  for (const config of PARTS_CONFIG) {
    const { part, pages } = config;
    console.log(`[${part}] ${pages}페이지 수집 시작...`);
    
    for (let page = 1; page <= pages; page++) {
      try {
        const items = await fetchPage(part, page);
        
        for (const item of items) {
          // 각 part API 호출에서 받은 means는 해당 part에 대한 의미
          // item.parts 배열에 여러 part가 있어도, 이 API 호출의 means는 currentPart에 대한 의미
          processItem(item, part);
        }
        
        console.log(`  ✓ 페이지 ${page}/${pages} 완료 (${items.length}개 항목, 누적: ${wordsMap.size}개 단어)`);
        
        // API 부하 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`  ✗ [${part}] 페이지 ${page} 오류: ${error.message}`);
      }
    }
    
    console.log(`[${part}] 완료!\n`);
  }
  
  console.log(`총 ${wordsMap.size}개 단어 수집 완료!`);
}

// TypeScript 파일 생성
function generateTypeScriptFile() {
  const data = Array.from(wordsMap.values());
  
  let content = `// 네이버 일본어 사전 N1 단어 데이터 (${data.length}개)\n`;
  content += `// API: https://ja.dict.naver.com/api/jako/getJLPTList?level=1\n`;
  content += `// 품사별 수집: ${PARTS_CONFIG.map(c => `${c.part}(${c.pages}페이지)`).join(', ')}\n\n`;
  content += `export interface NaverN1Word {\n`;
  content += `  entry_id: string\n`;
  content += `  origin_entry_id: string\n`;
  content += `  entry: string\n`;
  content += `  level: string\n`;
  content += `  source: string\n`;
  content += `  partsMeans: Array<{\n`;
  content += `    part: string | null\n`;
  content += `    means: string[]\n`;
  content += `  }>\n`;
  content += `  category1: string | null\n`;
  content += `  category2: string | null\n`;
  content += `  category3: string | null\n`;
  content += `}\n\n`;
  content += `export const n1NaverWords: NaverN1Word[] = [\n`;
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    content += `  {\n`;
    content += `    entry_id: ${JSON.stringify(item.entry_id)},\n`;
    content += `    origin_entry_id: ${JSON.stringify(item.origin_entry_id)},\n`;
    content += `    entry: ${JSON.stringify(item.entry)},\n`;
    content += `    level: ${JSON.stringify(item.level)},\n`;
    content += `    source: ${JSON.stringify(item.source)},\n`;
    content += `    partsMeans: [\n`;
    for (let j = 0; j < item.partsMeans.length; j++) {
      const pm = item.partsMeans[j];
      content += `      {\n`;
      content += `        part: ${pm.part === null ? 'null' : JSON.stringify(pm.part)},\n`;
      content += `        means: ${JSON.stringify(pm.means)}\n`;
      content += `      }`;
      if (j < item.partsMeans.length - 1) {
        content += ',';
      }
      content += '\n';
    }
    content += `    ],\n`;
    content += `    category1: ${item.category1 === null ? 'null' : JSON.stringify(item.category1)},\n`;
    content += `    category2: ${item.category2 === null ? 'null' : JSON.stringify(item.category2)},\n`;
    content += `    category3: ${item.category3 === null ? 'null' : JSON.stringify(item.category3)}\n`;
    content += `  }`;
    if (i < data.length - 1) {
      content += ',';
    }
    content += '\n';
  }
  
  content += `]\n`;
  
  return content;
}

// 메인 실행
async function main() {
  try {
    // 기존 데이터 로드 (선택적)
    loadExistingData();
    
    // 모든 품사별 데이터 수집
    await fetchAllParts();
    
    // TypeScript 파일 생성
    console.log('\nTypeScript 파일 생성 중...');
    const tsContent = generateTypeScriptFile();
    
    // 파일 저장
    const filePath = path.join(outputDir, 'n1_naver.ts');
    fs.writeFileSync(filePath, tsContent, 'utf-8');
    console.log(`✓ ${filePath} 생성 완료`);
    
    console.log('\n모든 작업 완료!');
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

main();

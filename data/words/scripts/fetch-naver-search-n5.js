const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// n5.ts 파일 경로
const n5Path = path.join(__dirname, '../data/words/n5.ts');
const outputDir = path.join(__dirname, '../data/words/search-results');
const detailsDir = path.join(__dirname, '../data/words/details/n5');

// 출력 디렉토리 생성
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(detailsDir)) {
  fs.mkdirSync(detailsDir, { recursive: true });
}

// API 호출 간 delay (ms) - rate limiting 방지
const DELAY_MS = 200; // 200ms 간격으로 요청

// n5.ts에서 entry 추출
function extractEntries() {
  try {
    const content = fs.readFileSync(n5Path, 'utf-8');
    
    // n5NaverWords 배열에서 entry 필드 추출
    const entries = [];
    const entryRegex = /entry:\s*["']([^"']+)["']/g;
    let match;
    
    while ((match = entryRegex.exec(content)) !== null) {
      entries.push(match[1]);
    }
    
    // 중복 제거
    const uniqueEntries = [...new Set(entries)];
    console.log(`총 ${uniqueEntries.length}개의 고유 entry를 찾았습니다.\n`);
    
    return uniqueEntries;
  } catch (error) {
    console.error('n5.ts 파일 읽기 실패:', error.message);
    process.exit(1);
  }
}

// TypeScript 파일로 변환하는 함수
function generateTypeScriptFile(results) {
  const header = `// 네이버 일본어 사전 N5 단어 상세 정보
// API: https://ja.dict.naver.com/api3/jako/search?query={entry}&m=mobile&range=entrySearch
// API: https://ja.dict.naver.com/api/jako/getHiraganaList?category1=katakana&category2={entry}&page=1&pageSize=100&sort=asc

import type { WordDetails } from '../types'

export const n5Details: WordDetails[] = [
`;

  // JSON을 TypeScript 코드로 변환
  const items = results.map(result => {
    const dataToSave = {
      entry: result.entry,
      priority: result.priority,
      words: result.words,
      meaning: result.meaning,
      examples: result.examples,
      hiraganaList: result.hiraganaList
    };
    
    // JSON을 문자열로 변환
    const jsonStr = JSON.stringify(dataToSave, null, 2);
    // 각 줄에 2칸 들여쓰기 추가
    const indented = jsonStr.split('\n').map(line => '  ' + line).join('\n');
    
    return indented;
  }).join(',\n\n');

  const footer = `
]
`;

  return header + items + footer;
}

// 공통 HTTP 요청 함수
function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const defaultHeaders = {
      'Accept': '*/*',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://ja.dict.naver.com/',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
      'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      ...headers
    };
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: defaultHeaders
    };
    
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      let stream = res;
      if (res.headers['content-encoding'] === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (res.headers['content-encoding'] === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      } else if (res.headers['content-encoding'] === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      }
      
      let data = '';
      
      stream.on('data', (chunk) => {
        data += chunk.toString();
      });
      
      stream.on('end', () => {
        try {
          if (!data) {
            reject(new Error('Empty response'));
            return;
          }
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(new Error(`JSON parse error: ${error.message}`));
        }
      });
      
      stream.on('error', (error) => {
        reject(new Error(`Stream error: ${error.message}`));
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });
    
    req.end();
  });
}

// 검색 결과 API 호출
function fetchSearchResult(entry) {
  const encodedEntry = encodeURIComponent(entry);
  const url = `https://ja.dict.naver.com/api3/jako/search?query=${encodedEntry}&m=mobile&range=entrySearch`;
  return makeRequest(url);
}

// 히라가나 리스트 API 호출
function fetchHiraganaList(entry) {
  const encodedEntry = encodeURIComponent(entry);
  const url = `https://ja.dict.naver.com/api/jako/getHiraganaList?category1=katakana&category2=${encodedEntry}&page=1&pageSize=100&sort=asc`;
  return makeRequest(url);
}

/**
 * HiraganaListItem interface
 * @typedef {Object} HiraganaListItem
 * @property {string} entry_id
 * @property {string} parent_entry_id
 * @property {string} origin_entry_id
 * @property {string} entry
 * @property {string} level
 * @property {string} source
 * @property {string[]} parts
 * @property {string} pron
 * @property {string[]} means
 * @property {string} category1
 * @property {string} category2
 */

// hiraganaList에서 불필요한 필드 제거
// @param {HiraganaListItem[]} hiraganaList
// @returns {HiraganaListItem[]}
function filterHiraganaList(hiraganaList) {
  if (!Array.isArray(hiraganaList)) {
    return hiraganaList;
  }
  
  const fieldsToExclude = [
    'category3',
    'category4',
    'category5',
    'category6',
    'relatedContent',
    'relatedContents',
    'example',
    'link_url',
    'anchor',
    'pron_file',
    'org_language',
    'mix_pron',
    'show_entry',
    'super_script',
    'pv',
    'super_script_num'
  ];
  
  return hiraganaList.map(item => {
    const filtered = { ...item };
    fieldsToExclude.forEach(field => {
      delete filtered[field];
    });
    return filtered;
  });
}

// words (wordExamples)에서 불필요한 필드 제거
function filterWords(words) {
  if (!Array.isArray(words)) {
    return words;
  }
  
  const fieldsToExclude = [
    'gdid',
    'sourceCid',
    'dictId',
    'matchType',
    'entryId',
    'serviceCode',
    'sourceDictnameKO',
    'sourceDictnameOri',
    'sourceDictnameLink',
    'sourceUpdate',
    'dictTypeWriter',
    'dictTypeMulti',
    'expEntry',
    'expEntrySuperscript',
    'destinationLink',
    'destinationLinkKo',
    'expAliasEntryAlways',
    'expAliasEntryAlwaysOld',
    'expAliasEntrySearch',
    'expAliasEntrySearchKrKind',
    'expAliasEntrySearchAllKind',
    'expAliasGeneralAlways',
    'expAliasGeneralSearch',
    'expConjugationMoreURL',
    'conjugate',
    'expSynonym',
    'expAntonym',
    'pronunFileCount',
    'expAudioRead',
    'expMeaningRead',
    'expKoreanPron',
    'expKoreanHanja',
    'exphanjaStroke',
    'exphanjaRadical',
    'exphanjaRadicalStroke',
    'isHighDfTerm',
    'isOpenDict',
    'isPhoneticSymbol',
    'hasConjugation',
    'hasIdiom',
    'hasExample',
    'hasStudy',
    'hasImage',
    'hasSource',
    'hasOrigin',
    'meaningCount',
    'entryImageURL',
    'entryImageURLs',
    'idiomOri',
    'idiomOriUrl',
    'phoneticSymbol',
    'entryLikeNumber',
    'entryCommentNumber',
    'uuid',
    'documentQuality',
    'expHanjaRadicalKoreanName',
    'etcExplain',
    'expSourceBook',
    'expEntryComposition',
    'expStrokeAnimation',
    'expAbstract',
    'imageFileCount',
    'audioThumnail',
    'audioFileCount',
    'videoThumnail',
    'videoFileCount',
    'expOnly',
    'pageView',
    'similarWordList',
    'antonymWordList',
    'expAliasEntryAlwaysList',
    'expAliasGeneralAlwaysList',
    'expAliasEntrySearchList',
    'searchPhoneticSymbolList',
    'searchVariantHanziList',
    'searchTraditionalChineseList',
    'abstractContent',
    'expEntryCustomContentList',
    'expMeaningCustomContentList',
    'openExactMatch',
    'exactMatch'
  ];
  
  return words.map(item => {
    const filtered = { ...item };
    fieldsToExclude.forEach(field => {
      delete filtered[field];
    });
    
    // meansCollector가 있으면 처리
    if (filtered.meansCollector && Array.isArray(filtered.meansCollector)) {
      filtered.meansCollector = filtered.meansCollector.map(collector => {
        const filteredCollector = { ...collector };
        // means 배열 필터링
        if (filteredCollector.means && Array.isArray(filteredCollector.means)) {
          filteredCollector.means = filterMeansCollectorMeans(filteredCollector.means);
        }
        return filteredCollector;
      });
    }
    
    return filtered;
  });
}

// meansCollector의 means 배열에서 불필요한 필드 제거
function filterMeansCollectorMeans(means) {
  if (!Array.isArray(means)) {
    return means;
  }
  
  const fieldsToExclude = [
    'subjectGroup',
    'subjectGroupCode',
    'languageGroup',
    'languageGroupCode',
    'example',
    'uuid',
    'groupName',
    'groupId',
    'sourceUpdate',
    'handleValue',
    'exampleOri',
    'exampleTrans',
    'hlType',
    'encode'
  ];
  
  // 이미 hlType이 포함되어 있으므로 추가 확인 불필요
  
  return means.map(mean => {
    const filtered = { ...mean };
    fieldsToExclude.forEach(field => {
      delete filtered[field];
    });
    return filtered;
  });
}

// meaning에서 불필요한 필드 제거
function filterMeaning(meaningItems) {
  if (!Array.isArray(meaningItems)) {
    return meaningItems;
  }
  
  const fieldsToExclude = [
    'gdid',
    'sourceCid',
    'dictId',
    'matchType',
    'entryId',
    'serviceCode',
    'languageCode',
    'sourceDictnameKO',
    'sourceDictnameOri',
    'sourceDictnameLink',
    'sourceUpdate',
    'dictTypeWriter',
    'dictTypeMulti',
    'destinationLink',
    'destinationLinkKo',
    'expAliasEntryAlways',
    'expAliasEntryAlwaysOld',
    'expAliasEntrySearch',
    'expAliasEntrySearchKrKind',
    'expAliasEntrySearchAllKind',
    'expAliasGeneralAlways',
    'expAliasGeneralSearch',
    'expConjugationMoreURL',
    'conjugate',
    'expSynonym',
    'expAntonym',
    'pronunFileCount',
    'expKanji',
    'expAudioRead',
    'expMeaningRead',
    'expKoreanPron',
    'expKoreanHanja',
    'exphanjaStroke',
    'exphanjaRadical',
    'exphanjaRadicalStroke',
    'partGroupYn',
    'newEntry',
    'isHighDfTerm',
    'isOpenDict',
    'isPhoneticSymbol',
    'hasConjugation',
    'hasIdiom',
    'hasExample',
    'hasStudy',
    'hasImage',
    'hasSource',
    'hasOrigin',
    'meaningCount',
    'entryImageURL',
    'entryImageURLs',
    'idiomOri',
    'idiomOriUrl',
    'phoneticSymbol',
    'frequencyAdd',
    'entryLikeNumber',
    'entryCommentNumber',
    'uuid',
    'documentQuality',
    'expHanjaRadicalKoreanName',
    'etcExplain',
    'expSourceBook',
    'expEntryComposition',
    'expStrokeAnimation',
    'expAbstract',
    'imageFileCount',
    'audioThumnail',
    'audioFileCount',
    'videoThumnail',
    'videoFileCount',
    'expOnly',
    'pageView',
    'similarWordList',
    'antonymWordList',
    'expAliasEntryAlwaysList',
    'expAliasEntrySearchList',
    'searchPhoneticSymbolList',
    'searchVariantHanziList',
    'searchTraditionalChineseList',
    'abstractContent',
    'expEntryCustomContentList',
    'expMeaningCustomContentList',
    'exactMatch',
    'openExactMatch'
  ];
  
  return meaningItems.map(item => {
    const filtered = { ...item };
    fieldsToExclude.forEach(field => {
      delete filtered[field];
    });
    
    // meansCollector가 있으면 처리
    if (filtered.meansCollector && Array.isArray(filtered.meansCollector)) {
      filtered.meansCollector = filtered.meansCollector.map(collector => {
        const filteredCollector = { ...collector };
        // means 배열 필터링
        if (filteredCollector.means && Array.isArray(filteredCollector.means)) {
          filteredCollector.means = filterMeansCollectorMeans(filteredCollector.means);
        }
        return filteredCollector;
      });
    }
    
    return filtered;
  });
}

// examples에서 불필요한 필드 제거
function filterExamples(examples) {
  if (!Array.isArray(examples)) {
    return examples;
  }
  
  const fieldsToExclude = [
    'gdid',
    'sourceCid',
    'dictId',
    'matchType',
    'exampleId',
    'serviceCode',
    'example3Lang',
    'expExample3',
    'expExampleURL',
    'translationId',
    'translation',
    'translationAutoLink',
    'languageCode',
    'sourceDictnameImage',
    'detailLink',
    'translationUserlink',
    'translationParticipationCount',
    'translationHonorYear',
    'translationDictUuid',
    'translationLike',
    'translationDislike',
    'expOnly',
    'searchPhoneticSymbolList',
    'exampleVcode',
    'exampleEncode',
    'translationVcode',
    'translationEncode',
    'documentQuality',
    'dictTypeWriter',
    'sourceDictnameKO',
    'sourceDictnameOri',
    'sourceDictnameURL',
    'sourceDictnameAddKO',
    'sourceDictnameAddURL',
    'sourceUpdate',
    'superscript',
    'expEntryURL',
    'languageIntCode',
    'dictTypeForm',
    'haveTrans',
    'expExampleAutoLink',
    'expExample1Pronun'
  ];
  
  return examples.map(item => {
    const filtered = { ...item };
    fieldsToExclude.forEach(field => {
      delete filtered[field];
    });
    return filtered;
  });
}

// 검색 결과에서 필요한 데이터 추출
function extractSearchData(searchData) {
  const result = {
    priority: null,
    words: [],
    meaning: [],
    examples: []
  };
  
  if (!searchData || !searchData.searchResultMap || !searchData.searchResultMap.searchResultListMap) {
    return result;
  }
  
  const listMap = searchData.searchResultMap.searchResultListMap;
  
  // WORD 섹션에서 rank가 1, 2인 항목들 추출
  if (listMap.WORD && listMap.WORD.items && Array.isArray(listMap.WORD.items)) {
    const wordItems = listMap.WORD.items.filter(item => {
      const rank = item.rank;
      return rank === "1" || rank === "2" || rank === 1 || rank === 2;
    });
    
    // priority는 rank가 1 또는 2인 첫 번째 항목의 priority 사용
    if (wordItems.length > 0) {
      result.priority = wordItems[0].priority;
    }
    
    // 필터링된 words 저장
    result.words = filterWords(wordItems);
  }
  
  // MEANING 섹션 추출 (바로 배열로 저장)
  if (listMap.MEANING) {
    const meaningItems = listMap.MEANING.items || [];
    result.meaning = filterMeaning(meaningItems);
  }
  
  // EXAMPLE 섹션 추출 (바로 배열로 저장)
  if (listMap.EXAMPLE) {
    const exampleItems = listMap.EXAMPLE.items || [];
    result.examples = filterExamples(exampleItems);
  }
  
  return result;
}

// delay 함수
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 메인 실행 함수
async function main() {
  const entries = extractEntries();
  const results = [];
  const errors = [];
  
  console.log('API 호출을 시작합니다...\n');
  
  for (let i = 0; i < entries.length; i++) {
  // for (let i = 0; i < 1; i++) {
    const entry = entries[i];
    const progress = `[${i + 1}/${entries.length}]`;
    
    try {
      console.log(`${progress} Fetching search result: ${entry}`);
      const searchData = await fetchSearchResult(entry);
      await delay(DELAY_MS);
      
      console.log(`${progress} Fetching hiragana list: ${entry}`);
      let hiraganaData = null;
      try {
        const hiraganaResponse = await fetchHiraganaList(entry);
        const rawHiraganaList = hiraganaResponse.m_items || [];
        // 불필요한 필드 제거
        hiraganaData = filterHiraganaList(rawHiraganaList);
      } catch (hiraganaError) {
        console.warn(`${progress} Hiragana list fetch failed for "${entry}": ${hiraganaError.message}`);
        // 히라가나 리스트 실패는 치명적이지 않으므로 계속 진행
      }
      
      // 검색 결과에서 필요한 데이터 추출
      const extractedData = extractSearchData(searchData);
      
      // 최종 결과 구성 (청크 파일에 저장할 데이터만)
      const result = {
        entry: entry,
        priority: extractedData.priority,
        words: extractedData.words,
        meaning: extractedData.meaning,
        examples: extractedData.examples,
        hiraganaList: hiraganaData
      };
      
      results.push(result);
      
      // 마지막 항목이 아니면 delay
      if (i < entries.length - 1) {
        await delay(DELAY_MS);
      }
    } catch (error) {
      console.error(`${progress} Error for "${entry}": ${error.message}`);
      errors.push({
        entry: entry,
        error: error.message
      });
      
      // 에러가 발생해도 계속 진행
      if (i < entries.length - 1) {
        await delay(DELAY_MS);
      }
    }
  }
  
  console.log(`\n완료! 성공: ${results.length}개, 실패: ${errors.length}개\n`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // 청크 저장 (100개 단위)
  const chunkSize = 100;
  const chunkFiles = [];
  const entryToChunkMap = {}; // entry -> chunk 파일명 매핑
  
  for (let i = 0; i < results.length; i += chunkSize) {
    const chunk = results.slice(i, i + chunkSize);
    const chunkIndex = Math.floor(i / chunkSize);
    const chunkFileName = `n5-details-chunk-${chunkIndex}.json`;
    const chunkFile = path.join(detailsDir, chunkFileName);
    
    fs.writeFileSync(
      chunkFile,
      JSON.stringify(chunk, null, 2),
      'utf-8'
    );
    chunkFiles.push(chunkFileName);
    
    // entry -> chunk 매핑 생성
    chunk.forEach(item => {
      entryToChunkMap[item.entry] = chunkFileName;
    });
  }
  console.log(`청크 파일 저장: ${chunkFiles.length}개 (경로: ${detailsDir})`);

  // 인덱스 파일 저장
  const indexData = {
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    successCount: results.length,
    errorCount: errors.length,
    chunkSize,
    chunkFiles,
    entryToChunk: entryToChunkMap // entry로 청크 파일 찾기
  };
  const indexPath = path.join(detailsDir, `n5-details-index.json`);
  fs.writeFileSync(
    indexPath,
    JSON.stringify(indexData, null, 2),
    'utf-8'
  );
  console.log(`인덱스 저장: ${indexPath}`);

  // 백업용 전체 JSON
  const allResultsPath = path.join(outputDir, `n5-search-results-${timestamp}.json`);
  fs.writeFileSync(
    allResultsPath,
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  console.log(`백업 JSON 저장: ${allResultsPath}`);

  // 에러 로그 저장
  if (errors.length > 0) {
    const errorsPath = path.join(outputDir, `n5-errors-${timestamp}.json`);
    fs.writeFileSync(
      errorsPath,
      JSON.stringify(errors, null, 2),
      'utf-8'
    );
    console.log(`에러 로그 저장: ${errorsPath}`);
  }

  // 요약 정보 저장
  const summary = {
    timestamp: new Date().toISOString(),
    totalEntries: entries.length,
    successCount: results.length,
    errorCount: errors.length,
    chunkSize,
    chunkFiles,
    detailsIndexFile: path.basename(indexPath),
    backupJsonFile: path.basename(allResultsPath),
  };
  const summaryPath = path.join(outputDir, `n5-summary-${timestamp}.json`);
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(summary, null, 2),
    'utf-8'
  );
  console.log(`요약 정보 저장: ${summaryPath}`);
}

// 실행
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

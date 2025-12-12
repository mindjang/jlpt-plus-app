const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const n1Path = path.join(__dirname, '../data/words/n1.ts');
const outputDir = path.join(__dirname, '../data/words/search-results');
const detailsDir = path.join(__dirname, '../data/words/details/n1');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(detailsDir)) fs.mkdirSync(detailsDir, { recursive: true });

function getDelayMs() {
  const min = 432;
  const max = 3869;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function delay() {
  return new Promise(resolve => setTimeout(resolve, getDelayMs()));
}

function extractEntries() {
  try {
    const content = fs.readFileSync(n1Path, 'utf-8');
    const entries = [];
    const entryRegex = /entry:\s*["']([^"']+)["']/g;
    let match;
    while ((match = entryRegex.exec(content)) !== null) entries.push(match[1]);
    const uniqueEntries = [...new Set(entries)];
    console.log(`총 ${uniqueEntries.length}개의 고유 entry를 찾았습니다.\n`);
    return uniqueEntries;
  } catch (error) {
    console.error('n1.ts 파일 읽기 실패:', error.message);
    process.exit(1);
  }
}

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
      ...headers,
    };

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: defaultHeaders,
    };

    const req = https.request(options, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let stream = res;
      if (res.headers['content-encoding'] === 'gzip') stream = res.pipe(zlib.createGunzip());
      else if (res.headers['content-encoding'] === 'deflate') stream = res.pipe(zlib.createInflate());
      else if (res.headers['content-encoding'] === 'br') stream = res.pipe(zlib.createBrotliDecompress());

      let data = '';
      stream.on('data', chunk => { data += chunk.toString(); });
      stream.on('end', () => {
        try {
          if (!data) return reject(new Error('Empty response'));
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`JSON parse error: ${err.message}`));
        }
      });
      stream.on('error', err => reject(new Error(`Stream error: ${err.message}`)));
    });

    req.on('error', err => reject(new Error(`Request error: ${err.message}`)));
    req.end();
  });
}

function fetchSearchResult(entry) {
  const encoded = encodeURIComponent(entry);
  return makeRequest(`https://ja.dict.naver.com/api3/jako/search?query=${encoded}&m=mobile&range=entrySearch`);
}

function fetchHiraganaList(entry) {
  const encoded = encodeURIComponent(entry);
  return makeRequest(`https://ja.dict.naver.com/api/jako/getHiraganaList?category1=katakana&category2=${encoded}&page=1&pageSize=100&sort=asc`);
}

function filterHiraganaList(list) {
  if (!Array.isArray(list)) return list;
  const drop = [
    'category3','category4','category5','category6','relatedContent','relatedContents',
    'example','link_url','anchor','pron_file','org_language','mix_pron','show_entry',
    'super_script','pv','super_script_num'
  ];
  return list.map(item => {
    const filtered = { ...item };
    drop.forEach(f => delete filtered[f]);
    return filtered;
  });
}

function filterMeansCollectorMeans(means) {
  if (!Array.isArray(means)) return means;
  const drop = ['subjectGroup','subjectGroupCode','languageGroup','languageGroupCode','example','uuid','groupName','groupId','sourceUpdate','handleValue','exampleOri','exampleTrans','hlType','encode'];
  return means.map(m => {
    const filtered = { ...m };
    drop.forEach(f => delete filtered[f]);
    return filtered;
  });
}

function filterWords(words) {
  if (!Array.isArray(words)) return words;
  const drop = [
    'gdid','sourceCid','dictId','matchType','entryId','serviceCode','sourceDictnameKO','sourceDictnameOri','sourceDictnameLink','sourceUpdate','dictTypeWriter','dictTypeMulti','expEntry','expEntrySuperscript','destinationLink','destinationLinkKo','expAliasEntryAlways','expAliasEntryAlwaysOld','expAliasEntrySearch','expAliasEntrySearchKrKind','expAliasEntrySearchAllKind','expAliasGeneralAlways','expAliasGeneralSearch','expConjugationMoreURL','conjugate','expSynonym','expAntonym','pronunFileCount','expAudioRead','expMeaningRead','expKoreanPron','expKoreanHanja','exphanjaStroke','exphanjaRadical','exphanjaRadicalStroke','isHighDfTerm','isOpenDict','isPhoneticSymbol','hasConjugation','hasIdiom','hasExample','hasStudy','hasImage','hasSource','hasOrigin','meaningCount','entryImageURL','entryImageURLs','idiomOri','idiomOriUrl','phoneticSymbol','entryLikeNumber','entryCommentNumber','uuid','documentQuality','expHanjaRadicalKoreanName','etcExplain','expSourceBook','expEntryComposition','expStrokeAnimation','expAbstract','imageFileCount','audioThumnail','audioFileCount','videoThumnail','videoFileCount','expOnly','pageView','similarWordList','antonymWordList','expAliasEntryAlwaysList','expAliasGeneralAlwaysList','expAliasEntrySearchList','searchPhoneticSymbolList','searchVariantHanziList','searchTraditionalChineseList','abstractContent','expEntryCustomContentList','expMeaningCustomContentList','openExactMatch','exactMatch'
  ];
  return words.map(item => {
    const filtered = { ...item };
    drop.forEach(f => delete filtered[f]);
    if (filtered.meansCollector && Array.isArray(filtered.meansCollector)) {
      filtered.meansCollector = filtered.meansCollector.map(c => {
        const fc = { ...c };
        if (fc.means && Array.isArray(fc.means)) fc.means = filterMeansCollectorMeans(fc.means);
        return fc;
      });
    }
    return filtered;
  });
}

function filterMeaning(items) {
  if (!Array.isArray(items)) return items;
  const drop = [
    'gdid','sourceCid','dictId','matchType','entryId','serviceCode','languageCode','sourceDictnameKO','sourceDictnameOri','sourceDictnameLink','sourceUpdate','dictTypeWriter','dictTypeMulti','destinationLink','destinationLinkKo','expAliasEntryAlways','expAliasEntryAlwaysOld','expAliasEntrySearch','expAliasEntrySearchKrKind','expAliasEntrySearchAllKind','expAliasGeneralAlways','expAliasGeneralSearch','expConjugationMoreURL','conjugate','expSynonym','expAntonym','pronunFileCount','expKanji','expAudioRead','expMeaningRead','expKoreanPron','expKoreanHanja','exphanjaStroke','exphanjaRadical','exphanjaRadicalStroke','partGroupYn','newEntry','isHighDfTerm','isOpenDict','isPhoneticSymbol','hasConjugation','hasIdiom','hasExample','hasStudy','hasImage','hasSource','hasOrigin','meaningCount','entryImageURL','entryImageURLs','idiomOri','idiomOriUrl','phoneticSymbol','frequencyAdd','entryLikeNumber','entryCommentNumber','uuid','documentQuality','expHanjaRadicalKoreanName','etcExplain','expSourceBook','expEntryComposition','expStrokeAnimation','expAbstract','imageFileCount','audioThumnail','audioFileCount','videoThumnail','videoFileCount','expOnly','pageView','similarWordList','antonymWordList','expAliasEntryAlwaysList','expAliasEntrySearchList','searchPhoneticSymbolList','searchVariantHanziList','searchTraditionalChineseList','abstractContent','expEntryCustomContentList','expMeaningCustomContentList','exactMatch','openExactMatch'
  ];
  return items.map(item => {
    const filtered = { ...item };
    drop.forEach(f => delete filtered[f]);
    if (filtered.meansCollector && Array.isArray(filtered.meansCollector)) {
      filtered.meansCollector = filtered.meansCollector.map(c => {
        const fc = { ...c };
        if (fc.means && Array.isArray(fc.means)) fc.means = filterMeansCollectorMeans(fc.means);
        return fc;
      });
    }
    return filtered;
  });
}

function filterExamples(items) {
  if (!Array.isArray(items)) return items;
  const drop = [
    'gdid','sourceCid','dictId','matchType','exampleId','serviceCode','example3Lang','expExample3','expExampleURL','translationId','translation','translationAutoLink','languageCode','sourceDictnameImage','detailLink','translationUserlink','translationParticipationCount','translationHonorYear','translationDictUuid','translationLike','translationDislike','expOnly','searchPhoneticSymbolList','exampleVcode','exampleEncode','translationVcode','translationEncode','documentQuality','dictTypeWriter','sourceDictnameKO','sourceDictnameOri','sourceDictnameURL','sourceDictnameAddKO','sourceDictnameAddURL','sourceUpdate','superscript','expEntryURL','languageIntCode','dictTypeForm','haveTrans','expExampleAutoLink','expExample1Pronun'
  ];
  return items.map(item => {
    const filtered = { ...item };
    drop.forEach(f => delete filtered[f]);
    return filtered;
  });
}

function extractSearchData(searchData) {
  const result = { priority: null, words: [], meaning: [], examples: [] };
  if (!searchData || !searchData.searchResultMap || !searchData.searchResultMap.searchResultListMap) return result;
  const listMap = searchData.searchResultMap.searchResultListMap;

  if (listMap.WORD && listMap.WORD.items && Array.isArray(listMap.WORD.items)) {
    const wordItems = listMap.WORD.items.filter(item => {
      const rank = item.rank;
      return rank === "1" || rank === "2" || rank === 1 || rank === 2;
    });
    if (wordItems.length > 0) result.priority = wordItems[0].priority;
    result.words = filterWords(wordItems);
  }

  if (listMap.MEANING) {
    const meaningItems = listMap.MEANING.items || [];
    result.meaning = filterMeaning(meaningItems);
  }

  if (listMap.EXAMPLE) {
    const exampleItems = listMap.EXAMPLE.items || [];
    result.examples = filterExamples(exampleItems);
  }

  return result;
}

async function main() {
  const entries = extractEntries();
  const results = [];
  const errors = [];
  console.log('API 호출을 시작합니다...\n');

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const progress = `[${i + 1}/${entries.length}]`;
    try {
      console.log(`${progress} Fetching search result: ${entry}`);
      const searchData = await fetchSearchResult(entry);
      await delay();

      console.log(`${progress} Fetching hiragana list: ${entry}`);
      let hiraganaData = null;
      try {
        const hiraganaResponse = await fetchHiraganaList(entry);
        const rawHiraganaList = hiraganaResponse.m_items || [];
        hiraganaData = filterHiraganaList(rawHiraganaList);
      } catch (err) {
        console.warn(`${progress} Hiragana list fetch failed for "${entry}": ${err.message}`);
      }

      const extracted = extractSearchData(searchData);
      results.push({
        entry,
        priority: extracted.priority,
        words: extracted.words,
        meaning: extracted.meaning,
        examples: extracted.examples,
        hiraganaList: hiraganaData,
      });

      if (i < entries.length - 1) await delay();
    } catch (err) {
      console.error(`${progress} Error for "${entry}": ${err.message}`);
      errors.push({ entry, error: err.message });
      if (i < entries.length - 1) await delay();
    }
  }

  console.log(`\n완료! 성공: ${results.length}개, 실패: ${errors.length}개\n`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const chunkSize = 100;
  const chunkFiles = [];
  const entryToChunkMap = {};
  for (let i = 0; i < results.length; i += chunkSize) {
    const chunk = results.slice(i, i + chunkSize);
    const chunkIndex = Math.floor(i / chunkSize);
    const chunkFileName = `n1-details-chunk-${chunkIndex}.json`;
    const chunkFile = path.join(detailsDir, chunkFileName);
    fs.writeFileSync(chunkFile, JSON.stringify(chunk, null, 2), 'utf-8');
    chunkFiles.push(chunkFileName);
    chunk.forEach(item => { entryToChunkMap[item.entry] = chunkFileName; });
  }
  console.log(`청크 파일 저장: ${chunkFiles.length}개 (경로: ${detailsDir})`);

  const indexData = {
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    successCount: results.length,
    errorCount: errors.length,
    chunkSize,
    chunkFiles,
    entryToChunk: entryToChunkMap,
  };
  const indexPath = path.join(detailsDir, 'n1-details-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
  console.log(`인덱스 저장: ${indexPath}`);

  const allResultsPath = path.join(outputDir, `n1-search-results-${timestamp}.json`);
  fs.writeFileSync(allResultsPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`백업 JSON 저장: ${allResultsPath}`);

  if (errors.length > 0) {
    const errorsPath = path.join(outputDir, `n1-errors-${timestamp}.json`);
    fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2), 'utf-8');
    console.log(`에러 로그 저장: ${errorsPath}`);
  }

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
  const summaryPath = path.join(outputDir, `n1-summary-${timestamp}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`요약 정보 저장: ${summaryPath}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

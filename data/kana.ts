import { KanaData } from './types'

export type { KanaData }

// 카테고리 타입
export type KanaCategory = 'seion' | 'dakuon' | 'handakuon' | 'yoon'

export interface KanaCategoryData {
  category: KanaCategory
  name: string
  items: KanaData[]
}

// 히라가나 - 청음 (Seion) - 기본 그룹
export const hiraganaSeionMain: KanaData[] = [
  { kana: 'あ', romaji: 'a' },
  { kana: 'い', romaji: 'i' },
  { kana: 'う', romaji: 'u' },
  { kana: 'え', romaji: 'e' },
  { kana: 'お', romaji: 'o' },
  { kana: 'か', romaji: 'ka' },
  { kana: 'き', romaji: 'ki' },
  { kana: 'く', romaji: 'ku' },
  { kana: 'け', romaji: 'ke' },
  { kana: 'こ', romaji: 'ko' },
  { kana: 'さ', romaji: 'sa' },
  { kana: 'し', romaji: 'shi' },
  { kana: 'す', romaji: 'su' },
  { kana: 'せ', romaji: 'se' },
  { kana: 'そ', romaji: 'so' },
  { kana: 'た', romaji: 'ta' },
  { kana: 'ち', romaji: 'chi' },
  { kana: 'つ', romaji: 'tsu' },
  { kana: 'て', romaji: 'te' },
  { kana: 'と', romaji: 'to' },
  { kana: 'な', romaji: 'na' },
  { kana: 'に', romaji: 'ni' },
  { kana: 'ぬ', romaji: 'nu' },
  { kana: 'ね', romaji: 'ne' },
  { kana: 'の', romaji: 'no' },
  { kana: 'は', romaji: 'ha' },
  { kana: 'ひ', romaji: 'hi' },
  { kana: 'ふ', romaji: 'fu' },
  { kana: 'へ', romaji: 'he' },
  { kana: 'ほ', romaji: 'ho' },
  { kana: 'ま', romaji: 'ma' },
  { kana: 'み', romaji: 'mi' },
  { kana: 'む', romaji: 'mu' },
  { kana: 'め', romaji: 'me' },
  { kana: 'も', romaji: 'mo' },
]

// 히라가나 - 청음 - や행 (3열)
export const hiraganaSeionYa: KanaData[] = [
  { kana: 'や', romaji: 'ya' },
  { kana: 'ゆ', romaji: 'yu' },
  { kana: 'よ', romaji: 'yo' },
]

// 히라가나 - 청음 - ら행 (5열)
export const hiraganaSeionRa: KanaData[] = [
  { kana: 'ら', romaji: 'ra' },
  { kana: 'り', romaji: 'ri' },
  { kana: 'る', romaji: 'ru' },
  { kana: 'れ', romaji: 're' },
  { kana: 'ろ', romaji: 'ro' },
]

// 히라가나 - 청음 - わ행 (2열)
export const hiraganaSeionWa: KanaData[] = [
  { kana: 'わ', romaji: 'wa' },
  { kana: 'を', romaji: 'wo' },
]

// 히라가나 - 청음 - ん (1개)
export const hiraganaSeionN: KanaData[] = [
  { kana: 'ん', romaji: 'n' },
]

// 히라가나 - 청음 전체 (하위 호환성)
export const hiraganaSeion: KanaData[] = [
  ...hiraganaSeionMain,
  ...hiraganaSeionYa,
  ...hiraganaSeionRa,
  ...hiraganaSeionWa,
  ...hiraganaSeionN,
]

// 히라가나 - 탁음 (Dakuon)
export const hiraganaDakuon: KanaData[] = [
  { kana: 'が', romaji: 'ga' },
  { kana: 'ぎ', romaji: 'gi' },
  { kana: 'ぐ', romaji: 'gu' },
  { kana: 'げ', romaji: 'ge' },
  { kana: 'ご', romaji: 'go' },
  { kana: 'ざ', romaji: 'za' },
  { kana: 'じ', romaji: 'ji' },
  { kana: 'ず', romaji: 'zu' },
  { kana: 'ぜ', romaji: 'ze' },
  { kana: 'ぞ', romaji: 'zo' },
  { kana: 'だ', romaji: 'da' },
  { kana: 'ぢ', romaji: 'ji' },
  { kana: 'づ', romaji: 'zu' },
  { kana: 'で', romaji: 'de' },
  { kana: 'ど', romaji: 'do' },
  { kana: 'ば', romaji: 'ba' },
  { kana: 'び', romaji: 'bi' },
  { kana: 'ぶ', romaji: 'bu' },
  { kana: 'べ', romaji: 'be' },
  { kana: 'ぼ', romaji: 'bo' },
]

// 히라가나 - 반탁음 (Handakuon)
export const hiraganaHandakuon: KanaData[] = [
  { kana: 'ぱ', romaji: 'pa' },
  { kana: 'ぴ', romaji: 'pi' },
  { kana: 'ぷ', romaji: 'pu' },
  { kana: 'ぺ', romaji: 'pe' },
  { kana: 'ぽ', romaji: 'po' },
]

// 히라가나 - 요음 (Yōon)
export const hiraganaYoon: KanaData[] = [
  { kana: 'きゃ', romaji: 'kya' },
  { kana: 'きゅ', romaji: 'kyu' },
  { kana: 'きょ', romaji: 'kyo' },
  { kana: 'ぎゃ', romaji: 'gya' },
  { kana: 'ぎゅ', romaji: 'gyu' },
  { kana: 'ぎょ', romaji: 'gyo' },
  { kana: 'しゃ', romaji: 'sha' },
  { kana: 'しゅ', romaji: 'shu' },
  { kana: 'しょ', romaji: 'sho' },
  { kana: 'じゃ', romaji: 'ja' },
  { kana: 'じゅ', romaji: 'ju' },
  { kana: 'じょ', romaji: 'jo' },
  { kana: 'ちゃ', romaji: 'cha' },
  { kana: 'ちゅ', romaji: 'chu' },
  { kana: 'ちょ', romaji: 'cho' },
  { kana: 'にゃ', romaji: 'nya' },
  { kana: 'にゅ', romaji: 'nyu' },
  { kana: 'にょ', romaji: 'nyo' },
  { kana: 'ひゃ', romaji: 'hya' },
  { kana: 'ひゅ', romaji: 'hyu' },
  { kana: 'ひょ', romaji: 'hyo' },
  { kana: 'みゃ', romaji: 'mya' },
  { kana: 'みゅ', romaji: 'myu' },
  { kana: 'みょ', romaji: 'myo' },
  { kana: 'りゃ', romaji: 'rya' },
  { kana: 'りゅ', romaji: 'ryu' },
  { kana: 'りょ', romaji: 'ryo' },
]

// 가타카나 - 청음 (Seion) - 기본 그룹
export const katakanaSeionMain: KanaData[] = [
  { kana: 'ア', romaji: 'a' },
  { kana: 'イ', romaji: 'i' },
  { kana: 'ウ', romaji: 'u' },
  { kana: 'エ', romaji: 'e' },
  { kana: 'オ', romaji: 'o' },
  { kana: 'カ', romaji: 'ka' },
  { kana: 'キ', romaji: 'ki' },
  { kana: 'ク', romaji: 'ku' },
  { kana: 'ケ', romaji: 'ke' },
  { kana: 'コ', romaji: 'ko' },
  { kana: 'サ', romaji: 'sa' },
  { kana: 'シ', romaji: 'shi' },
  { kana: 'ス', romaji: 'su' },
  { kana: 'セ', romaji: 'se' },
  { kana: 'ソ', romaji: 'so' },
  { kana: 'タ', romaji: 'ta' },
  { kana: 'チ', romaji: 'chi' },
  { kana: 'ツ', romaji: 'tsu' },
  { kana: 'テ', romaji: 'te' },
  { kana: 'ト', romaji: 'to' },
  { kana: 'ナ', romaji: 'na' },
  { kana: 'ニ', romaji: 'ni' },
  { kana: 'ヌ', romaji: 'nu' },
  { kana: 'ネ', romaji: 'ne' },
  { kana: 'ノ', romaji: 'no' },
  { kana: 'ハ', romaji: 'ha' },
  { kana: 'ヒ', romaji: 'hi' },
  { kana: 'フ', romaji: 'fu' },
  { kana: 'ヘ', romaji: 'he' },
  { kana: 'ホ', romaji: 'ho' },
  { kana: 'マ', romaji: 'ma' },
  { kana: 'ミ', romaji: 'mi' },
  { kana: 'ム', romaji: 'mu' },
  { kana: 'メ', romaji: 'me' },
  { kana: 'モ', romaji: 'mo' },
]

// 가타카나 - 청음 - ヤ행 (3열)
export const katakanaSeionYa: KanaData[] = [
  { kana: 'ヤ', romaji: 'ya' },
  { kana: 'ユ', romaji: 'yu' },
  { kana: 'ヨ', romaji: 'yo' },
]

// 가타카나 - 청음 - ラ행 (5열)
export const katakanaSeionRa: KanaData[] = [
  { kana: 'ラ', romaji: 'ra' },
  { kana: 'リ', romaji: 'ri' },
  { kana: 'ル', romaji: 'ru' },
  { kana: 'レ', romaji: 're' },
  { kana: 'ロ', romaji: 'ro' },
]

// 가타카나 - 청음 - ワ행 (2열)
export const katakanaSeionWa: KanaData[] = [
  { kana: 'ワ', romaji: 'wa' },
  { kana: 'ヲ', romaji: 'wo' },
]

// 가타카나 - 청음 - ン (1개)
export const katakanaSeionN: KanaData[] = [
  { kana: 'ン', romaji: 'n' },
]

// 가타카나 - 청음 전체 (하위 호환성)
export const katakanaSeion: KanaData[] = [
  ...katakanaSeionMain,
  ...katakanaSeionYa,
  ...katakanaSeionRa,
  ...katakanaSeionWa,
  ...katakanaSeionN,
]

// 가타카나 - 탁음 (Dakuon)
export const katakanaDakuon: KanaData[] = [
  { kana: 'ガ', romaji: 'ga' },
  { kana: 'ギ', romaji: 'gi' },
  { kana: 'グ', romaji: 'gu' },
  { kana: 'ゲ', romaji: 'ge' },
  { kana: 'ゴ', romaji: 'go' },
  { kana: 'ザ', romaji: 'za' },
  { kana: 'ジ', romaji: 'ji' },
  { kana: 'ズ', romaji: 'zu' },
  { kana: 'ゼ', romaji: 'ze' },
  { kana: 'ゾ', romaji: 'zo' },
  { kana: 'ダ', romaji: 'da' },
  { kana: 'ヂ', romaji: 'ji' },
  { kana: 'ヅ', romaji: 'zu' },
  { kana: 'デ', romaji: 'de' },
  { kana: 'ド', romaji: 'do' },
  { kana: 'バ', romaji: 'ba' },
  { kana: 'ビ', romaji: 'bi' },
  { kana: 'ブ', romaji: 'bu' },
  { kana: 'ベ', romaji: 'be' },
  { kana: 'ボ', romaji: 'bo' },
]

// 가타카나 - 반탁음 (Handakuon)
export const katakanaHandakuon: KanaData[] = [
  { kana: 'パ', romaji: 'pa' },
  { kana: 'ピ', romaji: 'pi' },
  { kana: 'プ', romaji: 'pu' },
  { kana: 'ペ', romaji: 'pe' },
  { kana: 'ポ', romaji: 'po' },
]

// 가타카나 - 요음 (Yōon)
export const katakanaYoon: KanaData[] = [
  { kana: 'キャ', romaji: 'kya' },
  { kana: 'キュ', romaji: 'kyu' },
  { kana: 'キョ', romaji: 'kyo' },
  { kana: 'ギャ', romaji: 'gya' },
  { kana: 'ギュ', romaji: 'gyu' },
  { kana: 'ギョ', romaji: 'gyo' },
  { kana: 'シャ', romaji: 'sha' },
  { kana: 'シュ', romaji: 'shu' },
  { kana: 'ショ', romaji: 'sho' },
  { kana: 'ジャ', romaji: 'ja' },
  { kana: 'ジュ', romaji: 'ju' },
  { kana: 'ジョ', romaji: 'jo' },
  { kana: 'チャ', romaji: 'cha' },
  { kana: 'チュ', romaji: 'chu' },
  { kana: 'チョ', romaji: 'cho' },
  { kana: 'ニャ', romaji: 'nya' },
  { kana: 'ニュ', romaji: 'nyu' },
  { kana: 'ニョ', romaji: 'nyo' },
  { kana: 'ヒャ', romaji: 'hya' },
  { kana: 'ヒュ', romaji: 'hyu' },
  { kana: 'ヒョ', romaji: 'hyo' },
  { kana: 'ミャ', romaji: 'mya' },
  { kana: 'ミュ', romaji: 'myu' },
  { kana: 'ミョ', romaji: 'myo' },
  { kana: 'リャ', romaji: 'rya' },
  { kana: 'リュ', romaji: 'ryu' },
  { kana: 'リョ', romaji: 'ryo' },
]

// 카테고리별 데이터 구조
export const hiraganaCategories: KanaCategoryData[] = [
  { category: 'seion', name: '청음', items: hiraganaSeion },
  { category: 'dakuon', name: '탁음', items: hiraganaDakuon },
  { category: 'handakuon', name: '반탁음', items: hiraganaHandakuon },
  { category: 'yoon', name: '요음', items: hiraganaYoon },
]

// 청음 그룹 데이터 (렌더링용)
export interface SeionGroup {
  items: KanaData[]
  columns: 2 | 3 | 5
}

export const hiraganaSeionGroups: SeionGroup[] = [
  { items: hiraganaSeionMain, columns: 5 },
  { items: hiraganaSeionYa, columns: 3 },
  { items: hiraganaSeionRa, columns: 5 },
  { items: hiraganaSeionWa, columns: 2 },
  { items: hiraganaSeionN, columns: 5 },
]

export const katakanaSeionGroups: SeionGroup[] = [
  { items: katakanaSeionMain, columns: 5 },
  { items: katakanaSeionYa, columns: 3 },
  { items: katakanaSeionRa, columns: 5 },
  { items: katakanaSeionWa, columns: 2 },
  { items: katakanaSeionN, columns: 5 },
]

export const katakanaCategories: KanaCategoryData[] = [
  { category: 'seion', name: '청음', items: katakanaSeion },
  { category: 'dakuon', name: '탁음', items: katakanaDakuon },
  { category: 'handakuon', name: '반탁음', items: katakanaHandakuon },
  { category: 'yoon', name: '요음', items: katakanaYoon },
]

// 하위 호환성을 위한 전체 데이터
export const hiraganaData: KanaData[] = [
  ...hiraganaSeion,
  ...hiraganaDakuon,
  ...hiraganaHandakuon,
  ...hiraganaYoon,
]

export const katakanaData: KanaData[] = [
  ...katakanaSeion,
  ...katakanaDakuon,
  ...katakanaHandakuon,
  ...katakanaYoon,
]

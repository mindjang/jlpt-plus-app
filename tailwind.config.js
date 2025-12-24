// Tailwind config에서 TypeScript 파일을 직접 import할 수 없으므로
// 색상 값을 직접 계산합니다.
// 실제 색상 값은 lib/constants/colors.ts에서 관리됩니다.

// 레벨별 단색 (Primary Color)
const LEVEL_COLORS = {
  N5: '#FF8C00', // 밝은 주황 (가장 쉬움)
  N4: '#FF6B35', // 오렌지-빨강
  N3: '#E63946', // 빨강
  N2: '#6A4C93', // 보라
  N1: '#1E88E5', // 파랑 (가장 어려움)
}

// 그라데이션용 매우 밝은 색상 생성 함수
function generateLightGradientColor(hex, lightness = 0.92) {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + (255 - parseInt(hex.slice(1, 3), 16)) * lightness)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + (255 - parseInt(hex.slice(3, 5), 16)) * lightness)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + (255 - parseInt(hex.slice(5, 7), 16)) * lightness)
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
}

// 그라데이션용 중간 밝기 색상 생성 함수
function generateMediumGradientColor(hex, lightness = 0.85) {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + (255 - parseInt(hex.slice(1, 3), 16)) * lightness)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + (255 - parseInt(hex.slice(3, 5), 16)) * lightness)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + (255 - parseInt(hex.slice(5, 7), 16)) * lightness)
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
}

// 레벨별 그라데이션 (LEVEL_COLORS에서 자동 생성)
const LEVEL_GRADIENTS = {
  N5: { 
    from: generateLightGradientColor(LEVEL_COLORS.N5, 0.92), 
    to: generateMediumGradientColor(LEVEL_COLORS.N5, 0.85) 
  },
  N4: { 
    from: generateLightGradientColor(LEVEL_COLORS.N4, 0.92), 
    to: generateMediumGradientColor(LEVEL_COLORS.N4, 0.85) 
  },
  N3: { 
    from: generateLightGradientColor(LEVEL_COLORS.N3, 0.92), 
    to: generateMediumGradientColor(LEVEL_COLORS.N3, 0.85) 
  },
  N2: { 
    from: generateLightGradientColor(LEVEL_COLORS.N2, 0.92), 
    to: generateMediumGradientColor(LEVEL_COLORS.N2, 0.85) 
  },
  N1: { 
    from: generateLightGradientColor(LEVEL_COLORS.N1, 0.92), 
    to: generateMediumGradientColor(LEVEL_COLORS.N1, 0.85) 
  },
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 레벨 단색 (List에서 사용)
        level: {
          n1: LEVEL_COLORS.N1,
          n2: LEVEL_COLORS.N2,
          n3: LEVEL_COLORS.N3,
          n4: LEVEL_COLORS.N4,
          n5: LEVEL_COLORS.N5,
        },
        // 레벨 그라데이션 (홈/자동학습 배경 전용)
        levelGradient: {
          n1: {
            from: LEVEL_GRADIENTS.N1.from,
            to: LEVEL_GRADIENTS.N1.to,
          },
          n2: {
            from: LEVEL_GRADIENTS.N2.from,
            to: LEVEL_GRADIENTS.N2.to,
          },
          n3: {
            from: LEVEL_GRADIENTS.N3.from,
            to: LEVEL_GRADIENTS.N3.to,
          },
          n4: {
            from: LEVEL_GRADIENTS.N4.from,
            to: LEVEL_GRADIENTS.N4.to,
          },
          n5: {
            from: LEVEL_GRADIENTS.N5.from,
            to: LEVEL_GRADIENTS.N5.to,
          },
        },
        // 표면 색상
        surface: '#FFFFFF',
        page: '#f5f5f5',
        // 텍스트 색상
        text: {
          main: '#2A2A2A',
          sub: '#757575',
          hint: '#BEBEBE',
          level: '#444444',
        },
        // Primary 색상 (Mogu 브랜드 컬러)
        primary: '#ff841f',
        // Mogu 브랜드 포인트 컬러 (고양이와 자연 이미지 기반)
        mogu: {
          DEFAULT: '#ff841f', // 메인 포인트 컬러 (자연 초록색)
          cream: '#F0F8F0', // 연한 초록색
          light: '#4DB84D', // 밝은 초록색
          dark: '#147A00', // 어두운 초록색
        },
        // Disabled 색상
        disabled: {
          bg: '#F1F1F1',
          text: '#BEBEBE',
        },
        // 칩 색상
        chip: {
          bg: '#F8F8F8',
          text: '#555555',
          radical: '#EDE2FF',
        },
        // Divider
        divider: '#F3F3F3',
      },
      borderRadius: {
        card: '8px', // 네이버 스타일: 8px
        chip: '6px',
        kanji: '8px',
        search: '999px',
        levelCard: '12px', // 네이버 스타일: 12px
      },
      boxShadow: {
        // 네이버 스타일: 그림자 최소화 (필요시에만 사용)
        soft: 'none', // 기본적으로 그림자 없음
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'sans-serif'],
        jp: ['Noto Sans JP', 'sans-serif'],
      },
      fontSize: {
        'display-l': ['40px', { lineHeight: '1.2', fontWeight: '500' }],
        'display-s': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        title: ['20px', { lineHeight: '1.35', fontWeight: '600' }],
        subtitle: ['16px', { lineHeight: '1.45', fontWeight: '500' }],
        body: ['14px', { lineHeight: '1.55', fontWeight: '400' }],
        label: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      spacing: {
        '18': '18px',
        '32': '32px',
        '56': '56px',
        '72': '72px',
      },
    },
  },
  plugins: [],
}



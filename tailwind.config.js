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
          n1: '#0F7FE1',
          n2: '#4841DC',
          n3: '#D33939',
          n4: '#D15D10',
          n5: '#DA7A13',
        },
        // 레벨 그라데이션 (홈/자동학습 배경 전용)
        levelGradient: {
          n1: {
            from: '#E9F4FF',
            to: '#D9E9FF',
          },
          n2: {
            from: '#EEE8FF',
            to: '#D9D0FF',
          },
          n3: {
            from: '#FFECEC',
            to: '#FFD4D4',
          },
          n4: {
            from: '#FFEFE8',
            to: '#FFDCC8',
          },
          n5: {
            from: '#FFF4D8',
            to: '#FFE8B3',
          },
        },
        // 표면 색상
        surface: '#FFFFFF',
        page: '#fcfcfc',
        // 텍스트 색상
        text: {
          main: '#2A2A2A',
          sub: '#757575',
          hint: '#BEBEBE',
          level: '#444444',
        },
        // Primary 색상
        primary: '#1A1A1A',
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
        card: '20px',
        chip: '6px',
        kanji: '12px',
        search: '999px',
        levelCard: '24px',
      },
      boxShadow: {
        soft: '0 6px 16px rgba(0,0,0,0.06)',
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



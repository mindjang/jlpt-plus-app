// Jest 테스트 환경 설정
import '@testing-library/jest-dom'

// 전역 모킹 설정
global.console = {
  ...console,
  // 테스트 중 불필요한 로그 숨기기 (선택사항)
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

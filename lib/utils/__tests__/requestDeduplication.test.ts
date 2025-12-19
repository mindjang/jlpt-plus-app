/**
 * 중복 요청 방지 시스템 테스트
 */

import { deduplicateRequest } from '../requestDeduplication'

describe('deduplicateRequest', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('동일한 요청을 동시에 여러 번 호출해도 한 번만 실행되어야 함', async () => {
    const fn = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve('result'), 100)
        })
    )

    const deduplicatedFn = deduplicateRequest(fn)

    // 동시에 3번 호출
    const promise1 = deduplicatedFn('arg1', 'arg2')
    const promise2 = deduplicatedFn('arg1', 'arg2')
    const promise3 = deduplicatedFn('arg1', 'arg2')

    await jest.advanceTimersByTimeAsync(100)

    const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

    expect(fn).toHaveBeenCalledTimes(1) // 한 번만 실행
    expect(result1).toBe('result')
    expect(result2).toBe('result')
    expect(result3).toBe('result')
  })

  it('다른 인자로 호출하면 별도로 실행되어야 함', async () => {
    const fn = jest.fn().mockImplementation(
      (arg: string) =>
        new Promise((resolve) => {
          setTimeout(() => resolve(`result-${arg}`), 100)
        })
    )

    const deduplicatedFn = deduplicateRequest(fn)

    const promise1 = deduplicatedFn('arg1')
    const promise2 = deduplicatedFn('arg2')

    await jest.advanceTimersByTimeAsync(100)

    const [result1, result2] = await Promise.all([promise1, promise2])

    expect(fn).toHaveBeenCalledTimes(2) // 각각 실행
    expect(result1).toBe('result-arg1')
    expect(result2).toBe('result-arg2')
  })

  it('TTL이 설정되면 캐시된 결과를 반환해야 함', async () => {
    const fn = jest.fn().mockResolvedValue('result')

    const deduplicatedFn = deduplicateRequest(fn, { ttl: 5000 })

    // 첫 번째 호출
    const result1 = await deduplicatedFn('arg')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(result1).toBe('result')

    // TTL 내 두 번째 호출 (캐시 사용)
    const result2 = await deduplicatedFn('arg')
    expect(fn).toHaveBeenCalledTimes(1) // 여전히 1번만 호출
    expect(result2).toBe('result')

    // TTL 경과 후 세 번째 호출 (새로 실행)
    await jest.advanceTimersByTimeAsync(5000)
    const result3 = await deduplicatedFn('arg')
    expect(fn).toHaveBeenCalledTimes(2) // 새로 실행됨
    expect(result3).toBe('result')
  })

  it('요청 실패 시 캐시에서 제거해야 함 (removeOnError: true)', async () => {
    const error = new Error('Failed')
    const fn = jest.fn().mockRejectedValue(error)

    const deduplicatedFn = deduplicateRequest(fn, {
      ttl: 5000,
      removeOnError: true,
    })

    // 첫 번째 호출 실패
    await expect(deduplicatedFn('arg')).rejects.toThrow('Failed')
    expect(fn).toHaveBeenCalledTimes(1)

    // 두 번째 호출 (캐시 없음, 새로 실행)
    await expect(deduplicatedFn('arg')).rejects.toThrow('Failed')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('커스텀 keyGenerator를 사용할 수 있어야 함', async () => {
    const fn = jest.fn().mockResolvedValue('result')

    const deduplicatedFn = deduplicateRequest(fn, {
      keyGenerator: (arg1: string, arg2: number) => `${arg1}-${arg2}`,
    })

    // 동일한 키로 호출
    const promise1 = deduplicatedFn('test', 123)
    const promise2 = deduplicatedFn('test', 123)

    await Promise.all([promise1, promise2])

    expect(fn).toHaveBeenCalledTimes(1) // 한 번만 실행
  })

  it('요청 완료 후 pendingRequests에서 제거되어야 함', async () => {
    const fn = jest.fn().mockResolvedValue('result')

    const deduplicatedFn = deduplicateRequest(fn)

    // 첫 번째 요청
    await deduplicatedFn('arg1')
    expect(fn).toHaveBeenCalledTimes(1)

    // 두 번째 요청 (이미 완료되었으므로 새로 실행)
    await deduplicatedFn('arg1')
    expect(fn).toHaveBeenCalledTimes(2) // 새로 실행됨
  })
})

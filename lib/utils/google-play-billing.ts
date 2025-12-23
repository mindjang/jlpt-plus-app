/**
 * Google Play Billing Digital Goods API 유틸리티
 * PWA가 TWA(Trusted Web Activity)로 설치된 경우 구글 플레이스토어 결제 사용
 */

/**
 * TWA 환경인지 감지
 * @returns TWA 환경이면 true
 */
export function isTWA(): boolean {
  if (typeof window === 'undefined') return false
  
  // Android Chrome에서 TWA로 설치된 경우
  // referrer가 android-app://로 시작하거나
  // display-mode가 standalone이고 Android 환경인 경우
  const isAndroid = /Android/i.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true
  
  // referrer 체크 (TWA의 경우 android-app:// 패턴)
  const referrer = document.referrer
  const isTWAReferrer = referrer.startsWith('android-app://')
  
  return isAndroid && (isStandalone || isTWAReferrer)
}

/**
 * Google Play Billing Digital Goods API 사용 가능 여부 확인
 */
export async function isGooglePlayBillingAvailable(): Promise<boolean> {
  if (!isTWA()) return false
  
  try {
    // Digital Goods API가 있는지 확인
    if ('getDigitalGoodsService' in window) {
      const service = await (window as any).getDigitalGoodsService('https://play.google.com/billing')
      return service !== null
    }
    return false
  } catch (error) {
    console.warn('[GooglePlayBilling] Service not available', error)
    return false
  }
}

/**
 * Google Play Billing 서비스 가져오기
 */
export async function getGooglePlayBillingService(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available')
  }
  
  if (!('getDigitalGoodsService' in window)) {
    throw new Error('Digital Goods API is not available')
  }
  
  const service = await (window as any).getDigitalGoodsService('https://play.google.com/billing')
  if (!service) {
    throw new Error('Google Play Billing service is not available')
  }
  
  return service
}

/**
 * 구독 상품 목록 조회
 * @param productIds 구글 플레이스토어 상품 ID 배열
 */
export async function getSubscriptions(productIds: string[]): Promise<any[]> {
  const service = await getGooglePlayBillingService()
  const details = await service.getDetails(productIds)
  return details || []
}

/**
 * 구독 구매
 * @param productId 구글 플레이스토어 상품 ID
 * @returns 구매 상세 정보 (purchaseToken 포함)
 */
export async function purchaseSubscription(productId: string): Promise<{
  purchaseToken: string
  productId: string
  orderId?: string
}> {
  const service = await getGooglePlayBillingService()
  
  // 구매 요청
  // purchase()는 PurchaseDetails 객체를 반환
  const purchaseDetails = await service.purchase(productId)
  
  if (!purchaseDetails || !purchaseDetails.purchaseToken) {
    throw new Error('Purchase failed: No purchase token received')
  }
  
  return {
    purchaseToken: purchaseDetails.purchaseToken,
    productId: purchaseDetails.productId || productId,
    orderId: purchaseDetails.orderId,
  }
}

/**
 * 활성 구독 목록 조회
 */
export async function getActiveSubscriptions(): Promise<any[]> {
  const service = await getGooglePlayBillingService()
  const subscriptions = await service.listPurchases()
  return subscriptions || []
}

/**
 * 구독 취소
 * @param purchaseToken 구매 토큰
 */
export async function cancelSubscription(purchaseToken: string): Promise<void> {
  const service = await getGooglePlayBillingService()
  await service.acknowledge(purchaseToken, 'cancel')
}

/**
 * 플랜을 구글 플레이스토어 상품 ID로 변환
 */
export function getGooglePlayProductId(plan: 'monthly' | 'quarterly'): string {
  // 환경변수에서 가져오거나 기본값 사용
  const productIds: Record<string, string> = {
    monthly: process.env.NEXT_PUBLIC_GOOGLE_PLAY_PRODUCT_ID_MONTHLY || 'monthly_subscription',
    quarterly: process.env.NEXT_PUBLIC_GOOGLE_PLAY_PRODUCT_ID_QUARTERLY || 'quarterly_subscription',
  }
  
  return productIds[plan] || productIds.monthly
}


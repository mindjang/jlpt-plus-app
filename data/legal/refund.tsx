import React from 'react'

/**
 * 환불규정 콘텐츠 컴포넌트
 */
export function RefundContent() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-body text-text-main">
      <div className="space-y-4">
        <section>
          <h2 className="text-display-s font-bold mb-4">환불규정</h2>
          <p className="text-body text-text-sub leading-relaxed mb-6">
            Mogu-JLPT 서비스의 환불규정을 안내해드립니다. 서비스 이용 전 반드시 확인해주시기 바랍니다.
          </p>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">1. 정기구독 서비스 환불</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-3">
            <p>
              정기구독 서비스는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라 
              디지털콘텐츠의 제공이 개시된 경우에는 청약철회를 할 수 없습니다.
            </p>
            
            <div>
              <h4 className="text-subtitle font-semibold mb-2">1-1. 환불 가능한 경우</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>서비스 제공 개시 전 환불 요청 시: 전액 환불</li>
                <li>서비스 제공 개시 후 환불 요청 시: 잔여 기간에 대한 비례 환불 (이용한 기간 제외)</li>
                <li>회사의 귀책사유로 인한 서비스 중단 시: 잔여 기간에 대한 전액 환불</li>
              </ul>
            </div>

            <div>
              <h4 className="text-subtitle font-semibold mb-2">1-2. 환불 금액 계산 방법</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold mb-2">환불 금액 = 결제 금액 × (잔여 이용일수 / 전체 이용일수)</p>
                <p className="text-sm">※ 이용일수는 서비스 이용 시작일부터 환불 요청일까지를 기준으로 계산합니다.</p>
              </div>
            </div>

            <div>
              <h4 className="text-subtitle font-semibold mb-2">1-3. 환불 처리 기간</h4>
              <p>환불 요청 접수 후 영업일 기준 3~5일 이내 처리됩니다.</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">2. 단건결제 서비스 환불</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-3">
            <p>단건결제 서비스는 서비스 제공 개시 전 환불 요청 시 전액 환불이 가능합니다.</p>
            <p>
              서비스 제공 개시 후에는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라 
              청약철회가 제한됩니다.
            </p>
            <p>
              다만, 회사의 귀책사유로 인한 서비스 중단 시에는 잔여 기간에 대한 비례 환불이 가능합니다.
            </p>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">3. 환불 신청 방법</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>3-1. 환불 신청은 고객센터를 통해 접수하실 수 있습니다.</p>
            <p>3-2. 환불 신청 시 다음 정보를 제공해주시기 바랍니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>회원 ID (이메일)</li>
              <li>결제 일시 및 결제 수단</li>
              <li>환불 사유</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">4. 환불 불가 사유</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>다음 각 호의 경우에는 환불이 불가능합니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>서비스 이용 기간이 전체 이용 기간의 50%를 초과한 경우</li>
              <li>이용자의 귀책사유로 인한 환불 요청 (단, 서비스 제공 개시 전은 제외)</li>
              <li>무료 체험 기간 종료 후 자동 결제된 경우 (체험 기간 동안 해지하지 않은 경우)</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">5. 문의처</h3>
          <div className="text-body text-text-sub leading-relaxed">
            <p>환불 관련 문의사항이 있으시면 고객센터로 연락해주시기 바랍니다.</p>
            <p className="mt-2">
              <strong>고객센터:</strong> 앱 내 고객센터 메뉴 또는 이메일을 통해 문의 가능합니다.
            </p>
          </div>
        </section>

        <div className="pt-4 border-t border-divider">
          <p className="text-label text-text-sub">
            본 환불규정은 2025년 1월 1일부터 시행됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

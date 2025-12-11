import React from 'react'

/**
 * 개인정보취급방침 콘텐츠 컴포넌트
 */
export function PrivacyContent() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-body text-text-main">
      <div className="space-y-4">
        <section>
          <h3 className="text-title font-semibold mb-3">제1조 (개인정보의 처리목적)</h3>
          <p className="text-body text-text-sub leading-relaxed mb-2">
            재미찾는개발자(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          </p>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 회원 가입 및 관리</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지 목적으로 개인정보를 처리합니다.</li>
            </ul>
            <p>2. 재화 또는 서비스 제공</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>서비스 제공, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 요금결제·정산을 목적으로 개인정보를 처리합니다.</li>
            </ul>
            <p>3. 마케팅 및 광고에의 활용</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공 등을 목적으로 개인정보를 처리합니다.</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제2조 (개인정보의 처리 및 보유기간)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
            <p>2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>회원 가입 및 관리: 회원 탈퇴시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료시까지)</li>
              <li>재화 또는 서비스 제공: 재화·서비스 공급완료 및 요금결제·정산 완료시까지 (단, 전자상거래법 등 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관)</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제3조 (처리하는 개인정보의 항목)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
            <p>1. 회원 가입 및 관리</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>필수항목: 이메일, 비밀번호, 닉네임</li>
              <li>선택항목: 전화번호, 프로필 사진</li>
            </ul>
            <p>2. 재화 또는 서비스 제공</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>필수항목: 이메일, 이름, 전화번호, 결제정보</li>
              <li>자동 수집 항목: IP주소, 쿠키, MAC주소, 서비스 이용 기록, 접속 로그, 기기정보</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제4조 (개인정보의 제3자 제공)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
            <p>2. 회사는 원활한 서비스 제공을 위해 다음과 같이 제3자에게 개인정보를 제공할 수 있습니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>결제 서비스 제공: 포트원(PortOne) - 결제 처리 및 빌링키 발급을 위해 필요한 최소한의 정보 제공</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제5조 (개인정보처리의 위탁)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>클라우드 서비스 제공: Google Firebase (데이터 저장 및 인증 서비스)</li>
              <li>결제 서비스 제공: 포트원(PortOne) (결제 처리 서비스)</li>
            </ul>
            <p>2. 회사는 위탁계약 체결시 개인정보보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제6조 (정보주체의 권리·의무 및 그 행사방법)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>개인정보 처리정지 요구권</li>
              <li>개인정보 열람요구권</li>
              <li>개인정보 정정·삭제요구권</li>
              <li>개인정보 처리정지 요구권</li>
            </ul>
            <p>2. 제1항에 따른 권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
            <p>3. 정보주체가 개인정보의 오류에 대한 정정을 요청한 경우에는 정정을 완료하기 전까지 당해 개인정보를 이용하거나 제공하지 않습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제7조 (개인정보의 파기)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
            <p>2. 개인정보 파기의 절차 및 방법은 다음과 같습니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>파기절차: 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
              <li>파기방법: 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다. 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제8조 (개인정보 보호책임자)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>상호명: 재미찾는개발자</li>
              <li>사업자번호: 547-12-02515</li>
              <li>이메일: support@jlptplus.app (문의 시 사용)</li>
            </ul>
            <p>2. 정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제9조 (개인정보의 안전성 확보조치)</h3>
          <p className="text-body text-text-sub leading-relaxed">
            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다: 관리적 조치(내부관리계획 수립·시행, 정기적 직원 교육 등), 기술적 조치(개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치), 물리적 조치(전산실, 자료보관실 등의 접근통제).
          </p>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제10조 (개인정보 처리방침 변경)</h3>
          <p className="text-body text-text-sub leading-relaxed">
            이 개인정보처리방침은 2024년 1월 1일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </p>
        </section>

        <div className="pt-4 border-t border-divider">
          <p className="text-label text-text-sub">
            본 개인정보취급방침은 2024년 1월 1일부터 시행됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

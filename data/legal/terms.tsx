import React from 'react'

/**
 * 이용약관 콘텐츠 컴포넌트
 */
export function TermsContent() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-body text-text-main">
      <div className="space-y-4">
        <section>
          <h3 className="text-title font-semibold mb-3">제1조 (목적)</h3>
          <p className="text-body text-text-sub leading-relaxed">
            본 약관은 재미찾는개발자(이하 "회사")가 제공하는 MoguMogu 언어 학습 플랫폼의 JLPT 시험 대비 버전인 Mogu-JLPT 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제2조 (정의)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. "서비스"란 회사가 제공하는 일본어 학습 애플리케이션 및 관련 웹 서비스를 의미합니다.</p>
            <p>2. "이용자"란 본 약관에 동의하고 서비스를 이용하는 회원 및 비회원을 의미합니다.</p>
            <p>3. "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며 서비스를 계속적으로 이용할 수 있는 자를 의미합니다.</p>
            <p>4. "콘텐츠"란 서비스를 통해 제공되는 단어, 한자, 예문, 학습 자료 등을 의미합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제3조 (약관의 게시와 개정)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
            <p>2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>
            <p>3. 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기 화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제4조 (서비스의 제공 및 변경)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 회사는 다음과 같은 서비스를 제공합니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>일본어 단어 및 한자 학습 서비스</li>
              <li>학습 진도 관리 및 통계 서비스</li>
              <li>반복 학습 시스템(SRS) 기반 학습 서비스</li>
              <li>기타 회사가 추가 개발하거나 제휴계약 등을 통해 제공하는 일체의 서비스</li>
            </ul>
            <p>2. 회사는 서비스의 내용을 변경할 수 있으며, 변경 시에는 사전에 공지합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제5조 (서비스의 중단)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
            <p>2. 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제6조 (회원가입)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</p>
            <p>2. 회사는 제1항과 같이 회원가입을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
              <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
              <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제7조 (회원 정보의 변경)</h3>
          <p className="text-body text-text-sub leading-relaxed">
            회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다. 다만, 서비스 관리를 위해 필요한 실명, 아이디 등은 수정이 불가능합니다.
          </p>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제8조 (개인정보보호)</h3>
          <p className="text-body text-text-sub leading-relaxed">
            회사는 이용자의 개인정보 수집시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다. 회사는 회원가입시 구매계약이행에 필요한 정보를 미리 수집하지 않습니다. 회사의 개인정보보호에 관한 자세한 사항은 개인정보취급방침을 참고하시기 바랍니다.
          </p>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제9조 (회원의 의무)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 회원은 다음 행위를 하여서는 안 됩니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>신청 또는 변경시 허위내용의 등록</li>
              <li>타인의 정보 도용</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
              <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
              <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
              <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제10조 (유료서비스의 이용)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 회사는 유료서비스의 구체적인 내용을 서비스 화면에 게시합니다.</p>
            <p>2. 회사는 이용자가 구매한 유료서비스에 대하여 청약철회의 제한에 따르는 경우를 제외하고는 원칙적으로 구매일로부터 7일 이내에 청약철회를 할 수 있도록 합니다.</p>
            <p>3. 회사는 다음 각 호에 해당하는 경우에는 이용자의 청약철회를 제한할 수 있습니다:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>이용자에게 책임이 있는 사유로 재화 등이 멸실되거나 훼손된 경우</li>
              <li>이용자의 사용 또는 일부 소비로 재화 등의 가치가 현저히 감소한 경우</li>
              <li>시간의 경과에 의하여 재판매가 곤란할 정도로 재화 등의 가치가 현저히 감소한 경우</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제11조 (면책조항)</h3>
          <div className="text-body text-text-sub leading-relaxed space-y-2">
            <p>1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
            <p>2. 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</p>
            <p>3. 회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</p>
          </div>
        </section>

        <section>
          <h3 className="text-title font-semibold mb-3">제12조 (준거법 및 관할법원)</h3>
          <p className="text-body text-text-sub leading-relaxed">
            본 약관은 대한민국 법률에 따라 규율되고 해석됩니다. 회사와 이용자 간에 발생한 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.
          </p>
        </section>

        <div className="pt-4 border-t border-divider">
          <p className="text-label text-text-sub">
            본 약관은 2024년 1월 1일부터 시행됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

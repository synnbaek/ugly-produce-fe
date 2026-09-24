import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { store, api } from '@/lib/api';
import { won } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export default function FarmerResult() {
  const router = useRouter();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const r = store.aiResult;

  if (!r) {
    return (
      <div className="empty">
        먼저 로트를 등록해 주세요.
        <button className="btn ghost" onClick={() => router.push('/farmer/register')} style={{ marginLeft: '10px' }}>
          등록하러 가기
        </button>
      </div>
    );
  }

  const handleCreate = async () => {
    setCreating(true);
    await api.createListing(store.draft, store.aiResult);
    toast('공동구매가 열렸습니다. 모집이 시작됩니다.', 'sage');
    router.push('/farmer');
  };

  return (
    <>
      <button className="back" onClick={() => router.push('/farmer/register')}>← 입력 수정</button>
      <div className="split">
        <div>
          <div className="panel">
            <div className="eyebrow">Farmer · Step 2 · AI 서버 산정 결과</div>
            <h1 className="title" style={{ fontSize: '26px' }}>{r.crop} {r.qty}kg — <em>{r.recommended}kg</em>을 권장합니다</h1>

            <h3 style={{ marginTop: '22px' }}>① 정상품 시세 예측 <span className="badge outline">ML · LightGBM</span></h3>
            <div className="kv"><span className="lab">현재 도매 시세 (KAMIS)</span><span className="n">{r.forecast.base.toLocaleString()}원/kg</span></div>
            <div className="kv">
              <span className="lab">30일 후 예측</span>
              <span className="n">
                {r.forecast.d30.toLocaleString()}원{' '}
                <span style={{ color: 'var(--ink-soft)', fontWeight: 400 }}>(80% 구간 {r.forecast.lo.toLocaleString()}~{r.forecast.hi.toLocaleString()})</span>
              </span>
            </div>

            <h3 style={{ marginTop: '24px' }}>② 잔존가치 산정 <span className="badge outline">Rule Engine</span></h3>
            <div className="kv"><span className="lab">외관 계수 ({r.defect})</span><span className="n">× {r.appearance}</span></div>
            <div className="kv"><span className="lab">신선도 계수 ({r.daysAfterHarvest}일 경과)</span><span className="n">× {r.freshness}</span></div>
            <div className="kv"><span className="lab">추정 잔존가치</span><span className="n">{r.residual.toLocaleString()}원/kg</span></div>
            <div className="kv hi"><span className="lab">공동구매 단가 (할인율 {r.discount}% 적용)</span><span className="n">{r.price.toLocaleString()}원/kg</span></div>

            <h3 style={{ marginTop: '24px' }}>③ 손익분기 · 마진 <span className="badge outline">Rule Engine</span></h3>
            <div className="kv"><span className="lab">예상 매출 ({r.recommended}kg)</span><span className="n">{won(r.revenue)}</span></div>
            <div className="kv"><span className="lab">변동비 (포장 150 + 소분 100 원/kg)</span><span className="n">− {won(r.variable)}</span></div>
            <div className="kv"><span className="lab">플랫폼 수수료 (5%)</span><span className="n">− {won(r.fee)}</span></div>
            <div className="kv"><span className="lab">물류 고정비 (1톤 트럭 1회)</span><span className="n">− {won(r.fixed)}</span></div>
            <div className="kv hi"><span className="lab">예상 순이익</span><span className="n">{won(r.profit)} (마진율 {r.marginRate}%)</span></div>
            <div className="kv rust"><span className="lab">손익분기 물량 (BEP)</span><span className="n">{r.bep}kg</span></div>

            <div className="callout amber">
              <b>{r.bep}kg 이상만 모이면 손해가 아닙니다.</b> 목표 {r.recommended}kg는 1톤 트럭 적재 단위 안에서
              순이익이 최대가 되는 지점으로 계산되었습니다. 이 값이 트럭 단위를 넘으면 고정비가 2배로 뛰므로
              권장 물량을 일부러 낮춥니다.
            </div>
            <div className="btn-row">
              <button className="btn amber" onClick={handleCreate} disabled={creating}>
                {creating ? '등록 중...' : '이 조건으로 공동구매 열기'}
              </button>
              <button className="btn ghost" onClick={() => router.push('/farmer/register')}>조건 다시 입력</button>
            </div>
          </div>
        </div>

        <div className="sticky">
          <div className="panel">
            <h3>산정 요약</h3>
            <div className="kv"><span className="lab">권장 공동구매 물량</span><span className="n">{r.recommended}kg</span></div>
            <div className="kv"><span className="lab">권장 1인 구매량</span><span className="n">5kg</span></div>
            <div className="kv"><span className="lab">예상 참여자</span><span className="n">약 {r.participants}명</span></div>
            <div className="kv"><span className="lab">손익분기</span><span className="n" style={{ color: 'var(--rust)' }}>{r.bep}kg</span></div>
            <div className="callout">
              이 중 <b>ML로 학습한 것은 ①뿐</b>입니다. ②③은 결정론적 재무 공식(Rule Engine)이며,
              이를 구분해 표기하는 것이 설계상 더 정직합니다.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

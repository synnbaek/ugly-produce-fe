import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, Listing, CROP_CONFIG } from '@/lib/api';
import { ProgressBar } from '@/components/ProgressBar';
import { STATUS_BADGE, won } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { useProgressStream } from '@/lib/useProgressStream';

export default function ListingDetail() {
  const router = useRouter();
  const { id } = router.query;
  const listingId = typeof id === 'string' ? parseInt(id, 10) : null;
  const [listingData, setListingData] = useState<Listing | null>(null);
  const { toast } = useToast();
  const [selectedQty, setSelectedQty] = useState(5);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (listingId) {
      api.getListing(listingId).then(setListingData);
    }
  }, [listingId]);

  const streamListing = useProgressStream(listingId || 0);
  const l = streamListing || listingData;

  if (!l) return <div className="empty">상품을 찾을 수 없습니다.</div>;

  const cfg = CROP_CONFIG[l.crop];
  const payAmt = l.price * selectedQty;

  const handleJoin = async () => {
    setJoining(true);
    await api.join(l.id, selectedQty, { onToast: toast });
    toast(`${l.id} 접수됨 — 잔여 물량 검증 중입니다`, '');
    setTimeout(() => {
      router.push('/orders');
    }, 900);
  };

  return (
    <>
      <button className="back" onClick={() => router.push('/')}>← 목록으로</button>
      <div className="split">
        <div>
          <div className="panel">
            <div className="card-top">
              <div className="crop-mark" style={{ width: '56px', height: '56px', fontSize: '27px' }}>{cfg.emoji}</div>
              <div style={{ flex: 1 }}>
                <h1 className="title" style={{ fontSize: '26px', margin: '0 0 4px' }}>{l.region} {l.farmer} · {l.crop}</h1>
                <div className="card-meta">{l.defect} · {l.harvestDate} 수확 · 5kg 단위 참여</div>
              </div>
              <span dangerouslySetInnerHTML={{ __html: STATUS_BADGE[l.status] }} />
            </div>
            <div className="price-row" style={{ marginTop: '6px' }}>
              <span className="price" style={{ fontSize: '30px' }}>{l.price.toLocaleString()}</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>원/kg</span>
              <span className="price-was">{l.normal.toLocaleString()}원</span>
              <span className="price-off">{Math.round((1 - l.price / l.normal) * 100)}%↓</span>
            </div>
            <div>
              <ProgressBar listing={l} />
            </div>
            <div className="callout">
              <b>왜 못난이인가요?</b><br />
              「농산물 표준규격」 등급규격은 고르기 · 형태 · 크기 · 결점 등 <b>외관</b> 기준으로 특 · 상 · 보통을 나눕니다.
              이 상품은 <b>{l.defect}</b>으로 규격에 미달했을 뿐, 맛과 영양은 정상품과 동일합니다.
            </div>
          </div>

          <div className="panel">
            <h3>가격이 이렇게 산정되었습니다</h3>
            <div className="kv"><span className="lab">정상품 도매 시세 (KAMIS)</span><span className="n">{l.normal.toLocaleString()}원/kg</span></div>
            <div className="kv"><span className="lab">외관 계수 ({l.defect})</span><span className="n">× {cfg.defects[l.defect] ?? 0.7}</span></div>
            <div className="kv"><span className="lab">신선도 계수 (저장성 반영)</span><span className="n">× {(l.price / (l.normal * (cfg.defects[l.defect] ?? 0.7))).toFixed(2)}</span></div>
            <div className="kv hi"><span className="lab">공동구매 단가</span><span className="n">{l.price.toLocaleString()}원/kg</span></div>
            <div className="callout amber">
              가격 산정에 쓰인 시세 예측값은 <b>하루 1회 배치</b>로 미리 계산되어 캐시된 값입니다.
              사용자 요청마다 KAMIS API나 ML 모델을 직접 호출하지 않습니다 (ADR 04).
            </div>
          </div>

          <div className="panel">
            <h3>배송은 이렇게 진행됩니다</h3>
            <div className="timeline">
              <div className="tl-item"><div className="tl-dot amber"></div><div className="tl-body"><b>1. 공동구매 모집</b><span>목표 {l.target}kg · 손익분기 {l.bep}kg · 마감 {l.deadline}</span></div></div>
              <div className="tl-item"><div className="tl-dot wait"></div><div className="tl-body"><b>2. 농가 배송수락</b><span>실제 확정물량 기준으로 재계산된 결과를 농가가 최종 확인합니다</span></div></div>
              <div className="tl-item"><div className="tl-dot wait"></div><div className="tl-body"><b>3. 집하장 1회 출하 → 소분</b><span>농가는 개별 배송 없이 집하장까지 대량 화물 1건만 처리합니다</span></div></div>
              <div className="tl-item"><div className="tl-dot wait"></div><div className="tl-body"><b>4. 개별 배송 · 에스크로 정산</b><span>수령 확인 후 농가에게 정산됩니다</span></div></div>
            </div>
          </div>
        </div>

        <div className="sticky">
          <div className="panel">
            <h3>참여하기</h3>
            {l.status === 'OPEN' ? (
              <>
                <div className="field-label">구매 수량</div>
                <div className="chips">
                  {[5, 10, 15].map(q => (
                    <span
                      key={q}
                      className={`chip ${selectedQty === q ? 'sel' : ''}`}
                      onClick={() => setSelectedQty(q)}
                    >
                      {q}kg
                    </span>
                  ))}
                </div>
                <div className="kv hi"><span className="lab">결제 금액</span><span className="n">{won(payAmt)}</span></div>
                <div className="callout">🔒 결제금은 즉시 농가에게 가지 않고 <b>에스크로에 보관</b>됩니다. 목표 미달 시 전액 자동 환불됩니다.</div>
                <button
                  className="btn amber block"
                  onClick={handleJoin}
                  disabled={joining}
                >
                  {joining ? '접수 중...' : '에스크로 결제하고 참여하기'}
                </button>
                <div style={{ marginTop: '10px', fontSize: '11.5px', color: '#9a9182', lineHeight: 1.6 }}>
                  참여 요청은 즉시 DB에 쓰이지 않고 Kafka로 발행된 뒤 &lsquo;접수됨&rsquo;이 먼저 응답됩니다.
                  잔여 물량 검증은 파티션 내 순차 처리로 이루어집니다.
                </div>
              </>
            ) : (
              <>
                <div className={`callout ${l.status === 'FAILED' ? 'rust' : ''}`}>
                  {l.status === 'REACHED' ? '목표 물량에 도달하여 농가의 배송수락을 기다리는 중입니다.' :
                    l.status === 'ACCEPTED' ? '농가가 출하를 수락했습니다. 집하장 소분 후 순차 배송됩니다.' :
                      '손익분기 물량에 미달하여 무산되었습니다. 참여자 전원에게 자동 환불이 완료되었습니다.'}
                </div>
                <button className="btn ghost block" onClick={() => router.push('/')}>다른 공동구매 보기</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

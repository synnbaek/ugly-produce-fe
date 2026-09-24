import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, Listing, COST } from '@/lib/api';
import { ProgressBar } from '@/components/ProgressBar';
import { won } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export default function FarmerShipment() {
  const router = useRouter();
  const { id } = router.query;
  const listingId = typeof id === 'string' ? parseInt(id, 10) : null;
  const [l, setListing] = useState<Listing | null>(null);
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (listingId) {
      api.getListing(listingId).then(setListing);
    }
  }, [listingId]);

  if (!l) return <div className="empty">해당 공동구매를 찾을 수 없습니다.</div>;

  const q = l.joined;
  const revenue = l.price * q;
  const variable = (COST.packPerKg + COST.handlePerKg) * q;
  const fee = Math.round(revenue * COST.feeRate);
  const profit = revenue - variable - fee - COST.truckFixed;
  const marginRate = ((profit / revenue) * 100).toFixed(1);
  const done = l.status !== 'REACHED';

  const handleAccept = async () => {
    setProcessing(true);
    await api.acceptShipment(l.id);
    toast('출하를 수락했습니다. 집하장 배송 안내가 발송되었습니다.', 'sage');
    router.push('/farmer');
  };

  const handleReject = async () => {
    setProcessing(true);
    await api.rejectShipment(l.id, '수확량 부족');
    toast('거절 처리되었습니다. 참여자 전원 자동 환불이 실행됩니다.', 'rust');
    router.push('/farmer');
  };

  return (
    <>
      <button className="back" onClick={() => router.push('/farmer')}>← 대시보드</button>
      <div className="split">
        <div>
          <div className="panel">
            <div className="eyebrow">Farmer · 출하 확정</div>
            <h1 className="title" style={{ fontSize: '26px' }}>공동구매 성사 — <em>출하하시겠습니까?</em></h1>
            <div style={{ margin: '18px 0' }}>
              <ProgressBar listing={l} />
            </div>

            <h3>확정 물량 기준으로 다시 계산한 결과</h3>
            <div className="kv"><span className="lab">확정 물량</span><span className="n">{q}kg</span></div>
            <div className="kv"><span className="lab">확정 매출</span><span className="n">{won(revenue)}</span></div>
            <div className="kv"><span className="lab">변동비</span><span className="n">− {won(variable)}</span></div>
            <div className="kv"><span className="lab">플랫폼 수수료</span><span className="n">− {won(fee)}</span></div>
            <div className="kv"><span className="lab">물류 고정비</span><span className="n">− {won(COST.truckFixed)}</span></div>
            <div className="kv hi"><span className="lab">예상 순이익</span><span className="n">{won(profit)} (마진율 {marginRate}%)</span></div>
            <div className="kv"><span className="lab">손익분기 대비</span><span className="n" style={{ color: 'var(--sage)' }}>+{q - l.bep}kg 여유</span></div>

            <div className="callout amber">
              <b>목표치가 아니라 확정물량으로 재계산했습니다.</b> 물류 고정비는 같은 트럭 등급 안에서는 물량과 무관하게 동일하므로,
              확정물량이 적을수록 kg당 고정비 부담이 커져 마진율이 낮아집니다. 이 값을 보여주지 않으면 농가가 잘못된 기대치로 수락하게 됩니다.
            </div>

            {done ? (
              <div className={`callout ${l.status === 'FAILED' ? 'rust' : ''}`}>
                {l.status === 'ACCEPTED' ? '출하를 수락했습니다. 집하장 배송 안내가 발송되었습니다.' : '출하를 거절하여 참여자 전원에게 환불이 완료되었습니다.'}
              </div>
            ) : (
              <div className="btn-row">
                <button className="btn amber" onClick={handleAccept} disabled={processing}>출하 수락</button>
                <button className="btn ghost" onClick={handleReject} disabled={processing}>보류 · 거절</button>
              </div>
            )}
          </div>
        </div>
        <div className="sticky">
          <div className="panel">
            <h3>수락 후 진행</h3>
            <div className="timeline">
              <div className="tl-item"><div className={`tl-dot ${done && l.status === 'ACCEPTED' ? '' : 'wait'}`}></div><div className="tl-body"><b>에스크로 정산 개시</b><span>보관된 결제금이 정산 대기로 전환</span></div></div>
              <div className="tl-item"><div className="tl-dot wait"></div><div className="tl-body"><b>집하장 배송 안내</b><span>지정 집하장 주소 · 반입 마감시각 발송</span></div></div>
              <div className="tl-item"><div className="tl-dot wait"></div><div className="tl-body"><b>소분 후 개별 배송</b><span>주문 단위로 소분되어 소비자에게 발송</span></div></div>
            </div>
            <div className="callout rust">거절 시 참여자 전원 자동 환불 후 농가 신뢰도 점수가 하락하며, 반복 거절 시 등록이 제한됩니다.</div>
          </div>
        </div>
      </div>
    </>
  );
}

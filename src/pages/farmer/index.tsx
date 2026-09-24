import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, Listing, CROP_CONFIG } from '@/lib/api';
import { ProgressBar } from '@/components/ProgressBar';
import { STATUS_BADGE } from '@/lib/utils';
import { useRole } from '@/lib/RoleContext';

export default function FarmerDashboard() {
  const [mine, setMine] = useState<Listing[]>([]);
  const router = useRouter();
  const { setRole } = useRole();

  useEffect(() => {
    setRole('farmer');
    api.getListings().then(listings => {
      setMine(listings.filter(l => l.mine || l.id === 4 || l.id === 1));
    });
  }, []);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Farmer · 대시보드</div>
        <h1 className="title">내 공동구매</h1>
        <p>산지 선별 과정에서 이미 분리된 등외 로트를 <b>로트 단위로 1건</b>만 등록하면 됩니다. 개별 농산물을 하나씩 분류하지 않습니다.</p>
        <div className="btn-row">
          <button className="btn amber" onClick={() => router.push('/farmer/register')}>＋ 등외 로트 등록하기</button>
        </div>
      </div>
      <div className="grid">
        {mine.map(l => (
          <div key={l.id} className="card flat">
            <div className="card-top">
              <div className="crop-mark">{CROP_CONFIG[l.crop].emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="card-title">{l.crop} · {l.defect}</h3>
                <div className="card-meta">{l.harvestDate} 수확 · {l.price.toLocaleString()}원/kg</div>
              </div>
              <span dangerouslySetInnerHTML={{ __html: STATUS_BADGE[l.status] }} />
            </div>
            <ProgressBar listing={l} />
            <div className="btn-row">
              {l.status === 'REACHED' ? (
                <button className="btn amber" onClick={() => router.push(`/farmer/shipment/${l.id}`)}>배송수락 화면 열기</button>
              ) : (
                <button className="btn ghost" onClick={() => router.push(`/listings/${l.id}`)}>소비자 화면으로 보기</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

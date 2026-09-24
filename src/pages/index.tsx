import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, Listing, CROP_CONFIG } from '@/lib/api';
import { ProgressBar } from '@/components/ProgressBar';
import { STATUS_BADGE } from '@/lib/utils';
import { useRole } from '@/lib/RoleContext';

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const router = useRouter();
  const { setRole } = useRole();

  useEffect(() => {
    setRole('consumer');
    api.getListings().then(setListings);
  }, []);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Consumer · 공동구매 탐색</div>
        <h1 className="title">규격에 못 미쳤을 뿐,<br /><em>맛과 영양은 그대로</em></h1>
        <p>산지 선별 과정에서 이미 분리된 등외 농산물을 공동구매로 모아 집하장에서 한 번에 출하합니다. 목표 물량에 미달하면 전액 자동 환불됩니다.</p>
      </div>
      <div className="grid">
        {listings.map(l => (
          <div key={l.id} className="card" onClick={() => router.push(`/listings/${l.id}`)}>
            <div className="card-top">
              <div className="crop-mark">{CROP_CONFIG[l.crop].emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="card-title">{l.region} {l.farmer} · {l.crop}</h3>
                <div className="card-meta">{l.defect} · {l.harvestDate} 수확</div>
              </div>
              <span dangerouslySetInnerHTML={{ __html: STATUS_BADGE[l.status] }} />
            </div>
            <div className="price-row">
              <span className="price">{l.price.toLocaleString()}</span>
              <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>원/kg</span>
              <span className="price-was">{l.normal.toLocaleString()}원</span>
              <span className="price-off">{Math.round((1 - l.price / l.normal) * 100)}%↓</span>
            </div>
            <ProgressBar listing={l} />
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--ink-soft)' }}>
              마감 {l.deadline}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

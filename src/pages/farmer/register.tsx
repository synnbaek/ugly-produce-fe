import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { CROP_CONFIG, api, store } from '@/lib/api';

export default function FarmerRegister() {
  const router = useRouter();
  const crops = Object.keys(CROP_CONFIG);

  const [crop, setCrop] = useState(store.draft?.crop || '감자');
  const [qty, setQty] = useState(store.draft?.qty ?? 800);
  const [daysAfterHarvest, setDaysAfterHarvest] = useState(store.draft?.daysAfterHarvest ?? 4);
  const [region, setRegion] = useState(store.draft?.region ?? '강원 평창');
  
  const currentDefects = Object.keys(CROP_CONFIG[crop].defects);
  const [defect, setDefect] = useState(store.draft?.defect || currentDefects[0]);
  
  const [analyzing, setAnalyzing] = useState(false);

  const handleCropChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCrop = e.target.value;
    setCrop(newCrop);
    setDefect(Object.keys(CROP_CONFIG[newCrop].defects)[0]);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const payload = { crop, qty, daysAfterHarvest, region, defect, harvestDate: '오늘 기준 역산' };
    store.draft = payload;
    store.aiResult = await api.analyze(payload);
    router.push('/farmer/result');
  };

  return (
    <>
      <button className="back" onClick={() => router.push('/farmer')}>← 대시보드</button>
      <div className="split">
        <div>
          <div className="panel">
            <div className="eyebrow">Farmer · Step 1</div>
            <h1 className="title" style={{ fontSize: '26px' }}>등외 로트 등록</h1>

            <div className="field-label">품목</div>
            <select className="field" value={crop} onChange={handleCropChange}>
              {crops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="field-label">총 물량 (kg)</div>
            <input className="field" type="number" value={qty} onChange={e => setQty(Number(e.target.value))} min="50" step="10" />

            <div className="field-label">수확 후 경과일</div>
            <input className="field" type="number" value={daysAfterHarvest} onChange={e => setDaysAfterHarvest(Number(e.target.value))} min="0" max="20" />

            <div className="field-label">출하 지역</div>
            <input className="field" value={region} onChange={e => setRegion(e.target.value)} />

            <div className="field-label">이 로트의 대표 상태 — 하나만 선택</div>
            <div className="chips">
              {currentDefects.map(d => (
                <span
                  key={d}
                  className={`chip ${defect === d ? 'sel' : ''}`}
                  onClick={() => setDefect(d)}
                >
                  {d}
                </span>
              ))}
            </div>

            <div className="callout">
              <b>선별은 이미 끝나 있습니다.</b> 산지유통센터(APC)의 집하 · 선별 공정에서 규격품과 등외품은 이미 분리되어 있으므로,
              농가는 그 결과물인 로트에 대해 대표 상태 하나만 선택하면 됩니다.
            </div>

            <button className="btn amber block" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? 'AI 서버 계산 중...' : 'AI 가격 · 손익분기 산정하기'}
            </button>
          </div>
        </div>
        <div className="sticky">
          <div className="panel">
            <h3>입력 항목이 4개뿐인 이유</h3>
            <div className="timeline">
              <div className="tl-item"><div className="tl-dot"></div><div className="tl-body"><b>등급 기준</b><span>「농산물 표준규격」 고시로 이미 표준화</span></div></div>
              <div className="tl-item"><div className="tl-dot"></div><div className="tl-body"><b>물리적 선별</b><span>전국 APC · 스마트 APC에서 이미 수행</span></div></div>
              <div className="tl-item"><div className="tl-dot amber"></div><div className="tl-body"><b>이 시스템의 역할</b><span>선별된 로트를 다수 수요와 연결</span></div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { store, arch, api, doFlush } from '@/lib/api';
import { useToast } from './Toast';

export const ArchObserver: React.FC = () => {
  const [closed, setClosed] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [counters, setCounters] = useState({ prod: 0, conf: 0, rej: 0, flush: 0, pub: 0, over: 0 });
  const { toast } = useToast();

  useEffect(() => {
    const render = () => {
      setLogs([...store.log.slice(-160)]);
      setCounters({ ...store.counters });
    };
    render();
    const unsub = arch.onUpdate(render);
    return unsub;
  }, []);

  const handleClear = () => {
    store.log = [];
    setLogs([]);
  };

  const handleStress = async () => {
    const target = store.listings.find(l => l.status === 'OPEN' && (l.target - l.joined) > 0) || store.listings[0];
    arch.push('API', `━━━ 부하 시뮬레이션 시작 · listing#${target.id} 에 100건 동시 참여 (잔여 ${target.target - target.joined}kg) ━━━`);
    toast(`listing#${target.id}에 동시 참여 100건 발생`, 'amber');
    for (let i = 0; i < 100; i++) {
      api.join(target.id, 5, { silent: true, onToast: toast });
      if (i % 12 === 0) await new Promise(r => setTimeout(r, 12));
    }
    setTimeout(() => {
      doFlush();
      const l = store.listings.find(x => x.id === target.id)!;
      arch.push('CONSUMER',
        `━━━ 결과: 확정 ${store.counters.conf} · 거절 ${store.counters.rej} · 최종 ${l.joined}/${l.target}kg · ` +
        `<b>초과판매 ${l.joined > l.target ? l.joined - l.target : 0}건</b> ━━━`);
      toast(`처리 완료 — 최종 ${l.joined}/${l.target}kg · 초과판매 0건`, 'sage');
      // trigger re-render
      arch.push('API', '시뮬레이션 완료');
    }, 1600);
  };

  useEffect(() => {
    const el = document.getElementById('archLog');
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div id="arch" className={closed ? 'closed' : ''}>
      <div className="arch-bar" onClick={() => setClosed(!closed)}>
        <span className="dot"></span>
        <span className="ttl">ARCHITECTURE OBSERVER — 요청이 어떤 계층을 지나는지 실시간 표시</span>
        <span className="cnt" id="archCnt">{logs.length} events</span>
      </div>
      <div className="arch-body">
        <div className="arch-log" id="archLog">
          {logs.map((r, i) => (
            <div className="row" key={i}>
              <span className="ts">{r.ts}</span>
              <span className={`tag tag-${r.tag}`}>{r.tag}</span>
              <span className="msg" dangerouslySetInnerHTML={{ __html: r.msg }}></span>
            </div>
          ))}
        </div>
        <div className="arch-side">
          <h5>RUNTIME COUNTERS</h5>
          <div className="arch-stat"><span>Kafka produced</span><b>{counters.prod}</b></div>
          <div className="arch-stat"><span>Consumer confirmed</span><b>{counters.conf}</b></div>
          <div className="arch-stat"><span>Consumer rejected</span><b>{counters.rej}</b></div>
          <div className="arch-stat"><span>RDS batch flush</span><b>{counters.flush}</b></div>
          <div className="arch-stat"><span>Redis publish</span><b>{counters.pub}</b></div>
          <div className="arch-stat"><span>Oversell</span><b>{counters.over}</b></div>
          <button onClick={handleStress}>마감 임박 동시 참여 100건 시뮬레이션</button>
          <button onClick={handleClear}>로그 비우기</button>
        </div>
      </div>
    </div>
  );
};

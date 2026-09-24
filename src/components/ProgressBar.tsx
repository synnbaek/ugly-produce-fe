import React from 'react';
import { Listing } from '@/lib/api';
import { pct } from '@/lib/utils';

export const ProgressBar: React.FC<{ listing: Listing }> = ({ listing: l }) => {
  const p = pct(l.joined, l.target);
  const bepPos = Math.min(100, (l.bep / l.target) * 100);

  return (
    <>
      <div className="bar-outer">
        <div className={`bar-inner ${l.joined >= l.target ? 'done' : ''}`} style={{ width: `${p}%` }}></div>
        <div className="bar-bep" style={{ left: `${bepPos}%` }} title={`손익분기 ${l.bep}kg`}></div>
      </div>
      <div className="bar-legend">
        <span className="mono">{l.joined} / {l.target}kg</span>
        <span>
          {p}% · 손익분기 {l.bep}kg{' '}
          {l.joined >= l.bep ? (
            <span className="badge">충족</span>
          ) : (
            <span className="badge gray">미달</span>
          )}
        </span>
      </div>
    </>
  );
};

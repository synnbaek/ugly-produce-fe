import React, { useEffect, useState } from 'react';
import { api, store, bus, Order } from '@/lib/api';
import { ORDER_BADGE, won } from '@/lib/utils';
import { useRole } from '@/lib/RoleContext';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { setRole } = useRole();

  useEffect(() => {
    setRole('consumer');
    setOrders([...store.orders]);

    const unsubs = store.orders.map(o =>
      bus.on('order:' + o.id, (ord: Order) => {
        setOrders(prev => prev.map(p => p.id === ord.id ? { ...ord } : p));
      })
    );
    // Also listen for new orders
    const unsubNew = bus.on('order:new', () => {
       setOrders([...store.orders]);
    });

    return () => {
      unsubs.forEach(f => f());
      unsubNew();
    };
  }, [setRole]);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Consumer · 내 참여 내역</div>
        <h1 className="title">참여 내역</h1>
        <p>참여 직후에는 <b>접수됨(PENDING)</b> 상태로 표시되고, Kafka Consumer가 잔여 물량을 검증한 뒤 확정 또는 환불로 바뀝니다.</p>
      </div>
      <div className="panel">
        {orders.length ? (
          <table className="t">
            <thead>
              <tr><th>주문번호</th><th>상품</th><th>수량</th><th>결제금액</th><th>상태</th></tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const l = store.listings.find(x => x.id === o.listingId);
                return (
                  <tr key={o.id}>
                    <td className="mono">{o.id}</td>
                    <td>{l ? `${l.region} ${l.farmer} · ${l.crop}` : '-'}</td>
                    <td className="mono">{o.qty}kg</td>
                    <td className="mono">{won(o.amount)}</td>
                    <td dangerouslySetInnerHTML={{ __html: ORDER_BADGE[o.status] }} />
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty">아직 참여한 공동구매가 없습니다.</div>
        )}
      </div>
    </>
  );
}

export const CROP_CONFIG: Record<string, any> = {
  감자: { emoji: '🥔', kamis: 3000, unit: 'kg', decay: 0.02, defects: { '크기 미달': 0.80, '표면 흠집': 0.70, '형태 불량': 0.60 } },
  양파: { emoji: '🧅', kamis: 1800, unit: 'kg', decay: 0.02, defects: { '크기 미달': 0.85, '표면 흠집': 0.75 } },
  배추: { emoji: '🥬', kamis: 1500, unit: 'kg', decay: 0.06, defects: { '겉잎 손상': 0.75, '형태 불량': 0.65 } },
  당근: { emoji: '🥕', kamis: 2200, unit: 'kg', decay: 0.04, defects: { '곡선 형태': 0.80, '표면 흠집': 0.75 } },
};

export const COST = { truckFixed: 150000, packPerKg: 150, handlePerKg: 100, feeRate: 0.05, truckCapacity: 1000 };

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'REFUNDED';
export type ListingStatus = 'OPEN' | 'REACHED' | 'ACCEPTED' | 'FAILED';

export interface Listing {
  id: number;
  crop: string;
  farmer: string;
  region: string;
  defect: string;
  harvestDate: string;
  price: number;
  normal: number;
  target: number;
  joined: number;
  bep: number;
  deadline: string;
  status: ListingStatus;
  step: number;
  mine?: boolean;
  unit?: string;
}

export interface Order {
  id: string;
  listingId: number;
  qty: number;
  amount: number;
  status: OrderStatus;
  at: string;
}

export const store = {
  role: 'consumer' as 'consumer' | 'farmer',
  listings: [
    { id: 1, crop: '감자', farmer: '박○○', region: '강원 평창', defect: '표면 흠집', harvestDate: '8월 26일', price: 1932, normal: 3000, target: 550, joined: 412, bep: 95, deadline: 'D-2', status: 'OPEN', step: 5 },
    { id: 2, crop: '양파', farmer: '김○○', region: '전남 무안', defect: '크기 미달', harvestDate: '9월 2일', price: 1215, normal: 1800, target: 700, joined: 672, bep: 168, deadline: 'D-1', status: 'OPEN', step: 5 },
    { id: 3, crop: '배추', farmer: '이○○', region: '전남 해남', defect: '겉잎 손상', harvestDate: '9월 8일', price: 1012, normal: 1500, target: 400, joined: 118, bep: 224, deadline: 'D-5', status: 'OPEN', step: 10 },
    { id: 4, crop: '당근', farmer: '최○○', region: '제주 구좌', defect: '곡선 형태', harvestDate: '8월 30일', price: 1584, normal: 2200, target: 600, joined: 600, bep: 118, deadline: '마감', status: 'REACHED', step: 5 },
    { id: 5, crop: '감자', farmer: '정○○', region: '경북 상주', defect: '형태 불량', harvestDate: '8월 20일', price: 1656, normal: 3000, target: 500, joined: 41, bep: 112, deadline: '종료', status: 'FAILED', step: 5 },
  ] as Listing[],
  orders: [
    { id: 'ORD-1042', listingId: 4, qty: 5, amount: 7920, status: 'CONFIRMED', at: '9월 14일' }
  ] as Order[],
  draft: null as any,
  aiResult: null as any,
  counters: { prod: 0, conf: 0, rej: 0, flush: 0, pub: 0, over: 0 },
  log: [] as any[],
};

let orderSeq = 1042;
export const nextOrderId = () => `ORD-${++orderSeq}`;

export const arch = {
  listeners: [] as (() => void)[],
  onUpdate(fn: () => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(f => f !== fn); };
  },
  push(tag: string, msg: string) {
    const t = new Date();
    const ts = `${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}.${String(t.getMilliseconds()).padStart(3, '0')}`;
    store.log.push({ ts, tag, msg });
    if (store.log.length > 400) store.log.shift();
    this.listeners.forEach(f => f());
  }
};

export const bus = {
  subs: {} as Record<string, ((payload: any) => void)[]>,
  on(topic: string, fn: (payload: any) => void) {
    (this.subs[topic] ||= []).push(fn);
    return () => { this.subs[topic] = this.subs[topic].filter(f => f !== fn); };
  },
  emit(topic: string, payload: any) {
    (this.subs[topic] || []).forEach(f => f(payload));
  }
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const flushBuffer = { items: [] as Order[], timer: null as any };
function bufferWrite(order: Order) {
  flushBuffer.items.push(order);
  if (flushBuffer.items.length >= 5) return doFlush();
  if (!flushBuffer.timer) flushBuffer.timer = setTimeout(doFlush, 500);
}
export function doFlush() {
  clearTimeout(flushBuffer.timer); flushBuffer.timer = null;
  const n = flushBuffer.items.length;
  if (!n) return;
  flushBuffer.items = [];
  store.counters.flush++;
  arch.push('RDS', `batch flush — INSERT INTO orders (${n} rows) · 단건 쓰기 대비 ${n}회 트랜잭션 절감`);
}

export function calcAI({ crop, qty, defect, daysAfterHarvest }: any) {
  const cfg = CROP_CONFIG[crop];
  const appearance = cfg.defects[defect];
  const freshness = Math.max(0.60, 1 - cfg.decay * daysAfterHarvest);
  const residual = Math.round(cfg.kamis * appearance * freshness);

  let discount = 1 - appearance * freshness;
  discount = Math.min(0.40, Math.max(0.10, discount));
  const price = Math.round(cfg.kamis * (1 - discount) / 1);

  const margin = price - COST.packPerKg - COST.handlePerKg - price * COST.feeRate;
  const bep = Math.ceil(COST.truckFixed / margin);

  const demand = Math.round(qty * 0.7 / 10) * 10;
  let recommended = Math.min(demand, COST.truckCapacity - 50);
  recommended = Math.max(recommended, bep + 20);

  const revenue = price * recommended;
  const variable = (COST.packPerKg + COST.handlePerKg) * recommended;
  const fee = Math.round(revenue * COST.feeRate);
  const profit = revenue - variable - fee - COST.truckFixed;

  return {
    crop, qty, defect, daysAfterHarvest,
    normal: cfg.kamis, appearance, freshness: +freshness.toFixed(2), residual,
    discount: +(discount * 100).toFixed(1), price, bep, recommended,
    revenue, variable, fee, fixed: COST.truckFixed, profit,
    marginRate: +((profit / revenue) * 100).toFixed(1),
    forecast: { base: cfg.kamis, d30: Math.round(cfg.kamis * 1.06), lo: Math.round(cfg.kamis * 0.97), hi: Math.round(cfg.kamis * 1.15) },
    participants: Math.ceil(recommended / 5)
  };
}

export const api = {
  async getListings() {
    arch.push('API', 'GET /api/listings → RDS Read Replica 라우팅');
    await sleep(120);
    return JSON.parse(JSON.stringify(store.listings)) as Listing[];
  },
  async getListing(id: number) {
    arch.push('API', `GET /api/listings/${id} → Read Replica`);
    await sleep(90);
    return JSON.parse(JSON.stringify(store.listings.find(l => l.id === id) || null)) as Listing;
  },

  async join(listingId: number, qty: number, opts: { silent?: boolean; onToast?: (msg: string, kind: string) => void } = {}) {
    const silent = opts.silent;
    const oid = nextOrderId();
    if (!silent) arch.push('ALB', `POST /api/listings/${listingId}/orders → 백엔드 ASG 인스턴스 #${1 + Math.floor(Math.random() * 3)}`);
    arch.push('API', `${oid} 접수 — DB 갱신 없이 Kafka produce`);
    store.counters.prod++;
    arch.push('KAFKA', `order-events / partition P${listingId % 3} · key=listingId:${listingId} · offset ${store.counters.prod}`);

    const listing = store.listings.find(l => l.id === listingId)!;
    const order: Order = { id: oid, listingId, qty, amount: listing.price * qty, status: 'PENDING', at: '방금' };
    store.orders.unshift(order);
    bus.emit('order:' + oid, order);

    (async () => {
      await sleep(silent ? 40 + Math.random() * 60 : 700 + Math.random() * 500);
      const remain = listing.target - listing.joined;
      if (qty <= remain) {
        listing.joined += qty;
        order.status = 'CONFIRMED';
        store.counters.conf++;
        arch.push('CONSUMER', `${oid} 잔여 ${remain}${listing.unit || 'kg'} 검증 → <b>CONFIRMED</b> (파티션 내 순차 처리)`);
        bufferWrite(order);
        store.counters.pub++;
        arch.push('REDIS', `PUBLISH progress:${listingId} {joined:${listing.joined}}`);
        arch.push('WS', `전 인스턴스 구독자에게 push → 진행률 ${listing.joined}/${listing.target}`);
        if (listing.joined >= listing.target && listing.status === 'OPEN') {
          listing.status = 'REACHED';
          arch.push('CONSUMER', `listing#${listingId} 목표 도달 → 상태 OPEN → REACHED (State Machine)`);
          arch.push('WS', `농가에게 '출하 확정 요청' 알림 push`);
          if (!silent && opts.onToast) opts.onToast(`공동구매 목표 도달! 농가 배송수락 대기 중`, 'sage');
        }
      } else {
        order.status = 'REJECTED';
        store.counters.rej++;
        arch.push('CONSUMER', `${oid} 잔여 ${remain}${listing.unit || 'kg'} < 요청 ${qty} → <b>REJECTED</b> · 초과판매 차단`);
        if (!silent && opts.onToast) opts.onToast('잔여 물량 부족으로 참여가 취소되었습니다. 전액 환불됩니다.', 'rust');
      }
      if (listing.joined > listing.target) store.counters.over++;
      bus.emit('order:' + oid, order);
      bus.emit('progress:' + listingId, listing);
      arch.listeners.forEach(f => f());
    })();

    return order;
  },

  async analyze(payload: any) {
    arch.push('API', `POST /api/farmer/listings/analyze → AI 서버(FastAPI) 호출`);
    await sleep(500);
    arch.push('AI', `가격예측 ML — 캐시 테이블 HIT (일 1회 배치 결과, KAMIS 직접 호출 없음)`);
    await sleep(300);
    arch.push('AI', `Rule Engine — 잔존가치 · 가격범위 · BEP · 권장물량 실시간 계산`);
    return calcAI(payload);
  },

  async createListing(payload: any, ai: any) {
    arch.push('API', `POST /api/farmer/listings → RDS Primary INSERT (트랜잭션)`);
    await sleep(350);
    const id = Math.max(...store.listings.map(l => l.id)) + 1;
    store.listings.unshift({
      id, crop: payload.crop, farmer: '나(테스트 농가)', region: payload.region, defect: payload.defect,
      harvestDate: payload.harvestDate, price: ai.price, normal: ai.normal,
      target: ai.recommended, joined: 0, bep: ai.bep, deadline: 'D-7', status: 'OPEN', step: 5, mine: true
    });
    arch.push('REDIS', `SET listing:${id}:progress 0 (캐시 워밍)`);
    return id;
  },

  async acceptShipment(id: number) {
    arch.push('API', `POST /api/farmer/listings/${id}/accept`);
    await sleep(400);
    const l = store.listings.find(x => x.id === id)!;
    l.status = 'ACCEPTED';
    arch.push('CONSUMER', `State Machine: REACHED → ACCEPTED · 에스크로 해제 트리거`);
    arch.push('RDS', `UPDATE settlements SET status='SETTLED' WHERE listing_id=${id}`);
    arch.push('WS', `참여자 전원에게 '농가 출하 수락' 알림 push`);
    return l;
  },

  async rejectShipment(id: number, reason: string) {
    arch.push('API', `POST /api/farmer/listings/${id}/reject {reason:"${reason}"}`);
    await sleep(400);
    const l = store.listings.find(x => x.id === id)!;
    l.status = 'FAILED';
    store.orders.filter(o => o.listingId === id && o.status === 'CONFIRMED').forEach(o => o.status = 'REFUNDED');
    arch.push('CONSUMER', `State Machine: REACHED → FAILED · 참여자 전원 자동 환불 이벤트 발행`);
    arch.push('WS', `참여자 전원에게 환불 완료 알림 push`);
    return l;
  }
};

import { Listing, Order } from './api';

export const won = (n: number) => n.toLocaleString('ko-KR') + '원';
export const pct = (a: number, b: number) => Math.min(100, Math.round((a / b) * 100));

export const STATUS_BADGE: Record<string, string> = {
  OPEN: '<span class="badge amber">모집중</span>',
  REACHED: '<span class="badge ink">배송수락 대기</span>',
  ACCEPTED: '<span class="badge">출하 확정</span>',
  FAILED: '<span class="badge rust">무산 · 환불</span>',
};

export const ORDER_BADGE: Record<string, string> = {
  PENDING: '<span class="badge gray">접수됨 (처리중)</span>',
  CONFIRMED: '<span class="badge">확정 · 에스크로 보관</span>',
  REJECTED: '<span class="badge rust">잔여부족 · 환불</span>',
  REFUNDED: '<span class="badge rust">무산 · 환불완료</span>',
};

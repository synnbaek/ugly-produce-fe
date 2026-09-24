import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRole } from '@/lib/RoleContext';

const NAV = {
  consumer: [
    ['/', '공동구매 탐색'],
    ['/orders', '내 참여 내역']
  ],
  farmer: [
    ['/farmer', '내 공동구매'],
    ['/farmer/register', '로트 등록']
  ],
};

export const Topbar: React.FC = () => {
  const { role, setRole } = useRole();
  const router = useRouter();

  const handleSwitchRole = () => {
    const newRole = role === 'consumer' ? 'farmer' : 'consumer';
    setRole(newRole);
    router.push(newRole === 'consumer' ? '/' : '/farmer');
  };

  const navItems = NAV[role];

  return (
    <div className="topbar">
      <div className="topbar-in">
        <Link href={role === 'consumer' ? '/' : '/farmer'} className="brand">
          <div className="brand-mark">🥔</div>
          <div>
            <div className="brand-txt">못난이살리기</div>
            <div className="brand-sub">GROUP BUY PLATFORM</div>
          </div>
        </Link>
        <nav className="nav">
          {navItems.map(([href, text]) => (
            <Link key={href} href={href}>
              <button className={router.pathname === href ? 'on' : ''}>
                {text}
              </button>
            </Link>
          ))}
          <button className="role-pill" onClick={handleSwitchRole}>
            {role === 'consumer' ? '🌾 농가 화면으로' : '🛒 소비자 화면으로'}
          </button>
        </nav>
      </div>
    </div>
  );
};

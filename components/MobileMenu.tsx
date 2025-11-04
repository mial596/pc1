import React from 'react';
import { UserProfile } from '../types';

type Page = 'home' | 'album' | 'shop' | 'games' | 'community' | 'admin';

interface MobileMenuProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  userProfile: UserProfile;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-16 transition-all duration-200 ease-in-out relative ${isActive ? 'text-primary' : 'text-ink/60 hover:text-primary'}`}
  >
    <div className={`text-3xl mb-1 transition-transform ${isActive ? 'transform scale-110' : ''}`}>{icon}</div>
    <span className="text-xs font-bold">{label}</span>
    {isActive && <div className="absolute bottom-1 w-2 h-2 bg-primary rounded-full"></div>}
  </button>
);

const MobileMenu: React.FC<MobileMenuProps> = ({ activePage, onNavigate, userProfile }) => {
  const { role, data } = userProfile;
  const isAdmin = role === 'admin';
  
  const communityIcon = (
      <div className="relative">
        <span>👥</span>
        {(data.tradeNotifications > 0 || data.friendRequestsReceived.length > 0) && (
            <span className="absolute -top-1 -right-2 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-surface">
                {data.tradeNotifications + data.friendRequestsReceived.length}
            </span>
        )}
    </div>
  );

  const navItems = [
    { page: 'home', label: 'Home', icon: '🏠' },
    { page: 'album', label: 'Álbum', icon: '🖼️' },
    { page: 'shop', label: 'Tienda', icon: '🛍️' },
    { page: 'games', label: 'Juegos', icon: '🎮' },
    { page: 'community', label: 'Comunidad', icon: communityIcon },
    ...(isAdmin ? [{ page: 'admin' as Page, label: 'Admin', icon: '👑' }] : [])
  ];

  return (
    <nav className="mobile-menu-solid lg:hidden fixed bottom-0 left-0 right-0 h-20 z-40">
      <div className="flex justify-around items-center h-full">
        {navItems.map(item => (
          <NavItem
            key={item.page}
            icon={item.icon}
            label={item.label}
            isActive={activePage === item.page}
            onClick={() => onNavigate(item.page as Page)}
          />
        ))}
      </div>
    </nav>
  );
};

export default MobileMenu;
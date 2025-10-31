import React from 'react';
import { HomeIcon, CatSilhouetteIcon, StoreIcon, BrainIcon, BookIcon, UsersIcon, AdminIcon } from '../hooks/Icons';
import { UserProfile } from '../types';

type Page = 'home' | 'album' | 'shop' | 'games' | 'phrases' | 'community' | 'admin';

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
    className={`flex flex-col items-center justify-center w-full h-16 transition-all duration-200 ease-in-out ${isActive ? 'text-primary' : 'text-ink/60 hover:text-primary'}`}
  >
    <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
      <div className="w-7 h-7">{icon}</div>
    </div>
    <span className="text-xs font-bold">{label}</span>
  </button>
);

const MobileMenu: React.FC<MobileMenuProps> = ({ activePage, onNavigate, userProfile }) => {
  const { role, data } = userProfile;
  const isAdmin = role === 'admin';
  
  const communityIcon = (
      <div className="relative">
        <UsersIcon />
        {data.tradeNotifications > 0 && (
            <span className="absolute -top-1 -right-2 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-surface">
                {data.tradeNotifications}
            </span>
        )}
    </div>
  );

  const navItems = [
    { page: 'home', label: 'Home', icon: <HomeIcon /> },
    { page: 'album', label: 'Álbum', icon: <CatSilhouetteIcon /> },
    { page: 'games', label: 'Juegos', icon: <BrainIcon /> },
    { page: 'community', label: 'Comunidad', icon: communityIcon },
    ...(isAdmin ? [{ page: 'admin' as Page, label: 'Admin', icon: <AdminIcon /> }] : [])
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

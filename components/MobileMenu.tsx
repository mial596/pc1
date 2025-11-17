import React, { useState } from 'react';
import { UserProfile } from '../types';
import { HomeIcon, BookIcon, StoreIcon, GamepadIcon, UsersIcon, AdminIcon, LogoutIcon, EditIcon, GiftCodeIcon, CatSilhouetteIcon, LeafCoinIcon } from '../hooks/Icons';
import { useLanguage } from '../contexts/LanguageContext';

type Page = 'home' | 'album' | 'shop' | 'games' | 'community' | 'admin';

interface MobileMenuProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  userProfile: UserProfile;
  onOpenProfile: () => void;
  onOpenTransactions: () => void;
  onOpenRedeemCode: () => void;
  onLogout: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ease-in-out relative pt-2 ${isActive ? 'text-primary' : 'text-ink/60 hover:text-ink'}`}
  >
    {isActive && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-paper border-3 border-b-0 border-ink rounded-t-lg"></div>
    )}
    <div className="relative transform transition-transform duration-200 ease-in-out" style={{ transform: isActive ? 'scale(1.1) translateY(-4px)' : 'scale(1)' }}>
      {icon}
    </div>
    <span className="text-xs font-black mt-1 font-display tracking-wider">{label}</span>
  </button>
);

const MobileMenu: React.FC<MobileMenuProps> = ({ activePage, onNavigate, userProfile, onOpenProfile, onOpenTransactions, onOpenRedeemCode, onLogout }) => {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { role, data } = userProfile;
  const isAdmin = role === 'admin';
  
  const notificationCount = (data.tradeNotifications || 0) + (data.friendRequestsReceived?.length || 0);

  const communityIcon = (
    <div className="relative">
      <UsersIcon className="w-8 h-8" />
      {notificationCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-danger text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-paper">
              {notificationCount}
          </span>
      )}
    </div>
  );

  const navItems = [
    { page: 'home', label: t('navHome'), icon: <HomeIcon className="w-8 h-8" /> },
    { page: 'album', label: t('navAlbum'), icon: <BookIcon className="w-8 h-8" /> },
    { page: 'shop', label: t('navShop'), icon: <StoreIcon className="w-8 h-8" /> },
    { page: 'games', label: t('navGames'), icon: <GamepadIcon className="w-8 h-8" /> },
    { page: 'community', label: t('navCommunity'), icon: communityIcon },
    ...(isAdmin ? [{ page: 'admin' as Page, label: 'Admin', icon: <AdminIcon className="w-8 h-8" /> }] : [])
  ];

  return (
    <nav 
        className="fixed bottom-0 left-0 right-0 h-24 bg-paper border-t-4 border-ink"
    >
      <div className="absolute -top-12 right-4">
            <div className="relative">
                <button onClick={() => setProfileMenuOpen(!isProfileMenuOpen)} className="w-20 h-20 rounded-full bg-surface border-3 border-ink shadow-[4px_4px_0_0_var(--c-ink)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                  {userProfile.profilePictureUrl ? (
                    <img src={userProfile.profilePictureUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <CatSilhouetteIcon className="w-12 h-12 text-ink/70" />
                  )}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-3 w-56 bg-surface rounded-xl shadow-lg border-3 border-ink animate-popIn">
                    <div className="p-2 space-y-1">
                        <button onClick={() => { onOpenProfile(); setProfileMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-darker font-bold text-left font-hand text-lg">
                            <EditIcon className="w-5 h-5"/> {t('editProfile')}
                        </button>
                        <button onClick={() => { onOpenRedeemCode(); setProfileMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-darker font-bold text-left font-hand text-lg">
                            <GiftCodeIcon className="w-5 h-5"/> {t('redeemCode')}
                        </button>
                         <button onClick={() => { onOpenTransactions(); setProfileMenuOpen(false); }} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-darker font-bold text-left font-hand text-lg">
                            <LeafCoinIcon className="w-5 h-5"/> {t('history')}
                        </button>
                        <div className="border-t-2 border-dashed border-ink/20 my-1"></div>
                        <button onClick={onLogout} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-surface-darker font-bold text-left text-danger font-hand text-lg">
                            <LogoutIcon className="w-5 h-5"/> {t('logout')}
                        </button>
                    </div>
                  </div>
                )}
            </div>
      </div>
      <div className="grid grid-cols-5 items-center h-full max-w-xl mx-auto">
        {navItems.map(item => item.page !== 'admin' && (
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
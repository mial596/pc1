import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { UserProfile } from '../types';
import { CoinIcon, StarIcon, StoreIcon, UsersIcon, BookIcon, HomeIcon, LogoutIcon, EditIcon, CatSilhouetteIcon, AdminIcon } from './Icons';
import { LOGO_URL } from '../constants';

type Page = 'home' | 'album' | 'shop' | 'games' | 'phrases' | 'community' | 'admin';

interface HeaderProps {
  userProfile: UserProfile;
  onNavigate: (page: Page) => void;
  onOpenProfile: () => void;
  activePage: Page;
}

const NavLink: React.FC<{
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md font-bold transition-colors ${isActive ? 'bg-primary text-white' : 'hover:bg-ink/10'}`}
  >
    {children}
  </button>
);

const Header: React.FC<HeaderProps> = ({ userProfile, onNavigate, onOpenProfile, activePage }) => {
  const { logout } = useAuth0();
  const { playerStats, coins } = userProfile.data;
  const xpPercentage = (playerStats.xp / playerStats.xpToNextLevel) * 100;

  return (
    <header className="fixed top-0 left-0 right-0 bg-surface/90 backdrop-blur-sm border-b-2 border-primary z-40">
      <div className="container mx-auto px-4 h-20 flex justify-between items-center">
        {/* Left Side: Logo & Nav */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="PictoCat Logo" className="w-12 h-12" />
            <span className="text-2xl font-black text-ink hidden sm:block">PictoCat</span>
          </div>
          <nav className="hidden lg:flex items-center gap-2">
            <NavLink onClick={() => onNavigate('home')} isActive={activePage === 'home'}>Home</NavLink>
            <NavLink onClick={() => onNavigate('album')} isActive={activePage === 'album'}>Álbum</NavLink>
            <NavLink onClick={() => onNavigate('phrases')} isActive={activePage === 'phrases'}>Frases</NavLink>
            <NavLink onClick={() => onNavigate('games')} isActive={activePage === 'games'}>Juegos</NavLink>
            <NavLink onClick={() => onNavigate('community')} isActive={activePage === 'community'}>Comunidad</NavLink>
            {userProfile.role === 'admin' && (
              <NavLink onClick={() => onNavigate('admin')} isActive={activePage === 'admin'}>Admin</NavLink>
            )}
          </nav>
        </div>

        {/* Right Side: Stats & User */}
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('shop')} className="btn-themed btn-themed-secondary hidden sm:flex items-center gap-2">
            <StoreIcon className="w-5 h-5" /> Tienda
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-bold bg-surface-darker px-3 py-1.5 rounded-full border-2 border-ink/20">
              <CoinIcon className="w-6 h-6 text-yellow-500" />
              <span>{coins}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button onClick={onOpenProfile} className="font-bold hover:text-primary transition-colors">
                {userProfile.username}
            </button>
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="p-2 rounded-full hover:bg-ink/10"
              title="Logout"
            >
              <LogoutIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { UserProfile } from '../types';
import { CoinIcon, StarIcon, StoreIcon, UsersIcon, BookIcon, HomeIcon, LogoutIcon, EditIcon, CatSilhouetteIcon } from './Icons';

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
    className={`px-4 py-2 rounded-md font-bold transition-colors ${isActive ? 'bg-liver text-white' : 'hover:bg-liver/10'}`}
  >
    {children}
  </button>
);

const Header: React.FC<HeaderProps> = ({ userProfile, onNavigate, onOpenProfile, activePage }) => {
  const { logout } = useAuth0();
  const { playerStats, coins } = userProfile.data;
  const xpPercentage = (playerStats.xp / playerStats.xpToNextLevel) * 100;

  return (
    <header className="fixed top-0 left-0 right-0 bg-seasalt/80 backdrop-blur-sm border-b-4 border-liver z-40">
      <div className="container mx-auto px-4 h-20 flex justify-between items-center">
        {/* Left Side: Logo & Nav */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CatSilhouetteIcon className="w-10 h-10 text-liver" />
            <span className="text-2xl font-black text-liver hidden sm:block">PictoCat</span>
          </div>
          <nav className="hidden lg:flex items-center gap-2">
            <NavLink onClick={() => onNavigate('home')} isActive={activePage === 'home'}>Home</NavLink>
            <NavLink onClick={() => onNavigate('album')} isActive={activePage === 'album'}>Álbum</NavLink>
            <NavLink onClick={() => onNavigate('phrases')} isActive={activePage === 'phrases'}>Frases</NavLink>
            <NavLink onClick={() => onNavigate('games')} isActive={activePage === 'games'}>Juegos</NavLink>
            <NavLink onClick={() => onNavigate('community')} isActive={activePage === 'community'}>Comunidad</NavLink>
          </nav>
        </div>

        {/* Right Side: Stats & User */}
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('shop')} className="btn-cartoon btn-cartoon-secondary hidden sm:flex items-center gap-2">
            <StoreIcon className="w-5 h-5" /> Tienda
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-bold bg-liver/10 px-3 py-1.5 rounded-full border-2 border-liver/20">
              <CoinIcon className="w-6 h-6 text-yellow-500" />
              <span>{coins}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button onClick={onOpenProfile} className="font-bold hover:text-orange-600 transition-colors">
                {userProfile.email}
            </button>
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="p-2 rounded-full hover:bg-liver/10"
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

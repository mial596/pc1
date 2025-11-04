import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { UserProfile } from '../types';
import { CatSilhouetteIcon, CoinIcon, StoreIcon, LogoutIcon } from './Icons';
import { LOGO_URL } from '../constants';

type Page = 'home' | 'album' | 'shop' | 'games' | 'community' | 'admin';

interface HeaderProps {
  userProfile: UserProfile;
  onNavigate: (page: Page) => void;
  onOpenProfile: () => void;
  onOpenTransactions: () => void;
  activePage: Page;
}

const NavLink: React.FC<{
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 relative ${isActive ? 'text-primary' : 'text-ink/60 hover:text-ink'}`}
  >
    {children}
    {isActive && <div className="absolute bottom-0 left-2 right-2 h-1 bg-primary rounded-full animate-popIn"></div>}
  </button>
);

const Header: React.FC<HeaderProps> = ({ userProfile, onNavigate, onOpenProfile, onOpenTransactions, activePage }) => {
  const { logout } = useAuth0();
  const { coins } = userProfile.data;

  return (
    <header className="fixed top-0 left-0 right-0 bg-surface border-b-4 border-ink z-40 shadow-lg">
      <div className="container mx-auto px-4 h-20 flex justify-between items-center">
        {/* Left Side: Logo & Nav */}
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2 flex-shrink-0">
            <img src={LOGO_URL} alt="PictoCat Logo" className="w-12 h-12" />
            <span className="text-2xl font-black text-ink hidden sm:block font-cartoon">PictoCat</span>
          </button>
          <nav className="hidden lg:flex items-center gap-2 bg-surface-darker p-1 rounded-full">
            <NavLink onClick={() => onNavigate('home')} isActive={activePage === 'home'}>Home</NavLink>
            <NavLink onClick={() => onNavigate('album')} isActive={activePage === 'album'}>Álbum</NavLink>
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
            <StoreIcon className="w-6 h-6" /> Tienda
          </button>
          
          <button onClick={onOpenTransactions} className="flex items-center gap-2 font-bold bg-surface-darker px-3 py-1.5 rounded-full border-2 border-ink/20 hover:bg-ink/10 transition-colors">
            <CoinIcon className="w-7 h-7 text-yellow-500" />
            <span className="text-lg">{coins}</span>
          </button>

          <div className="flex items-center gap-2">
             <button onClick={onOpenProfile} className="flex items-center gap-2 font-bold hover:text-primary transition-colors p-1 rounded-full hover:bg-ink/10">
                <div className="w-10 h-10 rounded-full bg-surface-darker border-2 border-primary flex items-center justify-center">
                  {userProfile.profilePictureUrl ? (
                    <img src={userProfile.profilePictureUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <CatSilhouetteIcon className="w-6 h-6 text-ink/70" />
                  )}
                </div>
                <span className="hidden md:inline">{userProfile.username}</span>
            </button>
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="p-2 rounded-full hover:bg-ink/10 text-ink/70 hover:text-ink transition-colors"
              title="Logout"
            >
              <LogoutIcon className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
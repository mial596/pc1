import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { LOGO_URL } from '../constants';
import { LeafCoinIcon } from '../hooks/Icons';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex bg-surface border-3 border-ink rounded-full shadow-[2px_2px_0_0_var(--c-ink)]">
            <button 
                onClick={() => setLanguage('es')} 
                className={`px-3 py-1 rounded-l-full font-bold ${language === 'es' ? 'bg-primary text-white' : 'bg-transparent'}`}
            >
                ES
            </button>
            <button 
                onClick={() => setLanguage('ca')}
                className={`px-3 py-1 rounded-r-full font-bold ${language === 'ca' ? 'bg-primary text-white' : 'bg-transparent'}`}
            >
                CA
            </button>
        </div>
    );
};

interface HeaderProps {
  userProfile: UserProfile;
  onOpenMissions: () => void;
  coinMultiplier: { active: boolean, endTime: number };
}

const FishTokenIcon: React.FC<{className?: string}> = ({className}) => <span className={`font-bold ${className}`}>🐟</span>;

const Header: React.FC<HeaderProps> = ({ userProfile, onOpenMissions, coinMultiplier }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (coinMultiplier.active) {
            const interval = setInterval(() => {
                const remaining = coinMultiplier.endTime - Date.now();
                if (remaining <= 0) {
                    setTimeLeft('');
                    clearInterval(interval);
                } else {
                    const minutes = Math.floor((remaining / 1000) / 60);
                    const seconds = Math.floor((remaining / 1000) % 60);
                    setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [coinMultiplier]);

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-40 bg-paper h-24 border-b-4 border-dashed border-ink/20"
    >
      <div className="container mx-auto flex justify-between items-center h-full px-4">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="PictoCat Logo" className="w-20 h-20 drop-shadow-lg" />
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />
          {coinMultiplier.active && (
              <div className="font-bold text-lg bg-yellow-300 text-ink py-2 px-3 rounded-full border-3 border-ink shadow-[2px_2px_0_0_var(--c-ink)]">
                🚀 {timeLeft}
              </div>
          )}
          <button onClick={onOpenMissions} className="btn-themed !p-2 !rounded-full bg-yellow-300 transform rotate-3">
             <span className="text-3xl" title="Misiones Diarias">🎯</span>
          </button>
          <div className="flex items-center gap-2 font-bold bg-blue-200 text-ink py-2 px-3 rounded-full border-3 border-ink shadow-[4px_4px_0_0_var(--c-ink)] transform rotate-2 transition-transform hover:rotate-0 hover:scale-105">
            <FishTokenIcon className="text-3xl" />
            <span className="text-2xl font-cartoon">{userProfile.data.fishTokens}</span>
          </div>
          <div className="flex items-center gap-2 font-bold bg-secondary text-ink py-2 px-4 rounded-full border-3 border-ink shadow-[4px_4px_0_0_var(--c-ink)] transform -rotate-3 transition-transform hover:rotate-0 hover:scale-105">
            <LeafCoinIcon className="w-7 h-7" />
            <span className="text-2xl font-cartoon">{userProfile.data.coins}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
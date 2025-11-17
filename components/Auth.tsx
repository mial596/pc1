import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LOGO_URL } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

const Auth: React.FC = () => {
  const { loginWithRedirect } = useAuth0();
  const { t } = useLanguage();

  return (
    <div 
        className="min-h-screen flex flex-col justify-center items-center p-4 bg-background"
    >
      <div className="w-full max-w-sm mx-auto text-center transform -rotate-2">
        <div className="card-themed p-8">
            <div className="flex flex-col items-center mb-6">
              <img src={LOGO_URL} alt="PictoCat Logo" className="w-28 h-28 mb-4 drop-shadow-lg" />
              <h1 className="text-5xl font-cartoon text-ink">PictoCat</h1>
            </div>
            
            <p className="text-center text-ink/70 mb-8 font-hand text-xl">
              {t('authMessage')}
            </p>

            <button
              onClick={() => loginWithRedirect()}
              className="w-full btn-themed btn-themed-primary text-xl"
            >
              {t('authButton')}
            </button>

            <p className="text-xs text-center text-ink/50 mt-8 font-hand">
              {t('authDisclaimer')}
            </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
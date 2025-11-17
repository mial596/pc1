import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations, TranslationKey } from '../translations';

type Language = 'es' | 'ca';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, options?: { [key: string]: string | number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('es');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey, options?: { [key: string]: string | number }): string => {
    let text = translations[language][key] || translations['es'][key] || key;
    if (options) {
      Object.keys(options).forEach(placeholder => {
        text = text.replace(`{{${placeholder}}}`, String(options[placeholder]));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

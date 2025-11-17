import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeafCoinIcon } from '../hooks/Icons';
import { useLanguage } from '../contexts/LanguageContext';

const Confetti: React.FC = () => (
    <div className="confetti-container">
        {Array.from({ length: 100 }).map((_, i) => (
            <div
                key={i}
                className="confetti-piece"
                style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    backgroundColor: ['var(--c-primary)', 'var(--c-secondary)', 'var(--c-accent)', '#fff'][Math.floor(Math.random() * 4)],
                }}
            />
        ))}
    </div>
);

interface LuckyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
}

const LuckyBonusModal: React.FC<LuckyBonusModalProps> = ({ isOpen, onClose, coins }) => {
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
            className="modal-themed-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div 
                className="modal-themed-content w-full max-w-sm text-center relative overflow-hidden p-6"
                initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                exit={{ scale: 0.8, rotate: 10, opacity: 0 }}
            >
                <Confetti />
                <div className="relative z-10 flex flex-col items-center">
                    <motion.span 
                        className="text-7xl drop-shadow-lg"
                        animate={{ scale: [1, 1.2, 1], rotate: [0, -15, 15, 0]}}
                        transition={{ repeat: Infinity, duration: 1.2}}
                    >
                        🍀
                    </motion.span>
                    <h2 className="text-4xl sm:text-5xl font-black text-ink my-4 font-cartoon">{t('luckyCatBonusTitle')}</h2>
                    <p className="text-xl text-ink/80 mb-2">{t('luckyCatBonusMessage')}</p>
                    <div className="flex items-center justify-center gap-2 my-4">
                        <LeafCoinIcon className="w-12 h-12 text-secondary"/>
                        <span className="font-black text-6xl text-primary font-cartoon">{coins}</span>
                    </div>
                    <button
                    onClick={onClose}
                    className="btn-themed btn-themed-primary text-lg w-full"
                    >
                    {t('awesome')}
                    </button>
                </div>
            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LuckyBonusModal;
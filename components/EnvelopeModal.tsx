import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CatImage } from '../types';
import { CloseIcon, CatSilhouetteIcon } from '../hooks/Icons';
import { generateShareableImage } from '../services/imageGenerator';
import ShareableImage from './ShareableImage';
import { useLanguage } from '../contexts/LanguageContext';

const RarityShine: React.FC<{ rarity: 'common' | 'rare' | 'epic' }> = ({ rarity }) => {
    if (rarity === 'common') return null;
    return <div className={`rarity-shine rarity-shine-${rarity}`} />;
};

const SpecialAbilityBadge: React.FC<{ ability: CatImage['specialAbility'] }> = ({ ability }) => {
    if (!ability) return null;
    let icon = '';
    if (ability === 'lucky') icon = '🍀';
    if (ability === 'multiplier') icon = '🚀';
    if (ability === 'mission') icon = '🎯';
    return <div className="special-ability-badge">{icon}</div>;
}

const RarityParticles: React.FC<{ rarity: 'common' | 'rare' | 'epic' }> = ({ rarity }) => {
    if (rarity !== 'epic') return null;
    return (
        <div className="rarity-particles">
            {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="particle" />
            ))}
        </div>
    );
};

const Confetti: React.FC = () => (
    <div className="confetti-container">
        {Array.from({ length: 50 }).map((_, i) => (
            <div
                key={i}
                className="confetti-piece"
                style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    backgroundColor: ['var(--c-primary)', 'var(--c-secondary)', 'var(--c-accent)'][Math.floor(Math.random() * 3)],
                }}
            />
        ))}
    </div>
);

interface SwipeCardProps {
  image: CatImage;
  isRevealed: boolean;
  onReveal: () => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ image, isRevealed, onReveal }) => {
    const { t } = useLanguage();
    return (
        <div 
            className={`swipe-card-container ${isRevealed ? 'revealed' : ''}`}
            onClick={onReveal}
        >
            <div className="swipe-card-inner">
                <div className="swipe-card-front bg-secondary flex items-center justify-center p-4 border-4 border-ink/50">
                    <CatSilhouetteIcon className="w-full h-full text-white/80" />
                </div>
                <div className={`swipe-card-back rarity-card-container rarity-${image.rarity} ${image.isShiny ? 'shiny-effect' : ''} ${image.specialAbility ? 'special-ability-glow' : ''}`}>
                    <RarityShine rarity={image.rarity} />
                    <RarityParticles rarity={image.rarity} />
                    <SpecialAbilityBadge ability={image.specialAbility} />
                    <div className="rarity-border"></div>
                    <div className="rarity-content">
                        <img src={image.url} alt={image.theme} className="w-full h-full object-cover rounded-md" />
                    </div>
                    <div className="rarity-label">
                        {image.isShiny && '✨ '}
                        {t(image.rarity)}
                    </div>
                </div>
            </div>
        </div>
    );
};


interface EnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  newImages: CatImage[];
  envelopeName: string;
}

const EnvelopeModal: React.FC<EnvelopeModalProps> = ({ isOpen, onClose, newImages, envelopeName }) => {
  const { t } = useLanguage();
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [shareableImageSrc, setShareableImageSrc] = useState<string | null>(null);
  const allRevealed = revealedIndices.size === newImages.length;

  useEffect(() => {
    if (isOpen) {
      setRevealedIndices(new Set());
      setShareableImageSrc(null);
    }
  }, [isOpen]);

  const handleReveal = (index: number) => {
    setRevealedIndices(prev => new Set(prev).add(index));
  };

  const handleRevealAll = () => {
    setRevealedIndices(new Set(newImages.map((_, i) => i)));
  };

  const handleGenerateShareImage = async () => {
      try {
        const src = await generateShareableImage(newImages, t);
        setShareableImageSrc(src);
      } catch (error) {
        console.error("Failed to generate shareable image:", error);
        alert(t('shareImageError'));
      }
  };

  if (shareableImageSrc) {
      return <ShareableImage src={shareableImageSrc} onClose={() => setShareableImageSrc(null)} />;
  }

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
                    className="modal-themed-content w-full max-w-3xl text-center relative overflow-hidden"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                    {allRevealed && <Confetti />}
                    <div className="relative z-10 p-4 sm:p-6 flex flex-col h-full">
                        <button onClick={onClose} className="absolute top-2 right-2 text-ink/70 p-2 rounded-full hover:bg-ink/10 z-20 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl sm:text-4xl font-black text-ink mb-2 font-cartoon">{t('envelopeTitle', { envelopeName })}</h2>
                        <p className="text-ink/70 mb-6 text-lg">{allRevealed ? t('envelopeAllRevealed') : t('envelopeRevealHint')}</p>
                        <div className="overflow-y-auto flex-grow max-h-[60vh] bg-surface-darker p-2 rounded-lg border-2 border-ink/20">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-2">
                            {newImages.map((image, index) => (
                            <SwipeCard
                                key={image.id}
                                image={image}
                                isRevealed={revealedIndices.has(index)}
                                onReveal={() => handleReveal(index)}
                            />
                            ))}
                        </div>
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                        {!allRevealed ? (
                            <button
                            onClick={handleRevealAll}
                            className="btn-themed btn-themed-secondary text-lg"
                            >
                            {t('revealAll')}
                            </button>
                        ) : (
                            <>
                            <button
                                onClick={handleGenerateShareImage}
                                className="btn-themed btn-themed-secondary text-lg"
                            >
                                {t('share')}
                            </button>
                            <button
                                onClick={onClose}
                                className="btn-themed btn-themed-primary text-lg"
                            >
                                {t('awesome')}
                            </button>
                            </>
                        )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
  );
};

export default EnvelopeModal;
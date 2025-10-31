import React from 'react';
import { CatImage } from '../types';
import { CloseIcon } from '../hooks/Icons';

const RarityShine: React.FC<{ rarity: 'common' | 'rare' | 'epic' }> = ({ rarity }) => {
    if (rarity === 'common') return null;
    return <div className={`rarity-shine rarity-shine-${rarity}`} />;
};

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

interface EnvelopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  newImages: CatImage[];
  envelopeName: string;
}

const EnvelopeModal: React.FC<EnvelopeModalProps> = ({ isOpen, onClose, newImages, envelopeName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-themed-overlay">
      <div className="modal-themed-content w-full max-w-3xl text-center relative overflow-hidden">
        <div className="relative z-10 p-4 sm:p-6">
            <button onClick={onClose} className="absolute top-2 right-2 text-ink/70 p-2 rounded-full hover:bg-ink/10 z-20 transition-colors">
              <CloseIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl sm:text-4xl font-black text-ink mb-2">¡Has abierto un {envelopeName}!</h2>
            <p className="text-ink/70 mb-6 text-lg">¡Nuevos gatos se unen a tu colección!</p>
            <div className="overflow-y-auto max-h-[60vh] bg-surface-darker p-2 rounded-lg border-2 border-ink/20">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-2">
                {newImages.map((image, index) => (
                  <div 
                    key={image.id} 
                    className={`rarity-card-container rarity-${image.rarity} animate-popIn ${image.isShiny ? 'shiny-effect' : ''}`}
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <RarityShine rarity={image.rarity} />
                    <RarityParticles rarity={image.rarity} />
                    <div className="rarity-border"></div>
                    <div className="rarity-content">
                        <img src={image.url} alt={image.theme} className="w-full h-full object-cover rounded-md" />
                    </div>
                    <div className="rarity-label">
                        {image.isShiny && '✨ '}
                        {image.rarity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-6 btn-themed btn-themed-primary text-lg"
            >
              ¡Genial!
            </button>
        </div>
      </div>
    </div>
  );
};

export default EnvelopeModal;
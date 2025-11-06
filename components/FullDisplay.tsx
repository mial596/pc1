import React from 'react';
import { CatImage, Phrase } from '../types';
import { CloseIcon } from '../hooks/Icons';
import { DEFAULT_PIC_URL } from '../constants';

interface FullDisplayProps {
  phrase: Phrase | null;
  image: CatImage | null;
  onClose: () => void;
}

const FullDisplay: React.FC<FullDisplayProps> = ({ phrase, image, onClose }) => {
  if (!phrase) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-popIn" style={{ zIndex: 'var(--z-full-display)' }} onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
        <CloseIcon className="w-10 h-10" />
      </button>
      <div className={`w-full max-w-2xl aspect-square mb-6 flex items-center justify-center rounded-2xl shadow-2xl border-8 border-white bg-white overflow-hidden ${image?.isShiny ? 'shiny-effect' : ''}`}>
        <img
          src={image ? image.url : DEFAULT_PIC_URL}
          alt={phrase.text}
          className="w-full h-full object-cover"
        />
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-center text-white text-stroke">{phrase.text}</h1>
    </div>
  );
};

export default FullDisplay;
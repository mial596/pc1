import React from 'react';
import { Phrase, CatImage } from '../types';
import { DEFAULT_PIC_URL } from '../constants';
import { SpeakerWaveIcon, PhotoIcon } from '../hooks/Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface PhraseCardProps {
  phrase: Phrase;
  image: CatImage | null;
  onCardClick: () => void;
  onSelectImageClick: () => void;
  onSpeak: (text: string) => void;
}

const PhraseCard: React.FC<PhraseCardProps> = ({ phrase, image, onCardClick, onSelectImageClick, onSpeak }) => {
  const { t } = useLanguage();

  const handleSelectImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectImageClick();
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSpeak(phrase.text);
  };

  return (
    <div
      onClick={onCardClick}
      className="card-themed aspect-[4/5] flex flex-col p-2 cursor-pointer bg-white"
    >
      <div className="w-full aspect-square flex-shrink-0 bg-ink/10 mb-2 border-2 border-ink/20 rounded-md overflow-hidden">
        <img
          src={image?.url || DEFAULT_PIC_URL}
          alt={phrase.text}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${image?.isShiny ? 'shiny-effect' : ''}`}
        />
      </div>
      <div className="flex-grow flex flex-col justify-between px-1 pb-1">
        <p className="font-hand font-bold text-center text-lg leading-tight flex-grow flex items-center justify-center">{phrase.text}</p>
        <div className="flex-shrink-0 flex justify-center gap-2 mt-2">
           <button
            onClick={handleSpeak}
            className="btn-themed btn-themed-secondary !p-2 !rounded-full !shadow-none border-2"
            aria-label={t('speakPhrase', { phraseText: phrase.text })}
           >
            <SpeakerWaveIcon className="w-5 h-5" />
           </button>
           <button
            onClick={handleSelectImage}
            className="btn-themed btn-themed-primary !p-2 !rounded-full !shadow-none border-2"
            aria-label={t('changeImageFor', { phraseText: phrase.text })}
           >
            <PhotoIcon className="w-5 h-5" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default PhraseCard;
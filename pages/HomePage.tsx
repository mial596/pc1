import React from 'react';
import { Phrase, CatImage, UserProfile } from '../types';
import PhraseCard from '../components/PhraseCard';
import { PlusIcon } from '../hooks/Icons';

interface HomePageProps {
  userProfile: UserProfile;
  allImages: CatImage[];
  onPhraseClick: (phrase: Phrase, image: CatImage | null) => void;
  onSelectImageClick: (phrase: Phrase) => void;
  onSpeak: (text: string) => void;
  onAddNewPhrase: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  userProfile, 
  allImages, 
  onPhraseClick, 
  onSelectImageClick, 
  onSpeak, 
  onAddNewPhrase
}) => {
  const visiblePhrases = userProfile.data.phrases.filter(p => !p.isArchived);

  const getImageForPhrase = (phrase: Phrase): CatImage | null => {
    if (!phrase.selectedImageId) return null;
    return allImages.find(img => img.id === phrase.selectedImageId) || null;
  };

  return (
    <div className="container mx-auto p-4">
       <header className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-black text-ink font-cartoon">Mi Tablero</h1>
        <p className="text-lg text-ink/70 mt-2">Tus frases listas para comunicar. ¡Toca una para mostrarla!</p>
      </header>
      
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <button
            onClick={onAddNewPhrase}
            className="card-themed add-phrase-card aspect-square flex flex-col items-center justify-center p-2 text-primary hover:bg-primary/10"
          >
            <PlusIcon className="w-12 h-12" />
            <span className="font-bold mt-2 text-center">Crear Nueva Frase</span>
          </button>
          {visiblePhrases.map(phrase => (
            <PhraseCard
              key={phrase.id}
              phrase={phrase}
              image={getImageForPhrase(phrase)}
              onCardClick={() => onPhraseClick(phrase, getImageForPhrase(phrase))}
              onSelectImageClick={() => onSelectImageClick(phrase)}
              onSpeak={onSpeak}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
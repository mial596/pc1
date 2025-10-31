import React from 'react';
import { Phrase, CatImage, UserProfile, DailyMission } from '../types';
import PhraseCard from '../components/PhraseCard';
import DailyMissions from '../components/DailyMissions';
import { PlusIcon, ChatBubbleIcon } from '../hooks/Icons';

interface HomePageProps {
  userProfile: UserProfile;
  allImages: CatImage[];
  onPhraseClick: (phrase: Phrase, image: CatImage | null) => void;
  onSelectImageClick: (phrase: Phrase) => void;
  onSpeak: (text: string) => void;
  onAddNewPhrase: () => void;
  onClaimMission: (mission: DailyMission) => void;
  onOpenPictoChat: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  userProfile, 
  allImages, 
  onPhraseClick, 
  onSelectImageClick, 
  onSpeak, 
  onAddNewPhrase,
  onClaimMission,
  onOpenPictoChat
}) => {
  const { phrases, dailyMissions } = userProfile.data;

  const getImageForPhrase = (phrase: Phrase): CatImage | null => {
    if (!phrase.selectedImageId) return null;
    return allImages.find(img => img.id === phrase.selectedImageId) || null;
  };

  return (
    <div className="container mx-auto p-4">
      
      <section className="mb-8">
        <DailyMissions missions={dailyMissions} onClaim={onClaimMission} />
      </section>

      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <div
            onClick={onAddNewPhrase}
            className="card-themed add-phrase-card aspect-square flex flex-col items-center justify-center p-2 text-primary hover:bg-primary/10"
          >
            <PlusIcon className="w-12 h-12" />
            <span className="font-bold mt-2 text-center">Crear Nueva Frase</span>
          </div>
          {phrases.map(phrase => (
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

      <button
        onClick={onOpenPictoChat}
        className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 btn-themed btn-themed-secondary !rounded-full !p-4 shadow-2xl animate-float"
        title="Ask Picto!"
      >
        <ChatBubbleIcon className="w-8 h-8 text-white" />
      </button>

    </div>
  );
};

export default HomePage;
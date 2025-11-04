import React, { useState } from 'react';
import { Phrase, CatImage, UserProfile, Folder } from '../types';
import { DEFAULT_PIC_URL } from '../constants';

interface PhraseItemProps {
  phrase: Phrase;
  image: CatImage | null;
  onPhraseClick: () => void;
  onSelectImageClick: () => void;
  onSpeak: (text: string) => void;
  onEdit: () => void;
  onArchive: () => void;
}

const PhraseItem: React.FC<PhraseItemProps> = ({ phrase, image, onPhraseClick, onSelectImageClick, onSpeak, onEdit, onArchive }) => (
    <div className="card-themed group flex flex-col justify-between p-2">
      <div 
        onClick={onPhraseClick} 
        className="flex-grow flex items-center justify-center rounded-md overflow-hidden mb-2 border-2 border-ink/30 bg-surface-darker cursor-pointer"
      >
        <img
          src={image?.url || DEFAULT_PIC_URL}
          alt={phrase.text}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${image?.isShiny ? 'shiny-effect' : ''}`}
        />
      </div>
      <p className="font-bold text-center flex-grow truncate px-1 text-sm sm:text-base mb-2">{phrase.text}</p>
      <div className="flex items-center justify-center gap-1">
          <button onClick={() => onSpeak(phrase.text)} className="btn-themed !p-2 bg-accent"><span className="text-lg">🔊</span></button>
          <button onClick={onSelectImageClick} className="btn-themed !p-2 bg-secondary"><span className="text-lg">🖼️</span></button>
          <button onClick={onEdit} className="btn-themed !p-2 bg-primary/80"><span className="text-lg">✏️</span></button>
          <button onClick={onArchive} className="btn-themed !p-2 bg-ink/70" title={phrase.isArchived ? "Unarchive" : "Archive"}>
             <span className="text-lg">{phrase.isArchived ? '↩️' : '📦'}</span>
          </button>
      </div>
    </div>
);


interface HomePageProps {
  userProfile: UserProfile;
  allImages: CatImage[];
  onPhraseClick: (phrase: Phrase, image: CatImage | null) => void;
  onSelectImageClick: (phrase: Phrase) => void;
  onSpeak: (text: string) => void;
  onSetPhraseToEdit: (phrase: Phrase | null) => void;
  onArchivePhrase: (phraseId: string, isArchived: boolean) => void;
  onOpenFolderManager: () => void;
}

const HomePage: React.FC<HomePageProps> = (props) => {
  const { userProfile, allImages, onPhraseClick, onSelectImageClick, onSpeak, onSetPhraseToEdit, onArchivePhrase, onOpenFolderManager } = props;
  const { phrases, folders } = userProfile.data;
  const [activeTab, setActiveTab] = useState<'all' | 'archived' | string>('all');

  const getImageForPhrase = (phrase: Phrase): CatImage | null => {
    if (!phrase.selectedImageId) return null;
    return allImages.find(img => img.id === phrase.selectedImageId) || null;
  };
  
  const displayedPhrases = phrases.filter(p => {
    if (activeTab === 'all') return !p.isArchived && !p.folderId;
    if (activeTab === 'archived') return p.isArchived;
    return p.folderId === activeTab && !p.isArchived;
  });

  const TabButton: React.FC<{id: string, name: string}> = ({ id, name }) => (
    <button onClick={() => setActiveTab(id)} className={`tab-solid ${activeTab === id ? 'tab-solid-active' : 'text-ink/70'}`}>{name}</button>
  );

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-black text-ink font-cartoon">Mi Tablero</h1>
        <div className="flex gap-2">
            <button onClick={onOpenFolderManager} className="btn-themed btn-themed-secondary">Gestionar Carpetas</button>
            <button onClick={() => onSetPhraseToEdit(null)} className="btn-themed btn-themed-primary flex items-center gap-2">
                <span className="text-xl">➕</span> Nueva Frase
            </button>
        </div>
      </header>
      
      <div className="flex border-b-2 border-ink/20 mb-6 overflow-x-auto">
          <TabButton id="all" name="Principal" />
          {folders.map(f => <TabButton key={f.id} id={f.id} name={f.name} />)}
          <TabButton id="archived" name="Archivadas" />
      </div>

      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayedPhrases.map(phrase => (
            <PhraseItem
              key={phrase.id}
              phrase={phrase}
              image={getImageForPhrase(phrase)}
              onPhraseClick={() => onPhraseClick(phrase, getImageForPhrase(phrase))}
              onSelectImageClick={() => onSelectImageClick(phrase)}
              onSpeak={onSpeak}
              onEdit={() => onSetPhraseToEdit(phrase)}
              onArchive={() => onArchivePhrase(phrase.id, !phrase.isArchived)}
            />
          ))}
        </div>
        {displayedPhrases.length === 0 && (
             <div className="text-center py-20 col-span-full">
                <p className="text-2xl font-bold text-ink/70">Esta carpeta está vacía.</p>
             </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
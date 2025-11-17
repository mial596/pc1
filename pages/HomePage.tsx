import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phrase, CatImage, UserProfile, Folder } from '../types';
import { DEFAULT_PIC_URL } from '../constants';
import { SpeakerWaveIcon, PhotoIcon, EditIcon, ArchiveBoxIcon, ArrowUturnUpIcon, PlusIcon } from '../hooks/Icons';
import PhraseCard from '../components/PhraseCard';
import { useLanguage } from '../contexts/LanguageContext';


interface PhraseItemProps {
  phrase: Phrase;
  image: CatImage | null;
  onPhraseClick: () => void;
  onSelectImageClick: () => void;
  onSpeak: (text: string) => void;
  onEdit: () => void;
  onArchive: () => void;
}

const PhraseItem: React.FC<PhraseItemProps> = ({ phrase, image, onPhraseClick, onSelectImageClick, onSpeak, onEdit, onArchive }) => {
  const { t } = useLanguage();
  return (
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
          <button onClick={() => onSpeak(phrase.text)} className="btn-themed btn-themed-secondary !p-2"><SpeakerWaveIcon className="w-6 h-6"/></button>
          <button onClick={onSelectImageClick} className="btn-themed btn-themed-primary !p-2"><PhotoIcon className="w-6 h-6"/></button>
          <button onClick={onEdit} className="btn-themed !p-2 bg-yellow-300"><EditIcon className="w-6 h-6"/></button>
          <button onClick={onArchive} className="btn-themed !p-2 bg-gray-300" title={phrase.isArchived ? t('unarchive') : t('archive')}>
             {phrase.isArchived ? <ArrowUturnUpIcon className="w-6 h-6" /> : <ArchiveBoxIcon className="w-6 h-6" />}
          </button>
      </div>
    </div>
  );
}


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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};


const HomePage: React.FC<HomePageProps> = (props) => {
  const { userProfile, allImages, onPhraseClick, onSelectImageClick, onSpeak, onSetPhraseToEdit, onArchivePhrase, onOpenFolderManager } = props;
  const { t } = useLanguage();
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
    <div className="container mx-auto p-4 relative">
        <button 
            onClick={() => onSetPhraseToEdit(null)} 
            className="fixed bottom-28 right-4 z-30 btn-themed btn-themed-primary !rounded-full !w-20 !h-20 flex items-center justify-center"
            aria-label={t('createNewPhrase')}
        >
            <PlusIcon className="w-10 h-10" />
        </button>

      <header className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl sm:text-4xl font-black text-ink font-cartoon">{t('myDashboard')}</h1>
        <div className="flex gap-2">
            <button onClick={onOpenFolderManager} className="btn-themed btn-themed-secondary">{t('manageFolders')}</button>
        </div>
      </header>
      
      <div className="flex border-b-4 border-ink/20 mb-6 overflow-x-auto">
          <TabButton id="all" name={t('main')} />
          {folders.map(f => <TabButton key={f.id} id={f.id} name={f.name} />)}
          <TabButton id="archived" name={t('archived')} />
      </div>

      <section>
        <motion.div
          key={activeTab}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {displayedPhrases.map((phrase, index) => (
            <motion.div 
              key={phrase.id} 
              variants={itemVariants}
              style={{transform: `rotate(${((index % 5) - 2) * 1.5}deg)` }}
            >
              <PhraseCard
                phrase={phrase}
                image={getImageForPhrase(phrase)}
                onCardClick={() => onPhraseClick(phrase, getImageForPhrase(phrase))}
                onSelectImageClick={() => onSelectImageClick(phrase)}
                onSpeak={onSpeak}
              />
            </motion.div>
          ))}
        </motion.div>
        {displayedPhrases.length === 0 && (
             <div className="text-center py-20 col-span-full">
                <p className="text-2xl font-bold text-ink/70 font-hand">{t('emptyFolder')}</p>
                <p className="text-ink/60">{t('emptyFolderHint')}</p>
             </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
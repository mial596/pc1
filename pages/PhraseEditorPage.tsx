import React from 'react';
import { Phrase, CatImage } from '../types';
import { EditIcon, TrashIcon, PlusIcon, ArchiveBoxIcon, ArrowUturnUpIcon } from '../hooks/Icons';

interface PhraseEditorPageProps {
  phrases: Phrase[];
  allImages: CatImage[];
  onSetPhraseToEdit: (phrase: Phrase | null) => void;
  onDeletePhrase: (phraseId: string) => void;
  onArchivePhrase: (phraseId: string, isArchived: boolean) => void;
}

const PhraseRow: React.FC<{
    phrase: Phrase,
    image: CatImage | null,
    onSetPhraseToEdit: (phrase: Phrase) => void,
    onDeletePhrase: (phraseId: string) => void,
    onArchivePhrase: (phraseId: string, isArchived: boolean) => void,
}> = ({ phrase, image, onSetPhraseToEdit, onDeletePhrase, onArchivePhrase }) => (
    <div className="card-themed p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-grow">
            <div className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 ${image?.isShiny ? 'shiny-effect' : ''}`}>
                <img
                    src={image?.url}
                    alt={phrase.text}
                    className="w-full h-full object-cover border-2 border-ink/20 bg-surface-darker"
                />
            </div>
            <span className="font-bold text-lg text-ink">{phrase.text}</span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => onArchivePhrase(phrase.id, !phrase.isArchived)} className="btn-themed bg-gray-500 text-white !p-3" title={phrase.isArchived ? "Unarchive" : "Archive"}>
                {phrase.isArchived ? <ArrowUturnUpIcon className="w-5 h-5"/> : <ArchiveBoxIcon className="w-5 h-5" />}
            </button>
            <button onClick={() => onSetPhraseToEdit(phrase)} className="btn-themed btn-themed-secondary !p-3">
                <EditIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onDeletePhrase(phrase.id)} className="btn-themed btn-themed-danger !p-3">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    </div>
);

const PhraseEditorPage: React.FC<PhraseEditorPageProps> = ({
  phrases,
  allImages,
  onSetPhraseToEdit,
  onDeletePhrase,
  onArchivePhrase
}) => {
  const customPhrases = phrases.filter(p => p.isCustom);
  const activePhrases = customPhrases.filter(p => !p.isArchived);
  const archivedPhrases = customPhrases.filter(p => p.isArchived);

  const getImageForPhrase = (phrase: Phrase): CatImage | null => {
    if (!phrase.selectedImageId) return null;
    return allImages.find(img => img.id === phrase.selectedImageId) || null;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-ink font-cartoon">Mis Frases</h1>
        <button onClick={() => onSetPhraseToEdit(null)} className="btn-themed btn-themed-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva Frase</span>
        </button>
      </div>

      <section>
          <h2 className="text-2xl font-bold text-ink mb-3">Frases Activas</h2>
          <div className="space-y-4">
            {activePhrases.length > 0 ? (
              activePhrases.map(phrase => (
                <PhraseRow 
                    key={phrase.id} 
                    phrase={phrase} 
                    image={getImageForPhrase(phrase)}
                    onSetPhraseToEdit={onSetPhraseToEdit}
                    onDeletePhrase={onDeletePhrase}
                    onArchivePhrase={onArchivePhrase}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-surface rounded-lg border-2 border-ink/20">
                <p className="text-xl font-bold text-ink">No tienes frases personalizadas.</p>
                <p className="text-ink/70">¡Crea una para comunicarte a tu manera!</p>
              </div>
            )}
          </div>
      </section>

      {archivedPhrases.length > 0 && (
          <section className="mt-12">
              <h2 className="text-2xl font-bold text-ink/70 mb-3">Frases Archivadas</h2>
              <div className="space-y-4 opacity-70">
                {archivedPhrases.map(phrase => (
                    <PhraseRow 
                        key={phrase.id} 
                        phrase={phrase} 
                        image={getImageForPhrase(phrase)}
                        onSetPhraseToEdit={onSetPhraseToEdit}
                        onDeletePhrase={onDeletePhrase}
                        onArchivePhrase={onArchivePhrase}
                    />
                ))}
              </div>
          </section>
      )}
    </div>
  );
};

export default PhraseEditorPage;
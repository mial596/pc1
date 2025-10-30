import React from 'react';
import { Phrase, CatImage } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from '../hooks/Icons';

interface PhraseEditorPageProps {
  phrases: Phrase[];
  allImages: CatImage[];
  onSetPhraseToEdit: (phrase: Phrase | null) => void;
  onDeletePhrase: (phraseId: string) => void;
}

const PhraseEditorPage: React.FC<PhraseEditorPageProps> = ({
  phrases,
  allImages,
  onSetPhraseToEdit,
  onDeletePhrase,
}) => {
  const customPhrases = phrases.filter(p => p.isCustom);
  const getImageForPhrase = (phrase: Phrase): CatImage | null => {
    if (!phrase.selectedImageId) return null;
    return allImages.find(img => img.id === phrase.selectedImageId) || null;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-ink">Mis Frases</h1>
        <button onClick={() => onSetPhraseToEdit(null)} className="btn-themed btn-themed-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva Frase</span>
        </button>
      </div>

      <div className="space-y-4">
        {customPhrases.length > 0 ? (
          customPhrases.map(phrase => (
            <div key={phrase.id} className="card-themed p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-grow">
                <img
                  src={getImageForPhrase(phrase)?.url}
                  alt={phrase.text}
                  className="w-16 h-16 rounded-md object-cover border-2 border-ink/20 bg-surface-darker"
                />
                <span className="font-bold text-lg text-ink">{phrase.text}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onSetPhraseToEdit(phrase)} className="btn-themed btn-themed-secondary !p-3">
                  <EditIcon className="w-5 h-5" />
                </button>
                <button onClick={() => onDeletePhrase(phrase.id)} className="btn-themed btn-themed-danger !p-3">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-surface rounded-lg border-2 border-ink/20">
            <p className="text-xl font-bold text-ink">No tienes frases personalizadas.</p>
            <p className="text-ink/70">¡Crea una para comunicarte a tu manera!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhraseEditorPage;
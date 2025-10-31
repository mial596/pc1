import React, { useState, useEffect } from 'react';
import { CatImage, Phrase } from '../types';
import { CloseIcon, TrashIcon, GlobeIcon } from '../hooks/Icons';

interface CustomPhraseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { text: string; selectedImageId: number | null; isPublic: boolean }) => void;
    onDelete: (phraseId: string) => void;
    phraseToEdit: Phrase | null;
    unlockedImages: CatImage[];
}

const CustomPhraseModal: React.FC<CustomPhraseModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    phraseToEdit,
    unlockedImages
}) => {
    const [text, setText] = useState('');
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    const [isPublic, setIsPublic] = useState(false);

    useEffect(() => {
        if (phraseToEdit) {
            setText(phraseToEdit.text);
            setSelectedImageId(phraseToEdit.selectedImageId);
            setIsPublic(phraseToEdit.isPublic || false);
        } else {
            // Reset for new phrase
            setText('');
            setSelectedImageId(null);
            setIsPublic(false);
        }
    }, [phraseToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ text, selectedImageId, isPublic });
    };

    const handleDelete = () => {
        if (phraseToEdit) {
            onDelete(phraseToEdit.id);
        }
    };
    
    const canSave = text.trim().length > 0 && selectedImageId !== null;

    return (
        <div className="modal-themed-overlay">
            <div className="modal-themed-content w-full max-w-2xl">
                <header className="flex justify-between items-center p-4 border-b-2 border-ink/20">
                    <h2 className="text-xl sm:text-2xl font-black text-ink">{phraseToEdit ? 'Editar Frase' : 'Crear Nueva Frase'}</h2>
                    <button onClick={onClose} className="text-ink/70 hover:text-ink">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto space-y-6 p-4 sm:p-6 bg-surface">
                    <div>
                        <label htmlFor="phraseText" className="font-bold text-ink text-lg">Texto de la frase</label>
                        <input
                            id="phraseText"
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Ej: Quiero jugar"
                            className="input-themed mt-1 text-lg"
                        />
                    </div>

                    <div>
                        <label className="font-bold text-ink text-lg">Elige una imagen</label>
                        <div className="mt-2 max-h-60 overflow-y-auto bg-surface-darker p-2 rounded-lg border-2 border-ink/20">
                            {unlockedImages.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {unlockedImages.map(image => (
                                        <button
                                            key={image.id}
                                            onClick={() => setSelectedImageId(image.id)}
                                            className={`aspect-square rounded-lg overflow-hidden border-4 transition-all duration-200 ease-in-out ${selectedImageId === image.id ? 'border-primary ring-4 ring-offset-2 ring-primary scale-105 shadow-lg' : 'border-transparent hover:border-primary'}`}
                                        >
                                            <img src={image.url} alt={image.theme} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-ink/60 py-4">No tienes imágenes desbloqueadas.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="isPublicToggle" className="flex items-center cursor-pointer group">
                             <div className="relative">
                                <input type="checkbox" id="isPublicToggle" className="sr-only" checked={isPublic} onChange={() => setIsPublic(!isPublic)} />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${isPublic ? 'bg-primary' : 'bg-disabled'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isPublic ? 'translate-x-6' : ''}`}></div>
                            </div>
                            <div className="ml-3 font-semibold flex items-center gap-2 text-ink group-hover:text-primary transition-colors">
                               <GlobeIcon className="w-5 h-5" /> Hacerla pública en la comunidad
                            </div>
                        </label>
                         <p className="text-sm text-ink/60 mt-1 ml-16">Otros podrán ver tu frase si activas esta opción.</p>
                    </div>
                </main>
                
                <footer className="p-4 sm:p-6 mt-2 bg-surface-darker border-t-2 border-ink/20 flex justify-between items-center">
                    <div>
                        {phraseToEdit && (
                            <button
                                onClick={handleDelete}
                                className="btn-themed btn-themed-danger flex items-center gap-2"
                            >
                                <TrashIcon className="w-5 h-5"/>
                                <span className="hidden sm:inline">Eliminar</span>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!canSave}
                        className="btn-themed btn-themed-primary"
                    >
                        Guardar Cambios
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CustomPhraseModal;
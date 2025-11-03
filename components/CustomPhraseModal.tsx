import React, { useState, useEffect } from 'react';
import { CatImage, Phrase, Folder } from '../types';
import { CloseIcon, TrashIcon, GlobeIcon, UsersIcon, LockIcon } from '../hooks/Icons';

interface CustomPhraseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { text: string; selectedImageId: number | null; visibility: 'public' | 'friends' | 'private'; folderId: string | null; }) => void;
    onDelete: (phraseId: string) => void;
    phraseToEdit: Phrase | null;
    unlockedImages: CatImage[];
    folders: Folder[];
}

const CustomPhraseModal: React.FC<CustomPhraseModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    phraseToEdit,
    unlockedImages,
    folders
}) => {
    const [text, setText] = useState('');
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
    const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('private');
    const [folderId, setFolderId] = useState<string | null>(null);

    useEffect(() => {
        if (phraseToEdit) {
            setText(phraseToEdit.text);
            setSelectedImageId(phraseToEdit.selectedImageId);
            setVisibility(phraseToEdit.visibility || 'private');
            setFolderId(phraseToEdit.folderId || null);
        } else {
            // Reset for new phrase
            setText('');
            setSelectedImageId(null);
            setVisibility('private');
            setFolderId(null);
        }
    }, [phraseToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ text, selectedImageId, visibility, folderId });
    };

    const handleDelete = () => {
        if (phraseToEdit && window.confirm("¿Estás seguro de que quieres eliminar esta frase permanentemente?")) {
            onDelete(phraseToEdit.id);
        }
    };
    
    const canSave = text.trim().length > 0 && selectedImageId !== null;
    
    const visibilityOptions = [
      { id: 'private', label: 'Privado', icon: <LockIcon className="w-5 h-5"/>, description: 'Solo tú puedes ver esta frase.' },
      { id: 'friends', label: 'Amigos', icon: <UsersIcon className="w-5 h-5"/>, description: 'Solo tus amigos pueden ver esta frase.' },
      { id: 'public', label: 'Público', icon: <GlobeIcon className="w-5 h-5"/>, description: 'Cualquiera en la comunidad puede verla.' },
    ];

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <label htmlFor="folderId" className="font-bold text-ink text-lg">Carpeta</label>
                            <select
                                id="folderId"
                                value={folderId || ''}
                                onChange={(e) => setFolderId(e.target.value || null)}
                                className="input-themed mt-1 text-lg"
                            >
                                <option value="">Sin carpeta</option>
                                {folders.map(folder => (
                                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                                ))}
                            </select>
                        </div>
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
                        <label className="font-bold text-ink text-lg mb-2">Visibilidad</label>
                        <div className="grid sm:grid-cols-3 gap-2">
                            {visibilityOptions.map(opt => (
                                <button key={opt.id} onClick={() => setVisibility(opt.id as any)} className={`p-3 rounded-lg border-4 text-left transition-all ${visibility === opt.id ? 'border-primary bg-primary/10' : 'border-ink/20 hover:border-ink/40'}`}>
                                    <div className="flex items-center gap-2 font-bold">{opt.icon} {opt.label}</div>
                                    <p className="text-xs text-ink/70 mt-1">{opt.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </main>
                
                <footer className="p-4 sm:p-6 mt-2 bg-surface-darker border-t-2 border-ink/20 flex justify-between items-center">
                    <div>
                        {phraseToEdit && phraseToEdit.isCustom && (
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
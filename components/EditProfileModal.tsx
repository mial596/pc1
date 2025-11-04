import React, { useState, useEffect } from 'react';
import { UserProfile, CatImage } from '../types';
import { CloseIcon, SpinnerIcon } from '../hooks/Icons';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserProfile: UserProfile;
    unlockedImages: CatImage[];
    onSave: (data: { username: string; bio: string; profilePictureId: number | null }) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUserProfile, unlockedImages, onSave }) => {
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [selectedPictureId, setSelectedPictureId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUsername(currentUserProfile.username);
            setBio(currentUserProfile.data.bio);
            setSelectedPictureId(currentUserProfile.data.profilePictureId);
            setError('');
            setIsSaving(false);
        }
    }, [isOpen, currentUserProfile]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            setError('El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números y guiones bajos.');
            return;
        }
        if (bio.length > 150) {
            setError('La biografía no puede exceder los 150 caracteres.');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await onSave({ username, bio, profilePictureId: selectedPictureId });
            // On successful save, the parent component will close the modal.
        } catch (err) {
             setError('Error al guardar. El nombre de usuario puede que ya esté en uso.');
        } finally {
            // This is crucial to re-enable the button even if the save fails.
            setIsSaving(false);
        }
    };
    
    return (
        <div className="modal-themed-overlay">
            <div className="modal-themed-content w-full max-w-2xl">
                <header className="flex justify-between items-center p-4 border-b-2 border-ink/20">
                    <h2 className="text-2xl font-black text-ink">Editar Perfil</h2>
                    <button onClick={onClose} className="text-ink/70 hover:text-ink">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <main className="flex-grow space-y-6 p-6 overflow-y-auto">
                    <div>
                        <label className="font-bold text-ink/80 text-lg">Foto de Perfil</label>
                        <div className="mt-2 max-h-48 overflow-y-auto bg-surface-darker p-2 rounded-lg border-2 border-ink/20">
                           <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                <button
                                    onClick={() => setSelectedPictureId(null)}
                                    className={`aspect-square rounded-lg flex items-center justify-center border-4 transition-all ${!selectedPictureId ? 'border-primary' : 'border-ink/20 bg-surface hover:border-ink/40'}`}
                                >
                                    <span className="text-ink/70 text-sm font-bold">Ninguna</span>
                                </button>
                                {unlockedImages.map(image => (
                                    <button
                                        key={image.id}
                                        onClick={() => setSelectedPictureId(image.id)}
                                        className={`aspect-square rounded-lg overflow-hidden border-4 transition-all ${selectedPictureId === image.id ? 'border-primary' : 'border-transparent hover:border-primary'}`}
                                    >
                                        <img src={image.url} alt={image.theme} className="w-full h-full object-cover"/>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="username" className="font-bold text-ink/80 text-lg">Nombre de usuario</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input-themed mt-1 text-lg"
                        />
                         <p className="text-xs text-ink/60 mt-1">De 3 a 20 caracteres (letras, números, _).</p>
                    </div>
                    <div>
                        <label htmlFor="bio" className="font-bold text-ink/80 text-lg">Biografía</label>
                        <textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            maxLength={150}
                            className="input-themed mt-1 text-base"
                            placeholder="Cuéntanos algo sobre ti..."
                        />
                        <p className="text-right text-xs text-ink/60 mt-1">{bio.length} / 150</p>
                    </div>

                    {error && <p className="text-sm text-red-400 bg-red-900/50 p-2 rounded-md border border-red-400/50">{error}</p>}
                </main>
                
                <footer className="p-4 bg-surface-darker border-t-2 border-ink/20 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn-themed btn-themed-primary flex items-center justify-center min-w-[120px]"
                    >
                        {isSaving ? <SpinnerIcon className="w-6 h-6 animate-spin"/> : 'Guardar'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default EditProfileModal;
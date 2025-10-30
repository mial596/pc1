import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { CloseIcon, SpinnerIcon } from '../hooks/Icons';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserProfile: UserProfile;
    onSave: (username: string, bio: string) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUserProfile, onSave }) => {
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUsername(currentUserProfile.username);
            setBio(currentUserProfile.data.bio);
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
            await onSave(username, bio);
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
            <div className="modal-themed-content w-full max-w-lg">
                <header className="flex justify-between items-center p-4 border-b-2 border-ink/20">
                    <h2 className="text-2xl font-black text-ink">Editar Perfil</h2>
                    <button onClick={onClose} className="text-ink/70 hover:text-ink">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <main className="flex-grow space-y-6 p-6">
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
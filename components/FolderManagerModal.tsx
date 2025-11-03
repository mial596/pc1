import React, { useState, useEffect } from 'react';
import { Folder } from '../types';
import { CloseIcon, TrashIcon } from '../hooks/Icons';
import { v4 as uuidv4 } from 'uuid';

interface FolderManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    folders: Folder[];
    onSave: (folders: Folder[]) => Promise<void>;
}

const FolderManagerModal: React.FC<FolderManagerModalProps> = ({ isOpen, onClose, folders: initialFolders, onSave }) => {
    const [folders, setFolders] = useState<Folder[]>(initialFolders);
    const [newFolderName, setNewFolderName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFolders(initialFolders);
        }
    }, [isOpen, initialFolders]);

    if (!isOpen) return null;

    const handleAddFolder = () => {
        if (newFolderName.trim()) {
            setFolders([...folders, { id: uuidv4(), name: newFolderName.trim() }]);
            setNewFolderName('');
        }
    };

    const handleUpdateFolderName = (id: string, name: string) => {
        setFolders(folders.map(f => (f.id === id ? { ...f, name } : f)));
    };

    const handleDeleteFolder = (id: string) => {
        if (window.confirm("¿Seguro que quieres eliminar esta carpeta? Las frases que contiene no se eliminarán, pero volverán al tablero principal.")) {
            setFolders(folders.filter(f => f.id !== id));
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        await onSave(folders);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="modal-themed-overlay">
            <div className="modal-themed-content w-full max-w-lg">
                <header className="flex justify-between items-center p-4 border-b-2 border-ink/20">
                    <h2 className="text-2xl font-black text-ink">Gestionar Carpetas</h2>
                    <button onClick={onClose} className="text-ink/70 hover:text-ink">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto p-6 space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Nombre de la nueva carpeta"
                            className="input-themed flex-grow"
                        />
                        <button onClick={handleAddFolder} className="btn-themed btn-themed-secondary">Añadir</button>
                    </div>
                    <div className="space-y-2">
                        {folders.map(folder => (
                            <div key={folder.id} className="flex items-center gap-2 bg-surface p-2 rounded-lg">
                                <input
                                    type="text"
                                    value={folder.name}
                                    onChange={(e) => handleUpdateFolderName(folder.id, e.target.value)}
                                    className="input-themed flex-grow !py-1"
                                />
                                <button onClick={() => handleDeleteFolder(folder.id)} className="btn-themed btn-themed-danger !p-2">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </main>
                
                <footer className="p-4 bg-surface-darker border-t-2 border-ink/20 flex justify-end">
                    <button onClick={handleSaveChanges} disabled={isSaving} className="btn-themed btn-themed-primary">
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default FolderManagerModal;
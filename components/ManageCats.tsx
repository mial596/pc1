import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { CatImage } from '../types';
import { SpinnerIcon, PlusIcon, EditIcon } from '../hooks/Icons';

const ManageCats: React.FC = () => {
    const [catalog, setCatalog] = useState<CatImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { getAccessTokenSilently } = useAuth0();
    
    // Form state
    const [editingCat, setEditingCat] = useState<CatImage | null>(null);
    const [url, setUrl] = useState('');
    const [theme, setTheme] = useState('');
    const [rarity, setRarity] = useState<'common' | 'rare' | 'epic'>('common');
    const [isShiny, setIsShiny] = useState(false);

    // Import state
    const [isImporting, setIsImporting] = useState(false);
    const [importMessage, setImportMessage] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const data = await apiService.adminGetCatCatalog(token);
            setCatalog(data);
        } catch (err) {
            setError('Failed to load cat catalog.');
        } finally {
            setIsLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const resetForm = () => {
        setEditingCat(null);
        setUrl('');
        setTheme('');
        setRarity('common');
        setIsShiny(false);
    };

    const handleEditClick = (cat: CatImage) => {
        setEditingCat(cat);
        setUrl(cat.url);
        setTheme(cat.theme);
        setRarity(cat.rarity);
        setIsShiny(cat.isShiny || false);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url || !theme) {
            setError('URL and Theme are required.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const token = await getAccessTokenSilently();
            if (editingCat) {
                await apiService.adminEditCat(token, { id: editingCat.id, url, theme, rarity, isShiny });
            } else {
                await apiService.adminAddCat(token, { url, theme, rarity, isShiny });
            }
            resetForm();
            await fetchData();
        } catch (err) {
            setError(`Failed to ${editingCat ? 'update' : 'add'} cat.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImport = async () => {
        if (!window.confirm('This will import the master cat catalog from the source code. This may take a moment. Continue?')) return;
        setIsImporting(true);
        setImportMessage('');
        try {
            const token = await getAccessTokenSilently();
            const result = await apiService.adminImportCatCatalog(token);
            setImportMessage(result.message || 'Import successful!');
            await fetchData(); // Refresh catalog
        } catch (err) {
            setImportMessage(err instanceof Error ? err.message : 'Import failed.');
        } finally {
            setIsImporting(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div>
            <div className="card-themed p-4 mb-6 bg-secondary/20 border-secondary">
                <h3 className="text-xl font-bold mb-2">Master Catalog Import</h3>
                <p className="text-sm text-ink/80 mb-4">
                    Import all cats from the application's master catalog file. This will only add cats that do not already exist in the database (based on URL).
                </p>
                <button onClick={handleImport} disabled={isImporting} className="btn-themed btn-themed-secondary">
                    {isImporting ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Start Import'}
                </button>
                {importMessage && <p className="text-sm mt-2 font-bold">{importMessage}</p>}
            </div>

            <div className="card-themed p-4 mb-6 sticky top-24 z-10 bg-surface/95 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">{editingCat ? `Editing Cat #${editingCat.id}` : 'Add New Cat'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="font-bold text-sm">Image URL</label>
                            <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="input-themed mt-1" />
                        </div>
                        <div>
                            <label className="font-bold text-sm">Theme</label>
                            <input type="text" value={theme} onChange={e => setTheme(e.target.value)} placeholder="e.g., Happy Cats" className="input-themed mt-1" />
                        </div>
                        <div>
                            <label className="font-bold text-sm">Rarity</label>
                            <select value={rarity} onChange={e => setRarity(e.target.value as any)} className="input-themed mt-1">
                                <option value="common">Common</option>
                                <option value="rare">Rare</option>
                                <option value="epic">Epic</option>
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="flex items-center gap-2 font-bold cursor-pointer"><input type="checkbox" checked={isShiny} onChange={e => setIsShiny(e.target.checked)} className="w-5 h-5 rounded text-primary focus:ring-primary"/> ✨ Shiny?</label>
                    </div>
                    <div className="flex gap-2 justify-end">
                        {editingCat && <button type="button" onClick={resetForm} className="btn-themed bg-gray-500 text-white">Cancel</button>}
                        <button type="submit" disabled={isSubmitting} className="btn-themed btn-themed-primary flex items-center justify-center gap-2">
                            {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : (editingCat ? 'Save Changes' : <><PlusIcon className="w-5 h-5" /> Add Cat</>)}
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-sm md:col-span-4">{error}</p>}
                </form>
            </div>
            
            <h3 className="text-xl font-bold mb-4">Cat Catalog ({catalog.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {catalog.map(cat => (
                    <div key={cat.id} className="card-themed p-2 text-center">
                        <div className={`relative w-full aspect-square mb-2 ${cat.isShiny ? 'shiny-effect' : ''}`}>
                             <img src={cat.url} alt={cat.theme} className="w-full h-full object-cover rounded-md border-2 border-ink/20" />
                        </div>
                        <p className="font-bold text-sm capitalize">{cat.theme}</p>
                        <p className="text-xs text-ink/70">{cat.rarity} {cat.isShiny && '✨'}</p>
                        <button onClick={() => handleEditClick(cat)} className="btn-themed btn-themed-secondary !py-1 !px-2 mt-2 text-xs w-full flex items-center justify-center gap-1">
                            <EditIcon className="w-3 h-3"/> Edit
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageCats;
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { CatImage } from '../types';
import { SpinnerIcon, PlusIcon } from '../hooks/Icons';

const ManageCats: React.FC = () => {
    const [catalog, setCatalog] = useState<CatImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { getAccessTokenSilently } = useAuth0();
    
    // Form state
    const [url, setUrl] = useState('');
    const [theme, setTheme] = useState('');
    const [rarity, setRarity] = useState<'common' | 'rare' | 'epic'>('common');

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
            await apiService.adminAddCat(token, { url, theme, rarity });
            setUrl('');
            setTheme('');
            setRarity('common');
            await fetchData(); // Refresh catalog
        } catch (err) {
            setError('Failed to add new cat.');
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

            <div className="card-themed p-4 mb-6">
                <h3 className="text-xl font-bold mb-4">Add New Cat</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                    <button type="submit" disabled={isSubmitting} className="btn-themed btn-themed-primary md:col-span-4 flex items-center justify-center gap-2">
                        {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <PlusIcon className="w-5 h-5" />}
                        Add Cat
                    </button>
                    {error && <p className="text-red-500 text-sm md:col-span-4">{error}</p>}
                </form>
            </div>
            
            <h3 className="text-xl font-bold mb-4">Cat Catalog ({catalog.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {catalog.map(cat => (
                    <div key={cat.id} className="card-themed p-2 text-center">
                        <img src={cat.url} alt={cat.theme} className="w-full aspect-square object-cover rounded-md mb-2 border-2 border-ink/20" />
                        <p className="font-bold text-sm capitalize">{cat.theme}</p>
                        <p className="text-xs text-ink/70">{cat.rarity}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageCats;
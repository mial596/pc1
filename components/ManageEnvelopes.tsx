import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import * as apiService from '../services/apiService';
import { Envelope } from '../types';
import { SpinnerIcon, PlusIcon, EditIcon, TrashIcon } from '../hooks/Icons';

const initialFormState: Envelope = {
    id: '',
    name: '',
    baseCost: 100,
    costIncreasePerLevel: 10,
    imageCount: 3,
    color: 'bg-yellow-400',
    description: '',
    xp: 25,
    isFeatured: false,
    catThemePool: [],
};

const ManageEnvelopes: React.FC = () => {
    const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
    const [themes, setThemes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { getAccessTokenSilently } = useAuth0();
    
    const [editingEnvelope, setEditingEnvelope] = useState<Envelope | null>(null);
    const [formState, setFormState] = useState<Envelope>(initialFormState);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await getAccessTokenSilently();
            const [envelopesData, themesData] = await Promise.all([
                apiService.adminGetEnvelopes(token),
                apiService.adminGetThemes(token),
            ]);
            setEnvelopes(envelopesData);
            setThemes(themesData);
        } catch (err) {
            setError('Failed to load envelope data.');
        } finally {
            setIsLoading(false);
        }
    }, [getAccessTokenSilently]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const isNumeric = type === 'number';

        setFormState(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : (isNumeric ? Number(value) : value) }));
    };
    
    const handleThemeChange = (theme: string) => {
        setFormState(prev => {
            const newPool = prev.catThemePool.includes(theme)
                ? prev.catThemePool.filter(t => t !== theme)
                : [...prev.catThemePool, theme];
            return { ...prev, catThemePool: newPool };
        });
    };

    const resetForm = () => {
        setEditingEnvelope(null);
        setFormState(initialFormState);
    };

    const handleEditClick = (envelope: Envelope) => {
        setEditingEnvelope(envelope);
        setFormState(envelope);
        window.scrollTo(0, 0);
    };

    const handleDelete = async (envelopeId: string) => {
        if (!window.confirm(`Are you sure you want to delete the "${envelopeId}" envelope?`)) return;
        try {
            const token = await getAccessTokenSilently();
            await apiService.adminDeleteEnvelope(token, envelopeId);
            fetchData();
        } catch (err) {
            setError('Failed to delete envelope.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.id || !formState.name) {
            setError('ID and Name are required.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const token = await getAccessTokenSilently();
            const apiCall = editingEnvelope ? apiService.adminEditEnvelope : apiService.adminAddEnvelope;
            await apiCall(token, formState as any);
            resetForm();
            await fetchData();
        } catch (err) {
            setError(`Failed to ${editingEnvelope ? 'update' : 'add'} envelope. ID might already exist.`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div>
            <div className="card-themed p-4 mb-6 sticky top-24 z-10 bg-surface/95 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">{editingEnvelope ? `Editing "${editingEnvelope.name}"` : 'Add New Envelope'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="font-bold text-sm">ID</label><input type="text" name="id" value={formState.id} onChange={handleInputChange} className="input-themed mt-1" disabled={!!editingEnvelope} /></div>
                        <div className="md:col-span-2"><label className="font-bold text-sm">Name</label><input type="text" name="name" value={formState.name} onChange={handleInputChange} className="input-themed mt-1" /></div>
                        <div><label className="font-bold text-sm">Base Cost</label><input type="number" name="baseCost" value={formState.baseCost} onChange={handleInputChange} className="input-themed mt-1" /></div>
                        <div><label className="font-bold text-sm">Cost Incr./Lvl</label><input type="number" name="costIncreasePerLevel" value={formState.costIncreasePerLevel} onChange={handleInputChange} className="input-themed mt-1" /></div>
                        <div><label className="font-bold text-sm">Image Count</label><input type="number" name="imageCount" value={formState.imageCount} onChange={handleInputChange} className="input-themed mt-1" /></div>
                        <div><label className="font-bold text-sm">XP Reward</label><input type="number" name="xp" value={formState.xp} onChange={handleInputChange} className="input-themed mt-1" /></div>
                        <div className="md:col-span-2"><label className="font-bold text-sm">Color (Tailwind class)</label><input type="text" name="color" value={formState.color} onChange={handleInputChange} className="input-themed mt-1" /></div>
                    </div>
                    <div><label className="font-bold text-sm">Description</label><textarea name="description" value={formState.description} onChange={handleInputChange} rows={2} className="input-themed mt-1" /></div>
                    
                    <div>
                        <label className="font-bold text-sm">Cat Theme Pool (leave empty for all)</label>
                        <div className="max-h-32 overflow-y-auto bg-surface-darker p-2 rounded-md mt-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                           {themes.map(theme => (
                               <label key={theme} className="flex items-center gap-2 text-sm cursor-pointer">
                                   <input type="checkbox" checked={formState.catThemePool.includes(theme)} onChange={() => handleThemeChange(theme)} className="w-4 h-4 rounded text-primary focus:ring-primary"/>
                                   {theme}
                               </label>
                           ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 font-bold cursor-pointer"><input type="checkbox" name="isFeatured" checked={formState.isFeatured || false} onChange={handleInputChange} className="w-5 h-5 rounded text-primary focus:ring-primary"/> Is Featured?</label>
                    </div>

                    <div className="flex justify-end gap-2">
                        {editingEnvelope && <button type="button" onClick={resetForm} className="btn-themed bg-gray-500 text-white">Cancel</button>}
                        <button type="submit" disabled={isSubmitting} className="btn-themed btn-themed-primary w-full md:w-auto flex items-center justify-center gap-2">
                            {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : (editingEnvelope ? 'Save Changes' : <><PlusIcon className="w-5 h-5" /> Add Envelope</>)}
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </form>
            </div>
            
            <h3 className="text-xl font-bold mb-4">Current Envelopes ({envelopes.length})</h3>
            <div className="space-y-3">
                {envelopes.map(env => (
                    <div key={env.id} className="card-themed p-3 flex justify-between items-center gap-4">
                        <div className="flex-grow">
                            <h4 className="font-bold text-lg">{env.name} <span className="text-xs text-ink/60">({env.id})</span></h4>
                            <p className="text-sm text-ink/70">{env.description}</p>
                            <div className="text-xs mt-2 space-x-4">
                                <span>Cost: {env.baseCost}</span>
                                <span>Images: {env.imageCount}</span>
                                <span>XP: {env.xp}</span>
                                {env.isFeatured && <span className="font-bold text-primary">Featured</span>}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <button onClick={() => handleEditClick(env)} className="btn-themed btn-themed-secondary !py-1 !px-2 flex items-center gap-1 text-sm"><EditIcon className="w-4 h-4"/> Edit</button>
                             <button onClick={() => handleDelete(env.id.toString())} className="btn-themed btn-themed-danger !py-1 !px-2 flex items-center gap-1 text-sm"><TrashIcon className="w-4 h-4"/> Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageEnvelopes;
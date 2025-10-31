import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Auth from './components/Auth';
import Header from './hooks/Header';
import MobileMenu from './components/MobileMenu';
import HomePage from './pages/HomePage';
import AlbumPage from './pages/AlbumPage';
import ShopPage from './pages/ShopPage';
import GameModeSelector from './components/GameModeSelector';
import PhraseEditorPage from './pages/PhraseEditorPage';
import CommunityView from './components/CommunityView';
import AdminPanel from './components/AdminPanel';
import ShopModal from './components/ShopModal';
import EnvelopeModal from './components/EnvelopeModal';
import ImageSelector from './components/ImageSelector';
import CustomPhraseModal from './components/CustomPhraseModal';
import FullDisplay from './components/FullDisplay';
import EditProfileModal from './components/EditProfileModal';
import Toast from './components/Toast';
import { SpinnerIcon } from './hooks/Icons';

import * as apiService from './services/apiService';
import { soundService, ttsService } from './services/audioService';
import {
  UserProfile,
  CatImage,
  Phrase,
  EnvelopeTypeId,
  UpgradeId,
  FullDisplayData,
  Envelope,
  GameUpgrade,
} from './types';

type Page = 'home' | 'album' | 'shop' | 'games' | 'phrases' | 'community' | 'admin';

const App: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, getAccessTokenSilently, user } = useAuth0();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allImages, setAllImages] = useState<CatImage[]>([]);
  const [shopData, setShopData] = useState<{ envelopes: Envelope[], upgrades: GameUpgrade[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<Page>('home');

  // Modal States
  const [isShopModalOpen, setShopModalOpen] = useState(false);
  const [isEnvelopeModalOpen, setEnvelopeModalOpen] = useState(false);
  const [isImageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [isCustomPhraseModalOpen, setCustomPhraseModalOpen] = useState(false);
  const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);
  
  const [fullDisplayData, setFullDisplayData] = useState<FullDisplayData | null>(null);
  const [newlyUnlockedImages, setNewlyUnlockedImages] = useState<CatImage[]>([]);
  const [openedEnvelopeName, setOpenedEnvelopeName] = useState('');
  const [activePhrase, setActivePhrase] = useState<Phrase | null>(null);
  const [phraseToEdit, setPhraseToEdit] = useState<Phrase | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');
  
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3500);
  };
  
  const loadInitialData = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const [profile, catalog, dynamicShopData] = await Promise.all([
        apiService.getUserProfile(token),
        apiService.getCatCatalog(),
        apiService.getShopData(),
      ]);
      setUserProfile(profile);
      setAllImages(catalog);
      setShopData(dynamicShopData);
    } catch (err) {
      console.error("Failed to load initial data", err);
      setError("Failed to load your data. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated, user, loadInitialData]);

  const saveData = useCallback(async (data: Partial<UserProfile['data']>) => {
    if (!userProfile) return;
    try {
        const token = await getAccessTokenSilently();
        await apiService.saveUserData(token, data);
    } catch (err) {
        console.error("Failed to save user data", err);
        showToast("Error saving progress.");
    }
  }, [userProfile, getAccessTokenSilently]);


  const handlePurchaseEnvelope = async (envelopeId: EnvelopeTypeId) => {
    if (!userProfile || !shopData) return;
    
    const envelope = shopData.envelopes.find(e => e.id === envelopeId);
    if (!envelope) return;

    // Cost calculation is now done on the backend, but we check here for UI purposes.
    // A more robust solution would re-calculate or get cost from backend pre-purchase.
    const cost = envelope.baseCost + ((userProfile.data.playerStats.level - 1) * envelope.costIncreasePerLevel);

    if (userProfile.data.coins < cost) {
        showToast("¡No tienes suficientes monedas!");
        return;
    }

    try {
      const token = await getAccessTokenSilently();
      const result = await apiService.purchaseEnvelope(token, envelopeId);
      
      soundService.play('reward');
      
      setUserProfile(prev => {
        if (!prev) return null;
        return {
            ...prev,
            data: {
                ...prev.data,
                coins: result.newCoins,
                unlockedImageIds: [...new Set([...prev.data.unlockedImageIds, ...result.newImages.map(img => img.id)])]
            }
        };
      });

      setNewlyUnlockedImages(result.newImages);
      setOpenedEnvelopeName(envelope.name);
      setEnvelopeModalOpen(true);
      setShopModalOpen(false);

    } catch (err) {
        console.error("Purchase failed", err);
        showToast(err instanceof Error ? err.message : "Error al realizar la compra.");
    }
  };

  const handleSelectImage = async (phraseId: string, imageId: number | null) => {
      if (!userProfile) return;
      const updatedPhrases = userProfile.data.phrases.map(p => 
          p.id === phraseId ? { ...p, selectedImageId: imageId } : p
      );
      setUserProfile({ ...userProfile, data: { ...userProfile.data, phrases: updatedPhrases }});
      await saveData({ phrases: updatedPhrases });
      setImageSelectorOpen(false);
      setActivePhrase(null);
  };

  const handleSavePhrase = async (data: { text: string; selectedImageId: number | null; isPublic: boolean }) => {
    if (!userProfile) return;
    let updatedPhrases: Phrase[];
    const phraseId = phraseToEdit ? phraseToEdit.id : `custom_${Date.now()}`;

    if (phraseToEdit) {
      updatedPhrases = userProfile.data.phrases.map(p => p.id === phraseId ? {...p, ...data} : p);
    } else {
      const newPhrase: Phrase = { id: phraseId, ...data, isCustom: true };
      updatedPhrases = [...userProfile.data.phrases, newPhrase];
    }
    setUserProfile({ ...userProfile, data: { ...userProfile.data, phrases: updatedPhrases }});
    await saveData({ phrases: updatedPhrases });
    setCustomPhraseModalOpen(false);
    setPhraseToEdit(null);
  };

  const handleDeletePhrase = async (phraseId: string) => {
    if(!userProfile) return;
    const updatedPhrases = userProfile.data.phrases.filter(p => p.id !== phraseId);
    setUserProfile({ ...userProfile, data: { ...userProfile.data, phrases: updatedPhrases }});
    await saveData({ phrases: updatedPhrases });
    setCustomPhraseModalOpen(false);
    setPhraseToEdit(null);
  }

  const handleSaveProfile = async (username: string, bio: string) => {
    if (!userProfile) return;
    const token = await getAccessTokenSilently();
    await apiService.updateProfile(token, { username, bio });
    setUserProfile({ ...userProfile, username: username, data: { ...userProfile.data, bio } });
    setEditProfileModalOpen(false);
    showToast("Profile updated successfully!");
  }

  const handleSpeak = (text: string) => {
    ttsService.speak(text);
  };
  
  const handleGameEnd = async (results: { coinsEarned: number; xpEarned: number }) => {
    if (!userProfile) return;
    // Update UI immediately for responsiveness
    const updatedProfile = {
      ...userProfile,
      data: {
        ...userProfile.data,
        coins: userProfile.data.coins + results.coinsEarned,
      }
    };
    setUserProfile(updatedProfile);
    showToast(`+${results.coinsEarned} monedas!`);
    
    // Send results to backend to process bonuses and missions
    try {
      const token = await getAccessTokenSilently();
      await apiService.saveGameResults(token, results);
      // Optionally, re-fetch profile data to get coin bonuses from friends
      // For now, we rely on the optimistic update.
    } catch (err) {
      console.error("Failed to save game results", err);
      // Revert optimistic update if backend call fails
      setUserProfile(userProfile);
      showToast("Error saving game results.");
    }
  };

  if (isAuthLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="w-screen h-screen flex justify-center items-center bg-paper">
        <SpinnerIcon className="w-12 h-12 animate-spin text-ink" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  if (error || !userProfile) {
    return <div className="text-center p-8 text-red-600">{error || "User profile could not be loaded."}</div>;
  }

  const unlockedImages = allImages.filter(img => userProfile.data.unlockedImageIds.includes(img.id));

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage
          phrases={userProfile.data.phrases}
          allImages={allImages}
          onPhraseClick={(phrase, image) => setFullDisplayData({ phrase, image })}
          onSelectImageClick={(phrase) => { setActivePhrase(phrase); setImageSelectorOpen(true); }}
          onSpeak={handleSpeak}
          onAddNewPhrase={() => { setPhraseToEdit(null); setCustomPhraseModalOpen(true); }}
        />;
      case 'album':
        return <AlbumPage allImages={allImages} unlockedImageIds={userProfile.data.unlockedImageIds} />;
      case 'shop':
        return <ShopPage shopData={shopData} onOpenShop={() => setShopModalOpen(true)} />;
      case 'games':
        return <GameModeSelector 
          unlockedImages={unlockedImages}
          upgrades={userProfile.data.purchasedUpgrades}
          onGameEnd={handleGameEnd}
        />;
      case 'phrases':
        return <PhraseEditorPage 
          phrases={userProfile.data.phrases}
          allImages={allImages}
          onSetPhraseToEdit={(phrase) => { setPhraseToEdit(phrase); setCustomPhraseModalOpen(true); }}
          onDeletePhrase={handleDeletePhrase}
        />;
      case 'community':
        return <CommunityView currentUserProfile={userProfile} onProfileUpdate={loadInitialData} />;
      case 'admin':
        return userProfile.role === 'admin' ? <AdminPanel /> : <div>Access Denied</div>;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="bg-paper min-h-screen font-body text-ink">
      <Header 
        userProfile={userProfile}
        onNavigate={setPage}
        onOpenProfile={() => setEditProfileModalOpen(true)}
        activePage={page}
      />
      <main className="pb-24 pt-20">
        {renderPage()}
      </main>
      <MobileMenu activePage={page} onNavigate={setPage} userProfile={userProfile} />

      {/* Modals */}
      <ShopModal 
        isOpen={isShopModalOpen}
        onClose={() => setShopModalOpen(false)}
        shopData={shopData}
        userProfile={userProfile}
        allImages={allImages}
        onPurchaseEnvelope={handlePurchaseEnvelope}
        onPurchaseUpgrade={() => { /* Implement upgrade purchase */ }}
      />
      <EnvelopeModal
        isOpen={isEnvelopeModalOpen}
        onClose={() => setEnvelopeModalOpen(false)}
        newImages={newlyUnlockedImages}
        envelopeName={openedEnvelopeName}
      />
      <ImageSelector
        isOpen={isImageSelectorOpen}
        onClose={() => setImageSelectorOpen(false)}
        onSelectImage={handleSelectImage}
        phrase={activePhrase}
        unlockedImages={unlockedImages}
      />
      <CustomPhraseModal
        isOpen={isCustomPhraseModalOpen}
        onClose={() => setCustomPhraseModalOpen(false)}
        onSave={handleSavePhrase}
        onDelete={handleDeletePhrase}
        phraseToEdit={phraseToEdit}
        unlockedImages={unlockedImages}
      />
       <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        currentUserProfile={userProfile}
        onSave={handleSaveProfile}
       />
      {fullDisplayData && (
        <FullDisplay
          phrase={fullDisplayData.phrase}
          image={fullDisplayData.image}
          onClose={() => setFullDisplayData(null)}
        />
      )}

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
    </div>
  );
};

export default App;
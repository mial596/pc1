import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Auth from './components/Auth';
import Header from './hooks/Header';
import MobileMenu from './components/MobileMenu';
import HomePage from './pages/HomePage';
import AlbumPage from './pages/AlbumPage';
import ShopPage from './pages/ShopPage';
import JuegosPage from './pages/JuegosPage';
import CommunityView from './components/CommunityView';
import AdminPanel from './components/AdminPanel';
import EnvelopeModal from './components/EnvelopeModal';
import ImageSelector from './components/ImageSelector';
import CustomPhraseModal from './components/CustomPhraseModal';
import FullDisplay from './components/FullDisplay';
import EditProfileModal from './components/EditProfileModal';
import Toast from './components/Toast';
import ReportModal from './components/ReportModal';
import TransactionHistoryModal from './components/TransactionHistoryModal';
import FolderManagerModal from './components/FolderManagerModal';
import CommentModal from './components/CommentModal';
import WelcomeTutorialModal from './components/WelcomeTutorialModal';
import { SpinnerIcon } from './hooks/Icons';
import { LOGO_URL } from './constants';

import * as apiService from './services/apiService';
import { soundService, ttsService } from './services/audioService';
import {
  UserProfile,
  CatImage,
  Phrase,
  EnvelopeTypeId,
  FullDisplayData,
  Envelope,
  GameUpgrade,
  Folder,
  PublicProfilePhrase,
} from './types';

type Page = 'home' | 'album' | 'shop' | 'games' | 'community' | 'admin';

const App: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, getAccessTokenSilently, user } = useAuth0();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allImages, setAllImages] = useState<CatImage[]>([]);
  const [shopData, setShopData] = useState<{ envelopes: Envelope[], upgrades: GameUpgrade[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<Page>('home');

  // Modal States
  const [isEnvelopeModalOpen, setEnvelopeModalOpen] = useState(false);
  const [isImageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [isCustomPhraseModalOpen, setCustomPhraseModalOpen] = useState(false);
  const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [isFolderManagerOpen, setFolderManagerOpen] = useState(false);
  const [isTransactionHistoryOpen, setTransactionHistoryOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [reportModalData, setReportModalData] = useState<{type: 'phrase' | 'comment', contentId: string} | null>(null);
  const [commentModalData, setCommentModalData] = useState<PublicProfilePhrase | null>(null);

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
    // We don't set loading to true here to avoid a full-screen loader on re-fetches
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
      setIsLoading(false); // Only set loading to false after the initial load
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
      const tutorialSeen = localStorage.getItem('pictocat_tutorial_seen');
      if (!tutorialSeen) {
        setIsTutorialOpen(true);
      }
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
        soundService.play('error');
    }
  }, [userProfile, getAccessTokenSilently]);


  const handlePurchaseEnvelope = async (envelopeId: EnvelopeTypeId) => {
    if (!userProfile || !shopData) return;
    
    const envelope = shopData.envelopes.find(e => e.id === envelopeId);
    if (!envelope) return;

    const cost = envelope.baseCost + ((userProfile.data.playerStats.level - 1) * envelope.costIncreasePerLevel);

    if (userProfile.data.coins < cost) {
        showToast("¡No tienes suficientes monedas!");
        return;
    }

    try {
      const token = await getAccessTokenSilently();
      const result = await apiService.purchaseEnvelope(token, envelopeId);
      
      soundService.play('reward');
      
      setUserProfile(result.updatedProfile);

      setNewlyUnlockedImages(result.newImages);
      setOpenedEnvelopeName(envelope.name);
      setEnvelopeModalOpen(true);

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

  const handleSavePhrase = async (data: { text: string; selectedImageId: number | null; visibility: 'public' | 'friends' | 'private'; folderId: string | null; }) => {
    if (!userProfile) return;
    let updatedPhrases: Phrase[];
    const phraseId = phraseToEdit ? phraseToEdit.id : `custom_${Date.now()}`;

    if (phraseToEdit) {
      updatedPhrases = userProfile.data.phrases.map(p => p.id === phraseId ? {...p, ...data} : p);
    } else {
      const newPhrase: Phrase = { id: phraseId, ...data, isCustom: true, isArchived: false };
      updatedPhrases = [...userProfile.data.phrases, newPhrase];
    }
    soundService.play('save');
    setUserProfile({ ...userProfile, data: { ...userProfile.data, phrases: updatedPhrases }});
    await saveData({ phrases: updatedPhrases });
    setCustomPhraseModalOpen(false);
    setPhraseToEdit(null);
  };

  const handleDeletePhrase = async (phraseId: string) => {
    if(!userProfile) return;
    const updatedPhrases = userProfile.data.phrases.filter(p => p.id !== phraseId);
    soundService.play('delete');
    setUserProfile({ ...userProfile, data: { ...userProfile.data, phrases: updatedPhrases }});
    await saveData({ phrases: updatedPhrases });
    setCustomPhraseModalOpen(false);
    setPhraseToEdit(null);
  }

  const handleArchivePhrase = async (phraseId: string, isArchived: boolean) => {
    if (!userProfile) return;
    const updatedPhrases = userProfile.data.phrases.map(p => p.id === phraseId ? { ...p, isArchived } : p);
    setUserProfile({ ...userProfile, data: { ...userProfile.data, phrases: updatedPhrases }});
    await saveData({ phrases: updatedPhrases });
  };
  
  const handleSaveFolder = async (folders: Folder[]) => {
      if (!userProfile) return;
      soundService.play('save');
      setUserProfile({ ...userProfile, data: { ...userProfile.data, folders }});
      await saveData({ folders });
  }

  const handleSaveProfile = async (profileData: { username: string; bio: string; profilePictureId: number | null }) => {
    if (!userProfile) return;
    const token = await getAccessTokenSilently();
    await apiService.updateProfile(token, profileData);
    
    // Refresh all data to ensure consistency
    await loadInitialData();

    setEditProfileModalOpen(false);
    showToast("Profile updated successfully!");
  }

  const handleSpeak = (text: string) => {
    ttsService.speak(text);
  };
  
  const handleGameEnd = useCallback(async (results: { coinsEarned: number; xpEarned: number }) => {
    if (!userProfile) return;
    
    showToast(`+${results.coinsEarned} monedas!`);
    
    try {
      const token = await getAccessTokenSilently();
      const updatedProfile = await apiService.saveGameResults(token, results);
      setUserProfile(updatedProfile);
    } catch (err) {
      console.error("Failed to save game results", err);
      showToast("Error saving game results.");
    }
  }, [userProfile, getAccessTokenSilently]);

  const handleReportSubmit = async (reason: string) => {
    if (!reportModalData) return;
    try {
      const token = await getAccessTokenSilently();
      await apiService.reportContent(token, reportModalData.type, reportModalData.contentId, reason);
      showToast("Report submitted. Thank you for your feedback.");
      setReportModalData(null);
    } catch (error) {
      console.error("Failed to submit report", error);
      showToast("Could not submit report.");
    }
  };

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
    localStorage.setItem('pictocat_tutorial_seen', 'true');
  };

  if (isAuthLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="w-screen h-screen flex flex-col justify-center items-center bg-paper gap-4">
        <img src={LOGO_URL} alt="PictoCat Logo" className="w-32 h-32" />
        <div className="flex items-center gap-3">
            <SpinnerIcon className="w-8 h-8 animate-spin text-ink" />
            <p className="font-bold text-xl text-ink/80">Cargando tus gatos...</p>
        </div>
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
          userProfile={userProfile}
          allImages={allImages}
          onPhraseClick={(phrase, image) => setFullDisplayData({ phrase, image })}
          onSelectImageClick={(phrase) => { setActivePhrase(phrase); setImageSelectorOpen(true); }}
          onSpeak={handleSpeak}
          onSetPhraseToEdit={(phrase) => { setPhraseToEdit(phrase); setCustomPhraseModalOpen(true); soundService.play('openModal'); }}
          onArchivePhrase={handleArchivePhrase}
          onOpenFolderManager={() => { setFolderManagerOpen(true); soundService.play('openModal'); }}
        />;
      case 'album':
        return <AlbumPage allImages={allImages} unlockedImageIds={userProfile.data.unlockedImageIds} />;
      case 'shop':
        return <ShopPage 
          shopData={shopData} 
          userProfile={userProfile}
          allImages={allImages}
          onPurchaseEnvelope={handlePurchaseEnvelope}
          onPurchaseUpgrade={() => { /* Implement upgrade purchase */ }}
        />;
      case 'games':
        return <JuegosPage 
          unlockedImages={unlockedImages}
          onGameEnd={handleGameEnd}
        />;
      case 'community':
        return <CommunityView currentUserProfile={userProfile} onProfileUpdate={loadInitialData} onReport={setReportModalData} onOpenComments={setCommentModalData}/>;
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
        onOpenTransactions={() => setTransactionHistoryOpen(true)}
        activePage={page}
      />
      <main className="pb-24 pt-20">
        {renderPage()}
      </main>
      <MobileMenu activePage={page} onNavigate={setPage} userProfile={userProfile} />

      {/* Modals */}
      <WelcomeTutorialModal isOpen={isTutorialOpen} onClose={handleCloseTutorial} />
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
        onClose={() => {setCustomPhraseModalOpen(false); soundService.play('closeModal');}}
        onSave={handleSavePhrase}
        onDelete={handleDeletePhrase}
        phraseToEdit={phraseToEdit}
        unlockedImages={unlockedImages}
        folders={userProfile.data.folders}
      />
       <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        currentUserProfile={userProfile}
        onSave={handleSaveProfile}
        unlockedImages={unlockedImages}
       />
       <ReportModal
        isOpen={!!reportModalData}
        onClose={() => setReportModalData(null)}
        onSubmit={handleReportSubmit}
        itemType={reportModalData?.type || 'phrase'}
       />
       <TransactionHistoryModal
        isOpen={isTransactionHistoryOpen}
        onClose={() => setTransactionHistoryOpen(false)}
       />
       <CommentModal
        isOpen={!!commentModalData}
        onClose={() => setCommentModalData(null)}
        phraseData={commentModalData}
        currentUserProfile={userProfile}
        onReport={setReportModalData}
       />
      <FolderManagerModal 
        isOpen={isFolderManagerOpen}
        onClose={() => {setFolderManagerOpen(false); soundService.play('closeModal');}}
        folders={userProfile.data.folders}
        onSave={handleSaveFolder}
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
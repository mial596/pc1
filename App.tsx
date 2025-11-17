import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { motion, AnimatePresence } from 'framer-motion';
import Auth from './components/Auth';
import Header from './components/Header';
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
import LevelUpModal from './components/LevelUpModal';
import RedeemCodeModal from './components/RedeemCodeModal';
import MissionsModal from './components/MissionsModal';
import LuckyBonusModal from './components/LuckyBonusModal';
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
  ShopFeaturedItem,
} from './types';
import { useLanguage } from './contexts/LanguageContext';

type Page = 'home' | 'album' | 'shop' | 'games' | 'community' | 'admin';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4
};


const App: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading, getAccessTokenSilently, user, logout } = useAuth0();
  const { t } = useLanguage();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allImages, setAllImages] = useState<CatImage[]>([]);
  const [shopData, setShopData] = useState<{ envelopes: Envelope[], upgrades: GameUpgrade[], featured: ShopFeaturedItem[] } | null>(null);
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
  const [isLevelUpModalOpen, setLevelUpModalOpen] = useState(false);
  const [isRedeemCodeModalOpen, setRedeemCodeModalOpen] = useState(false);
  const [isMissionsModalOpen, setMissionsModalOpen] = useState(false);
  const [luckyBonus, setLuckyBonus] = useState<number | null>(null);
  const [leveledUpTo, setLeveledUpTo] = useState(0);
  const [reportModalData, setReportModalData] = useState<{type: 'phrase' | 'comment', contentId: string} | null>(null);
  const [commentModalData, setCommentModalData] = useState<PublicProfilePhrase | null>(null);

  // Special Abilities State
  const [coinMultiplier, setCoinMultiplier] = useState<{ active: boolean; endTime: number }>({ active: false, endTime: 0 });

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
  
  const loadInitialData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
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
      setError(t('errorLoadData'));
    } finally {
      setIsLoading(false);
    }
  }, [getAccessTokenSilently, t]);

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
        showToast(t('errorSaveChanges'));
        soundService.play('error');
    }
  }, [userProfile, getAccessTokenSilently, t]);

  const handleSpecialAbilities = useCallback(async (images: CatImage[]) => {
      for (const image of images) {
          if (image.specialAbility === 'lucky') {
              const bonus = Math.floor(Math.random() * 200) + 50; // 50 to 250 coins
              setLuckyBonus(bonus);
              setUserProfile(prev => prev ? ({...prev, data: {...prev.data, coins: prev.data.coins + bonus}}) : null);
              await saveData({ coins: userProfile!.data.coins + bonus });
          } else if (image.specialAbility === 'multiplier') {
              setCoinMultiplier({ active: true, endTime: Date.now() + 10 * 60 * 1000 }); // 10 minutes
              showToast(t('multiplierActivated'));
          } else if (image.specialAbility === 'mission') {
              try {
                  const token = await getAccessTokenSilently();
                  await apiService.completeRandomMission(token);
                  showToast(t('missionCompleted'));
                  // Mission progress is updated on backend, no need to refresh profile here
              } catch (err) {
                  console.error("Failed to complete random mission", err);
              }
          }
      }
  }, [saveData, userProfile, getAccessTokenSilently, t]);


  const handlePurchaseEnvelope = async (envelopeId: EnvelopeTypeId) => {
    if (!userProfile || !shopData) return;
    
    const envelope = shopData.envelopes.find(e => e.id === envelopeId);
    if (!envelope) return;

    const cost = envelope.baseCost + ((userProfile.data.playerStats.level - 1) * envelope.costIncreasePerLevel);
    if (userProfile.data.coins < cost) {
        showToast(t('notEnoughCoins'));
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
      await apiService.claimMission(token, 'open_envelope', 1);
      
      handleSpecialAbilities(result.newImages);


    } catch (err) {
        console.error("Purchase failed", err);
        showToast(err instanceof Error ? err.message : t('errorPurchase'));
    }
  };

  const handlePurchaseFeaturedCat = async (catId: number, cost: number) => {
    if (!userProfile) return;
    if (userProfile.data.fishTokens < cost) {
        showToast(t('notEnoughFishTokens'));
        return;
    }
     try {
        const token = await getAccessTokenSilently();
        const { updatedProfile } = await apiService.purchaseFeaturedCat(token, catId);
        setUserProfile(updatedProfile);
        showToast(t('catAddedToCollection'));
        soundService.play('reward');
    } catch (err) {
        showToast(err instanceof Error ? err.message : t('errorPurchase'));
    }
  };

  const handlePurchasePremiumPass = async () => {
    if(!userProfile) return;
    if(userProfile.data.catPass.isPremium) return;
    const cost = 500;
    if(userProfile.data.fishTokens < cost) {
        showToast(t('notEnoughFishTokensPass'));
        return;
    }
     try {
        const token = await getAccessTokenSilently();
        const { updatedProfile } = await apiService.purchasePremiumPass(token);
        setUserProfile(updatedProfile);
        showToast(t('premiumPassActivated'));
        soundService.play('reward');
    } catch (err) {
        showToast(err instanceof Error ? err.message : t('errorActivatePass'));
    }
  };

  const handleClaimPassReward = async (level: number, type: 'free' | 'premium') => {
      try {
        const token = await getAccessTokenSilently();
        const { updatedProfile } = await apiService.claimCatPassReward(token, level, type);
        setUserProfile(updatedProfile);
        soundService.play('select');
    } catch (err) {
        showToast(err instanceof Error ? err.message : t('errorClaimReward'));
    }
  };

  const handleClaimMission = async (missionId: string) => {
       try {
        const token = await getAccessTokenSilently();
        const { updatedProfile } = await apiService.claimMissionReward(token, missionId);
        setUserProfile(updatedProfile);
        soundService.play('reward');
      } catch (err) {
        showToast(err instanceof Error ? err.message : t('errorClaimMission'));
      }
  }


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
    
    await loadInitialData(false);

    setEditProfileModalOpen(false);
    showToast(t('profileUpdated'));
  }

  const handleSpeak = (text: string) => {
    ttsService.speak(text);
  };
  
  const handleGameEnd = useCallback(async (results: { coinsEarned: number; xpEarned: number }) => {
    if (!userProfile) return;
    
    let finalCoins = results.coinsEarned;
    if (coinMultiplier.active && Date.now() < coinMultiplier.endTime) {
        finalCoins *= 2;
        showToast(t('multiplierBonus', { coins: finalCoins - results.coinsEarned }));
    }

    const oldLevel = userProfile.data.playerStats.level;
    showToast(`+${finalCoins} ${t('coins')}!`);
    
    try {
      const token = await getAccessTokenSilently();
      const updatedProfile = await apiService.saveGameResults(token, { ...results, coinsEarned: finalCoins });
      setUserProfile(updatedProfile);

      const newLevel = updatedProfile.data.playerStats.level;
      if (newLevel > oldLevel) {
          soundService.play('reward');
          setLeveledUpTo(newLevel);
          setLevelUpModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to save game results", err);
      showToast(t('errorSaveGame'));
    }
  }, [userProfile, getAccessTokenSilently, t, coinMultiplier]);

  const handleRouletteWin = async (coinsWon: number) => {
    if (!userProfile) return;
    const newCoins = userProfile.data.coins + coinsWon;
    setUserProfile({ ...userProfile, data: { ...userProfile.data, coins: newCoins } });
    await saveData({ coins: newCoins });
  };

  const handleReportSubmit = async (reason: string) => {
    if (!reportModalData) return;
    try {
      const token = await getAccessTokenSilently();
      await apiService.reportContent(token, reportModalData.type, reportModalData.contentId, reason);
      showToast(t('reportSubmitted'));
      setReportModalData(null);
    } catch (error) {
      console.error("Failed to submit report", error);
      showToast(t('errorReport'));
    }
  };

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
    localStorage.setItem('pictocat_tutorial_seen', 'true');
  };

  const handleRedeemCode = async (code: string) => {
      const token = await getAccessTokenSilently();
      const result = await apiService.redeemCoinCode(token, code);
      await loadInitialData(false);
      return result;
  };

  if (isAuthLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="w-screen h-screen flex flex-col justify-center items-center bg-background gap-4">
        <img src={LOGO_URL} alt="PictoCat Logo" className="w-32 h-32" />
        <div className="flex items-center gap-3">
            <SpinnerIcon className="w-8 h-8 animate-spin text-ink" />
            <p className="font-bold text-xl text-ink/80">{t('loadingCats')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  if (error || !userProfile) {
    return <div className="text-center p-8 text-red-600">{error || t('errorProfileLoad')}</div>;
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
          onRouletteWin={handleRouletteWin}
          onPurchaseFeaturedCat={handlePurchaseFeaturedCat}
          onPurchasePremiumPass={handlePurchasePremiumPass}
          onClaimPassReward={handleClaimPassReward}
        />;
      case 'games':
        return <JuegosPage 
          unlockedImages={unlockedImages}
          onGameEnd={handleGameEnd}
        />;
      case 'community':
        return <CommunityView currentUserProfile={userProfile} onProfileUpdate={() => loadInitialData(false)} onReport={setReportModalData} onOpenComments={setCommentModalData}/>;
      case 'admin':
        return userProfile.role === 'admin' ? <AdminPanel /> : <div>Access Denied</div>;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className={`bg-background min-h-screen font-body text-ink page-${page}`}>
      <Header userProfile={userProfile} onOpenMissions={() => setMissionsModalOpen(true)} coinMultiplier={coinMultiplier}/>
      <main className="pt-28 pb-28">
         <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              {renderPage()}
            </motion.div>
        </AnimatePresence>
      </main>
      <MobileMenu 
        activePage={page} 
        onNavigate={setPage} 
        userProfile={userProfile}
        onOpenProfile={() => setEditProfileModalOpen(true)}
        onOpenTransactions={() => setTransactionHistoryOpen(true)}
        onOpenRedeemCode={() => setRedeemCodeModalOpen(true)}
        onLogout={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      />

      {/* Modals */}
      <WelcomeTutorialModal isOpen={isTutorialOpen} onClose={handleCloseTutorial} />
      <LuckyBonusModal isOpen={luckyBonus !== null} onClose={() => setLuckyBonus(null)} coins={luckyBonus || 0} />
      <MissionsModal 
        isOpen={isMissionsModalOpen} 
        onClose={() => setMissionsModalOpen(false)}
        userProfile={userProfile}
        onClaimMission={handleClaimMission}
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
      <LevelUpModal 
        isOpen={isLevelUpModalOpen}
        onClose={() => setLevelUpModalOpen(false)}
        newLevel={leveledUpTo}
      />
      <RedeemCodeModal
        isOpen={isRedeemCodeModalOpen}
        onClose={() => setRedeemCodeModalOpen(false)}
        onRedeem={handleRedeemCode}
      />
      <FullDisplay
          phrase={fullDisplayData?.phrase ?? null}
          image={fullDisplayData?.image ?? null}
          onClose={() => setFullDisplayData(null)}
      />

      <AnimatePresence>
        {toastMessage && <Toast message={toastMessage} />}
      </AnimatePresence>
    </div>
  );
};

export default App;
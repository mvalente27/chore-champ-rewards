import { useEffect, useState, useCallback } from 'react';
import { 
  initializeAdMob, 
  showBannerAd, 
  hideBannerAd, 
  removeBannerAd,
  showInterstitialAd,
  showRewardedAd,
  isAdMobSupported 
} from '@/lib/admob';

export function useAdMob() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  useEffect(() => {
    const supported = isAdMobSupported();
    setIsSupported(supported);

    if (supported) {
      initializeAdMob().then(() => {
        setIsInitialized(true);
      });
    }
  }, []);

  const showBanner = useCallback(async () => {
    if (!isSupported) return;
    await showBannerAd();
    setIsBannerVisible(true);
  }, [isSupported]);

  const hideBanner = useCallback(async () => {
    if (!isSupported) return;
    await hideBannerAd();
    setIsBannerVisible(false);
  }, [isSupported]);

  const removeBanner = useCallback(async () => {
    if (!isSupported) return;
    await removeBannerAd();
    setIsBannerVisible(false);
  }, [isSupported]);

  const showInterstitial = useCallback(async () => {
    if (!isSupported) return false;
    return await showInterstitialAd();
  }, [isSupported]);

  const showRewarded = useCallback(async () => {
    if (!isSupported) return null;
    return await showRewardedAd();
  }, [isSupported]);

  return {
    isInitialized,
    isSupported,
    isBannerVisible,
    showBanner,
    hideBanner,
    removeBanner,
    showInterstitial,
    showRewarded,
  };
}

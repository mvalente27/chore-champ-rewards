import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdMobBannerSize, InterstitialAdPluginEvents, AdMobRewardItem, RewardAdPluginEvents } from '@capacitor-community/admob';

// Test Ad Unit IDs (replace with your real IDs for production)
const AD_UNIT_IDS = {
  // Android test IDs
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  // iOS test IDs
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
};

// Detect platform
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const adUnitIds = isIOS ? AD_UNIT_IDS.ios : AD_UNIT_IDS.android;

let isAdMobInitialized = false;

/**
 * Initialize AdMob - call this once when the app starts
 */
export async function initializeAdMob(): Promise<void> {
  if (isAdMobInitialized) return;
  
  try {
    await AdMob.initialize({
      // For testing, set to true. Set to false in production.
      initializeForTesting: true, // Set to false in production
    });
    isAdMobInitialized = true;
    console.log('AdMob initialized successfully');
  } catch (error) {
    console.error('AdMob initialization failed:', error);
  }
}

/**
 * Show a banner ad at the bottom of the screen
 */
export async function showBannerAd(): Promise<void> {
  if (!isAdMobInitialized) {
    await initializeAdMob();
  }

  const options: BannerAdOptions = {
    adId: adUnitIds.banner,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: true, // Set to false in production
  };

  try {
    await AdMob.showBanner(options);
    console.log('Banner ad shown');
  } catch (error) {
    console.error('Failed to show banner ad:', error);
  }
}

/**
 * Hide the banner ad
 */
export async function hideBannerAd(): Promise<void> {
  try {
    await AdMob.hideBanner();
    console.log('Banner ad hidden');
  } catch (error) {
    console.error('Failed to hide banner ad:', error);
  }
}

/**
 * Remove the banner ad completely
 */
export async function removeBannerAd(): Promise<void> {
  try {
    await AdMob.removeBanner();
    console.log('Banner ad removed');
  } catch (error) {
    console.error('Failed to remove banner ad:', error);
  }
}

/**
 * Show an interstitial ad (full-screen ad)
 * Good for natural transition points in the app
 */
export async function showInterstitialAd(): Promise<boolean> {
  if (!isAdMobInitialized) {
    await initializeAdMob();
  }

  try {
    // Prepare the ad
    await AdMob.prepareInterstitial({
      adId: adUnitIds.interstitial,
      isTesting: true, // Set to false in production
    });

    // Show the ad
    await AdMob.showInterstitial();
    console.log('Interstitial ad shown');
    return true;
  } catch (error) {
    console.error('Failed to show interstitial ad:', error);
    return false;
  }
}

/**
 * Show a rewarded ad - user watches ad to earn rewards
 * Perfect for earning bonus Quest Coins!
 */
export async function showRewardedAd(): Promise<AdMobRewardItem | null> {
  if (!isAdMobInitialized) {
    await initializeAdMob();
  }

  return new Promise(async (resolve) => {
    try {
      // Listen for reward event
      const rewardListener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        (reward: AdMobRewardItem) => {
          console.log('User earned reward:', reward);
          rewardListener.remove();
          resolve(reward);
        }
      );

      // Listen for ad dismissal without reward
      const dismissListener = await AdMob.addListener(
        RewardAdPluginEvents.Dismissed,
        () => {
          console.log('Rewarded ad dismissed');
          dismissListener.remove();
        }
      );

      // Prepare the ad
      await AdMob.prepareRewardVideoAd({
        adId: adUnitIds.rewarded,
        isTesting: true, // Set to false in production
      });

      // Show the ad
      await AdMob.showRewardVideoAd();
      console.log('Rewarded ad shown');
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      resolve(null);
    }
  });
}

/**
 * Check if ads are supported (only works in native app context)
 */
export function isAdMobSupported(): boolean {
  // Check if we're in a Capacitor native context
  return typeof (window as any).Capacitor !== 'undefined' && 
         (window as any).Capacitor.isNativePlatform();
}

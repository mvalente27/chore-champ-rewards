import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdMobBannerSize, InterstitialAdPluginEvents, AdMobRewardItem, RewardAdPluginEvents } from '@capacitor-community/admob';

// Your AdMob App ID: ca-app-pub-4921015020988476~7394189413
// This goes in AndroidManifest.xml, not here

// Production Ad Unit IDs
const AD_UNIT_IDS = {
  // Android - Your real IDs
  android: {
    banner: '', // Create in AdMob if needed
    interstitial: '', // Create in AdMob if needed
    rewarded: 'ca-app-pub-4921015020988476/7959932097', // Your rewarded ad unit
  },
  // iOS - Create these in AdMob when you add iOS support
  ios: {
    banner: '',
    interstitial: '',
    rewarded: '',
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
      // Set to false for production with real ads
      initializeForTesting: false,
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
      isTesting: false,
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

  return new Promise((resolve) => {
    void (async () => {
      let settled = false;
      let rewardListener: { remove: () => Promise<void> } | null = null;
      let dismissListener: { remove: () => Promise<void> } | null = null;

      const settle = async (reward: AdMobRewardItem | null) => {
        if (settled) return;
        settled = true;
        await Promise.allSettled([
          rewardListener?.remove() ?? Promise.resolve(),
          dismissListener?.remove() ?? Promise.resolve(),
        ]);
        resolve(reward);
      };

      try {
        // Listen for reward event
        rewardListener = await AdMob.addListener(
          RewardAdPluginEvents.Rewarded,
          (reward: AdMobRewardItem) => {
            console.log('User earned reward:', reward);
            void settle(reward);
          }
        );

        // Listen for ad dismissal without reward
        dismissListener = await AdMob.addListener(
          RewardAdPluginEvents.Dismissed,
          () => {
            console.log('Rewarded ad dismissed');
            void settle(null);
          }
        );

        // Prepare the ad
        await AdMob.prepareRewardVideoAd({
          adId: adUnitIds.rewarded,
          isTesting: false,
        });

        // Show the ad
        await AdMob.showRewardVideoAd();
        console.log('Rewarded ad shown');
      } catch (error) {
        console.error('Failed to show rewarded ad:', error);
        await settle(null);
      }
    })();
  });
}

/**
 * Check if ads are supported (only works in native app context)
 */
export function isAdMobSupported(): boolean {
  // Check if we're in a Capacitor native context
  type CapacitorWindow = Window & {
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  };

  const capacitorWindow = window as CapacitorWindow;
  return capacitorWindow.Capacitor?.isNativePlatform?.() === true;
}

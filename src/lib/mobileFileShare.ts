interface NavigatorLike {
  userAgent: string;
  maxTouchPoints: number;
  platform: string;
  canShare?: (data?: ShareData) => boolean;
}

export function isMobileNavigator(navigatorLike: NavigatorLike): boolean {
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(
    navigatorLike.userAgent,
  );
  const harmonyTouchDevice =
    /OpenHarmony|HarmonyOS|ArkWeb|HuaweiBrowser/i.test(
      navigatorLike.userAgent,
    ) && navigatorLike.maxTouchPoints > 0;
  const touchIPad =
    navigatorLike.platform === "MacIntel" && navigatorLike.maxTouchPoints > 1;

  return mobileUserAgent || harmonyTouchDevice || touchIPad;
}

export function supportsMobileFileShare(
  navigatorLike: NavigatorLike,
  file: File,
): boolean {
  if (!isMobileNavigator(navigatorLike) || !navigatorLike.canShare) return false;

  try {
    return navigatorLike.canShare({ files: [file] });
  } catch {
    return false;
  }
}

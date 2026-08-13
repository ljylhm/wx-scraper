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
  const touchIPad =
    navigatorLike.platform === "MacIntel" && navigatorLike.maxTouchPoints > 1;

  return mobileUserAgent || touchIPad;
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

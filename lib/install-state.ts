export type InstallPlatform = 'ios' | 'android' | 'desktop'
export function installPlatform(userAgent: string, platform: string, touchPoints: number): InstallPlatform {
  if (/iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && touchPoints > 1)) return 'ios'
  return /Android/i.test(userAgent) ? 'android' : 'desktop'
}
export function installedDisplay(standalone: boolean, iosStandalone: boolean, overlay: boolean) {
  return standalone || iosStandalone || overlay
}

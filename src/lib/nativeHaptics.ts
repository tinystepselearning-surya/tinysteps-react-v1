import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

const canUseNativeHaptics = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

const runNativeHaptic = (action: () => Promise<void>) => {
  if (!canUseNativeHaptics()) return;

  void action().catch(() => undefined);
};

export const hapticLight = () => {
  runNativeHaptic(() => Haptics.impact({ style: ImpactStyle.Light }));
};

export const hapticSelection = () => {
  runNativeHaptic(() => Haptics.selectionChanged());
};

export const hapticSuccess = () => {
  runNativeHaptic(() => Haptics.notification({ type: NotificationType.Success }));
};

export const hapticWarning = () => {
  runNativeHaptic(() => Haptics.notification({ type: NotificationType.Warning }));
};

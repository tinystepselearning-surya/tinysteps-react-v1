import { Capacitor } from '@capacitor/core';

export type TinyStepsNativePlatform = 'ios' | 'android' | null;

export const getTinyStepsNativePlatform = (): TinyStepsNativePlatform => {
  if (typeof window === 'undefined') return null;

  try {
    if (!Capacitor.isNativePlatform()) return null;
    const platform = String(Capacitor.getPlatform()).toLowerCase();
    return platform === 'ios' || platform === 'android' ? platform : null;
  } catch {
    const protocol = window.location?.protocol;
    return protocol === 'capacitor:' || protocol === 'ionic:' ? 'ios' : null;
  }
};

export const isTinyStepsNativeRuntime = () =>
  getTinyStepsNativePlatform() !== null;

export const isEditableElement = (element: Element | null): boolean => {
  if (!(element instanceof HTMLElement)) return false;
  const tag = element.tagName.toLowerCase();
  return tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    element.isContentEditable;
};

export const NATIVE_ANDROID_BACK_EVENT = 'tinysteps:native-android-back';

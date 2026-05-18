// Centralized haptic helpers — used for like, button taps, and success/error events.
// Gracefully no-ops when expo-haptics is unavailable.

let Haptics = null;
try {
  // Dynamic require so the module remains optional in dev environments.
  Haptics = require('expo-haptics');
} catch (_) {
  Haptics = null;
}

const safe = async (fn) => {
  try {
    await fn();
  } catch (_) {
    /* no-op */
  }
};

export const hapticLight = () =>
  safe(async () => {
    if (Haptics?.impactAsync && Haptics?.ImpactFeedbackStyle) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  });

export const hapticMedium = () =>
  safe(async () => {
    if (Haptics?.impactAsync && Haptics?.ImpactFeedbackStyle) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  });

export const hapticHeavy = () =>
  safe(async () => {
    if (Haptics?.impactAsync && Haptics?.ImpactFeedbackStyle) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  });

export const hapticSuccess = () =>
  safe(async () => {
    if (Haptics?.notificationAsync && Haptics?.NotificationFeedbackType) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  });

export const hapticWarning = () =>
  safe(async () => {
    if (Haptics?.notificationAsync && Haptics?.NotificationFeedbackType) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  });

export const hapticError = () =>
  safe(async () => {
    if (Haptics?.notificationAsync && Haptics?.NotificationFeedbackType) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  });

export default {
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticWarning,
  hapticError,
};

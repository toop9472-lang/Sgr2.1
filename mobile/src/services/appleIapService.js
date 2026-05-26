/**
 * Apple In-App Purchase service wrapper (StoreKit 2 mode).
 *
 * Public API:
 *   - initIAP()                  → call once at app startup (idempotent)
 *   - shutdownIAP()              → call on app teardown
 *   - fetchGiftProducts(skus)    → resolves to native Product[]
 *   - purchaseGiftProduct(sku)   → triggers the StoreKit purchase sheet and
 *                                  resolves with { transactionId, jws, productId }
 *                                  AFTER server-side verification succeeds.
 *
 * On iOS we send `jws` (the StoreKit 2 JWSTransaction string) to the backend.
 * On Android we send `purchaseToken` (Phase 2 follow-up).
 *
 * NOTE: react-native-iap requires a native build. It does NOT work in Expo Go.
 * The IAP module is dynamically required so the JS still loads on Expo Go
 * (with a friendly fallback) until the user does an `eas build`.
 */
import { Alert, Platform } from "react-native";

let RNIap = null;
let initialized = false;
let initInFlight = null;

// Try-require so Expo Go (where the native module is missing) still boots.
// Wrapped at module-init time so any failure here NEVER prevents the rest
// of the app (gift picker, ads, profile, etc.) from rendering.
try {
  // eslint-disable-next-line global-require
  const mod = require("react-native-iap");
  // Some versions export default { initConnection, ... }, others expose
  // top-level functions. Normalize so the rest of this file can rely on
  // a flat shape: { initConnection, getProducts, requestPurchase, ... }.
  RNIap = mod?.default && typeof mod.default === "object" ? mod.default : mod;
} catch (_) {
  RNIap = null;
}

export const isIAPAvailable = () => !!RNIap;

export const initIAP = async () => {
  if (!RNIap || initialized) return initialized;
  if (initInFlight) return initInFlight;
  initInFlight = (async () => {
    try {
      // StoreKit 2 mode on iOS — gives us JWS-signed transactions.
      if (RNIap.setup) {
        try {
          await RNIap.setup({ storekitMode: "STOREKIT2_MODE" });
        } catch (_) {
          /* older versions: setup may not exist; safe to ignore */
        }
      }
      const connected = await RNIap.initConnection();
      initialized = !!connected;
      return initialized;
    } catch (e) {
      console.warn("[IAP] init failed:", e?.message || e);
      initialized = false;
      return false;
    } finally {
      initInFlight = null;
    }
  })();
  return initInFlight;
};

export const shutdownIAP = async () => {
  if (!RNIap || !initialized) return;
  try {
    await RNIap.endConnection();
  } catch (_) {
    /* ignore */
  }
  initialized = false;
};

export const fetchGiftProducts = async (skus) => {
  if (!RNIap) return [];
  if (!initialized) await initIAP();
  if (!initialized || !Array.isArray(skus) || skus.length === 0) return [];
  try {
    if (RNIap.getProducts) {
      // react-native-iap >= 12 accepts { skus }, older versions accept the array directly
      try {
        return await RNIap.getProducts({ skus });
      } catch (_) {
        return await RNIap.getProducts(skus);
      }
    }
    return [];
  } catch (e) {
    console.warn("[IAP] getProducts failed:", e?.message || e);
    return [];
  }
};

/**
 * Extract the StoreKit 2 JWS string from a react-native-iap Purchase object.
 * Different lib versions expose it under slightly different fields, so we
 * try a chain of likely properties.
 */
const extractIosJws = (purchase) => {
  if (!purchase || Platform.OS !== "ios") return null;
  return (
    purchase.jwsRepresentationIOS ||
    purchase.jwsRepresentation ||
    purchase.verificationResultIOS ||
    purchase.transactionReceipt || // legacy fallback (SK1)
    null
  );
};

/**
 * Buy a single consumable gift product. Returns:
 *   { productId, transactionId, jws, platform, purchase }
 * or throws on failure (user cancel raises a friendly error too).
 *
 * This function does NOT call our backend itself — the caller (GiftPickerModal)
 * is responsible for calling /api/gifts/send with the receipt so we keep IAP
 * logic decoupled from the gift business logic.
 */
export const purchaseGiftProduct = async (sku) => {
  if (!RNIap) {
    throw new Error("شراء داخل التطبيق غير متاح في هذه النسخة (يحتاج بناء iOS).");
  }
  if (!initialized) await initIAP();
  if (!initialized) throw new Error("لم يتم الاتصال بـ StoreKit.");

  let purchase = null;
  try {
    if (RNIap.requestPurchase) {
      // v12 cross-platform API
      try {
        purchase = await RNIap.requestPurchase({
          request: {
            apple: { sku },
            google: { skus: [sku] },
          },
          type: "in-app",
        });
      } catch (_) {
        // Older API
        purchase = await RNIap.requestPurchase({ sku, skus: [sku] });
      }
    }
  } catch (e) {
    // Normalize cancel errors
    const code = e?.code || "";
    if (code === "E_USER_CANCELLED" || /cancel/i.test(e?.message || "")) {
      const err = new Error("تم إلغاء عملية الشراء.");
      err.userCancelled = true;
      throw err;
    }
    throw new Error(e?.message || "تعذر إكمال عملية الشراء.");
  }

  if (!purchase) throw new Error("لم يُرجع StoreKit أي عملية شراء.");

  const jws =
    Platform.OS === "ios" ? extractIosJws(purchase) : purchase.purchaseToken;
  const transactionId =
    purchase.transactionId ||
    purchase.originalTransactionIdentifierIOS ||
    purchase.transactionIdentifier ||
    null;

  return {
    productId: sku,
    transactionId: transactionId || "",
    jws: jws || "",
    platform: Platform.OS,
    purchase,
  };
};

/** Tell StoreKit / Play that we're done with the transaction (always consumable for gifts). */
export const finishPurchase = async (purchase) => {
  if (!RNIap || !purchase) return;
  try {
    if (RNIap.finishTransaction) {
      await RNIap.finishTransaction({ purchase, isConsumable: true });
    }
  } catch (e) {
    console.warn("[IAP] finishTransaction failed:", e?.message || e);
  }
};

export default {
  isIAPAvailable,
  initIAP,
  shutdownIAP,
  fetchGiftProducts,
  purchaseGiftProduct,
  finishPurchase,
};

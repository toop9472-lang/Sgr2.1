import React, { createContext, useContext, useRef } from "react";
import GiftCenter from "./GiftCenter";

/**
 * Provider mounts the GiftCenter overlay once at the root and exposes
 * `playLocal(gift)` to any descendant via the useGiftCenter() hook.
 */
const GiftCenterContext = createContext({ playLocal: () => {} });

export const GiftCenterProvider = ({ user, onGemsCredited, children }) => {
  const controllerRef = useRef(null);
  const api = {
    playLocal: (gift) => {
      if (controllerRef.current?.enqueue) {
        controllerRef.current.enqueue(gift);
      }
    },
  };
  return (
    <GiftCenterContext.Provider value={api}>
      {children}
      <GiftCenter
        user={user}
        controllerRef={controllerRef}
        onGemsCredited={onGemsCredited}
      />
    </GiftCenterContext.Provider>
  );
};

export const useGiftCenter = () => useContext(GiftCenterContext);

export default GiftCenterContext;

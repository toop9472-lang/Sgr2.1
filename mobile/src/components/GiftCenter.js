import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import GiftAnimationOverlay from "./GiftAnimationOverlay";
import { fetchPending } from "../services/giftsService";

/**
 * App-level controller that:
 *   1) Polls /api/gifts/pending/{user_id} every ~10s while the app is foreground,
 *      and once on resume.
 *   2) Queues incoming gifts and plays them one-by-one with the cinematic overlay.
 *   3) Exposes an imperative API (via `controller` ref prop) for local senders
 *      to immediately preview the animation without waiting for the next poll.
 *
 * Usage: mount once near the root of the app:
 *   <GiftCenter user={user} controllerRef={giftCenterRef} onGemsCredited={...} />
 *
 * Then anywhere in the app: giftCenterRef.current.enqueue(giftPayload)
 */
const POLL_INTERVAL_MS = 10_000;

const GiftCenter = ({ user, controllerRef, onGemsCredited }) => {
  const [active, setActive] = useState(null);
  const queueRef = useRef([]);
  const playingRef = useRef(false);
  const pollTimerRef = useRef(null);
  const lastUserIdRef = useRef(null);

  const playNext = useCallback(() => {
    if (playingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) {
      setActive(null);
      return;
    }
    playingRef.current = true;
    setActive(next);
  }, []);

  const enqueue = useCallback(
    (gift) => {
      if (!gift) return;
      queueRef.current.push(gift);
      if (!playingRef.current) playNext();
    },
    [playNext],
  );

  // Expose imperative API
  useEffect(() => {
    if (controllerRef) {
      controllerRef.current = { enqueue };
    }
    return () => {
      if (controllerRef) controllerRef.current = null;
    };
  }, [controllerRef, enqueue]);

  // Poll
  const userId = user?.id || user?.user_id;
  const doPoll = useCallback(async () => {
    if (!userId) return;
    const data = await fetchPending(userId);
    const gifts = Array.isArray(data?.gifts) ? data.gifts : [];
    for (const g of gifts) {
      queueRef.current.push(g);
      if (onGemsCredited && g.gems_awarded) {
        onGemsCredited(g.gems_awarded);
      }
    }
    if (!playingRef.current && queueRef.current.length) {
      playNext();
    }
  }, [onGemsCredited, playNext, userId]);

  useEffect(() => {
    if (lastUserIdRef.current === userId) return;
    lastUserIdRef.current = userId;
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (!userId) return;
    doPoll();
    pollTimerRef.current = setInterval(doPoll, POLL_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [doPoll, userId]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") doPoll();
    });
    return () => sub.remove();
  }, [doPoll]);

  return (
    <GiftAnimationOverlay
      gift={active}
      onDone={() => {
        playingRef.current = false;
        setActive(null);
        // Slight delay before next so users register one gift at a time
        setTimeout(() => playNext(), 250);
      }}
    />
  );
};

export default GiftCenter;

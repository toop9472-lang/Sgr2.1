// طير — Main shell (bottom nav + all screens). Checkout/Orders flow removed.
import React, { useEffect, useState } from "react";
import TairBottomNav from "./TairBottomNav";
import HomeScreen from "./HomeScreen";
import CreateListingScreen from "./CreateListingScreen";
import TripsScreen from "./TripsScreen";
import ProfileScreen from "./ProfileScreen";
import ForumScreen from "./ForumScreen";
import ForumPostScreen from "./ForumPostScreen";
import MessagesScreen, { ChatThreadScreen } from "./MessagesScreen";
import ListingDetailsScreen from "./ListingDetailsScreen";
import KycScreen from "./KycScreen";
import NotificationsScreen from "./NotificationsScreen";
import OnboardingScreen from "./OnboardingScreen";
import { InjectAnimations } from "./TairUI";
import { tairApi } from "./tairApi";

const ONBOARDING_KEY = "tair_onboarding_done";

export default function TairShell({ user, onLogout }) {
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY),
  );
  const [tab, setTab] = useState("home");
  const [overlay, setOverlay] = useState(null);
  const [unread, setUnread] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const uid = user?.id || user?.user_id;

  useEffect(() => {
    if (!uid) return;
    const load = () => {
      tairApi.chatUnreadCount(uid).then(setUnread).catch(() => {});
      tairApi.myNotifications(uid).then((d) => setUnreadNotifs(d.unread_count || 0)).catch(() => {});
    };
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [uid, tab, overlay]);

  // Global chat WebSocket — increment unread badges instantly
  useEffect(() => {
    if (!uid) return;
    const base = process.env.REACT_APP_BACKEND_URL || "";
    const wsUrl = base.replace(/^http/, "ws") + `/api/chat/ws?user_id=${encodeURIComponent(uid)}`;
    let ws;
    let reconnectTimer;
    let closed = false;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data);
            if (data.type === "message") {
              // Refresh unread counts fast
              tairApi.chatUnreadCount(uid).then(setUnread).catch(() => {});
              tairApi.myNotifications(uid).then((d) => setUnreadNotifs(d.unread_count || 0)).catch(() => {});
            }
          } catch (e) { /* ignore */ }
        };
        ws.onclose = () => {
          if (!closed) reconnectTimer = setTimeout(connect, 4000);
        };
        ws.onerror = () => {};
      } catch (e) { /* ignore */ }
    };
    connect();

    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      try { ws && ws.close(); } catch (e) { /* ignore */ }
    };
  }, [uid]);

  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
    document.title = "طير — سوق الطيور والحيوانات الأليفة";
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return (
      <>
        <InjectAnimations />
        <OnboardingScreen onComplete={completeOnboarding} />
      </>
    );
  }

  const openListing = (listingId) =>
    setOverlay({ name: "listing-details", payload: { listingId } });
  const openTrip = () => setTab("trips");
  const openPost = (postId) =>
    setOverlay({ name: "post-details", payload: { postId } });
  const openThread = (threadId) =>
    setOverlay({ name: "chat-thread", payload: { threadId } });

  if (overlay?.name === "create-listing") {
    return (
      <CreateListingScreen
        user={user}
        onBack={() => setOverlay(null)}
        onCreated={() => {
          setOverlay(null);
          setTab("home");
        }}
      />
    );
  }
  if (overlay?.name === "listing-details") {
    return (
      <ListingDetailsScreen
        user={user}
        listingId={overlay.payload.listingId}
        onBack={() => setOverlay(null)}
        onOpenThread={(threadId) => setOverlay({ name: "chat-thread", payload: { threadId } })}
      />
    );
  }
  if (overlay?.name === "post-details") {
    return (
      <ForumPostScreen
        user={user}
        postId={overlay.payload.postId}
        onBack={() => { setOverlay(null); setTab("forum"); }}
      />
    );
  }
  if (overlay?.name === "chat-thread") {
    return (
      <ChatThreadScreen
        user={user}
        threadId={overlay.payload.threadId}
        onBack={() => { setOverlay(null); setTab("messages"); }}
      />
    );
  }
  if (overlay?.name === "kyc") {
    return (
      <KycScreen
        user={user}
        onBack={() => setOverlay(null)}
      />
    );
  }
  if (overlay?.name === "notifications") {
    return (
      <NotificationsScreen
        user={user}
        onBack={() => setOverlay(null)}
        onOpenThread={(threadId) => setOverlay({ name: "chat-thread", payload: { threadId } })}
        onOpenListing={openListing}
      />
    );
  }

  return (
    <>
      <InjectAnimations />
      {tab === "home" && (
        <HomeScreen
          user={user}
          onOpenListing={openListing}
          onCreateListing={() => setOverlay({ name: "create-listing" })}
          onOpenMessages={() => setTab("messages")}
          onOpenNotifications={() => setOverlay({ name: "notifications" })}
          unreadMessages={unread}
          unreadNotifs={unreadNotifs}
        />
      )}
      {tab === "trips" && (
        <TripsScreen user={user} onOpenTrip={openTrip} />
      )}
      {tab === "messages" && (
        <MessagesScreen user={user} onOpenThread={openThread} />
      )}
      {tab === "forum" && (
        <ForumScreen user={user} onOpenPost={openPost} />
      )}
      {tab === "profile" && (
        <ProfileScreen
          user={user}
          onOpenListing={openListing}
          onOpenTrip={openTrip}
          onLogout={onLogout}
          onOpenKyc={() => setOverlay({ name: "kyc" })}
        />
      )}
      <TairBottomNav current={tab} onChange={setTab} unread={unread} />
    </>
  );
}

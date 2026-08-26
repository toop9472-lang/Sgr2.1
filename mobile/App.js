// طير — App root (Tair MVP)
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  I18nManager,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LanguageProvider } from "./src/i18n/LanguageContext";

import AuthScreen from "./src/screens/AuthScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import UserProfileScreen from "./src/screens/UserProfileScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import SupportScreen from "./src/screens/SupportScreen";
import PrivateMessagesScreen from "./src/screens/PrivateMessagesScreen";

import ListingsFeedScreen from "./src/screens/ListingsFeedScreen";
import CreateListingScreen from "./src/screens/CreateListingScreen";
import ListingDetailsScreen from "./src/screens/ListingDetailsScreen";
import TripsScreen from "./src/screens/TripsScreen";
import OrdersScreen from "./src/screens/OrdersScreen";

import BottomNav from "./src/components/BottomNav";
import api from "./src/services/api";

// Force RTL for the whole app.
try {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
} catch {}

const TABS = ["listings", "trips", "orders", "account"];

function TairApp() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [seenOnboarding, setSeenOnboarding] = useState(false);
  const [currentPage, setCurrentPage] = useState("listings");
  // Modal stack (route + params)
  const [modal, setModal] = useState(null);

  // Boot: load token and user
  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem("tair_seen_onboarding");
        setSeenOnboarding(seen === "1");
        const savedUser = await AsyncStorage.getItem("saqr_user");
        const token = await AsyncStorage.getItem("saqr_token");
        if (savedUser && token) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
        }
      } catch (e) {
        console.warn("boot error", e?.message);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const finishOnboarding = useCallback(async () => {
    await AsyncStorage.setItem("tair_seen_onboarding", "1");
    setSeenOnboarding(true);
  }, []);

  const onAuthed = useCallback(async (u, token) => {
    await AsyncStorage.setItem("saqr_user", JSON.stringify(u));
    if (token) await AsyncStorage.setItem("saqr_token", token);
    setUser(u);
    setCurrentPage("listings");
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(["saqr_user", "saqr_token", "admin_token"]);
    setUser(null);
    setModal(null);
    setCurrentPage("listings");
  }, []);

  // Navigation helpers ---------------
  const openListing = (listing) =>
    setModal({ name: "listing_details", params: { listingId: listing.listing_id } });
  const openCreateListing = () => setModal({ name: "create_listing" });
  const closeModal = () => setModal(null);

  const openChat = (otherUserId) =>
    setModal({ name: "private_chat", params: { otherUserId } });

  const openOrder = (order) =>
    setModal({ name: "order_details", params: { orderId: order.order_id } });

  const openTrip = (trip) =>
    setModal({ name: "trip_details", params: { tripId: trip.trip_id } });

  const orderListing = (listing) => {
    Alert.alert(
      "طلب جديد",
      "سيتم فتح محادثة مع البائع لإتمام الطلب. تابع في تبويب طلباتي.",
      [
        { text: "إلغاء", style: "cancel" },
        { text: "متابعة", onPress: () => openChat(listing.seller_id) },
      ],
    );
  };

  // ---------------- Render ----------------
  if (booting) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!seenOnboarding) {
    return <OnboardingScreen onComplete={finishOnboarding} />;
  }

  if (!user) {
    return <AuthScreen onAuthenticated={onAuthed} />;
  }

  // Modal stack
  if (modal) {
    switch (modal.name) {
      case "create_listing":
        return (
          <CreateListingScreen
            user={user}
            onCancel={closeModal}
            onDone={() => {
              closeModal();
              setCurrentPage("listings");
            }}
          />
        );
      case "listing_details":
        return (
          <ListingDetailsScreen
            user={user}
            listingId={modal.params.listingId}
            onBack={closeModal}
            onContactSeller={(sellerId) => openChat(sellerId)}
            onOrder={orderListing}
          />
        );
      case "private_chat":
        return (
          <PrivateMessagesScreen
            user={user}
            token={null}
            initialUserId={modal.params.otherUserId}
            onBack={closeModal}
          />
        );
      case "settings":
        return (
          <SettingsScreen
            user={user}
            onBack={closeModal}
            onLogout={logout}
          />
        );
      case "support":
        return <SupportScreen user={user} onBack={closeModal} />;
      case "user_profile":
        return (
          <UserProfileScreen
            userId={modal.params.userId}
            currentUser={user}
            onBack={closeModal}
          />
        );
      default:
        return null;
    }
  }

  // Main tabs
  let content = null;
  switch (currentPage) {
    case "listings":
      content = (
        <ListingsFeedScreen
          user={user}
          onOpenListing={openListing}
          onCreateListing={openCreateListing}
        />
      );
      break;
    case "trips":
      content = <TripsScreen user={user} onOpenTrip={openTrip} />;
      break;
    case "orders":
      content = <OrdersScreen user={user} onOpenOrder={openOrder} />;
      break;
    case "account":
      content = (
        <ProfileScreen
          user={user}
          onOpenSettings={() => setModal({ name: "settings" })}
          onOpenSupport={() => setModal({ name: "support" })}
          onLogout={logout}
          onNavigate={(page) => {
            if (page === "settings") setModal({ name: "settings" });
            else if (page === "support") setModal({ name: "support" });
            else if (page === "chat") openChat(null);
          }}
        />
      );
      break;
    default:
      content = null;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      {content}
      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </View>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <TairApp />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#c8fce6",
  },
});

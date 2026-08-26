// طير — Main authenticated shell (bottom nav + all screens)
import React, { useEffect, useState } from "react";
import TairBottomNav from "./TairBottomNav";
import HomeScreen from "./HomeScreen";
import CreateListingScreen from "./CreateListingScreen";
import TripsScreen from "./TripsScreen";
import OrdersScreen from "./OrdersScreen";
import ProfileScreen from "./ProfileScreen";
import ListingDetailsScreen from "./ListingDetailsScreen";
import CheckoutScreen from "./CheckoutScreen";
import OrderDetailsScreen from "./OrderDetailsScreen";
import RateOrderScreen from "./RateOrderScreen";
import OnboardingScreen from "./OnboardingScreen";
import { InjectAnimations } from "./TairUI";

const ONBOARDING_KEY = "tair_onboarding_done";

export default function TairShell({ user, onLogout }) {
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY),
  );
  const [tab, setTab] = useState("home");
  // Modal-ish stack. Only one overlay screen at a time.
  const [overlay, setOverlay] = useState(null);
  // overlay shape: { name: 'create-listing' | 'listing-details' | 'checkout' | 'order-details' | 'rate' , payload: ... }

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

  // Route rendering
  const openListing = (listingId) =>
    setOverlay({ name: "listing-details", payload: { listingId } });
  const openTrip = () => setTab("trips"); // trips have their own inline modal; fine for now
  const openOrder = (orderId) =>
    setOverlay({ name: "order-details", payload: { orderId } });

  // Overlay stack renders on top of everything (no bottom nav)
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
        onCheckout={(listing) =>
          setOverlay({ name: "checkout", payload: { listing } })
        }
      />
    );
  }
  if (overlay?.name === "checkout") {
    return (
      <CheckoutScreen
        user={user}
        listing={overlay.payload.listing}
        onBack={() => setOverlay({ name: "listing-details", payload: { listingId: overlay.payload.listing.listing_id } })}
        onCreated={(order) => {
          setOverlay({ name: "order-details", payload: { orderId: order.order_id } });
        }}
      />
    );
  }
  if (overlay?.name === "order-details") {
    return (
      <OrderDetailsScreen
        user={user}
        orderId={overlay.payload.orderId}
        onBack={() => {
          setOverlay(null);
          setTab("orders");
        }}
        onRate={(order) => setOverlay({ name: "rate", payload: { order } })}
      />
    );
  }
  if (overlay?.name === "rate") {
    return (
      <RateOrderScreen
        user={user}
        order={overlay.payload.order}
        onBack={() =>
          setOverlay({ name: "order-details", payload: { orderId: overlay.payload.order.order_id } })
        }
        onDone={() => {
          setOverlay({ name: "order-details", payload: { orderId: overlay.payload.order.order_id } });
        }}
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
        />
      )}
      {tab === "trips" && (
        <TripsScreen user={user} onOpenTrip={openTrip} />
      )}
      {tab === "orders" && (
        <OrdersScreen user={user} onOpenOrder={openOrder} />
      )}
      {tab === "profile" && (
        <ProfileScreen
          user={user}
          onOpenListing={openListing}
          onOpenTrip={openTrip}
          onLogout={onLogout}
        />
      )}
      <TairBottomNav current={tab} onChange={setTab} />
    </>
  );
}

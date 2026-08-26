import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import AuthCallback from "./components/AuthCallback";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import PaymentSuccess from "./components/PaymentSuccess";
import PaymentCancel from "./components/PaymentCancel";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import DownloadPage from "./pages/DownloadPage";
import SupportPage from "./pages/SupportPage";
import AppDocumentation from "./pages/AppDocumentation";
import DeleteAccountPage from "./pages/DeleteAccountPage";
import TairPage from "./pages/TairPage";
import TairShell from "./tair/TairShell";
import { Toaster } from "./components/ui/toaster";
import { toast } from "./hooks/use-toast";
import { LanguageProvider } from "./i18n/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Router wrapper to detect session_id in URL
function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return <MainApp />;
}

function MainApp() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(
    location.state?.user ? true : null,
  );
  const [user, setUser] = useState(location.state?.user || null);
  const [isLoading, setIsLoading] = useState(true);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  }, []);

  useEffect(() => {
    if (location.state?.user) {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      const adminToken = localStorage.getItem("admin_token");
      const savedAdmin = localStorage.getItem("admin_data");
      if (adminToken && savedAdmin) {
        setIsAdmin(true);
        setAdminData(JSON.parse(savedAdmin));
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [location.state]);

  const handleLogin = async (userData) => {
    setIsLoading(true);
    try {
      if (userData.isGuest) {
        setUser({ ...userData, joined_date: new Date().toISOString() });
        setIsAuthenticated(true);
        return;
      }
      setUser(userData);
      setIsAuthenticated(true);
      const welcomeShown = localStorage.getItem("welcome_shown_" + userData.id);
      if (!welcomeShown) {
        toast({
          title: "✅ مرحباً بك في طير!",
          description: `أهلاً ${userData.name} 🐦`,
        });
        localStorage.setItem("welcome_shown_" + userData.id, "true");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("user_token");
    setIsAuthenticated(false);
    setUser(null);
    toast({ title: "تم تسجيل الخروج", description: "نراك قريباً!" });
  };

  const handleAdminLogin = (admin) => {
    setIsAdmin(true);
    setAdminData(admin);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_data");
    setIsAdmin(false);
    setAdminData(null);
    toast({ title: "تم تسجيل الخروج", description: "نراك قريباً!" });
  };

  if (isLoading) {
    return (
      <div style={loaderStyles.wrap}>
        <div style={loaderStyles.card}>
          <img src="/tair_logo.png" alt="طير" style={loaderStyles.logo} />
          <p style={loaderStyles.text}>جاري التحميل…</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Admin */}
      <Route
        path="/admin/login"
        element={
          isAdmin ? (
            <Navigate to="/admin/dashboard" />
          ) : (
            <div className="dark admin-shell">
              <AdminLogin onAdminLogin={handleAdminLogin} />
            </div>
          )
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          isAdmin ? (
            <div className="dark admin-shell">
              <AdminDashboard admin={adminData} onLogout={handleAdminLogout} />
            </div>
          ) : (
            <Navigate to="/admin/login" />
          )
        }
      />

      {/* Payment (legacy — kept for backwards compat) */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />

      {/* Static */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/help" element={<SupportPage />} />
      <Route path="/docs" element={<AppDocumentation />} />
      <Route path="/documentation" element={<AppDocumentation />} />
      <Route path="/download" element={<DownloadPage />} />
      <Route path="/delete-account" element={<DeleteAccountPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Public marketing landing */}
      <Route path="/landing" element={<TairPage />} />

      {/* Main App (Tair) */}
      <Route
        path="/*"
        element={
          !isAuthenticated ? (
            <AuthPage
              onLogin={handleLogin}
              onGuestMode={handleLogin}
              onAdminLogin={handleAdminLogin}
            />
          ) : (
            <TairShell user={user} onLogout={handleLogout} />
          )
        }
      />
    </Routes>
  );
}

const loaderStyles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #c8fce6 0%, #7dd3fc 100%)",
  },
  card: { textAlign: "center" },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    boxShadow: "0 20px 50px rgba(6, 95, 70, 0.20)",
    animation: "tair-pulse 1.4s ease-in-out infinite",
  },
  text: {
    color: "#065f46",
    fontSize: 15,
    marginTop: 14,
    fontWeight: 700,
    fontFamily: "'Tajawal', system-ui",
  },
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <div className="App">
            <AppRouter />
            <Toaster />
          </div>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

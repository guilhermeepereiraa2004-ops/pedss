import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import ApplicationProvider from "./components/ApplicationProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import { viewScope } from "./application/viewScope";
import { currentStoreAddress } from "./application/storeAddress";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Storefront = lazy(() => import("./pages/Storefront"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const Auth = lazy(() => import("./pages/Auth"));
const Tracking = lazy(() => import("./pages/Tracking"));
const DigitalMenu = lazy(() => import("./pages/DigitalMenu"));
const TrialSignup = lazy(() => import("./pages/TrialSignup"));
function ScrollReset() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}
function ApplicationRoutes({ subdomain }) {
  const location = useLocation();
  // Marketing has no session/data dependency and opens even during a database outage.
  if (location.pathname === "/" && !subdomain) return <Landing />;
  const viewKey = JSON.stringify(
    viewScope({
      pathname: location.pathname,
      search: location.search,
      hostname: window.location.hostname,
    }),
  );
  return (
    <ApplicationProvider viewKey={viewKey}>
      <Suspense
        fallback={
          <div className="loading-screen" role="status">
            Abrindo a Pedss…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Storefront manualStoreId={subdomain} />} />
          <Route path="/store/:storeId" element={<Storefront />} />
          <Route path="/menu/:storeId" element={<DigitalMenu />} />
          <Route path="/menu" element={<DigitalMenu manualStoreId={subdomain} />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute central>
                <SuperAdmin />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Auth key="login" />} />
          <Route path="/cadastro" element={<TrialSignup />} />
          <Route path="/configurar-acesso" element={<Auth key="setup" mode="setup" />} />
          <Route path="/recuperar" element={<Auth key="forgot" mode="forgot" />} />
          <Route path="/redefinir/:token" element={<Auth key="reset" mode="reset" />} />
          <Route path="/convite/:token" element={<Auth key="invite" mode="invite" />} />
          <Route path="/acompanhar" element={<Tracking />} />
          <Route path="/pedido/:token" element={<Tracking />} />
          <Route
            path="/acesso-negado"
            element={
              <div className="store-not-found">
                <h1>Seu perfil não tem acesso a esta área.</h1>
                <Link className="button button-dark" to="/login">
                  Escolher acesso
                </Link>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ApplicationProvider>
  );
}
export default function App() {
  const subdomain = currentStoreAddress() || null;
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollReset />
        <ApplicationRoutes subdomain={subdomain} />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

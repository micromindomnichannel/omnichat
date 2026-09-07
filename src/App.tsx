import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useStore } from './state/store';
import { useVertical } from './state/verticalContext';
import { Sidebar } from './app/shell/Sidebar';
import { TopBar } from './app/shell/TopBar';
import { VerticalSelect } from './app/onboarding/VerticalSelect';
import { BusinessInfo } from './app/onboarding/BusinessInfo';
import { ConnectChannels } from './app/onboarding/ConnectChannels';
import { KnowledgeSetup } from './app/onboarding/KnowledgeSetup';
import { AIReview } from './app/onboarding/AIReview';
import { Finish } from './app/onboarding/Finish';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Overview } from './pages/Overview';
import { Inbox } from './pages/Inbox';
import { Customers } from './pages/Customers';
import { Orders } from './pages/Orders';
import { Appointments } from './pages/Appointments';
import { Products } from './pages/Products';
import { Services } from './pages/Services';
import { Automations } from './pages/Automations';
import { Knowledge } from './pages/Knowledge';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Admin } from './pages/Admin';
import { Demo } from './pages/Demo';
import { Scheduler } from './pages/Scheduler';
import { Toast } from './components/shared/Toast';
import { api } from './services/api';
import { isAdmin } from './services/session';

// Session guard: the server cookie is the source of truth. localStorage is only
// an optimistic hint so first paint isn't blocked on the network.
function useSession() {
  const [status, setStatus] = useState<'checking' | 'in' | 'out'>(() =>
    localStorage.getItem('orbit_authenticated') === 'true' ? 'in' : 'checking'
  );
  useEffect(() => {
    let cancelled = false;
    api.me().then((me) => {
      if (cancelled) return;
      if (me?.user) {
        localStorage.setItem('orbit_authenticated', 'true');
        localStorage.setItem('orbit_memberships', JSON.stringify(me.memberships || []));
        setStatus('in');
      } else {
        localStorage.removeItem('orbit_authenticated');
        setStatus('out');
      }
    });
    return () => { cancelled = true; };
  }, []);
  return status;
}

function App() {
  const { state, dispatch } = useStore();
  const { vertical } = useVertical();
  const location = useLocation();
  const navigate = useNavigate();
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});

  const isLanding = location.pathname === '/' || location.pathname === '/landing';
  const isLogin = location.pathname === '/login';
  const isSignup = location.pathname === '/signup';
  const isOnboarding = location.pathname === '/onboarding';
  const isVerticalSelect = location.pathname === '/select-vertical';
  const isDemo = location.pathname === '/demo';
  const session = useSession();

  // Public routes (no auth needed)
  if (isLanding) {
    return <Landing />;
  }

  if (isLogin) {
    if (session === 'in') return <Navigate to="/overview" replace />;
    return <Login />;
  }

  if (isSignup) {
    if (session === 'in') return <Navigate to="/overview" replace />;
    return <Signup />;
  }

  if (isDemo) {
    return <Demo />;
  }

  if (session === 'checking') {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--stone-gray)', fontSize: 14 }}>Checking session…</div>;
  }

  if (session === 'out') {
    return <Navigate to="/login" replace />;
  }

  if (isVerticalSelect) {
    return <VerticalSelect />;
  }

  if (isOnboarding) {

    const steps = [
      <VerticalSelect key="0" onSelect={(v) => { setOnboardingData({ ...onboardingData, vertical: v }); setOnboardingStep(1); }} />,
      <BusinessInfo key="1" data={onboardingData} onNext={(d) => { setOnboardingData(d); setOnboardingStep(2); }} onBack={() => setOnboardingStep(0)} />,
      <ConnectChannels key="2" data={onboardingData} onNext={(d) => { setOnboardingData(d); setOnboardingStep(3); }} onBack={() => setOnboardingStep(1)} />,
      <KnowledgeSetup key="3" data={onboardingData} onNext={(d) => { setOnboardingData(d); setOnboardingStep(4); }} onBack={() => setOnboardingStep(2)} />,
      <AIReview key="4" data={onboardingData} onNext={() => setOnboardingStep(5)} onBack={() => setOnboardingStep(3)} />,
      <Finish key="5" data={onboardingData} onComplete={() => {
        const name = onboardingData.businessName || 'My Business';
        dispatch({ type: 'UPDATE_BUSINESS', field: 'businessName', value: name });
        // Best-effort backend sync (offline-safe — onboarding completes regardless).
        api.updateSettings({ business_name: name, industry: onboardingData.industry });
        dispatch({ type: 'COMPLETE_ONBOARDING' });
        navigate('/overview');
      }} onBack={() => setOnboardingStep(4)} />
    ];

    return (
      <div style={{ height: '100vh', background: 'var(--surface-0)' }}>
        {steps[onboardingStep]}
      </div>
    );
  }

  // Past this point session === 'in' (checked above).
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar />
        <main style={{ flex: 1, overflow: 'auto', padding: '24px', background: 'var(--surface-0)' }}>
          <Routes>
            <Route path="/overview" element={<Overview />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/products" element={<Products />} />
            <Route path="/services" element={<Services />} />
            <Route path="/automations" element={<Automations />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={isAdmin() ? <Admin /> : <Navigate to="/overview" replace />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </main>
      </div>
      <Toast />
    </div>
  );
}

export default App;

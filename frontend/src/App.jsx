import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NotificationPanel from './components/NotificationPanel';
import CommandPalette from './components/CommandPalette';
import Dashboard from './pages/Dashboard';
import DonorList from './pages/DonorList';
import DonorForm from './pages/DonorForm';
import RecipientList from './pages/RecipientList';
import RecipientForm from './pages/RecipientForm';
import MatchFinder from './pages/MatchFinder';
import ExchangeView from './pages/ExchangeView';
import HospitalView from './pages/HospitalView';
import AuditLog from './pages/AuditLog';
import Analytics from './pages/Analytics';
import SqlInspector from './pages/SqlInspector';
import LoginPage from './pages/LoginPage';
import { SocketProvider, useSocket } from './hooks/useSocket';
import { getUnreadAlertCount } from './api/client';
import ClickSpark from './components/reactbits/ClickSpark';
import Particles from './components/reactbits/Particles';
import HamsterEngineModal from './components/HamsterEngineModal';
import CrazyEntranceReveal from './components/CrazyEntranceReveal';
import OrganTransitRadarModal from './components/OrganTransitRadarModal';
import VitalAICopilotDrawer from './components/VitalAICopilotDrawer';
import SurgicalManifestModal from './components/SurgicalManifestModal';

function AppContent() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [hamsterModalOpen, setHamsterModalOpen] = useState(false);
  const [radarModalOpen, setRadarModalOpen] = useState(false);
  const [copilotDrawerOpen, setCopilotDrawerOpen] = useState(false);
  const [manifestModalOpen, setManifestModalOpen] = useState(false);
  const [manifestData, setManifestData] = useState(null);
  const [showEntranceReveal, setShowEntranceReveal] = useState(() => {
    return !sessionStorage.getItem('vn_entrance_shown');
  });
  const [revealKey, setRevealKey] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toasts, dismissToast, lastEvent } = useSocket();
  const location = useLocation();

  const isLoginPage = location.pathname === '/login';

  const handleTriggerEntranceReveal = () => {
    setRevealKey((k) => k + 1);
    setShowEntranceReveal(true);
  };

  const refreshUnread = () => {
    getUnreadAlertCount()
      .then((res) => setUnreadCount(res.count))
      .catch(() => {});
  };

  useEffect(() => {
    refreshUnread();
  }, [lastEvent]);

  // Global event bridge for quick cross-component modal opening
  useEffect(() => {
    const handleOpenManifest = (e) => {
      setManifestData(e.detail || null);
      setManifestModalOpen(true);
    };
    const handleOpenRadar = () => {
      setRadarModalOpen(true);
    };
    const handleOpenCopilot = () => {
      setCopilotDrawerOpen(true);
    };

    window.addEventListener('open-surgical-manifest', handleOpenManifest);
    window.addEventListener('open-transit-radar', handleOpenRadar);
    window.addEventListener('open-vitalai-copilot', handleOpenCopilot);

    return () => {
      window.removeEventListener('open-surgical-manifest', handleOpenManifest);
      window.removeEventListener('open-transit-radar', handleOpenRadar);
      window.removeEventListener('open-vitalai-copilot', handleOpenCopilot);
    };
  }, []);

  return (
    <ClickSpark sparkColor="#38BDF8" sparkCount={8} sparkRadius={24} duration={400}>
      {/* Crazy Entrance Reveal Cyber-Biometric Overlay */}
      {showEntranceReveal && (
        <CrazyEntranceReveal
          key={revealKey}
          forceStart={true}
          onComplete={() => setShowEntranceReveal(false)}
        />
      )}

      <div
        className={`flex min-h-screen bg-surface-0 text-ink-primary relative font-sans overflow-x-hidden ${
          showEntranceReveal ? 'scale-[0.98] blur-[2px] transition-all duration-700 ease-out' : ''
        }`}
      >
        {/* Dynamic Ambient Aurora Background Floating Orbs */}
        <div className="aurora-orb-cyan" />
        <div className="aurora-orb-violet" />
        <div className="aurora-orb-emerald" />

        {/* Ambient Interactive Bio-Dust Particles (React Bits) */}
        <Particles particleCount={32} particleColors={['#38BDF8', '#10B981', '#818CF8', '#F59E0B']} />

      {/* Global Command Palette (⌘K / Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={(val, toggle) => setCommandPaletteOpen(toggle ? !commandPaletteOpen : false)}
        onOpenHamsterModal={() => setHamsterModalOpen(true)}
        onTriggerEntranceReveal={handleTriggerEntranceReveal}
        onOpenRadarModal={() => setRadarModalOpen(true)}
        onOpenCopilotDrawer={() => setCopilotDrawerOpen(true)}
        onOpenManifestModal={() => setManifestModalOpen(true)}
      />

      {/* ACID Hamster Compute Core Diagnostic Modal */}
      <HamsterEngineModal
        isOpen={hamsterModalOpen}
        onClose={() => setHamsterModalOpen(false)}
      />

      {/* Organ Transit Radar & Medevac Flight Tracker Modal */}
      <OrganTransitRadarModal
        isOpen={radarModalOpen}
        onClose={() => setRadarModalOpen(false)}
      />

      {/* VitalAI Clinical Allocation Copilot Drawer */}
      <VitalAICopilotDrawer
        isOpen={copilotDrawerOpen}
        onClose={() => setCopilotDrawerOpen(false)}
      />

      {/* Cryptographic Surgical Manifest & Chain of Custody Modal */}
      <SurgicalManifestModal
        isOpen={manifestModalOpen}
        onClose={() => setManifestModalOpen(false)}
        allocationData={manifestData}
      />

      {/* Restrained Inline Toast Stream (§2.3) */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="panel pointer-events-auto p-3 bg-surface-1 border-line shadow-lg flex items-start gap-2.5 w-76 text-xs font-mono"
          >
            <span className="w-2 h-2 rounded-full bg-signal-info mt-1 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-ink-primary truncate text-[11px]">{toast.title}</p>
              <p className="text-[10px] text-ink-secondary leading-snug mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-ink-secondary hover:text-ink-primary text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Floating VitalAI Quick Action Trigger Pill */}
      {!isLoginPage && (
        <button
          onClick={() => setCopilotDrawerOpen(true)}
          className="fixed bottom-5 right-5 z-40 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-1/95 border border-line hover:border-emerald-500/50 text-ink-primary shadow-xl backdrop-blur-md text-xs font-mono group hover:scale-105 transition-all cursor-pointer"
          title="Open VitalAI Clinical Allocation Copilot"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-ink-secondary group-hover:text-ink-primary">VitalAI Copilot</span>
          <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-400/10">🤖</span>
        </button>
      )}

      {/* Persistent Left Rail */}
      {!isLoginPage && (
        <Sidebar
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenHamsterModal={() => setHamsterModalOpen(true)}
          onTriggerEntranceReveal={handleTriggerEntranceReveal}
          onOpenRadarModal={() => setRadarModalOpen(true)}
          onOpenCopilotDrawer={() => setCopilotDrawerOpen(true)}
          unreadCount={unreadCount}
        />
      )}

      {/* Main Terminal Screen */}
      <main className="flex-1 min-w-0 h-screen overflow-auto relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/donors" element={<DonorList />} />
          <Route path="/donors/new" element={<DonorForm />} />
          <Route path="/recipients" element={<RecipientList />} />
          <Route path="/recipients/new" element={<RecipientForm />} />
          <Route path="/match" element={<MatchFinder />} />
          <Route path="/match/:donorId" element={<MatchFinder />} />
          <Route path="/exchange" element={<ExchangeView />} />
          <Route path="/hospitals" element={<HospitalView />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/sql" element={<SqlInspector />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>

      {/* Clinical Triage Alert Drawer */}
      <NotificationPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onAlertChange={refreshUnread}
      />
    </div>
    </ClickSpark>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </SocketProvider>
  );
}

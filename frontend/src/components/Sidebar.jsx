import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  HeartPulse,
  Users,
  Dna,
  GitCompare,
  Building2,
  FileSpreadsheet,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Sun,
  Moon,
  Sparkles,
  Navigation,
  Bot,
  Cpu,
  Database
} from 'lucide-react';
import VitalNodeLogo from './VitalNodeLogo';
import { useSocket } from '../hooks/useSocket';
import DecryptedText from './reactbits/DecryptedText';

export default function Sidebar({
  onOpenNotifications,
  onOpenCommandPalette,
  onOpenHamsterModal,
  onTriggerEntranceReveal,
  onOpenRadarModal,
  onOpenCopilotDrawer,
  unreadCount = 0
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [statePulse, setStatePulse] = useState(false);
  const { lastEvent } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('vn_user') || '{"username":"coordinator","role":"Coordinator"}');
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || localStorage.getItem('vn_theme') || 'blueprint';
  });

  const handleThemeChange = (newTheme) => {
    const target = newTheme || (theme === 'blueprint' ? 'dark' : 'blueprint');
    setTheme(target);
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('vn_theme', target);
  };

  useEffect(() => {
    if (lastEvent) {
      setStatePulse(true);
      const timer = setTimeout(() => setStatePulse(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  const links = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/match', label: 'Match Finder', icon: Dna },
    { to: '/exchange', label: 'Exchange Network', icon: GitCompare },
    { to: '/donors', label: 'Donor Registry', icon: HeartPulse },
    { to: '/recipients', label: 'Waitlist Registry', icon: Users },
    { to: '/hospitals', label: 'Hospital Command', icon: Building2 },
    { to: '/audit', label: 'Audit Ledger', icon: FileSpreadsheet },
    { to: '/analytics', label: 'System Analytics', icon: BarChart3 },
    { to: '/sql', label: 'SQL Inspector', icon: Database },
  ];

  const handleLogout = () => {
    localStorage.removeItem('vn_token');
    localStorage.removeItem('vn_user');
    navigate('/login');
  };

  // Collapsed icon-only button
  const CollapseIconBtn = ({ onClick, icon: Icon, title, colorClass = 'text-ink-secondary', children }) => (
    <button
      onClick={onClick}
      title={title}
      className={`w-full flex items-center justify-center py-2 rounded hover:bg-surface-2 transition-all group ${colorClass} cursor-pointer`}
    >
      {children || <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
    </button>
  );

  return (
    <aside
      className={`bg-surface-1/95 backdrop-blur-xl border-r border-line h-screen sticky top-0 flex flex-col z-30 transition-[width] duration-200 select-none overflow-hidden shrink-0 ${
        collapsed ? 'w-[64px]' : 'w-[245px]'
      }`}
    >
      {/* ── Brand Header ─────────────────────────────── */}
      <div className="h-16 px-3 border-b border-line flex items-center justify-between shrink-0 bg-surface-1">
        <div className={`overflow-hidden transition-all duration-200 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <VitalNodeLogo
            size={34}
            showText={true}
            subtitle="ALLOCATION TERMINAL"
            animated={true}
          />
        </div>

        {collapsed && (
          <div className="w-full flex justify-center">
            <VitalNodeLogo size={30} showText={false} animated={true} />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-ink-secondary hover:text-ink-primary p-1.5 rounded hover:bg-surface-2 transition-all hover:scale-105 active:scale-95 shrink-0 hidden md:block"
          title={collapsed ? 'Expand terminal rail' : 'Collapse terminal rail'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Command Palette Trigger ───────────────────── */}
      <div className="px-2.5 pt-2.5 shrink-0">
        {collapsed ? (
          <CollapseIconBtn onClick={onOpenCommandPalette} icon={Search} title="Command Palette (⌘K)" colorClass="text-cyan-400">
            <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </CollapseIconBtn>
        ) : (
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-0/70 border border-line hover:border-cyan-500/50 text-ink-secondary hover:text-ink-primary text-xs font-mono transition-all group cursor-pointer"
            title="Open Command Terminal (⌘K)"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px]">Command Palette</span>
            </div>
            <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-surface-2 border border-line text-ink-secondary font-mono">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* ── Navigation Links ─────────────────────────── */}
      <nav className="p-2 space-y-0.5 mt-1 flex-1 overflow-y-auto overflow-x-hidden">
        {links.map((link) => {
          const Icon = link.icon;
          const active = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));

          return (
            <NavLink
              key={link.to}
              to={link.to}
              title={collapsed ? link.label : undefined}
              className={`group flex items-center gap-3 rounded text-xs font-medium transition-all duration-150 ${
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
              } ${
                active
                  ? 'bg-surface-2 text-ink-primary border-l-2 border-signal-info font-semibold shadow-sm'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-2/80'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                  active ? 'text-signal-info' : 'text-ink-secondary group-hover:text-signal-info'
                }`}
              />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Footer Controls ───────────────────────────── */}
      <div className="shrink-0 p-2.5 border-t border-line space-y-1.5 bg-surface-1">

        {/* Alert Queue */}
        {collapsed ? (
          <div className="relative">
            <CollapseIconBtn onClick={onOpenNotifications} icon={Bell} title="Alert Queue" colorClass="text-ink-secondary">
              <div className="relative">
                <Bell className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-signal-critical text-[9px] font-bold text-white flex items-center justify-center px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </CollapseIconBtn>
          </div>
        ) : (
          <button
            onClick={onOpenNotifications}
            className="w-full flex items-center justify-between p-2 rounded text-ink-secondary hover:text-ink-primary hover:bg-surface-2 transition-all cursor-pointer"
            title="Clinical Alerts Queue"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-signal-critical animate-pulse" />
                )}
              </div>
              <span className="text-xs font-medium">Alert Queue</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-signal-critical/20 text-signal-critical text-[10px] font-mono px-1.5 py-0.5 rounded border border-signal-critical/40 font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        {/* ACID Engine */}
        {collapsed ? (
          <CollapseIconBtn onClick={() => onOpenHamsterModal?.()} icon={Cpu} title="ACID Engine (Hamster Powered) — Click to inspect" colorClass="text-signal-stable">
            <span className="text-base group-hover:scale-125 transition-transform">🐹</span>
          </CollapseIconBtn>
        ) : (
          <button
            onClick={() => onOpenHamsterModal?.()}
            className="w-full text-left p-2.5 rounded bg-surface-0 border border-line hover:border-signal-info/50 hover:bg-surface-2/60 transition-all flex items-center justify-between text-[11px] font-mono group cursor-pointer"
            title="Inspect ACID Hamster Engine Core"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  statePulse ? 'bg-signal-info animate-ping' : 'bg-signal-stable'
                }`}
              />
              <span className="text-ink-secondary group-hover:text-ink-primary transition-colors flex items-center gap-1">
                <span>ACID ENGINE</span>
                <span className="opacity-0 group-hover:opacity-100 text-xs transition-opacity">🐹</span>
              </span>
            </div>
            <DecryptedText
              text="ONLINE"
              speed={45}
              maxIterations={8}
              animateOn="hover"
              className="text-signal-stable font-semibold text-[10px] tracking-wider"
            />
          </button>
        )}

        {/* Transit Radar */}
        {collapsed ? (
          <CollapseIconBtn onClick={() => onOpenRadarModal?.()} icon={Navigation} title="Live Organ Transit Radar" colorClass="text-signal-info">
            <div className="relative">
              <Navigation className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-signal-info animate-ping" />
            </div>
          </CollapseIconBtn>
        ) : (
          <button
            onClick={() => onOpenRadarModal?.()}
            className="w-full text-left p-2 rounded bg-surface-0 border border-line hover:border-signal-info/50 hover:bg-surface-2/60 transition-all flex items-center justify-between text-[11px] font-mono group cursor-pointer"
            title="Open Live Organ Transit Flight Radar"
          >
            <div className="flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-signal-info group-hover:rotate-45 transition-transform" />
              <span className="text-ink-secondary group-hover:text-ink-primary">TRANSIT RADAR</span>
            </div>
            <span className="text-[10px] text-signal-info font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-info animate-ping" />
              LIVE
            </span>
          </button>
        )}

        {/* VitalAI Copilot */}
        {collapsed ? (
          <CollapseIconBtn onClick={() => onOpenCopilotDrawer?.()} icon={Bot} title="VitalAI Clinical Copilot" colorClass="text-emerald-400">
            <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </CollapseIconBtn>
        ) : (
          <button
            onClick={() => onOpenCopilotDrawer?.()}
            className="w-full text-left p-2 rounded bg-surface-0 border border-line hover:border-emerald-500/50 hover:bg-surface-2/60 transition-all flex items-center justify-between text-[11px] font-mono group cursor-pointer"
            title="Open VitalAI Clinical Copilot Decision Drawer"
          >
            <div className="flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-ink-secondary group-hover:text-ink-primary">VITALAI COPILOT</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">AI 🤖</span>
          </button>
        )}

        {/* Entrance Reveal */}
        {collapsed ? (
          <CollapseIconBtn onClick={() => onTriggerEntranceReveal?.()} icon={Sparkles} title="Play Cinematic Entrance Reveal" colorClass="text-cyan-400">
            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          </CollapseIconBtn>
        ) : (
          <button
            onClick={() => onTriggerEntranceReveal?.()}
            className="w-full text-left p-2 rounded bg-surface-0 border border-line hover:border-cyan-500/50 hover:bg-surface-2/60 transition-all flex items-center justify-between text-[11px] font-mono group cursor-pointer"
            title="Play Cinematic Entrance Reveal Sequence"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span className="text-ink-secondary group-hover:text-ink-primary">ENTRANCE REVEAL</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-bold">PLAY ⚡</span>
          </button>
        )}

        {/* Theme Switcher */}
        {collapsed ? (
          <CollapseIconBtn
            onClick={() => handleThemeChange()}
            icon={theme === 'blueprint' ? Sun : Moon}
            title={theme === 'blueprint' ? 'Switch to Terminal Dark' : 'Switch to Augen Pro'}
            colorClass="text-ink-secondary"
          >
            {theme === 'blueprint' ? (
              <Moon className="w-4 h-4 text-signal-info hover:scale-110 transition-transform" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 hover:scale-110 transition-transform" />
            )}
          </CollapseIconBtn>
        ) : (
          <div className="flex items-center p-1 bg-surface-0 rounded-full border border-line text-[11px] font-mono">
            <button
              type="button"
              onClick={() => handleThemeChange('blueprint')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-full transition-all ${
                theme === 'blueprint'
                  ? 'bg-surface-1 text-ink-primary shadow-sm font-semibold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
              title="Augen Pro — Surgical white & electric blue light theme"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Augen Pro</span>
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-full transition-all ${
                theme === 'dark'
                  ? 'bg-surface-1 text-ink-primary shadow-sm font-semibold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
              title="Command Terminal dark mode"
            >
              <Moon className="w-3.5 h-3.5 text-signal-info" />
              <span>Terminal</span>
            </button>
          </div>
        )}

        {/* User Profile & Logout */}
        <div className={`flex items-center pt-1.5 border-t border-line ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="text-xs truncate max-w-[145px] font-mono">
              <p className="text-ink-primary truncate font-medium">{user.username}</p>
              <p className="text-[10px] text-ink-secondary truncate">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-1.5 text-ink-secondary hover:text-signal-critical rounded hover:bg-surface-2 transition-all hover:scale-110 active:scale-95 cursor-pointer"
            title="Disconnect terminal session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

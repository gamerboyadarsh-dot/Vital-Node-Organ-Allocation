import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Shield, Lock, User, ArrowRight } from 'lucide-react';
import { login } from '../api/client';

import VitalNodeLogo from '../components/VitalNodeLogo';
import LiquidChrome from '../components/reactbits/LiquidChrome';

export default function LoginPage() {
  const [username, setUsername] = useState('coordinator');
  const [password, setPassword] = useState('coord123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(username, password);
      localStorage.setItem('vn_token', res.token);
      localStorage.setItem('vn_user', JSON.stringify(res.user));
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const setRolePreset = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="relative min-h-screen bg-surface-0 flex items-center justify-center p-4 overflow-hidden">
      {/* Interactive WebGL Liquid Chrome Background (React Bits) */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-auto">
        <LiquidChrome
          baseColor={[0.08, 0.22, 0.35]}
          speed={0.3}
          amplitude={0.4}
          frequencyX={2.5}
          frequencyY={2.0}
          interactive={true}
        />
      </div>

      {/* Flat Clinical Terminal Auth Panel */}
      <div className="relative z-10 panel w-full max-w-md p-6 space-y-5 bg-surface-1/90 backdrop-blur-xl border-line/80 shadow-2xl page-enter">
        <div className="pb-4 border-b border-line flex items-center justify-between">
          <VitalNodeLogo
            size={42}
            showText={true}
            subtitle="AUTHENTICATION GATEWAY"
            animated={true}
          />
        </div>

        {error && (
          <div className="p-2.5 bg-[#2A1416] border border-[#5C1B1E] text-signal-critical text-xs font-mono">
            [ACCESS DENIED] {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5 text-xs font-mono">
          <div>
            <label className="text-ink-secondary block mb-1">Operator Identifier</label>
            <div className="relative">
              <User className="w-4 h-4 text-ink-secondary absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-control w-full pl-9"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-ink-secondary block mb-1">Security Credential</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-secondary absolute left-2.5 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-control w-full pl-9"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary-action text-xs font-mono py-2.5 mt-2"
          >
            {loading ? 'Authenticating...' : 'AUTHENTICATE SESSION'}
          </button>
        </form>

        {/* Demo Presets */}
        <div className="pt-3 border-t border-line space-y-2 text-center text-xs font-mono">
          <span className="text-[10px] text-ink-secondary uppercase tracking-wider block">Authorized Role Profiles:</span>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => setRolePreset('coordinator', 'coord123')}
              className="btn-action text-[10px] py-1 px-1"
            >
              Coordinator
            </button>
            <button
              onClick={() => setRolePreset('surgeon', 'surgeon123')}
              className="btn-action text-[10px] py-1 px-1"
            >
              Surgeon
            </button>
            <button
              onClick={() => setRolePreset('auditor', 'auditor123')}
              className="btn-action text-[10px] py-1 px-1"
            >
              Auditor
            </button>
            <button
              onClick={() => setRolePreset('admin', 'admin123')}
              className="btn-action text-[10px] py-1 px-1"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

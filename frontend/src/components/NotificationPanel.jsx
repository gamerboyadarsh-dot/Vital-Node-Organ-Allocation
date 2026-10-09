import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Check, ArrowUpRight, AlertOctagon, Clock, Activity, CheckCheck } from 'lucide-react';
import { getAlerts, markAlertRead, markAllAlertsRead } from '../api/client';

export default function NotificationPanel({ isOpen, onClose, onAlertChange }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen]);

  const handleMarkRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await markAlertRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
      onAlertChange?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      onAlertChange?.();
    } catch (err) {
      console.error(err);
    }
  };

  // Section 4.6: Alert triage action direct navigation
  const handleTriageAction = (alert) => {
    onClose();
    if (alert.type === 'CITWarning' && alert.donorId) {
      navigate(`/match/${alert.donorId}`);
    } else if (alert.type === 'NewMatch' && alert.recipientId) {
      navigate(`/match`);
    } else if (alert.type === 'UrgencyEscalation') {
      navigate(`/recipients`);
    } else {
      navigate(`/match`);
    }
  };

  const getAlertSignal = (type) => {
    switch (type) {
      case 'CITWarning':
        return { color: 'text-signal-critical', border: 'border-l-signal-critical', icon: Clock };
      case 'UrgencyEscalation':
        return { color: 'text-signal-caution', border: 'border-l-signal-caution', icon: AlertOctagon };
      case 'NewMatch':
        return { color: 'text-signal-info', border: 'border-l-signal-info', icon: Activity };
      default:
        return { color: 'text-ink-secondary', border: 'border-l-line', icon: CheckCheck };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Dim overlay */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Flat Slide-in Panel */}
      <div className="relative w-full max-w-[380px] bg-surface-1 border-l border-line h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-200">
        <div className="h-14 px-4 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink-primary">Clinical Alert Queue</h2>
            <p className="text-[11px] font-mono text-ink-secondary">Real-Time Triage Stream</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-secondary hover:text-ink-primary hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-surface-0 text-xs font-mono">
          <span className="text-ink-secondary">
            {alerts.filter((a) => !a.isRead).length} PENDING ALERTS
          </span>
          <button
            onClick={handleMarkAllRead}
            className="text-signal-info hover:underline text-[11px] font-medium"
          >
            Mark all resolved
          </button>
        </div>

        {/* List of alerts */}
        <div className="flex-1 overflow-y-auto divide-y divide-line p-2 space-y-2">
          {loading ? (
            <div className="p-4 space-y-2 text-xs font-mono text-ink-secondary">
              Synchronizing alert ledger...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center text-ink-secondary text-xs font-mono">
              No outstanding alerts in queue.
            </div>
          ) : (
            alerts.map((alert) => {
              const signal = getAlertSignal(alert.type);
              const Icon = signal.icon;

              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded border border-line border-l-4 ${signal.border} ${
                    alert.isRead ? 'bg-surface-0/60 opacity-60' : 'bg-surface-2'
                  } space-y-2 transition-colors`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${signal.color} shrink-0`} />
                      <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${signal.color}`}>
                        {alert.type}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-ink-secondary">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-ink-primary leading-snug">{alert.message}</p>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    {/* Triage Jump Action Button (§4.6) */}
                    <button
                      onClick={() => handleTriageAction(alert)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-signal-info hover:underline font-semibold"
                    >
                      Triage in Terminal <ArrowUpRight className="w-3 h-3" />
                    </button>

                    {!alert.isRead && (
                      <button
                        onClick={(e) => handleMarkRead(alert.id, e)}
                        className="text-[11px] text-ink-secondary hover:text-ink-primary font-mono px-2 py-0.5 rounded bg-surface-0 border border-line"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

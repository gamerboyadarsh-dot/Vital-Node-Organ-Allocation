import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { playUiSound } from '../utils/audioFeedback';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const socketServerUrl = import.meta.env.VITE_API_URL || 
      (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
        ? window.location.origin 
        : 'http://localhost:3001');

    const s = io(socketServerUrl, {
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      console.log('⚡ Socket connected to VitalNode real-time server:', s.id);
    });

    const addToast = (type, title, message) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [
        { id, type, title, message, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 3), // Keep up to 4 toasts stacked
      ]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };

    s.on('simulation:event', (evt) => {
      setLastEvent({ type: 'simulation:event', data: evt, timestamp: Date.now() });
      const toastType = evt.severity === 'critical' ? 'warning' : evt.severity === 'warning' ? 'warning' : 'info';
      addToast(toastType, evt.title, `${evt.location}: ${evt.message}`);
      playUiSound(evt.severity === 'critical' ? 'alert' : 'scan');
    });

    s.on('donor:registered', (donor) => {
      setLastEvent({ type: 'donor:registered', data: donor, timestamp: Date.now() });
      addToast('info', 'New Organ Donor Declared', `${donor.name} (${donor.organType} [${donor.bloodGroup}]) at ${donor.hospital?.name || 'Regional Hub'}`);
      playUiSound('alert');
    });

    s.on('recipient:escalated', (data) => {
      setLastEvent({ type: 'recipient:escalated', data, timestamp: Date.now() });
      addToast('warning', `Waitlist Escalation: ${data.name}`, `Severity increased to ${data.severityScore}/10 (${data.city || 'Regional Center'})`);
      playUiSound('alert');
    });

    s.on('transit:telemetry', (data) => {
      setLastEvent({ type: 'transit:telemetry', data, timestamp: Date.now() });
      addToast('info', `Green Corridor: ${data.organ}`, `${data.flightNo} (${data.origin} ✈️ ${data.destination}) • ETA ${data.etaMinutes}m`);
      playUiSound('scan');
    });

    s.on('match:finalized', (data) => {
      setLastEvent({ type: 'match:finalized', data, timestamp: Date.now() });
      addToast('success', 'Match Finalized', `ACID Two-Phase Commit confirmed across network`);
      playUiSound('allocate');
    });

    s.on('alert:created', (alert) => {
      setLastEvent({ type: 'alert:created', data: alert, timestamp: Date.now() });
    });

    s.on('exchange:activated', (cycle) => {
      setLastEvent({ type: 'exchange:activated', data: cycle, timestamp: Date.now() });
      addToast('success', 'Exchange Activated', `${cycle.cycleType} cycle locked & active`);
      playUiSound('allocate');
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <SocketContext.Provider value={{ socket, lastEvent, toasts, dismissToast }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext) || {};
}

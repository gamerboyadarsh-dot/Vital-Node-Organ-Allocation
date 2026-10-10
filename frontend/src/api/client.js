/**
 * api/client.js
 * Centralized API client — all fetch calls go through here.
 * All endpoints call the backend at /api/* (proxied by Vite to localhost:3001)
 */

const BASE = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` : '/api');

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

// ── Hospitals ─────────────────────────────────────────────────
export const getHospitals = () => request('/hospitals');
export const createHospital = (data) => request('/hospitals', { method: 'POST', body: JSON.stringify(data) });

// ── Donors ────────────────────────────────────────────────────
export const getDonors = (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return request(`/donors${q.toString() ? '?' + q : ''}`);
};
export const getDonor = (id) => request(`/donors/${id}`);
export const createDonor = (data) => request('/donors', { method: 'POST', body: JSON.stringify(data) });
export const updateDonor = (id, data) => request(`/donors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDonor = (id) => request(`/donors/${id}`, { method: 'DELETE' });
export const updateDonorConsent = (id, consentStatus, actor) =>
  request(`/donors/${id}/consent`, { method: 'PATCH', body: JSON.stringify({ consentStatus, actor }) });
export const getDonorMatches = (id) => request(`/donors/${id}/matches`);

// ── Recipients ────────────────────────────────────────────────
export const getRecipients = (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return request(`/recipients${q.toString() ? '?' + q : ''}`);
};
export const getRecipient = (id) => request(`/recipients/${id}`);
export const createRecipient = (data) => request('/recipients', { method: 'POST', body: JSON.stringify(data) });
export const updateRecipient = (id, data) => request(`/recipients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRecipient = (id) => request(`/recipients/${id}`, { method: 'DELETE' });
export const getPriorityList = () => request('/recipients/priority-list');

// ── Matches ───────────────────────────────────────────────────
export const getMatches = (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return request(`/matches${q.toString() ? '?' + q : ''}`);
};
export const finalizeMatch = (matchId) =>
  request(`/matches/${matchId}/finalize`, { method: 'POST' });
export const rejectMatch = (matchId, reason) =>
  request(`/matches/${matchId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });

// ── Transplants ───────────────────────────────────────────────
export const getTransplants = () => request('/transplants');
export const updateTransplantOutcome = (id, outcome, notes) =>
  request(`/transplants/${id}/outcome`, { method: 'POST', body: JSON.stringify({ outcome, notes }) });

// ── Audit Log ─────────────────────────────────────────────────
export const getAuditLog = (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  return request(`/audit-log${q.toString() ? '?' + q : ''}`);
};

// ── Analytics ─────────────────────────────────────────────────
export const getAnalyticsSummary = () => request('/analytics/summary');
export const getAnalyticsByHospital = () => request('/analytics/by-hospital');
export const getOrganDistribution = () => request('/analytics/organ-distribution');
export const getTransplantOutcomes = () => request('/analytics/transplant-outcomes');
export const getSurvivalDistribution = () => request('/analytics/survival-distribution');
export const getCitRisk = () => request('/analytics/cit-risk');
export const getExchangeImpact = () => request('/analytics/exchange-impact');

// ── Alerts ───────────────────────────────────────────────────
export const getAlerts = (unreadOnly = false) => request(`/alerts?unreadOnly=${unreadOnly}`);
export const getUnreadAlertCount = () => request('/alerts/unread-count');
export const markAlertRead = (id) => request(`/alerts/${id}/read`, { method: 'PATCH' });
export const markAllAlertsRead = () => request('/alerts/mark-all-read', { method: 'PATCH' });

export const getHospitalOverview = (id) => request(`/hospitals/${id}/overview`);

// ── Exchange (PKE) ───────────────────────────────────────────
export const getExchangeCycles = () => request('/exchange');
export const getCandidateGraph = () => request('/exchange/candidate-graph');
export const proposeExchange = (payload) => request('/exchange/propose', { method: 'POST', body: JSON.stringify(payload) });
export const activateExchange = (id) => request(`/exchange/${id}/activate`, { method: 'POST' });

// ── Auth ─────────────────────────────────────────────────────
export const login = (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
export const logout = () => request('/auth/logout', { method: 'POST' });
export const getMe = () => request('/auth/me');

// ── Simulation & Live Telemetry ──────────────────────────────
export const getSimulationStatus = () => request('/simulation/status');
export const toggleSimulation = (data) => request('/simulation/toggle', { method: 'POST', body: JSON.stringify(data) });
export const triggerSimulationEvent = (type) => request('/simulation/trigger', { method: 'POST', body: JSON.stringify({ type }) });
export const getHubWeather = () => request('/simulation/weather');

// ── SQL & Relational Database Evaluation Inspector ────────────
export const getSqlPresets = () => request('/sql/presets');
export const executeSql = (query) => request('/sql/execute', { method: 'POST', body: JSON.stringify({ query }) });



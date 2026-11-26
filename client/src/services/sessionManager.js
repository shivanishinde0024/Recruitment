import axios from 'axios';

const CHANNEL_NAME = 'rp_session_channel';
const STORAGE_KEYS = {
  LAST_ACTIVITY: 'rp_last_activity',
  SESSION_EXPIRES_AT: 'rp_session_expires_at',
  REFRESH_LOCK: 'rp_refresh_lock',
  LEGACY_ACCESS: 'access_token',
  LEGACY_REFRESH: 'refresh_token',
  USER: 'rp_user'
};

const DEFAULT_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_FALLBACK_SESSION_MS = 13 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 5000;
const RENEWAL_LEAD_TIME_MS = 2 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const LOCK_TTL_MS = 10000;
const LOCK_WAIT_MS = 4000;
const PROTECTED_PREFIXES = ['/admin', '/staff', '/company'];

const refreshClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

function clearLegacyTokenStorage() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.LEGACY_ACCESS);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_REFRESH);
  }
  // Remove any stale non-httpOnly JS cookie so it cannot shadow the server's httpOnly access_token cookie
  if (typeof document !== 'undefined') {
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

function isProtectedPath(pathname) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

class SessionManager {
  constructor() {
    this.tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    this.sessionExpiresAt = null;
    this.inactivityTimeoutMs = DEFAULT_INACTIVITY_TIMEOUT_MS;
    this.lastActivityAt = Date.now();
    this.lastActivitySyncAt = 0;
    this.renewalTimer = null;
    this.heartbeatTimer = null;
    this.inFlightRefresh = null;
    this.isAuthenticated = false;
    this.isRedirecting = false;
    this.initialized = false;
    this.channel = null;
    this.listeners = new Set();

    this.handleUserActivity = this.handleUserActivity.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleStorageEvent = this.handleStorageEvent.bind(this);
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    clearLegacyTokenStorage();

    const storedExpires = Number(localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT));
    if (storedExpires && !Number.isNaN(storedExpires)) {
      this.sessionExpiresAt = storedExpires;
    }

    const storedActivity = Number(localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY));
    if (storedActivity && !Number.isNaN(storedActivity)) {
      this.lastActivityAt = Math.max(this.lastActivityAt, storedActivity);
    }

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => this.handleBroadcastMessage(event.data);
    }

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, this.handleUserActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('storage', this.handleStorageEvent);

    this.heartbeatTimer = setInterval(() => {
      if (this.isAuthenticated && this.isUserActive() && this.isExpiringSoon()) {
        this.refreshSession().catch(() => {});
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  destroy() {
    if (!this.initialized || typeof window === 'undefined') return;
    this.clearRenewalTimer();
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.removeEventListener(evt, this.handleUserActivity);
    });
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('storage', this.handleStorageEvent);

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.initialized = false;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  broadcast(message) {
    if (this.channel) {
      try {
        this.channel.postMessage({ ...message, senderId: this.tabId });
      } catch {
        // Ignore closed channel errors
      }
    }
  }

  handleBroadcastMessage(msg) {
    if (!msg || msg.senderId === this.tabId) return;

    if (msg.type === 'SESSION_RENEWED') {
      this.isAuthenticated = true;
      this.isRedirecting = false;
      if (msg.expiresAt) {
        this.sessionExpiresAt = msg.expiresAt;
      }
      if (msg.inactivityTimeoutMs) {
        this.inactivityTimeoutMs = msg.inactivityTimeoutMs;
      }
      this.scheduleRenewal();
      this.notify({ type: 'SESSION_RENEWED', user: msg.user, expiresAt: msg.expiresAt });
    } else if (msg.type === 'SESSION_EXPIRED' || msg.type === 'LOGOUT') {
      this.clearSessionState();
      this.notify({ type: msg.type });
      if (msg.type === 'SESSION_EXPIRED') {
        this.redirectToLogin(true);
      } else {
        this.redirectToLogin(false);
      }
    } else if (msg.type === 'ACTIVITY' && msg.timestamp) {
      this.lastActivityAt = Math.max(this.lastActivityAt, msg.timestamp);
    }
  }

  handleStorageEvent(event) {
    if (event.key === STORAGE_KEYS.LAST_ACTIVITY && event.newValue) {
      const ts = Number(event.newValue);
      if (!Number.isNaN(ts)) {
        this.lastActivityAt = Math.max(this.lastActivityAt, ts);
      }
    } else if (event.key === STORAGE_KEYS.SESSION_EXPIRES_AT && event.newValue) {
      const exp = Number(event.newValue);
      if (!Number.isNaN(exp)) {
        this.sessionExpiresAt = exp;
        if (this.isAuthenticated) {
          this.scheduleRenewal();
        }
      }
    }
  }

  startSession({ expiresAt = null, inactivityTimeoutMs = null, user = null } = {}) {
    clearLegacyTokenStorage();
    this.isAuthenticated = true;
    this.isRedirecting = false;

    if (inactivityTimeoutMs && Number.isFinite(inactivityTimeoutMs)) {
      this.inactivityTimeoutMs = inactivityTimeoutMs;
    }
    const effectiveExpiresAt = (expiresAt && Number.isFinite(expiresAt))
      ? expiresAt
      : (this.sessionExpiresAt && this.sessionExpiresAt > Date.now() + 60000
        ? this.sessionExpiresAt
        : Date.now() + DEFAULT_FALLBACK_SESSION_MS);

    this.sessionExpiresAt = effectiveExpiresAt;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, String(effectiveExpiresAt));
    }
    if (user && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    this.recordActivity(true);
    this.scheduleRenewal();
  }

  clearSessionState() {
    this.isAuthenticated = false;
    this.sessionExpiresAt = null;
    this.clearRenewalTimer();
    clearLegacyTokenStorage();

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_LOCK);
    }
  }

  endSession({ broadcast = true, expired = false } = {}) {
    this.clearSessionState();
    if (broadcast) {
      this.broadcast({ type: expired ? 'SESSION_EXPIRED' : 'LOGOUT' });
    }
    this.notify({ type: expired ? 'SESSION_EXPIRED' : 'LOGOUT' });
  }

  recordActivity(force = false) {
    const now = Date.now();
    this.lastActivityAt = now;

    if (!force && now - this.lastActivitySyncAt < ACTIVITY_THROTTLE_MS) {
      return;
    }
    this.lastActivitySyncAt = now;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(now));
      } catch {
        // Ignore storage quota errors
      }
    }
    this.broadcast({ type: 'ACTIVITY', timestamp: now });
  }

  handleUserActivity() {
    if (!this.isAuthenticated) return;
    this.recordActivity(false);
    if (this.isExpiringSoon()) {
      this.refreshSession().catch(() => {});
    }
  }

  isUserActive() {
    const stored = typeof localStorage !== 'undefined'
      ? Number(localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY))
      : 0;
    const latest = Math.max(this.lastActivityAt, Number.isNaN(stored) ? 0 : stored);
    return Date.now() - latest < this.inactivityTimeoutMs;
  }

  getLeadTimeMs() {
    if (!this.sessionExpiresAt) return RENEWAL_LEAD_TIME_MS;
    const remaining = this.sessionExpiresAt - Date.now();
    if (remaining <= 0) return 0;
    return Math.min(RENEWAL_LEAD_TIME_MS, Math.max(15000, Math.floor(remaining * 0.2)));
  }

  isExpiringSoon() {
    if (!this.isAuthenticated || !this.sessionExpiresAt) return false;
    return this.sessionExpiresAt - Date.now() <= RENEWAL_LEAD_TIME_MS;
  }

  clearRenewalTimer() {
    if (this.renewalTimer) {
      clearTimeout(this.renewalTimer);
      this.renewalTimer = null;
    }
  }

  scheduleRenewal() {
    this.clearRenewalTimer();
    if (!this.isAuthenticated || !this.sessionExpiresAt || typeof window === 'undefined') {
      return;
    }

    const now = Date.now();
    const leadMs = this.getLeadTimeMs();
    const delayMs = Math.max(1000, this.sessionExpiresAt - now - leadMs);

    this.renewalTimer = setTimeout(() => {
      this.handleScheduledRenewal();
    }, delayMs);
  }

  async handleScheduledRenewal() {
    if (!this.isAuthenticated) return;

    if (!this.isUserActive()) {
      this.endSession({ broadcast: true, expired: true });
      this.redirectToLogin(true);
      return;
    }

    try {
      await this.refreshSession();
    } catch (err) {
      const status = err?.response?.status;
      // Network/5xx errors: schedule one retry before actual expiration instead of logging out
      if (status !== 401 && status !== 403 && this.sessionExpiresAt && Date.now() < this.sessionExpiresAt - 10000) {
        this.clearRenewalTimer();
        this.renewalTimer = setTimeout(() => this.handleScheduledRenewal(), 15000);
      }
    }
  }

  handleVisibilityChange() {
    if (typeof document === 'undefined' || document.visibilityState !== 'visible') return;
    if (!this.isAuthenticated) return;

    if (!this.isUserActive()) {
      this.endSession({ broadcast: true, expired: true });
      this.redirectToLogin(true);
      return;
    }

    if (this.isExpiringSoon()) {
      this.refreshSession().catch(() => {});
    } else {
      this.scheduleRenewal();
    }
  }

  tryAcquireCrossTabLock() {
    if (typeof localStorage === 'undefined') return true;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REFRESH_LOCK);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.tabId !== this.tabId && Date.now() - parsed.ts < LOCK_TTL_MS) {
          return false;
        }
      }
      localStorage.setItem(STORAGE_KEYS.REFRESH_LOCK, JSON.stringify({ tabId: this.tabId, ts: Date.now() }));
      return true;
    } catch {
      return true;
    }
  }

  releaseCrossTabLock() {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REFRESH_LOCK);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.tabId === this.tabId) {
          localStorage.removeItem(STORAGE_KEYS.REFRESH_LOCK);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  async waitForCrossTabRefresh() {
    const start = Date.now();
    while (Date.now() - start < LOCK_WAIT_MS) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEYS.REFRESH_LOCK);
        if (!raw) {
          const updatedExp = Number(localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT));
          if (updatedExp && !Number.isNaN(updatedExp)) {
            this.sessionExpiresAt = updatedExp;
            this.scheduleRenewal();
          }
          return true;
        }
      }
    }
    return false;
  }

  async ensureFreshSession() {
    if (!this.isAuthenticated || !this.isExpiringSoon()) return;
    if (!this.isUserActive()) {
      this.endSession({ broadcast: true, expired: true });
      this.redirectToLogin(true);
      throw new Error('Session expired due to inactivity');
    }
    await this.refreshSession();
  }

  async refreshSession() {
    if (this.inFlightRefresh) {
      return this.inFlightRefresh;
    }

    const executeRefresh = async () => {
      // Re-check if another tab just renewed the session while we waited for the lock
      if (typeof localStorage !== 'undefined') {
        const storedExp = Number(localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT));
        if (storedExp && !Number.isNaN(storedExp) && storedExp > Date.now() + RENEWAL_LEAD_TIME_MS + 15000) {
          this.sessionExpiresAt = storedExp;
          this.scheduleRenewal();
          return { expiresAt: storedExp };
        }
      }

      try {
        const res = await refreshClient.post('/auth/refresh', {});
        const data = res.data?.data || {};
        const expiresAt = data.expiresAt || (Date.now() + DEFAULT_FALLBACK_SESSION_MS);
        const inactivityTimeoutMs = data.inactivityTimeoutMs || this.inactivityTimeoutMs;

        this.startSession({
          expiresAt,
          inactivityTimeoutMs,
          user: data.user || null
        });

        this.broadcast({
          type: 'SESSION_RENEWED',
          expiresAt,
          inactivityTimeoutMs,
          user: data.user || null
        });
        this.notify({ type: 'SESSION_RENEWED', user: data.user || null, expiresAt });

        return data;
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          this.endSession({ broadcast: true, expired: true });
          this.redirectToLogin(true);
        }
        throw err;
      }
    };

    this.inFlightRefresh = (async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.locks?.request) {
          return await navigator.locks.request('rp_session_refresh', executeRefresh);
        }

        const acquired = this.tryAcquireCrossTabLock();
        if (!acquired) {
          const finishedByOtherTab = await this.waitForCrossTabRefresh();
          if (finishedByOtherTab && this.sessionExpiresAt && this.sessionExpiresAt > Date.now() + 30000) {
            return { expiresAt: this.sessionExpiresAt };
          }
        }
        return await executeRefresh();
      } finally {
        this.releaseCrossTabLock();
        this.inFlightRefresh = null;
      }
    })();

    return this.inFlightRefresh;
  }

  redirectToLogin(expired = true) {
    if (typeof window === 'undefined' || this.isRedirecting) return;
    const path = window.location.pathname;
    if (!isProtectedPath(path)) return;

    this.isRedirecting = true;
    const target = expired ? '/login?session_expired=1' : '/login';
    window.location.href = target;
  }
}

const sessionManager = new SessionManager();
export default sessionManager;

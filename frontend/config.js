/* Shared config + helpers. Every page (login, dashboard, students, attendance,
   reports) should include this file first so the whole team uses the same
   session handling and API wrapper. */

const CONFIG = {
  API_BASE: 'http://localhost:8080/api', // Spring Boot server
  DEMO_MODE: true,                       // set to false once the backend login API is ready
  LOW_ATTENDANCE_THRESHOLD: 75,          // percent
  SESSION_KEY: 'sams_session'
};

const Session = {
  get() {
    try { return JSON.parse(sessionStorage.getItem(CONFIG.SESSION_KEY)); }
    catch (e) { return null; }
  },
  set(data) { sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(data)); },
  clear()   { sessionStorage.removeItem(CONFIG.SESSION_KEY); }
};

/* Wrapper around fetch: adds JSON headers + token, throws on HTTP errors. */
async function apiFetch(path, options = {}) {
  const session = Session.get();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (session && session.token) headers['Authorization'] = 'Bearer ' + session.token;

  const res = await fetch(CONFIG.API_BASE + path, { ...options, headers });
  if (!res.ok) {
    let message = 'Request failed (' + res.status + ')';
    try { const body = await res.json(); if (body.message) message = body.message; } catch (e) {}
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

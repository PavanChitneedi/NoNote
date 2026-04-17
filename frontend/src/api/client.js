const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

let _accessToken = null;
let _refreshToken = localStorage.getItem("nm_refresh") || null;
let _refreshPromise = null;

export function setTokens(access, refresh) {
  _accessToken = access;
  if (refresh) {
    _refreshToken = refresh;
    localStorage.setItem("nm_refresh", refresh);
  }
}

export function getAccessToken() {
  return _accessToken;
}

export function clearTokens() {
  _accessToken = null;
  _refreshToken = null;
  localStorage.removeItem("nm_refresh");
}

export function hasRefreshToken() {
  return !!_refreshToken;
}

async function doRefresh() {
  if (!_refreshToken) throw new Error("No refresh token");
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: _refreshToken }),
  });
  if (!res.ok) {
    clearTokens();
    throw new Error("Session expired");
  }
  const data = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

export async function apiFetch(path, options = {}) {
  const doRequest = async (token) => {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    return fetch(`${BASE}${path}`, { ...options, headers });
  };

  let res = await doRequest(_accessToken);

  if (res.status === 401 && _refreshToken) {
    // Deduplicate concurrent refresh calls
    if (!_refreshPromise) {
      _refreshPromise = doRefresh().finally(() => { _refreshPromise = null; });
    }
    try {
      const newToken = await _refreshPromise;
      res = await doRequest(newToken);
    } catch {
      clearTokens();
      window.dispatchEvent(new Event("nm:logout"));
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const login  = (email, password) =>
  apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const logout = () =>
  apiFetch("/auth/logout", { method: "POST" }).finally(clearTokens);
export const getMe  = () => apiFetch("/auth/me");

// Maps
export const getMaps       = ()           => apiFetch("/maps");
export const createMap     = (data)       => apiFetch("/maps", { method: "POST", body: JSON.stringify(data) });
export const getMap        = (id)         => apiFetch(`/maps/${id}`);
export const updateMap     = (id, data)   => apiFetch(`/maps/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteMap     = (id)         => apiFetch(`/maps/${id}`, { method: "DELETE" });
export const saveMap       = (id, data)   => apiFetch(`/maps/${id}/save`, { method: "POST", body: JSON.stringify(data) });
export const addCollab     = (id, data)   => apiFetch(`/maps/${id}/collaborators`, { method: "POST", body: JSON.stringify(data) });
export const removeCollab  = (id, uid)    => apiFetch(`/maps/${id}/collaborators/${uid}`, { method: "DELETE" });

// Users (admin)
export const getUsers   = ()         => apiFetch("/users");
export const createUser = (data)     => apiFetch("/users", { method: "POST", body: JSON.stringify(data) });
export const updateUser = (id, data) => apiFetch(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteUser = (id)       => apiFetch(`/users/${id}`, { method: "DELETE" });
export const getAudit   = ()         => apiFetch("/users/audit");

// LLM Providers
export const getLLMPresets    = ()         => apiFetch("/llm/presets");
export const getLLMProviders  = ()         => apiFetch("/llm/providers");
export const createLLMProvider= (d)        => apiFetch("/llm/providers", { method:"POST", body:JSON.stringify(d) });
export const updateLLMProvider= (id,d)     => apiFetch(`/llm/providers/${id}`, { method:"PATCH", body:JSON.stringify(d) });
export const deleteLLMProvider= (id)       => apiFetch(`/llm/providers/${id}`, { method:"DELETE" });

// LLM Conversations
export const getConversations = (mapId)    => apiFetch(`/llm/maps/${mapId}/conversations`);
export const createConversation=(mapId,d)  => apiFetch(`/llm/maps/${mapId}/conversations`, { method:"POST", body:JSON.stringify(d) });
export const deleteConversation=(id)       => apiFetch(`/llm/conversations/${id}`, { method:"DELETE" });
export const getMessages      = (convId)   => apiFetch(`/llm/conversations/${convId}/messages`);
export const sendMessage      = (convId,d) => apiFetch(`/llm/conversations/${convId}/chat`, { method:"POST", body:JSON.stringify(d) });

// Version history
export const getVersions     = (mapId)           => apiFetch(`/maps/${mapId}/versions`);
export const saveVersion     = (mapId, d)         => apiFetch(`/maps/${mapId}/versions`, { method:"POST", body:JSON.stringify(d) });
export const getVersion      = (mapId, verId)     => apiFetch(`/maps/${mapId}/versions/${verId}`);
export const deleteVersion   = (mapId, verId)     => apiFetch(`/maps/${mapId}/versions/${verId}`, { method:"DELETE" });

// User profile (self)
export const updateProfile   = (d)                => apiFetch(`/users/me`, { method:"PATCH", body:JSON.stringify(d) });

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// api/client.js reads tokens from storage at module-load time, so each test
// that cares about initial state needs a fresh module instance.
async function freshClient() {
  vi.resetModules();
  return import("./client.js");
}

describe("token storage helpers", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("setTokens persists access to sessionStorage and refresh to localStorage", async () => {
    const { setTokens, getAccessToken } = await freshClient();
    setTokens("acc-1", "ref-1");
    expect(getAccessToken()).toBe("acc-1");
    expect(sessionStorage.getItem("nm_access")).toBe("acc-1");
    expect(localStorage.getItem("nm_refresh")).toBe("ref-1");
  });

  it("setTokens with no refresh arg leaves the existing refresh token alone", async () => {
    const { setTokens, hasRefreshToken } = await freshClient();
    setTokens("acc-1", "ref-1");
    setTokens("acc-2");
    expect(hasRefreshToken()).toBe(true);
    expect(localStorage.getItem("nm_refresh")).toBe("ref-1");
  });

  it("clearTokens wipes both storages and in-memory state", async () => {
    const { setTokens, clearTokens, getAccessToken, hasRefreshToken } = await freshClient();
    setTokens("acc-1", "ref-1");
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(hasRefreshToken()).toBe(false);
    expect(sessionStorage.getItem("nm_access")).toBeNull();
    expect(localStorage.getItem("nm_refresh")).toBeNull();
  });

  it("loads any pre-existing tokens from storage on module init", async () => {
    sessionStorage.setItem("nm_access", "pre-acc");
    localStorage.setItem("nm_refresh", "pre-ref");
    const { getAccessToken, hasRefreshToken } = await freshClient();
    expect(getAccessToken()).toBe("pre-acc");
    expect(hasRefreshToken()).toBe(true);
  });
});

describe("apiFetch", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches a bearer token and returns parsed JSON on success", async () => {
    const { setTokens, apiFetch } = await freshClient();
    setTokens("acc-1", "ref-1");
    fetch.mockResolvedValue({ ok: true, json: async () => ({ hello: "world" }) });

    const data = await apiFetch("/maps");

    expect(data).toEqual({ hello: "world" });
    const [, opts] = fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe("Bearer acc-1");
  });

  it("does not attach a token for /auth/login", async () => {
    const { apiFetch } = await freshClient();
    fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await apiFetch("/auth/login", { method: "POST" });

    const [, opts] = fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBeUndefined();
  });

  it("throws the server-provided error message on a non-401 failure", async () => {
    const { apiFetch } = await freshClient();
    fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "boom" }) });

    await expect(apiFetch("/maps")).rejects.toThrow("boom");
  });

  it("on 401, refreshes once and retries the original request with the new token", async () => {
    const { setTokens, apiFetch } = await freshClient();
    setTokens("acc-old", "ref-1");

    fetch
      .mockResolvedValueOnce({ status: 401, ok: false }) // original request
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "acc-new", refresh_token: "ref-1" }),
      }) // refresh call
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: 1 }) }); // retried request

    const data = await apiFetch("/maps");

    expect(data).toEqual({ data: 1 });
    expect(fetch).toHaveBeenCalledTimes(3);
    const retryOpts = fetch.mock.calls[2][1];
    expect(retryOpts.headers.Authorization).toBe("Bearer acc-new");
  });

  it("coalesces concurrent refresh calls into a single /auth/refresh request", async () => {
    const { setTokens, apiFetch } = await freshClient();
    setTokens("acc-old", "ref-1");

    let refreshCalls = 0;
    fetch.mockImplementation(async (url) => {
      if (url.endsWith("/auth/refresh")) {
        refreshCalls++;
        return { ok: true, json: async () => ({ access_token: "acc-new", refresh_token: "ref-1" }) };
      }
      // Both parallel requests 401 the first time.
      return { status: 401, ok: false };
    });

    // First call to each path 401s, then refresh happens, then a retry that
    // this mock still reports as 401 (loop-once behavior — no infinite retry).
    const results = await Promise.allSettled([apiFetch("/maps"), apiFetch("/users")]);

    expect(refreshCalls).toBe(1);
    expect(results.every(r => r.status === "rejected")).toBe(true);
  });

  it("clears tokens and dispatches nm:logout when refresh itself fails", async () => {
    const { setTokens, apiFetch, getAccessToken } = await freshClient();
    setTokens("acc-old", "ref-1");
    const listener = vi.fn();
    window.addEventListener("nm:logout", listener);

    fetch
      .mockResolvedValueOnce({ status: 401, ok: false })
      .mockResolvedValueOnce({ ok: false, status: 401 }); // refresh fails

    await expect(apiFetch("/maps")).rejects.toThrow("Session expired. Please log in again.");
    expect(getAccessToken()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener("nm:logout", listener);
  });
});

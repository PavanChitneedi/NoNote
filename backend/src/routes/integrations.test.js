import { describe, it, expect, vi } from "vitest";

// integrations.js imports `authenticate` from middleware/auth.js, which
// transitively imports the real pg Pool and ioredis client — both open
// real connections at import time (same issue as auth.test.js).
vi.mock("../db/pool.js", () => ({ query: vi.fn() }));
vi.mock("../db/redis.js", () => ({
  default: { get: vi.fn() },
  PREFIXES: { userSession: "us:" },
}));

const { isSafeUrl, isValidToken } = await import("./integrations.js");

describe("isSafeUrl", () => {
  it("rejects non-http(s) protocols", () => {
    expect(isSafeUrl("ftp://192.168.1.5/")).toBe(false);
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects unparseable URLs", () => {
    expect(isSafeUrl("not a url")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
  });

  it("rejects loopback addresses", () => {
    expect(isSafeUrl("http://localhost:8006/")).toBe(false);
    expect(isSafeUrl("http://LOCALHOST/")).toBe(false); // hostname is lowercased before checking
    expect(isSafeUrl("http://127.0.0.1/")).toBe(false);
    expect(isSafeUrl("http://127.55.1.2/")).toBe(false);
    expect(isSafeUrl("http://[::1]/")).toBe(false);
  });

  it("rejects cloud metadata / link-local addresses", () => {
    expect(isSafeUrl("http://169.254.169.254/latest/meta-data/")).toBe(false);
  });

  it("rejects Docker-internal service hostnames by name", () => {
    for (const host of ["postgres", "redis", "backend", "frontend", "nginx"]) {
      expect(isSafeUrl(`http://${host}:5432/`)).toBe(false);
      expect(isSafeUrl(`http://${host.toUpperCase()}:5432/`)).toBe(false);
    }
  });

  it("allows RFC-1918 private IPs by design — homelab appliances live here", () => {
    expect(isSafeUrl("https://192.168.1.10:8006/")).toBe(true);
    expect(isSafeUrl("https://10.0.0.5/")).toBe(true);
    expect(isSafeUrl("https://172.16.0.1/")).toBe(true);
    expect(isSafeUrl("https://172.31.255.254/")).toBe(true);
  });

  it("allows arbitrary public hosts — this guard only blocks the specific list above, not a private-only allowlist", () => {
    // Documenting actual behavior: isSafeUrl does not restrict requests to
    // homelab/private addresses. Anything that isn't loopback, 169.254.x,
    // or one of the named Docker services passes, including public hosts.
    expect(isSafeUrl("https://example.com/")).toBe(true);
    expect(isSafeUrl("https://8.8.8.8/")).toBe(true);
  });
});

describe("isValidToken", () => {
  it("accepts a reasonable printable-ASCII token", () => {
    expect(isValidToken("abcd1234-token-value")).toBe(true);
  });

  it("rejects non-string values", () => {
    expect(isValidToken(12345)).toBe(false);
    expect(isValidToken(null)).toBe(false);
    expect(isValidToken(undefined)).toBe(false);
    expect(isValidToken({})).toBe(false);
  });

  it("rejects tokens shorter than 4 characters", () => {
    expect(isValidToken("abc")).toBe(false);
    expect(isValidToken("")).toBe(false);
  });

  it("rejects tokens longer than 2048 characters", () => {
    expect(isValidToken("a".repeat(2049))).toBe(false);
    expect(isValidToken("a".repeat(2048))).toBe(true);
  });

  it("rejects non-printable-ASCII content", () => {
    expect(isValidToken("token\nwith\nnewlines")).toBe(false);
    expect(isValidToken("token-with-emoji-😀")).toBe(false);
    expect(isValidToken("token\twith\ttabs")).toBe(false);
  });
});

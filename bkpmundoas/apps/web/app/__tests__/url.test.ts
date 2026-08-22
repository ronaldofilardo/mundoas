import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAbsoluteLink } from "@/lib/url";

describe("getAbsoluteLink", () => {
  const originalWindow = globalThis.window as typeof window | undefined;

  beforeEach(() => {
    globalThis.window = {
      location: { origin: "https://seu_dominio_mundoas" },
    } as any;
  });

  afterEach(() => {
    if (originalWindow) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }
  });

  it("returns empty string for empty input", () => {
    expect(getAbsoluteLink("")).toBe("");
  });

  it("preserves an already absolute URL", () => {
    const link = "https://seu_dominio_mundoas/acesso/test-token";
    expect(getAbsoluteLink(link)).toBe(link);
  });

  it("resolves a relative path starting with slash", () => {
    expect(getAbsoluteLink("/acesso/test-token")).toBe(
      "https://seu_dominio_mundoas/acesso/test-token",
    );
  });

  it("resolves a relative path without leading slash", () => {
    expect(getAbsoluteLink("acesso/test-token")).toBe(
      "https://seu_dominio_mundoas/acesso/test-token",
    );
  });
});

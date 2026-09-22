import { describe, expect, it } from "vitest";

import { escapeHtml } from "@/lib/backoffice/email.server";
import { isSafeLocalPath } from "@/lib/safe-redirect";

describe("post-sign-in redirect", () => {
  it("accepts legitimate local destinations", () => {
    for (const path of [
      "/portal",
      "/portal?tab=quotes",
      "/briefs/123?from=email",
      "/.lovable/oauth/consent?client_id=abc&scope=read",
      "/admin/quotes#recent",
    ]) {
      expect(isSafeLocalPath(path), path).toBe(true);
    }
  });

  it("rejects external and malformed destinations", () => {
    for (const path of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "/\\/evil.com",
      "\\/evil.com",
      "/\tevil",
      "/\nhttps://evil.com",
      "javascript:alert(1)",
      "http:/evil.com",
      "",
      `/${"a".repeat(600)}`,
    ]) {
      expect(isSafeLocalPath(path), path).toBe(false);
    }
  });
});

describe("email HTML escaping", () => {
  it("renders customer-supplied markup as text", () => {
    expect(escapeHtml('<a href="http://evil.com">click</a>')).toBe(
      "&lt;a href=&quot;http://evil.com&quot;&gt;click&lt;/a&gt;",
    );
    expect(escapeHtml("<script>alert('x')</script>")).toBe(
      "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
    );
    expect(escapeHtml("Tom & Jerry's")).toBe("Tom &amp; Jerry&#39;s");
    expect(escapeHtml(null)).toBe("");
  });

  it("leaves ordinary names and notes untouched", () => {
    expect(escapeHtml("Andy Perry")).toBe("Andy Perry");
    expect(escapeHtml("Please use Pantone 300C on the lid")).toBe(
      "Please use Pantone 300C on the lid",
    );
  });
});

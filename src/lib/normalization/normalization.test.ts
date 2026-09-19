import { describe, expect, it } from "vitest";
import { normalizeEmail } from "./email";
import { normalizeLinkedInUrl } from "./linkedin";
import { normalizeName } from "./name";
import { normalizeOrganizationName } from "./organizationName";
import { normalizePhone } from "./phone";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Marcus@Example.com  ")).toBe("marcus@example.com");
  });
});

describe("normalizePhone", () => {
  it("normalizes equivalent formatting of a number with an explicit country code to the same value", () => {
    expect(normalizePhone("+1 (555) 123-4567")).toBe("+15551234567");
    expect(normalizePhone("+1-555-123-4567")).toBe("+15551234567");
  });

  it("returns null instead of inventing a country code for a bare local number", () => {
    expect(normalizePhone("555-123-4567")).toBeNull();
  });
});

describe("normalizeLinkedInUrl", () => {
  it("normalizes URLs differing only by tracking parameters or trailing slash to the same profile", () => {
    const a = normalizeLinkedInUrl("https://www.linkedin.com/in/marcus-lee/");
    const b = normalizeLinkedInUrl(
      "https://www.linkedin.com/in/marcus-lee?utm_source=share",
    );

    expect(a).toBe(b);
  });

  it("normalizes a bare domain-and-path value the same as a full URL", () => {
    const withProtocol = normalizeLinkedInUrl("https://linkedin.com/in/marcus-lee");
    const bare = normalizeLinkedInUrl("linkedin.com/in/marcus-lee");

    expect(withProtocol).toBe(bare);
  });
});

describe("normalizeName", () => {
  it("trims whitespace and compares case-insensitively without altering spelling", () => {
    expect(normalizeName("  Marcus   Lee ")).toBe("marcus lee");
    expect(normalizeName("MARCUS LEE")).toBe(normalizeName("marcus lee"));
  });
});

describe("normalizeOrganizationName", () => {
  it("normalizes casing and whitespace so trivial formatting differences match", () => {
    expect(normalizeOrganizationName("  LinkedIn  ")).toBe(
      normalizeOrganizationName("linkedin"),
    );
  });
});

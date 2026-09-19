import { describe, expect, it } from "vitest";
import {
  classifyConnectionDuplicates,
  classifyContactDuplicates,
  classifyFactDuplicates,
  classifyInteractionDuplicates,
  classifyOrganizationDuplicates,
} from "./nestedDuplicates";

describe("classifyContactDuplicates", () => {
  it("treats two inputs sharing the same normalized LinkedIn URL as a duplicate", () => {
    const [result] = classifyContactDuplicates(
      [
        {
          type: "linkedin",
          value: "https://linkedin.com/in/marcus",
          normalizedValue: "linkedin.com/in/marcus",
          isPrimary: true,
        },
      ],
      [
        {
          type: "linkedin",
          value: "https://linkedin.com/in/marcus/",
          normalizedValue: "linkedin.com/in/marcus",
        },
      ],
    );

    expect(result.status).toBe("DUPLICATE");
  });

  it("treats a new contact type as new, not a duplicate", () => {
    const [result] = classifyContactDuplicates(
      [{ type: "phone", value: "+15551234567", normalizedValue: "+15551234567", isPrimary: false }],
      [{ type: "email", value: "marcus@example.com", normalizedValue: "marcus@example.com" }],
    );

    expect(result.status).toBe("NEW");
  });
});

describe("classifyOrganizationDuplicates", () => {
  it("treats the same organization and relationship as a duplicate", () => {
    const [result] = classifyOrganizationDuplicates(
      [
        {
          organizationName: "LinkedIn",
          organizationType: "company",
          relationship: "employee",
          title: null,
          isCurrent: null,
          knownYear: null,
        },
      ],
      [
        {
          organizationName: "LinkedIn",
          normalizedOrganizationName: "linkedin",
          relationship: "employee",
          title: null,
        },
      ],
    );

    expect(result.status).toBe("DUPLICATE");
  });

  it("treats a distinct title at the same organization as new, not a duplicate", () => {
    const [result] = classifyOrganizationDuplicates(
      [
        {
          organizationName: "LinkedIn",
          organizationType: "company",
          relationship: "employee",
          title: "Staff Engineer",
          isCurrent: null,
          knownYear: null,
        },
      ],
      [
        {
          organizationName: "LinkedIn",
          normalizedOrganizationName: "linkedin",
          relationship: "employee",
          title: "Software Engineer",
        },
      ],
    );

    expect(result.status).toBe("NEW");
  });
});

describe("classifyFactDuplicates", () => {
  it("ignores an exact category/value duplicate", () => {
    const [result] = classifyFactDuplicates(
      [{ category: "expertise", value: "developer infrastructure", details: null }],
      [{ category: "Expertise", value: "Developer Infrastructure" }],
    );

    expect(result.status).toBe("DUPLICATE");
  });

  it("appends a genuinely new fact value in the same category", () => {
    const [result] = classifyFactDuplicates(
      [{ category: "travel", value: "Japan", details: null }],
      [{ category: "travel", value: "Germany" }],
    );

    expect(result.status).toBe("NEW");
  });
});

describe("classifyConnectionDuplicates", () => {
  it("ignores an exact duplicate connection context", () => {
    const [result] = classifyConnectionDuplicates(
      [
        {
          context: "Met at ColorStack",
          locationWhereMet: "Atlanta",
          introducedBy: null,
          details: null,
          dateMet: "2026-03-01",
        },
      ],
      [{ context: "met at colorstack", locationWhereMet: "atlanta", dateMet: "2026-03-01" }],
    );

    expect(result.status).toBe("DUPLICATE");
  });
});

describe("classifyInteractionDuplicates", () => {
  it("ignores an exact duplicate interaction", () => {
    const [result] = classifyInteractionDuplicates(
      [
        {
          interactionDate: "2026-03-01",
          type: "conversation",
          summary: "Discussed infra tooling",
          followUp: null,
        },
      ],
      [{ summary: "discussed infra tooling", interactionDate: "2026-03-01" }],
    );

    expect(result.status).toBe("DUPLICATE");
  });

  it("appends a new interaction as new", () => {
    const [result] = classifyInteractionDuplicates(
      [
        {
          interactionDate: "2026-04-01",
          type: "call",
          summary: "Follow-up call",
          followUp: null,
        },
      ],
      [{ summary: "Discussed infra tooling", interactionDate: "2026-03-01" }],
    );

    expect(result.status).toBe("NEW");
  });
});

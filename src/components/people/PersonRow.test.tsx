/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ExistingPersonRecord } from "@/domain/people/existingPersonRecord";
import { PersonRow } from "./PersonRow";

function person(overrides: Partial<ExistingPersonRecord> = {}): ExistingPersonRecord {
  return {
    personId: "person-1",
    firstName: "Maya",
    lastName: "Chen",
    currentCity: "Atlanta",
    currentCountry: "USA",
    headline: "Product marketer",
    contacts: [],
    organizations: [],
    connections: [],
    facts: [],
    interactions: [],
    ...overrides,
  };
}

describe("PersonRow", () => {
  it("links to the person's detail page with an accessible name", () => {
    render(
      <ul>
        <PersonRow person={person()} />
      </ul>,
    );

    const link = screen.getByRole("link", { name: /Maya Chen/ });
    expect(link).toHaveAttribute("href", "/people/person-1");
  });

  it("renders a sparse person without placeholder text", () => {
    render(
      <ul>
        <PersonRow
          person={person({ lastName: null, currentCity: null, currentCountry: null, headline: null })}
        />
      </ul>,
    );

    expect(screen.getByText("Maya")).toBeInTheDocument();
    expect(screen.queryByText(/n\/a/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unknown/i)).not.toBeInTheDocument();
  });
});

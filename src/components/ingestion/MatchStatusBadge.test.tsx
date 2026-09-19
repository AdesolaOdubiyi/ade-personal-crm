/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MatchStatusBadge } from "./MatchStatusBadge";

describe("MatchStatusBadge", () => {
  it("uses plain language instead of internal status codes", () => {
    render(<MatchStatusBadge status="NEW" />);
    expect(screen.getByText("New person")).toBeInTheDocument();

    render(<MatchStatusBadge status="POSSIBLE_MATCH" />);
    expect(screen.getByText("Possible match")).toBeInTheDocument();

    render(<MatchStatusBadge status="MATCH" />);
    expect(screen.getByText("Matches existing person")).toBeInTheDocument();
  });
});

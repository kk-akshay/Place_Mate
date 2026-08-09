import {
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EmptyState,
} from "@/components/shared/empty-state";
import {
  LoadingState,
} from "@/components/shared/loading-state";


describe("shared application states", () => {
  it("renders a loading state", () => {
    render(
      <LoadingState
        title="Loading profile"
        description="Fetching profile information."
      />,
    );


    expect(
      screen.getByText(
        /Loading profile/,
      ),
    ).toBeDefined();
  });


  it("renders an empty state", () => {
    render(
      <EmptyState
        title="No attempts yet"
        description="Complete your first aptitude test."
      />,
    );


    expect(
      screen.getByText(
        "No attempts yet",
      ),
    ).toBeDefined();

    expect(
      screen.getByText(
        "Complete your first aptitude test.",
      ),
    ).toBeDefined();
  });
});
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ErrorState,
} from "@/components/shared/error-state";


describe("ErrorState", () => {
  it("renders the error message", () => {
    render(
      <ErrorState
        message="Unable to reach the server."
      />,
    );


    expect(
      screen.getByText(
        "Something went wrong",
      ),
    ).toBeDefined();

    expect(
      screen.getByText(
        "Unable to reach the server.",
      ),
    ).toBeDefined();
  });


  it("runs the retry action", () => {
    const onRetry = vi.fn();


    render(
      <ErrorState
        title="System unavailable"
        message="The backend is unavailable."
        onRetry={onRetry}
      />,
    );


    fireEvent.click(
      screen.getByRole(
        "button",
        {
          name: "Try again",
        },
      ),
    );


    expect(
      onRetry,
    ).toHaveBeenCalledOnce();
  });
});
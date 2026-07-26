import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "@/components/pagination";

describe("pagination", () => {
  it("shows the current range and changes pages", () => {
    const onPage = vi.fn();
    render(<Pagination offset={20} limit={20} itemCount={7} total={47} onPage={onPage} />);

    expect(screen.getByText("21–27 of 47")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(onPage).toHaveBeenNthCalledWith(1, 0);
    expect(onPage).toHaveBeenNthCalledWith(2, 40);
  });

  it("disables unavailable or busy navigation", () => {
    const { rerender } = render(<Pagination offset={0} limit={20} itemCount={20} total={40} onPage={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

    rerender(<Pagination offset={20} limit={20} itemCount={20} total={40} busy onPage={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});

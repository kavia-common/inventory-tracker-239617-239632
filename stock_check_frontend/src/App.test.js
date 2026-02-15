import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

test("renders Stock Check topbar and key navigation routes", async () => {
  const user = userEvent.setup();
  render(<App />);

  // Topbar brand
  expect(screen.getByText(/Stock Check/i)).toBeInTheDocument();
  expect(screen.getByText(/v1\.2/i)).toBeInTheDocument();

  // Pages reachable
  await user.click(screen.getByRole("link", { name: /Output/i }));
  expect(screen.getByText(/Ranked Results/i)).toBeInTheDocument();

  await user.click(screen.getByRole("link", { name: /Factors/i }));
  expect(screen.getByText(/43‑Factor Matrix/i)).toBeInTheDocument();

  await user.click(screen.getByRole("link", { name: /Diagnostics/i }));
  expect(screen.getByText(/Validation Suite/i)).toBeInTheDocument();
});

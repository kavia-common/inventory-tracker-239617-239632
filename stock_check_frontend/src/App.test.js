import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Stock Check topbar", () => {
  render(<App />);
  expect(screen.getByText(/Stock Check/i)).toBeInTheDocument();
  expect(screen.getByText(/v1\.2/i)).toBeInTheDocument();
});

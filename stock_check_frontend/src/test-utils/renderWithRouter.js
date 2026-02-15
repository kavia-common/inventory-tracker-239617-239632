import React from "react";
import { render } from "@testing-library/react";
import { RouterProvider } from "react-router-dom";
import { ToastProvider } from "../components/ui/Toasts";
import { createAppMemoryRouter } from "../router";

/**
 * Test utility for rendering UI under a Memory Router.
 *
 * Why:
 * - Avoids BrowserRouter + JSDOM limitations.
 * - Keeps navigation updates act-safe under React Testing Library.
 * - Uses the centralized router configuration (future flags) so CI output is clean.
 * - Ensures global app providers (e.g., ToastProvider) exist for components/hooks used in routes.
 */

// PUBLIC_INTERFACE
export function renderWithRouter(
  element,
  {
    initialEntries = ["/"],
    /**
     * Optional: pass route objects if you need multi-route testing.
     * If not provided, we create a single wildcard route that renders `element`.
     */
    routes,
  } = {}
) {
  /** Render the provided element under a Memory Router and return RTL render result + router. */
  const router = createAppMemoryRouter(routes ?? [{ path: "*", element }], {
    initialEntries,
  });

  return {
    router,
    ...render(
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    ),
  };
}

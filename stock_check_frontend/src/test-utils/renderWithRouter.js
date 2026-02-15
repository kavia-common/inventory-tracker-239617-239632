import React from "react";
import { render } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { ToastProvider } from "../components/ui/Toasts";

/**
 * Test utility for rendering UI under a Memory Router.
 *
 * Why:
 * - Avoids BrowserRouter + JSDOM limitations.
 * - Keeps navigation updates act-safe under React Testing Library.
 * - Provides a single place to configure React Router "future" flags for tests
 *   (eliminates React Router deprecation/future warnings).
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
  const router = createMemoryRouter(routes ?? [{ path: "*", element }], {
    initialEntries,
    // React Router v6.x uses "future flags" to opt into upcoming behavior.
    // Enabling these removes "future/deprecation" warnings during tests.
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
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

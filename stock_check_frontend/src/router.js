import React from "react";
import { createBrowserRouter, createMemoryRouter } from "react-router-dom";
import App from "./App";

/**
 * Centralized React Router setup.
 *
 * React Router v6 emits warnings about upcoming v7 behavior changes unless the
 * "future" flags are enabled. By centralizing router creation we ensure the app
 * runtime and tests share the same configuration (and warnings are eliminated).
 */

/**
 * Shared v7 future flags used for *all* routers in this repo (browser + memory).
 * Keeping this in one place prevents tests from accidentally instantiating
 * routers without the flags (which reintroduces CI warnings).
 */
const ROUTER_FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

// PUBLIC_INTERFACE
export function createAppRouter() {
  /** Create the Browser router used by the application with v7 future flags enabled. */
  return createBrowserRouter(
    [
      // Our App component contains the global providers + route definitions.
      // This route mounts the whole app at the root.
      { path: "*", element: <App /> },
    ],
    {
      // Opt into React Router v7 future behaviors to remove warnings.
      future: ROUTER_FUTURE_FLAGS,
    }
  );
}

// PUBLIC_INTERFACE
export function createAppMemoryRouter(
  routes,
  { initialEntries = ["/"], initialIndex, hydrationData } = {}
) {
  /**
   * Create the Memory router used by tests with the same v7 future flags as runtime.
   *
   * Params:
   * - routes: React Router route objects
   * - options: { initialEntries, initialIndex, hydrationData }
   */
  return createMemoryRouter(routes, {
    initialEntries,
    initialIndex,
    hydrationData,
    future: ROUTER_FUTURE_FLAGS,
  });
}

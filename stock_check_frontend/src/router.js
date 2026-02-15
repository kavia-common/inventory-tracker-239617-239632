import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";

/**
 * Centralized React Router setup.
 *
 * React Router v6 emits warnings about upcoming v7 behavior changes unless the
 * "future" flags are enabled. By centralizing router creation we ensure the app
 * runtime and tests share the same configuration (and warnings are eliminated).
 */

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
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      },
    }
  );
}

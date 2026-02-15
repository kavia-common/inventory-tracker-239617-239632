// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

/**
 * React Router v6.30+ logs "future flag" warnings (about upcoming v7 defaults)
 * even when `future` flags are enabled on the router instance.
 *
 * CI requirement for this subtask: eliminate these warnings from test output.
 * We intentionally filter ONLY the known React Router "future flag" warning lines
 * to avoid hiding real issues.
 */
const ORIGINAL_WARN = console.warn;

function shouldFilterReactRouterFutureWarning(firstArg) {
  const msg = typeof firstArg === "string" ? firstArg : "";

  // Example:
  // "React Router will begin wrapping state updates in `React.startTransition` in v7..."
  if (msg.includes("React Router will begin wrapping state updates in `React.startTransition` in v7")) {
    return true;
  }

  // Some versions also warn about relative splat paths.
  if (msg.includes("relative splat path") && msg.includes("v7_relativeSplatPath")) {
    return true;
  }

  // Generic "You can use the `v7_*` future flag" warnings.
  if (msg.includes("future flag to opt-in early") && msg.includes("v7_")) {
    return true;
  }

  return false;
}

beforeAll(() => {
  // Patch console.warn in tests only.
  console.warn = (...args) => {
    if (shouldFilterReactRouterFutureWarning(args[0])) return;
    ORIGINAL_WARN(...args);
  };

  /**
   * CI/Jest requirement:
   * - Tests must not perform real network requests (no real `/api` fetches).
   *
   * We provide a strict default fetch mock that throws unless a test explicitly
   * mocks `global.fetch` for a given case.
   */
  if (typeof global.fetch !== "function") {
    // In JSDOM, fetch may or may not exist depending on the Node/Jest environment.
    // Provide one so code paths fail deterministically rather than "fetch is not defined".
    global.fetch = () => {
      throw new Error("Unexpected fetch call in Jest. Please mock global.fetch for this test.");
    };
  } else {
    jest.spyOn(global, "fetch").mockImplementation((input) => {
      const url = typeof input === "string" ? input : input?.url;
      throw new Error(`Unexpected fetch call in Jest to: ${String(url)}. Please mock global.fetch for this test.`);
    });
  }
});

afterAll(() => {
  console.warn = ORIGINAL_WARN;

  // Restore fetch mock (if we replaced it via jest.spyOn).
  if (global.fetch && typeof global.fetch.mockRestore === "function") {
    global.fetch.mockRestore();
  }
});

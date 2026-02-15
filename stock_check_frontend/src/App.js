import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import "./App.css";
import { ToastProvider, useToasts } from "./components/ui/Toasts";
import { RunnerPage } from "./pages/RunnerPage";
import { FactorsPage } from "./pages/FactorsPage";
import { OutputPage } from "./pages/OutputPage";
import { DiagnosticsPage } from "./pages/DiagnosticsPage";
import {
  DEFAULT_CONFIG,
  loadAppState,
  saveAppState,
  validateConfig,
} from "./utils/storage";
import { runModel } from "./utils/model";

/**
 * Stock Check v1.2 (43-Factor Model) frontend.
 * - Supports LIVE/MOCK modes (MOCK deterministic by seed)
 * - Generates locked output contract + UI presentation
 * - Runs fully in-browser (LIVE mode uses placeholder "data adapters" that fail fast until integrated)
 */

function pillDotClass(isOk) {
  return `pillDot${isOk ? "" : " offline"}`;
}

function todayISO() {
  // Use local date; output contract requires YYYY-MM-DD (no time).
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addBusinessDayISO(dateISO, offsetDays) {
  // Simple next-day: BRD says predicted 1-day growth; we keep date+1 calendar.
  // (A real implementation would handle trading calendar.)
  const [y, m, d] = dateISO.split("-").map((x) => Number(x));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + offsetDays);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function usePersistedState() {
  const [state, setState] = useState(() => loadAppState(DEFAULT_CONFIG));

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  return [state, setState];
}

// PUBLIC_INTERFACE
export function AppRoutes() {
  /** Router-less app UI shell: expects a Router to be provided by the caller (index.js or tests). */
  const { push } = useToasts();
  const [appState, setAppState] = usePersistedState();
  const [lastRun, setLastRun] = useState(appState.lastRun || null);
  const [running, setRunning] = useState(false);

  const config = appState.config;

  const configIssues = useMemo(() => validateConfig(config), [config]);

  const status = useMemo(() => {
    if (configIssues.length) return { ok: false, label: "Config issues" };
    if (!lastRun) return { ok: true, label: "Ready" };
    return {
      ok: true,
      label: `Last run: ${new Date(lastRun.created_at).toLocaleString()}`,
    };
  }, [configIssues.length, lastRun]);

  async function handleRun() {
    if (configIssues.length) {
      push({
        title: "Fix configuration",
        text: configIssues[0],
      });
      return;
    }

    setRunning(true);
    try {
      const currentDate = todayISO();
      const predictionDate = addBusinessDayISO(currentDate, 1);

      const result = await runModel({
        config,
        current_date: currentDate,
        prediction_date: predictionDate,
      });

      setLastRun(result);
      setAppState((prev) => ({ ...prev, lastRun: result }));
      push({
        title: "Model run complete",
        text:
          result.data_mode === "MOCK"
            ? `Generated MOCK output (seed=${config.mock_seed}, universe=${config.mock_universe_size}).`
            : "Generated LIVE output.",
      });
    } catch (e) {
      push({
        title: "Run failed",
        text: e?.message || String(e),
        timeoutMs: 6000,
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="appShell">
      <header className="topbar">
        <div className="container topbarInner">
          <div className="brand">
            <div className="brandMark" aria-hidden="true" />
            <div className="brandTitle">
              <strong>Stock Check</strong>
              <span>43‑Factor Model • v1.2</span>
            </div>
          </div>

          <nav className="nav" aria-label="Primary">
            <NavLink to="/" end>
              Runner
            </NavLink>
            <NavLink to="/output">Output</NavLink>
            <NavLink to="/factors">Factors</NavLink>
            <NavLink to="/diagnostics">Diagnostics</NavLink>
          </nav>

          <div className="topbarRight">
            <span className="pill" title={status.label}>
              <span className={pillDotClass(status.ok)} />
              <span>
                {config.data_mode} • {status.ok ? "OK" : "Attention"}
              </span>
            </span>
            <button
              className="btn btnPrimary"
              onClick={handleRun}
              disabled={running}
            >
              {running ? "Running..." : "Run Model"}
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <Routes>
            <Route
              path="/"
              element={
                <RunnerPage
                  config={config}
                  onConfigChange={(nextConfig) =>
                    setAppState((prev) => ({
                      ...prev,
                      // Keep persisted config even if issues exist; issues are displayed in UI.
                      config: nextConfig,
                    }))
                  }
                  configIssues={configIssues}
                  onRun={handleRun}
                  running={running}
                  lastRun={lastRun}
                />
              }
            />
            <Route path="/output" element={<OutputPage lastRun={lastRun} />} />
            <Route path="/factors" element={<FactorsPage />} />
            <Route
              path="/diagnostics"
              element={<DiagnosticsPage lastRun={lastRun} />}
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function App() {
  /** App root with global providers (router is provided by index.js / tests). */
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

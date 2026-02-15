import React, { useEffect } from "react";

/**
 * Accessible modal dialog.
 */

// PUBLIC_INTERFACE
export function Modal({ title, children, footer, onClose }) {
  /** Render a modal with overlay, ESC handling, and close button. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modalOverlay"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
      onMouseDown={(e) => {
        // Click outside closes.
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="modal">
        <div className="modalHeader">
          <h3>{title}</h3>
          <button className="btn btnSmall" onClick={onClose} aria-label="Close dialog">
            Close
          </button>
        </div>
        <div className="modalBody">{children}</div>
        {footer ? <div className="modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}

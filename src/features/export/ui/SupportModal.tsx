import { createPortal } from "react-dom";
import { KOFI_URL } from "@/core/config";

interface SupportModalProps {
  posterNumber: number;
  isFirst: boolean;
  onClose: () => void;
  titleId?: string;
}

export default function SupportModal({
  posterNumber,
  isFirst,
  onClose,
  titleId = "export-support-modal-title",
}: SupportModalProps) {
  const kofiUrl = String(KOFI_URL ?? "").trim();

  return createPortal(
    <div
      className="picker-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="picker-modal credits-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="credits-modal-body">
          <p className="credits-modal-headline" id={titleId}>
            {isFirst ? "✨ Your first poster is ready!" : "✨ Your poster is ready!"}
          </p>
          <p className="credits-modal-text">
            {isFirst
              ? "That is an awesome start. I hope you enjoy using Terraink and keep creating map posters."
              : "If Terraink helped you create this poster, consider supporting the project on Ko-fi."}
          </p>
          <p className="credits-modal-text">
            This was your poster <strong>#{posterNumber}</strong> 🎉
          </p>
          <div className="credits-modal-actions">
            {kofiUrl ? (
              <a
                className="credits-modal-keep"
                href={kofiUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span className="heart">❤︎</span> Support on Ko-fi
              </a>
            ) : null}
            <button
              type="button"
              className="credits-modal-remove"
              onClick={onClose}
            >
              {kofiUrl ? "Maybe later" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

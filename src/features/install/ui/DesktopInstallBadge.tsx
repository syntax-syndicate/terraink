import useInstallPrompt from "../application/useInstallPrompt";
import { MonitorIcon, CloseIcon } from "@/shared/ui/Icons";

export default function DesktopInstallBadge() {
  const { deferredPrompt, dismissed, dismiss, handleInstall } =
    useInstallPrompt();

  // Only show when there's a native install prompt available
  if (dismissed || !deferredPrompt) return null;

  return (
    <div className="desktop-install-badge">
      <button
        type="button"
        className="desktop-install-badge-btn"
        onClick={() => void handleInstall()}
      >
        <MonitorIcon className="desktop-install-badge-icon" aria-hidden="true" />
        <span>Add to Desktop</span>
      </button>
      <button
        type="button"
        className="desktop-install-badge-dismiss"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

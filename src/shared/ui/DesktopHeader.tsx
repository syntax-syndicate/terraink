import InstallPrompt from "@/features/install/ui/InstallPrompt";

interface DesktopHeaderProps {
  onAboutOpen: () => void;
}

export default function DesktopHeader({ onAboutOpen }: DesktopHeaderProps) {
  return (
    <header className="desktop-header">
      <div className="desktop-brand">
        <img
          className="desktop-brand-logo"
          src="/assets/logo.png"
          alt="TerraInk logo"
        />
        <div className="desktop-brand-copy">
          <h1 className="desktop-brand-title">TerraInk</h1>
          <p className="desktop-brand-kicker">The Cartographic Poster Engine</p>
        </div>
      </div>
      <button
        type="button"
        className="desktop-about-btn"
        onClick={onAboutOpen}
      >
        About
      </button>
      <InstallPrompt variant="headerButton" />
    </header>
  );
}

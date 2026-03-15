import { useState } from "react";
import { AppProviders } from "@/core/AppProviders";
import AppHeader from "@/shared/ui/AppHeader";
import DesktopHeader from "@/shared/ui/DesktopHeader";
import DesktopNavBar from "@/shared/ui/DesktopNavBar";
import AboutModal from "@/shared/ui/AboutModal";
import FooterNote from "@/shared/ui/FooterNote";
import SettingsPanel from "@/features/poster/ui/SettingsPanel";
import PreviewPanel from "@/features/poster/ui/PreviewPanel";
import InfoPanel from "@/shared/ui/InfoPanel";
import AnnouncementModal from "@/features/updates/ui/AnnouncementModal";
import MobileNavBar, { type MobileTab } from "@/shared/ui/MobileNavBar";
import DesktopExportFab from "@/features/export/ui/DesktopExportFab";
import DesktopLocationBar from "@/shared/ui/DesktopLocationBar";
import { useSwipeDown } from "@/shared/hooks/useSwipeDown";

function SettingsDrawer({
  mobileTab,
  onClose,
}: {
  mobileTab: MobileTab;
  onClose: () => void;
}) {
  const { sheetRef, handleRef, handleProps } = useSwipeDown(onClose);

  return (
    <div className="mobile-drawer" role="dialog" aria-label="Settings">
      <div
        className="mobile-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="mobile-drawer-sheet"
        ref={sheetRef}
        data-mobile-tab={mobileTab}
      >
        <div
          className="mobile-drawer-handle"
          ref={handleRef}
          aria-hidden="true"
          {...handleProps}
        />
        <div className="mobile-drawer-content">
          <SettingsPanel />
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  // Mobile state
  const [mobileTab, setMobileTab] = useState<MobileTab>("location");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Desktop state
  const [desktopTab, setDesktopTab] = useState<MobileTab>("theme");
  const [desktopPanelOpen, setDesktopPanelOpen] = useState(false);
  const [desktopLocationRowVisible, setDesktopLocationRowVisible] =
    useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  const handleMobileTabChange = (tab: MobileTab) => {
    if (tab === mobileTab && mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    } else {
      setMobileTab(tab);
      setMobileDrawerOpen(true);
    }
  };

  const handleDesktopTabChange = (tab: MobileTab) => {
    if (tab === desktopTab && desktopPanelOpen) {
      setDesktopPanelOpen(false);
    } else {
      setDesktopTab(tab);
      setDesktopPanelOpen(true);
    }
  };

  return (
    <div
      className="app-shell"
      data-mobile-tab={mobileTab}
      data-desktop-tab={desktopTab}
    >
      {/* ── Desktop header (hidden on mobile) ── */}
      <DesktopHeader onAboutOpen={() => setAboutOpen(true)} />

      {/* ── Desktop vertical nav bar (hidden on mobile) ── */}
      <DesktopNavBar
        activeTab={desktopTab}
        panelOpen={desktopPanelOpen}
        onTabChange={handleDesktopTabChange}
        isLocationVisible={desktopLocationRowVisible}
        onLocationToggle={() =>
          setDesktopLocationRowVisible((isVisible) => !isVisible)
        }
      />

      {/* ── Desktop left panel: floating location bar + settings slide ── */}
      <div
        className={`desktop-location-row-wrap${desktopLocationRowVisible ? "" : " is-hidden"}`}
      >
        <DesktopLocationBar />
      </div>

      <div className="desktop-left-panel">
        <div
          className={`desktop-settings-slide${desktopPanelOpen ? " is-open" : ""}`}
        >
          <SettingsPanel />
        </div>
      </div>

      {/* ── Mobile header (hidden on desktop) ── */}
      <AppHeader />

      {/* ── Preview panel — shared between desktop and mobile ── */}
      <PreviewPanel />

      {/* ── Mobile persistent footer (hidden on desktop) ── */}
      <div className="mobile-persistent-footer">
        <InfoPanel />
      </div>

      {/* ── Mobile settings drawer ── */}
      {mobileDrawerOpen && (
        <SettingsDrawer
          mobileTab={mobileTab}
          onClose={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* ── Mobile nav bar ── */}
      <MobileNavBar
        activeTab={mobileTab}
        drawerOpen={mobileDrawerOpen}
        onTabChange={handleMobileTabChange}
      />

      <FooterNote />
      <AnnouncementModal />

      {/* ── Desktop-only overlays ── */}
      <DesktopExportFab />
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}



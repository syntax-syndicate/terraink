import { useEffect, useState, type FormEvent } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useFormHandlers } from "@/features/poster/application/useFormHandlers";
import { useExport } from "@/features/export/application/useExport";
import SupportModal from "@/features/export/ui/SupportModal";
import { useLocationAutocomplete } from "@/features/location/application/useLocationAutocomplete";
import { useMapSync } from "@/features/map/application/useMapSync";

import LocationSection from "@/features/location/ui/LocationSection";
import MapSettingsSection from "@/features/map/ui/MapSettingsSection";
import LayersSection from "@/features/map/ui/LayersSection";
import MarkersSection from "@/features/markers/ui/MarkersSection";
import TypographySection from "@/features/poster/ui/TypographySection";
import {
  DownloadIcon,
  LoaderIcon,
  LocationIcon,
  ThemeIcon,
  LayoutIcon,
  LayersIcon,
  MarkersIcon,
  StyleIcon,
  ExportIcon,
  ChevronDownIcon,
} from "@/shared/ui/Icons";

import { themeOptions } from "@/features/theme/infrastructure/themeRepository";
import { layoutGroups } from "@/features/layout/infrastructure/layoutRepository";
import {
  MIN_POSTER_CM,
  MAX_POSTER_CM,
  FONT_OPTIONS,
  DEFAULT_DISTANCE_METERS,
} from "@/core/config";
import { reverseGeocodeCoordinates } from "@/core/services";
import { GEOLOCATION_TIMEOUT_MS } from "@/features/map/infrastructure";
import type { SearchResult } from "@/features/location/domain/types";

type SectionId =
  | "location"
  | "theme"
  | "layout"
  | "layers"
  | "markers"
  | "style"
  | "export";

const accordionSections: {
  id: SectionId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "location", label: "Location", Icon: LocationIcon },
  { id: "theme", label: "Theme", Icon: ThemeIcon },
  { id: "layout", label: "Layout", Icon: LayoutIcon },
  { id: "layers", label: "Layers", Icon: LayersIcon },
  { id: "markers", label: "Markers", Icon: MarkersIcon },
  { id: "style", label: "Style", Icon: StyleIcon },
  { id: "export", label: "Export", Icon: ExportIcon },
];

export default function SettingsPanel() {
  const { state, selectedTheme, dispatch } = usePosterContext();
  const {
    handleChange,
    handleNumericFieldBlur,
    handleThemeChange,
    handleLayoutChange,
    handleColorChange,
    handleResetColors,
    handleLocationSelect,
    handleClearLocation,
    setLocationFocused,
    handleCreditsChange,
  } = useFormHandlers();
  const {
    handleDownloadPng,
    handleDownloadPdf,
    handleDownloadSvg,
    supportPrompt,
    dismissSupportPrompt,
  } = useExport();
  const { locationSuggestions, isLocationSearching } = useLocationAutocomplete(
    state.form.location,
    state.isLocationFocused,
  );
  const { flyToLocation } = useMapSync();

  const [isColorEditorActive, setIsColorEditorActive] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationPermissionMessage, setLocationPermissionMessage] =
    useState("");
  const [activeExportFormat, setActiveExportFormat] = useState<
    "png" | "pdf" | "svg" | null
  >(null);
  const [openSections, setOpenSections] = useState<Set<SectionId>>(
    new Set(["location", "theme", "layout", "style", "export"]),
  );

  const isAuxEditorActive = isColorEditorActive;

  const showLocationSuggestions =
    state.isLocationFocused && locationSuggestions.length > 0;

  const toggleSection = (id: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /** When user selects a location, fly the map there. */
  const onLocationSelect = (location: SearchResult) => {
    handleLocationSelect(location);
    flyToLocation(location.lat, location.lon);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation || isLocatingUser) return;

    const applyLocation = (lat: number, lon: number) => {
      setLocationPermissionMessage("");
      flyToLocation(lat, lon);
      dispatch({
        type: "SET_FORM_FIELDS",
        resetDisplayNameOverrides: true,
        fields: {
          latitude: lat.toFixed(6),
          longitude: lon.toFixed(6),
          distance: String(DEFAULT_DISTANCE_METERS),
        },
      });
      void reverseGeocodeCoordinates(lat, lon)
        .then((resolved) => {
          dispatch({
            type: "SET_FORM_FIELDS",
            resetDisplayNameOverrides: true,
            fields: {
              location: resolved.label,
              displayCity: String(resolved.city ?? "").trim(),
              displayCountry: String(resolved.country ?? "").trim(),
              displayContinent: String(resolved.continent ?? "").trim(),
            },
          });
          dispatch({ type: "SET_USER_LOCATION", location: resolved });
        })
        .catch(() => {
          const fallbackLocation: SearchResult = {
            id: `user:${lat.toFixed(6)},${lon.toFixed(6)}`,
            label: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
            city: "",
            country: "",
            continent: "",
            lat,
            lon,
          };
          dispatch({
            type: "SET_FORM_FIELDS",
            resetDisplayNameOverrides: true,
            fields: {
              location: fallbackLocation.label,
            },
          });
          dispatch({ type: "SET_USER_LOCATION", location: fallbackLocation });
        })
        .finally(() => {
          setIsLocatingUser(false);
        });
    };

    const requestPosition = (retry = false) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          applyLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          if (!retry) {
            // Retry once per click to re-trigger permission request where the browser allows it.
            requestPosition(true);
          } else {
            if (error?.code === 1) {
              setLocationPermissionMessage(
                "Location access is blocked. Please enable location permission for this website in your browser settings and try again. We do not track your location: this app runs fully client-side on your device and is open source.",
              );
            } else {
              setLocationPermissionMessage(
                "Could not get your current location right now. Please check browser location permissions and try again.",
              );
            }
            setIsLocatingUser(false);
          }
        },
        {
          enableHighAccuracy: retry,
          timeout: GEOLOCATION_TIMEOUT_MS,
          maximumAge: 0,
        },
      );
    };

    setIsLocatingUser(true);
    requestPosition(false);
  };

  const exportButtons = [
    {
      id: "png",
      label: "PNG",
      className: "generate-btn download-format-btn",
      onClick: () => {
        setActiveExportFormat("png");
        handleDownloadPng();
      },
    },
    {
      id: "pdf",
      label: "PDF",
      className: "ghost download-format-btn",
      onClick: () => {
        setActiveExportFormat("pdf");
        handleDownloadPdf();
      },
    },
    {
      id: "svg",
      label: "SVG",
      className: "download-format-btn export-map-btn",
      onClick: () => {
        setActiveExportFormat("svg");
        handleDownloadSvg();
      },
    },
  ] as const;

  useEffect(() => {
    if (!state.isExporting) {
      setActiveExportFormat(null);
    }
  }, [state.isExporting]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // No generation step needed — the poster is always live
  };

  return (
    <form className="settings-panel" onSubmit={onSubmit}>
      {/* ── Location ── */}
      <div className={`mobile-section mobile-section--location accordion-item${openSections.has("location") ? " accordion-item--open" : ""}`}>
        <AccordionHeader
          sectionId="location"
          label={accordionSections[0].label}
          Icon={accordionSections[0].Icon}
          isOpen={openSections.has("location")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("location") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isColorEditorActive && (
              <LocationSection
                form={state.form}
                onChange={handleChange}
                onLocationFocus={() => setLocationFocused(true)}
                onLocationBlur={() => setLocationFocused(false)}
                showLocationSuggestions={showLocationSuggestions}
                locationSuggestions={locationSuggestions}
                isLocationSearching={isLocationSearching}
                onLocationSelect={onLocationSelect}
                onClearLocation={handleClearLocation}
                onUseCurrentLocation={handleUseCurrentLocation}
                isLocatingUser={isLocatingUser}
                locationPermissionMessage={locationPermissionMessage}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Theme ── */}
      <div className={`mobile-section mobile-section--theme-settings accordion-item${openSections.has("theme") ? " accordion-item--open" : ""}`}>
        <AccordionHeader
          sectionId="theme"
          label={accordionSections[1].label}
          Icon={accordionSections[1].Icon}
          isOpen={openSections.has("theme")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("theme") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isColorEditorActive && (
              <MapSettingsSection
                form={state.form}
                onChange={handleChange}
                onNumericFieldBlur={handleNumericFieldBlur}
                onThemeChange={handleThemeChange}
                onLayoutChange={handleLayoutChange}
                selectedTheme={selectedTheme}
                themeOptions={themeOptions}
                layoutGroups={layoutGroups}
                minPosterCm={MIN_POSTER_CM}
                maxPosterCm={MAX_POSTER_CM}
                customColors={state.customColors}
                onColorChange={handleColorChange}
                onResetColors={handleResetColors}
                onColorEditorActiveChange={setIsColorEditorActive}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Layout ── */}
      <div className={`mobile-section mobile-section--layout-settings accordion-item${openSections.has("layout") ? " accordion-item--open" : ""}`}>
        <AccordionHeader
          sectionId="layout"
          label={accordionSections[2].label}
          Icon={accordionSections[2].Icon}
          isOpen={openSections.has("layout")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("layout") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isColorEditorActive && (
              <MapSettingsSection
                form={state.form}
                onChange={handleChange}
                onNumericFieldBlur={handleNumericFieldBlur}
                onThemeChange={handleThemeChange}
                onLayoutChange={handleLayoutChange}
                selectedTheme={selectedTheme}
                themeOptions={themeOptions}
                layoutGroups={layoutGroups}
                minPosterCm={MIN_POSTER_CM}
                maxPosterCm={MAX_POSTER_CM}
                customColors={state.customColors}
                onColorChange={handleColorChange}
                onResetColors={handleResetColors}
                onColorEditorActiveChange={setIsColorEditorActive}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Layers ── */}
      <div className={`mobile-section mobile-section--layers accordion-item${openSections.has("layers") ? " accordion-item--open" : ""}`}>
        <AccordionHeader
          sectionId="layers"
          label={accordionSections[3].label}
          Icon={accordionSections[3].Icon}
          isOpen={openSections.has("layers")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("layers") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isAuxEditorActive && (
              <LayersSection
                form={state.form}
                onChange={handleChange}
                minPosterCm={MIN_POSTER_CM}
                maxPosterCm={MAX_POSTER_CM}
                onNumericFieldBlur={handleNumericFieldBlur}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Markers ── */}
      <div className={`mobile-section mobile-section--markers accordion-item${openSections.has("markers") ? " accordion-item--open" : ""}`}>
        <AccordionHeader
          sectionId="markers"
          label={accordionSections[4].label}
          Icon={accordionSections[4].Icon}
          isOpen={openSections.has("markers")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("markers") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isColorEditorActive && <MarkersSection />}
          </div>
        </div>
      </div>

      {/* ── Style ── */}
      <div className={`mobile-section mobile-section--style accordion-item${openSections.has("style") ? " accordion-item--open" : ""}`}>
        <AccordionHeader
          sectionId="style"
          label={accordionSections[5].label}
          Icon={accordionSections[5].Icon}
          isOpen={openSections.has("style")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("style") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isAuxEditorActive && (
              <TypographySection
                form={state.form}
                onChange={handleChange}
                fontOptions={FONT_OPTIONS}
                onCreditsChange={handleCreditsChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Export ── */}
      <div className={`mobile-section mobile-section--export accordion-item${openSections.has("export") ? " accordion-item--open" : ""}`}>
        <AccordionHeader
          sectionId="export"
          label={accordionSections[6].label}
          Icon={accordionSections[6].Icon}
          isOpen={openSections.has("export")}
          onToggle={toggleSection}
        />
        <div
          className={`accordion-body${openSections.has("export") ? " is-open" : ""}`}
        >
          <div className="accordion-body-inner">
            {!isAuxEditorActive && (
              <div className="action-row">
                <div className="download-row">
                  {exportButtons.map((button) => (
                    <button
                      key={button.id}
                      type="button"
                      className={button.className}
                      onClick={button.onClick}
                      disabled={state.isExporting}
                    >
                      {state.isExporting && activeExportFormat === button.id ? (
                        <LoaderIcon className="download-btn-icon is-spinning" />
                      ) : (
                        <DownloadIcon className="download-btn-icon" />
                      )}
                      <span>
                        {state.isExporting && activeExportFormat === button.id
                          ? "Exporting..."
                          : button.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isAuxEditorActive && state.error && (
              <p className="error">{state.error}</p>
            )}
          </div>
        </div>
      </div>

      {supportPrompt ? (
        <SupportModal
          posterNumber={supportPrompt.posterNumber}
          isFirst={supportPrompt.isFirst}
          onClose={dismissSupportPrompt}
          titleId="settings-export-support-modal-title"
        />
      ) : null}
    </form>
  );
}

function AccordionHeader({
  sectionId,
  label,
  Icon,
  isOpen,
  onToggle,
}: {
  sectionId: SectionId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: (id: SectionId) => void;
}) {
  return (
    <button
      type="button"
      className={`accordion-header${isOpen ? " is-open" : ""}`}
      onClick={() => onToggle(sectionId)}
      aria-expanded={isOpen}
    >
      <Icon className="accordion-icon" />
      <span className="accordion-label">{label}</span>
      <ChevronDownIcon className="accordion-chevron" />
    </button>
  );
}



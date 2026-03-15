import { useRef, type WheelEvent } from "react";
import ThemeCard from "./ThemeCard";
import {
  ChevronCompactLeftIcon,
  ChevronCompactRightIcon,
  EditIcon,
} from "@/shared/ui/Icons";
import type { ThemeOption } from "../domain/types";

interface ThemeSummarySectionProps {
  themeOptions: ThemeOption[];
  selectedThemeId: string;
  selectedThemeOption: ThemeOption;
  onThemeSelect: (themeId: string) => void;
  onOpenThemePicker: () => void;
  onCustomize: () => void;
}

export default function ThemeSummarySection({
  themeOptions,
  selectedThemeId,
  selectedThemeOption,
  onThemeSelect,
  onOpenThemePicker,
  onCustomize,
}: ThemeSummarySectionProps) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const description =
    selectedThemeOption.description?.trim() || "No description available.";

  function handleSliderWheel(event: WheelEvent<HTMLDivElement>) {
    if (!sliderRef.current) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    sliderRef.current.scrollLeft += event.deltaY;
    event.preventDefault();
  }

  return (
    <div className="theme-summary-view">
      <div className="theme-mobile-slider">
        <div className="theme-slider-wrap">
          <span className="theme-slider-chevron theme-slider-chevron--left" aria-hidden="true">
            <ChevronCompactLeftIcon aria-hidden="true" />
          </span>
          <div
            ref={sliderRef}
            className="theme-slider"
            onWheel={handleSliderWheel}
            role="list"
            aria-label="Theme options"
          >
            {themeOptions.map((themeOption) => (
              <ThemeCard
                key={themeOption.id}
                themeOption={themeOption}
                isSelected={themeOption.id === selectedThemeId}
                onClick={() => onThemeSelect(themeOption.id)}
              />
            ))}
          </div>
          <span className="theme-slider-chevron theme-slider-chevron--right" aria-hidden="true">
            <ChevronCompactRightIcon aria-hidden="true" />
          </span>
        </div>
      </div>

      <ThemeCard
        themeOption={selectedThemeOption}
        isSelected
        showFullPalette
        onClick={onOpenThemePicker}
      />

      <div className="theme-summary-footer">
        <p className="theme-card-description">{description}</p>
        <button
          type="button"
          className="theme-customize-btn"
          onClick={onCustomize}
          aria-label={`Customize ${selectedThemeOption.name} colors`}
        >
          <span className="theme-customize-icon" aria-hidden="true">
            <EditIcon />
          </span>
        </button>
      </div>
    </div>
  );
}

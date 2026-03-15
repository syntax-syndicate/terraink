import { useState } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { useFormHandlers } from "@/features/poster/application/useFormHandlers";
import { useLocationAutocomplete } from "@/features/location/application/useLocationAutocomplete";
import { useMapSync } from "@/features/map/application/useMapSync";
import { reverseGeocodeCoordinates } from "@/core/services";
import { DEFAULT_DISTANCE_METERS } from "@/core/config";
import { GEOLOCATION_TIMEOUT_MS } from "@/features/map/infrastructure";
import {
  PLACEHOLDER_LOCATION_SEARCH,
  PLACEHOLDER_EXAMPLE_LATITUDE,
  PLACEHOLDER_EXAMPLE_LONGITUDE,
} from "@/features/location/ui/constants";
import type { SearchResult } from "@/features/location/domain/types";
import { MyLocationIcon, LocationIcon, SearchIcon } from "@/shared/ui/Icons";

/**
 * Desktop floating location bar.
 * Renders a pill-shaped search row with a search icon on the left,
 * a coords-toggle pin button, and a GPS button on the right.
 * Clicking the pin icon shows/hides the lat/lon coordinate fields.
 */
export default function DesktopLocationBar() {
  const { state, dispatch } = usePosterContext();
  const {
    handleChange,
    handleLocationSelect: handleLocationSelectBase,
    handleClearLocation,
    setLocationFocused,
  } = useFormHandlers();
  const { locationSuggestions, isLocationSearching } = useLocationAutocomplete(
    state.form.location,
    state.isLocationFocused,
  );
  const { flyToLocation } = useMapSync();

  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationPermissionMessage, setLocationPermissionMessage] = useState("");
  const [showCoords, setShowCoords] = useState(false);

  const hasLocationValue = state.form.location.trim().length > 0;
  const showLocationSuggestions =
    state.isLocationFocused && locationSuggestions.length > 0;

  const onLocationSelect = (location: SearchResult) => {
    handleLocationSelectBase(location);
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
          const fallback: SearchResult = {
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
            fields: { location: fallback.label },
          });
          dispatch({ type: "SET_USER_LOCATION", location: fallback });
        })
        .finally(() => setIsLocatingUser(false));
    };

    const requestPosition = (retry = false) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          if (!retry) {
            requestPosition(true);
          } else {
            setLocationPermissionMessage(
              err?.code === 1
                ? "Location access is blocked. Enable it in your browser settings."
                : "Could not get your location. Please try again.",
            );
            setIsLocatingUser(false);
          }
        },
        { enableHighAccuracy: retry, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 0 },
      );
    };

    setIsLocatingUser(true);
    requestPosition(false);
  };

  return (
    <div className={`dsk-loc-bar${showCoords ? " show-coords" : ""}`}>
      <div className="location-autocomplete">
        <div className="location-search-stack">
          <div className="location-search-main-row">
            <div className="location-search-row">
              <span className="location-search-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <div className="location-input-wrap">
                <input
                  className="form-control-tall"
                  name="location"
                  value={state.form.location}
                  onChange={handleChange}
                  onFocus={() => setLocationFocused(true)}
                  onBlur={() => setLocationFocused(false)}
                  placeholder={PLACEHOLDER_LOCATION_SEARCH}
                  autoComplete="off"
                />
                {hasLocationValue ? (
                  <button
                    type="button"
                    className="location-clear-btn"
                    aria-label="Clear location"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleClearLocation}
                  >
                    x
                  </button>
                ) : null}
              </div>
            </div>

            <div className="location-search-icons">
            <button
              type="button"
              className={`icon-only-btn location-row-icon-btn${isLocatingUser ? " is-locating" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleUseCurrentLocation}
              disabled={isLocatingUser}
              aria-label="Use current location"
              title="Use current location"
            >
              <MyLocationIcon className="location-current-icon" />
            </button>
            <button
              type="button"
              className={`icon-only-btn location-row-icon-btn${showCoords ? " is-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowCoords((v) => !v)}
              aria-label="Toggle coordinate fields"
              title="Show/hide lat & lon"
            >
              <LocationIcon />
            </button>
            </div>
          </div>

          {showLocationSuggestions ? (
            <ul className="location-suggestions" role="listbox">
              {locationSuggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    className="location-suggestion"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onLocationSelect(suggestion);
                    }}
                  >
                    {suggestion.label}
                  </button>
                </li>
              ))}
              {isLocationSearching ? (
                <li className="location-suggestion-status">Searching...</li>
              ) : null}
            </ul>
          ) : null}
        </div>

        {locationPermissionMessage ? (
          <p className="location-permission-message">{locationPermissionMessage}</p>
        ) : null}

        <div className="dsk-loc-coords">
          <label>
            Latitude
            <input
              className="form-control-tall"
              name="latitude"
              value={state.form.latitude}
              onChange={handleChange}
              placeholder={PLACEHOLDER_EXAMPLE_LATITUDE}
            />
          </label>
          <label>
            Longitude
            <input
              className="form-control-tall"
              name="longitude"
              value={state.form.longitude}
              onChange={handleChange}
              placeholder={PLACEHOLDER_EXAMPLE_LONGITUDE}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();

  const [locationStatus, setLocationStatus] = useState<
    "locating" | "active" | "denied"
  >("locating");

  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const zoomParam = searchParams.get("zoom");

  const fallbackLat = Number(latParam) || 12.9716;
  const fallbackLng = Number(lngParam) || 77.5946;
  const fallbackZoom = Number(zoomParam) || 12;

  // True when a specific cleanup task was selected
  const taskSelected = Boolean(latParam && lngParam);

  // UrbanTriage nearby activity radius
  const ACTIVITY_RADIUS = 900;

  useEffect(() => {
    let map: any;
    let userMarker: any;
    let radiusCircle: any;
    let locationAccuracyCircle: any;

    let cancelled = false;

    const loadMap = async () => {
      const L = await import("leaflet");

      if (!mapContainer.current || cancelled) return;

      // Prevent duplicate map initialization
      if ((mapContainer.current as any)._leaflet_id) return;

      /*
       * --------------------------------------------------------
       * INITIAL MAP
       * --------------------------------------------------------
       */

      map = L.map(mapContainer.current, {
        center: [fallbackLat, fallbackLng],
        zoom: fallbackZoom,
        zoomControl: false,
      });

      /*
       * --------------------------------------------------------
       * OPENSTREETMAP
       * --------------------------------------------------------
       */

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(map);

      /*
       * --------------------------------------------------------
       * CLEANUP TASK MARKERS & GROUPED LOCATION POPS
       * --------------------------------------------------------
       */

      let allMapTasks: any[] = [
        {
          id: "UT-101",
          type: "Plastic & Hazardous Waste",
          location: "Koramangala 5th Block, Bengaluru",
          lat: 12.9352,
          lng: 77.6245,
          volunteers: "3 needed",
          priority: "HIGH",
          equipment: "Heavy Duty Gloves, Trash Bags, Hazard Suits",
        },
        {
          id: "UT-102",
          type: "Mixed Waste Dump",
          location: "Indiranagar 100ft Road, Bengaluru",
          lat: 12.9784,
          lng: 77.6408,
          volunteers: "2 needed",
          priority: "MEDIUM",
          equipment: "Gloves, Trash Tongs, Rakes",
        }
      ];

      try {
        const savedTasks = localStorage.getItem("urbantriage_cleanup_tasks");
        if (savedTasks) {
          const parsed = JSON.parse(savedTasks);
          if (Array.isArray(parsed) && parsed.length > 0) {
            allMapTasks = [...parsed, ...allMapTasks];
          }
        }
      } catch (e) {
        console.error("Error loading tasks for map:", e);
      }

      // Group tasks by coordinate key
      const taskGroups: { [key: string]: any[] } = {};
      allMapTasks.forEach((t) => {
        const key = `${t.lat.toFixed(3)},${t.lng.toFixed(3)}`;
        if (!taskGroups[key]) taskGroups[key] = [];
        taskGroups[key].push(t);
      });

      // Render a Red Circle Marker for each location group
      Object.keys(taskGroups).forEach((key) => {
        const group = taskGroups[key];
        const first = group[0];

        const redMarker = L.circleMarker([first.lat, first.lng], {
          radius: 12,
          color: "#FF5364",
          weight: 3,
          fillColor: "#FF5364",
          fillOpacity: 0.7,
        }).addTo(map);

        // Build popup HTML for single or multiple tasks
        let popupHtml = "";
        if (group.length === 1) {
          const t = group[0];
          popupHtml = `
            <div style="min-width: 220px; font-family: system-ui, -apple-system, sans-serif; padding: 4px;">
              <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #FF5364; margin-bottom: 4px;">
                🔴 SCHEDULED CLEANUP TASK
              </div>
              <div style="font-size: 15px; font-weight: 700; color: #111; margin-bottom: 4px;">
                ${t.type || "Waste Cleanup"}
              </div>
              <div style="font-size: 12px; color: #444; margin-bottom: 6px;">
                📍 ${t.location}
              </div>
              <div style="font-size: 11px; background: #FFF5F5; border: 1px solid #FFE0E0; padding: 6px 8px; border-radius: 6px; margin-bottom: 6px; color: #333;">
                <div>👥 <strong>Volunteers:</strong> ${t.volunteers || "Needed"}</div>
                <div>🛠️ <strong>Equipment:</strong> ${t.equipment || "Standard"}</div>
                <div>⚠️ <strong>Priority:</strong> ${t.priority || "HIGH"}</div>
              </div>
            </div>
          `;
        } else {
          // Multiple tasks at this location!
          popupHtml = `
            <div style="min-width: 260px; max-height: 280px; overflow-y: auto; font-family: system-ui, -apple-system, sans-serif; padding: 4px;">
              <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #FF5364; margin-bottom: 4px;">
                🔴 MULTIPLE TASKS AT THIS POINT (${group.length} Tasks)
              </div>
              <div style="font-size: 13px; font-weight: 600; color: #111; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                📍 ${first.location}
              </div>
              ${group.map((t, idx) => `
                <div style="background: #FAF8F8; border: 1px solid #EEE; padding: 8px; border-radius: 8px; margin-bottom: 6px;">
                  <div style="font-size: 12px; font-weight: 700; color: #111;">
                    #${idx + 1}. ${t.type} (${t.priority} Priority)
                  </div>
                  <div style="font-size: 11px; color: #555; margin-top: 3px;">
                    👥 ${t.volunteers} | 🛠️ ${t.equipment || "None"}
                  </div>
                </div>
              `).join("")}
            </div>
          `;
        }

        redMarker.bindPopup(popupHtml);

        // Open popup on hover or click
        redMarker.on("mouseover", function (e: any) {
          this.openPopup();
        });
      });

      /*
       * --------------------------------------------------------
       * ZOOM CONTROLS
       * --------------------------------------------------------
       */

      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map);

      /*
       * --------------------------------------------------------
       * CURRENT USER LOCATION
       * --------------------------------------------------------
       */

      if (!navigator.geolocation) {
        setLocationStatus("denied");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled || !map) return;

          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          /*
           * ----------------------------------------------------
           * BLUE USER MARKER
           * ----------------------------------------------------
           */

          const userIcon = L.divIcon({
            className: "",
            html: `
              <div style="
                position: relative;
                width: 22px;
                height: 22px;
              ">
                <div style="
                  position: absolute;
                  left: 50%;
                  top: 50%;
                  width: 22px;
                  height: 22px;
                  transform: translate(-50%, -50%);
                  border-radius: 50%;
                  background: rgba(77,166,255,0.20);
                  animation: urbanTriageLocationPulse 2s infinite;
                "></div>

                <div style="
                  position: absolute;
                  left: 50%;
                  top: 50%;
                  width: 12px;
                  height: 12px;
                  transform: translate(-50%, -50%);
                  border-radius: 50%;
                  background: #4DA6FF;
                  border: 3px solid white;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.35);
                "></div>
              </div>

              <style>
                @keyframes urbanTriageLocationPulse {
                  0% {
                    transform: translate(-50%, -50%) scale(0.7);
                    opacity: 0.9;
                  }

                  70% {
                    transform: translate(-50%, -50%) scale(1.7);
                    opacity: 0;
                  }

                  100% {
                    transform: translate(-50%, -50%) scale(1.7);
                    opacity: 0;
                  }
                }
              </style>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          userMarker = L.marker(
            [userLat, userLng],
            {
              icon: userIcon,
              zIndexOffset: 1000,
            }
          );

          userMarker
            .addTo(map)
            .bindPopup(
              `
                <div style="
                  min-width: 150px;
                  font-family: Arial, sans-serif;
                ">
                  <div style="
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 0.15em;
                    color: #268BE8;
                    margin-bottom: 6px;
                  ">
                    YOUR LOCATION
                  </div>

                  <div style="
                    font-size: 15px;
                    font-weight: 600;
                    color: #111;
                  ">
                    You are here
                  </div>

                  <div style="
                    margin-top: 5px;
                    font-size: 11px;
                    color: #666;
                  ">
                    900 m monitoring radius
                  </div>
                </div>
              `
            );

          /*
           * ----------------------------------------------------
           * 900 M ACTIVITY RADIUS
           * ----------------------------------------------------
           */

          radiusCircle = L.circle(
            [userLat, userLng],
            {
              radius: ACTIVITY_RADIUS,
              color: "#4DA6FF",
              weight: 1.5,
              opacity: 0.55,
              fillColor: "#4DA6FF",
              fillOpacity: 0.045,
              dashArray: "6 8",
            }
          );

          radiusCircle.addTo(map);

          /*
           * ----------------------------------------------------
           * LOCATION ACCURACY
           * ----------------------------------------------------
           */

          if (position.coords.accuracy) {
            locationAccuracyCircle = L.circle(
              [userLat, userLng],
              {
                radius: position.coords.accuracy,
                color: "#4DA6FF",
                weight: 1,
                opacity: 0.25,
                fillColor: "#4DA6FF",
                fillOpacity: 0.06,
              }
            );

            locationAccuracyCircle.addTo(map);
          }

          /*
           * ----------------------------------------------------
           * CENTER MAP ON USER
           * ----------------------------------------------------
           *
           * Fit the map around the 900 m circle so the complete
           * activity radius is visible.
           */

          const radiusBounds = radiusCircle.getBounds();

          map.fitBounds(radiusBounds, {
            padding: [70, 70],
            maxZoom: 15,
            animate: true,
          });

          /*
           * ----------------------------------------------------
           * TASK LOCATION
           * ----------------------------------------------------
           *
           * If this map was opened from a cleanup task:
           *
           * - Keep the user's 900 m radius.
           * - If the task is nearby, show both naturally.
           * - If it is farther away, fit both user + task.
           */

          if (taskSelected) {
            const userPoint = L.latLng(
              userLat,
              userLng
            );

            const taskPoint = L.latLng(
              fallbackLat,
              fallbackLng
            );

            const distance =
              userPoint.distanceTo(taskPoint);

            /*
             * If task is outside approximately the nearby
             * activity area, fit both points.
             */

            if (distance > 1100) {
              const bounds = L.latLngBounds([
                [userLat, userLng],
                [fallbackLat, fallbackLng],
              ]);

              map.fitBounds(bounds, {
                padding: [70, 70],
                maxZoom: 14,
                animate: true,
              });
            }
          }

          setLocationStatus("active");
        },

        (error) => {
          if (cancelled) return;

          console.log(
            "Unable to get current location:",
            error.message
          );

          setLocationStatus("denied");

          /*
           * Keep the map working using fallback/task coordinates.
           */
        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    loadMap();

    return () => {
      cancelled = true;

      if (userMarker) {
        userMarker.remove();
      }

      if (radiusCircle) {
        radiusCircle.remove();
      }

      if (locationAccuracyCircle) {
        locationAccuracyCircle.remove();
      }

      if (map) {
        map.remove();
      }
    };
  }, [
    fallbackLat,
    fallbackLng,
    fallbackZoom,
    taskSelected,
  ]);

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#06110D]">

      {/* =====================================================
          MAP
      ===================================================== */}

      <div
        ref={mapContainer}
        className="absolute inset-0"
      />

      {/* =====================================================
          TOP LEFT — URBANTRIAGE
      ===================================================== */}

      <div className="pointer-events-none absolute left-6 top-6 z-[1000]">

        <div className="rounded-2xl border border-white/10 bg-[#06110D]/80 px-5 py-4 shadow-2xl backdrop-blur-xl">

          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#4DFF9A]">
            UrbanTriage
          </p>

          <h1 className="mt-1 text-xl font-semibold text-white">
            Environmental Intelligence
          </h1>

          <p className="mt-1 text-xs text-[#91A99C]">
            Live waste & cleanup activity
          </p>

        </div>

      </div>

      {/* =====================================================
          TOP RIGHT — USER NAVIGATION
      ===================================================== */}

      <div className="absolute right-6 top-6 z-[1000] flex items-center gap-2">

        <Link
          href="/volunteer/tasks"
          className="rounded-xl border border-white/10 bg-[#06110D]/85 px-4 py-2.5 text-sm font-medium text-[#91A99C] shadow-xl backdrop-blur-xl transition-all duration-200 hover:border-[#19D879]/30 hover:bg-[#0B2118] hover:text-[#F4FFF8]"
        >
          Tasks
        </Link>

        <Link
          href="/report"
          className="rounded-xl border border-white/10 bg-[#06110D]/85 px-4 py-2.5 text-sm font-medium text-[#91A99C] shadow-xl backdrop-blur-xl transition-all duration-200 hover:border-[#19D879]/30 hover:bg-[#0B2118] hover:text-[#F4FFF8]"
        >
          Report Incident
        </Link>

        <Link
          href="/"
          className="rounded-xl border border-white/10 bg-[#06110D]/85 px-4 py-2.5 text-sm font-medium text-[#91A99C] shadow-xl backdrop-blur-xl transition-all duration-200 hover:border-[#19D879]/30 hover:bg-[#0B2118] hover:text-[#F4FFF8]"
        >
          Home
        </Link>

      </div>

      {/* =====================================================
          LOCATION STATUS
      ===================================================== */}

      <div className="absolute left-1/2 top-6 z-[1000] -translate-x-1/2">

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#06110D]/85 px-4 py-2.5 shadow-xl backdrop-blur-xl">

          {locationStatus === "locating" && (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#FFB84D]" />

              <span className="text-xs font-medium text-[#F4FFF8]">
                Locating you...
              </span>
            </>
          )}

          {locationStatus === "active" && (
            <>
              <span className="h-2 w-2 rounded-full bg-[#4DA6FF] shadow-[0_0_10px_rgba(77,166,255,0.7)]" />

              <span className="text-xs font-medium text-[#F4FFF8]">
                Your location · 900 m radius
              </span>
            </>
          )}

          {locationStatus === "denied" && (
            <>
              <span className="h-2 w-2 rounded-full bg-[#FF5364]" />

              <span className="text-xs font-medium text-[#F4FFF8]">
                Location unavailable
              </span>
            </>
          )}

        </div>

      </div>

      {/* =====================================================
          SELECTED TASK INDICATOR
      ===================================================== */}

      {taskSelected && (
        <div className="absolute left-1/2 top-[76px] z-[1000] -translate-x-1/2">

          <div className="flex items-center gap-2 rounded-full border border-[#19D879]/20 bg-[#06110D]/85 px-4 py-2.5 shadow-xl backdrop-blur-xl">

            <span className="h-2 w-2 animate-pulse rounded-full bg-[#19D879]" />

            <span className="text-xs font-medium text-[#F4FFF8]">
              Cleanup location selected
            </span>

          </div>

        </div>
      )}

      {/* =====================================================
          RADIUS INDICATOR
      ===================================================== */}

      {locationStatus === "active" && (
        <div className="pointer-events-none absolute bottom-6 right-6 z-[1000]">

          <div className="rounded-2xl border border-[#4DA6FF]/20 bg-[#06110D]/85 px-5 py-4 shadow-xl backdrop-blur-xl">

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#91A99C]">
              YOUR AREA
            </p>

            <p className="mt-1 text-lg font-semibold text-[#F4FFF8]">
              900 m
            </p>

            <p className="mt-1 text-xs text-[#91A99C]">
              Nearby cleanup activity
            </p>

          </div>

        </div>
      )}

      {/* =====================================================
          LEGEND
      ===================================================== */}

      <div className="absolute bottom-6 left-6 z-[1000] rounded-2xl border border-white/10 bg-[#06110D]/85 px-5 py-4 backdrop-blur-xl">

        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#91A99C]">
          Map Layers
        </p>

        <div className="space-y-2 text-xs text-white">

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5364]" />
            Active waste
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFB84D]" />
            Pending verification
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#19D879]" />
            Verified cleanup
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4DA6FF]" />
            Your location
          </div>

          <div className="mt-3 border-t border-white/[0.08] pt-3 text-[11px] text-[#91A99C]">
            Dashed circle = 900 m activity radius
          </div>

        </div>

      </div>

    </main>
  );
}
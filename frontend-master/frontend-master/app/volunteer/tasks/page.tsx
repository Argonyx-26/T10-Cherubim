"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface CleanupTask {
  id: string;
  type: string;
  location: string;
  lat: number;
  lng: number;
  distance: string;
  quantity: string;
  volunteers: string;
  joined: number;
  deadline: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  equipment: string;
  status: string;
}

const DEFAULT_TASKS: CleanupTask[] = [
  {
    id: "UT-101",
    type: "Plastic & Hazardous Waste",
    location: "Koramangala 5th Block, Bengaluru",
    lat: 12.9352,
    lng: 77.6245,
    distance: "0.8 km",
    quantity: "Large",
    volunteers: "3 needed",
    joined: 1,
    deadline: "Today · 6:30 PM",
    priority: "HIGH",
    equipment: "Heavy Duty Gloves, Trash Bags, Hazard Suits",
    status: "Open",
  },
  {
    id: "UT-102",
    type: "Mixed Waste",
    location: "Indiranagar 100ft Road, Bengaluru",
    lat: 12.9784,
    lng: 77.6408,
    distance: "1.4 km",
    quantity: "Medium",
    volunteers: "2 needed",
    joined: 0,
    deadline: "Today · 8:00 PM",
    priority: "MEDIUM",
    equipment: "Gloves, Trash Tongs, Rakes",
    status: "Open",
  },
];

export default function VolunteerTasks() {
  const [tasks, setTasks] = useState<CleanupTask[]>(DEFAULT_TASKS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("urbantriage_cleanup_tasks");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks([...parsed, ...DEFAULT_TASKS]);
        }
      }
    } catch (e) {
      console.error("Failed to load custom tasks:", e);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#06110D] text-[#F4FFF8]">
      {/* NAVBAR */}
      <nav className="mx-auto flex h-[88px] max-w-[1200px] items-center justify-between px-6">
        <Link
          href="/volunteer"
          className="text-[22px] font-semibold tracking-[-0.04em]"
        >
          Urban<span className="text-[#19D879]">Triage</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/volunteer"
            className="rounded-xl px-4 py-2.5 text-sm text-[#91A99C] transition-colors hover:text-[#F4FFF8]"
          >
            Dashboard
          </Link>

          <Link
            href="/report"
            className="rounded-xl px-4 py-2.5 text-sm text-[#91A99C] transition-colors hover:text-[#F4FFF8]"
          >
            Report
          </Link>

          <Link
            href="/map"
            className="rounded-xl px-4 py-2.5 text-sm text-[#91A99C] transition-colors hover:text-[#F4FFF8]"
          >
            City Map
          </Link>

          <button
            type="button"
            className="ml-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.035] text-sm transition-all hover:border-[#19D879]/30 relative"
            aria-label="Notifications"
          >
            🔔
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#FF5364]" />
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      <section className="mx-auto max-w-[1200px] px-6 pb-24 pt-12">
        {/* HEADER */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#19D879]">
              CLEANUP NETWORK
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] md:text-5xl">
              Nearby tasks
            </h1>

            <p className="mt-4 max-w-[600px] text-sm leading-7 text-[#91A99C] md:text-base">
              Verified cleanup tasks around your current area.
              Join a task and help turn a reported problem into
              measurable environmental impact.
            </p>
          </div>

          {/* LOCATION STATUS */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#19D879]/15 bg-[#0B2118]/60 px-4 py-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#19D879]" />

            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-[#91A99C]">
                Your area
              </p>

              <p className="mt-0.5 text-sm font-medium text-[#F4FFF8]">
                Bengaluru
              </p>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="mt-10 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-[#19D879] px-4 py-2 text-xs font-semibold text-[#06110D]"
          >
            Nearby ({tasks.length})
          </button>

          <button
            type="button"
            className="rounded-full border border-white/[0.10] bg-white/[0.035] px-4 py-2 text-xs text-[#91A99C] transition-colors hover:text-[#F4FFF8]"
          >
            All Tasks
          </button>

          <button
            type="button"
            className="rounded-full border border-white/[0.10] bg-white/[0.035] px-4 py-2 text-xs text-[#91A99C] transition-colors hover:text-[#F4FFF8]"
          >
            High Priority
          </button>
        </div>

        {/* TASKS */}
        <div className="mt-6 space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="group rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-6 transition-all duration-300 hover:border-[#19D879]/25 hover:bg-[#0B2118]/50"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                {/* TASK INFO */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#19D879]">
                      {task.type}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] ${
                        task.priority === "HIGH"
                          ? "bg-[#FF5364]/10 text-[#FF5364]"
                          : "bg-[#FFB84D]/10 text-[#FFB84D]"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-semibold">
                    Cleanup required at {task.location}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#91A99C]">
                    <span>📍 {task.location}</span>

                    <span>{task.distance} away</span>

                    <span>{task.quantity} waste</span>
                  </div>

                  {/* SPECIAL EQUIPMENT NEEDED */}
                  {task.equipment && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="text-[#FFB84D] font-medium">🛠️ Equipment Needed:</span>
                      <span className="rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1 text-[#F4FFF8]">
                        {task.equipment}
                      </span>
                    </div>
                  )}
                </div>

                {/* TASK DETAILS */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-y border-white/[0.06] py-4 text-xs sm:grid-cols-3 lg:border-y-0 lg:py-0">
                  <div>
                    <p className="text-[#91A99C]">
                      Volunteers Needed
                    </p>

                    <p className="mt-1 font-medium text-[#F4FFF8]">
                      {task.joined} / {task.volunteers}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#91A99C]">
                      Deadline
                    </p>

                    <p className="mt-1 font-medium text-[#F4FFF8]">
                      {task.deadline}
                    </p>
                  </div>

                  <div>
                    <p className="text-[#91A99C]">
                      Status
                    </p>

                    <p className="mt-1 font-medium text-[#19D879]">
                      {task.status || "Verified"}
                    </p>
                  </div>
                </div>

                {/* ACTION */}
                <Link
                  href={`/map?lat=${task.lat}&lng=${task.lng}&zoom=15`}
                  className="rounded-xl bg-[#19D879] px-5 py-3 text-sm font-semibold text-[#06110D] transition-all duration-200 hover:bg-[#4DFF9A] hover:shadow-[0_0_30px_rgba(25,216,121,0.15)]"
                >
                  View on Map
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* INFO */}
        <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div className="flex gap-3">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#19D879]" />

            <p className="text-xs leading-6 text-[#91A99C]">
              Tasks shown here are verified cleanup opportunities.
              In the live system, nearby volunteers will receive
              notifications when a new task is created within their
              configured radius.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
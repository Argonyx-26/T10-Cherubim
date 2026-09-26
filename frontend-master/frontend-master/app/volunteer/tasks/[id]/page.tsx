"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function TaskDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [joined, setJoined] = useState(false);
  const [completed, setCompleted] = useState(false);

  /*
   * Restore task state after refresh/navigation.
   *
   * Demo only — later this will come from the backend.
   */
  useEffect(() => {
    const saved = localStorage.getItem(
      `urbantriage-task-${id}`
    );

    if (!saved) return;

    try {
      const task = JSON.parse(saved);

      if (task.status === "completed") {
        setCompleted(true);
        setJoined(true);
      }
    } catch {
      localStorage.removeItem(
        `urbantriage-task-${id}`
      );
    }
  }, [id]);

  const currentVolunteers = completed
    ? 3
    : joined
      ? 2
      : 1;

  const progress = completed
    ? "3/3"
    : joined
      ? "2/3"
      : "1/3";

  return (
    <main className="min-h-screen bg-[#06110D] text-[#F4FFF8]">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="mx-auto flex h-[88px] max-w-[1200px] items-center justify-between px-6">

        <Link
          href="/volunteer"
          className="text-[22px] font-semibold tracking-[-0.04em]"
        >
          Urban<span className="text-[#19D879]">Triage</span>
        </Link>

        <div className="flex items-center gap-2">

          <Link
            href="/volunteer/tasks"
            className="rounded-xl px-4 py-2.5 text-sm text-[#91A99C] transition-colors hover:text-[#F4FFF8]"
          >
            ← Tasks
          </Link>

          <Link
            href="/map"
            className="rounded-xl px-4 py-2.5 text-sm text-[#91A99C] transition-colors hover:text-[#F4FFF8]"
          >
            City Map
          </Link>

        </div>

      </nav>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-[1000px] px-6 pb-24 pt-12">

        {/* HEADER */}

        <div>

          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#19D879]">
            {completed
              ? "COMPLETED CLEANUP TASK"
              : "VERIFIED CLEANUP TASK"}
          </p>

          <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>

              <h1 className="text-4xl font-semibold tracking-[-0.045em] md:text-5xl">
                Mixed Waste Cleanup
              </h1>

              <p className="mt-4 text-sm text-[#91A99C]">
                Task #{id} · Verified by UrbanTriage
              </p>

            </div>

            {completed ? (
              <span className="w-fit rounded-full bg-[#19D879]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#19D879]">
                COMPLETED
              </span>
            ) : (
              <span className="w-fit rounded-full bg-[#FF5364]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#FF5364]">
                HIGH PRIORITY
              </span>
            )}

          </div>

        </div>

        {/* JOINED / COMPLETED STATUS */}

        {joined && (

          <div
            className={`mt-8 rounded-2xl px-5 py-4 ${
              completed
                ? "border border-[#19D879]/25 bg-[#19D879]/10"
                : "border border-[#19D879]/20 bg-[#19D879]/10"
            }`}
          >

            <div className="flex items-center gap-3">

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#19D879] text-sm font-bold text-[#06110D]">
                ✓
              </span>

              <div>

                <p className="text-sm font-semibold text-[#F4FFF8]">
                  {completed
                    ? "Cleanup completed."
                    : "You're part of this cleanup."}
                </p>

                <p className="mt-1 text-xs text-[#91A99C]">
                  {completed
                    ? "This task has been verified. All participating volunteers received completion credit."
                    : "Task details and cleanup instructions will be available here."}
                </p>

              </div>

            </div>

          </div>

        )}

        {/* LOCATION */}

        <div className="mt-10 rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-7">

          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#91A99C]">
            LOCATION
          </p>

          <h2 className="mt-3 text-xl font-semibold">
            Indiranagar, Bengaluru
          </h2>

          <p className="mt-2 text-sm text-[#91A99C]">
            Approximately 0.8 km from your current area
          </p>

          <Link
            href="/map?lat=12.9784&lng=77.6408&zoom=16"
            className="mt-6 inline-flex rounded-xl border border-[#19D879]/20 bg-[#19D879]/10 px-4 py-2.5 text-sm font-medium text-[#19D879] transition-colors hover:bg-[#19D879]/15"
          >
            View on City Map →
          </Link>

        </div>

        {/* BASIC DETAILS */}

        <div className="mt-5 grid gap-5 md:grid-cols-3">

          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-6">

            <p className="text-xs text-[#91A99C]">
              Waste Type
            </p>

            <p className="mt-3 text-lg font-semibold">
              Mixed Waste
            </p>

          </div>

          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-6">

            <p className="text-xs text-[#91A99C]">
              Estimated Scale
            </p>

            <p className="mt-3 text-lg font-semibold">
              Large
            </p>

          </div>

          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-6">

            <p className="text-xs text-[#91A99C]">
              Deadline
            </p>

            <p className="mt-3 text-lg font-semibold">
              Today · 6:30 PM
            </p>

          </div>

        </div>

        {/* VOLUNTEERS + EQUIPMENT */}

        <div className="mt-5 grid gap-5 md:grid-cols-2">

          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-7">

            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#91A99C]">
              VOLUNTEERS
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {progress}
            </p>

            <p className="mt-2 text-sm text-[#91A99C]">

              {completed
                ? "All required volunteers completed the task."
                : joined
                  ? "One more volunteer is needed."
                  : "Two more volunteers are needed."}

            </p>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]">

              <div
                className={`h-full rounded-full bg-[#19D879] transition-all duration-500 ${
                  completed
                    ? "w-full"
                    : joined
                      ? "w-2/3"
                      : "w-1/3"
                }`}
              />

            </div>

          </div>

          <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-7">

            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#91A99C]">
              REQUIRED EQUIPMENT
            </p>

            <div className="mt-4 flex flex-wrap gap-2">

              <span className="rounded-full bg-white/[0.05] px-3 py-2 text-xs text-[#F4FFF8]">
                Gloves
              </span>

              <span className="rounded-full bg-white/[0.05] px-3 py-2 text-xs text-[#F4FFF8]">
                Garbage bags
              </span>

              <span className="rounded-full bg-white/[0.05] px-3 py-2 text-xs text-[#F4FFF8]">
                Collection cart
              </span>

            </div>

          </div>

        </div>

        {/* INCIDENT ANALYSIS */}

        <div className="mt-5 rounded-[24px] border border-[#19D879]/10 bg-[#0B2118]/40 p-7">

          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#19D879]">
            INCIDENT ANALYSIS
          </p>

          <h2 className="mt-3 text-xl font-semibold">
            Why this task was created
          </h2>

          <p className="mt-3 max-w-[720px] text-sm leading-7 text-[#91A99C]">
            The reported image was verified as a waste incident.
            Environmental analysis identified mixed waste at a
            large estimated scale, making coordinated cleanup
            appropriate.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">

            <div className="rounded-xl border border-white/[0.07] bg-black/10 p-4">

              <p className="text-xs text-[#91A99C]">
                Verification
              </p>

              <p className="mt-1 text-sm font-medium text-[#19D879]">
                Verified
              </p>

            </div>

            <div className="rounded-xl border border-white/[0.07] bg-black/10 p-4">

              <p className="text-xs text-[#91A99C]">
                Waste detected
              </p>

              <p className="mt-1 text-sm font-medium">
                Yes
              </p>

            </div>

            <div className="rounded-xl border border-white/[0.07] bg-black/10 p-4">

              <p className="text-xs text-[#91A99C]">
                Scale
              </p>

              <p className="mt-1 text-sm font-medium">
                Large
              </p>

            </div>

          </div>

        </div>

        {/* =====================================================
            ACTION AREA
        ===================================================== */}

        <div className="mt-8 flex flex-col items-center justify-between gap-5 rounded-[28px] border border-[#19D879]/20 bg-[#0B2118]/60 p-7 sm:flex-row">

          <div>

            <p className="text-lg font-semibold">

              {completed
                ? "This cleanup is complete."
                : joined
                  ? "You're ready to verify."
                  : "Ready to help?"}

            </p>

            <p className="mt-1 text-sm text-[#91A99C]">

              {completed
                ? "All participating volunteers received +120 points."
                : joined
                  ? "Submit after-cleanup proof once the cleanup is finished."
                  : "Join this cleanup and contribute to the community."}

            </p>

          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto">

            {/* COMPLETED */}

            {completed ? (

              <div className="w-full rounded-xl border border-[#19D879]/25 bg-[#19D879]/10 px-7 py-3.5 text-center text-sm font-semibold text-[#19D879] sm:w-auto">
                ✓ Task Completed · +120 points
              </div>

            ) : joined ? (

              /* JOINED */

              <Link
                href={`/volunteer/tasks/${id}/verify`}
                className="w-full rounded-xl bg-[#19D879] px-7 py-3.5 text-center text-sm font-semibold text-[#06110D] transition-all duration-200 hover:bg-[#4DFF9A] hover:shadow-[0_0_35px_rgba(25,216,121,0.18)] sm:w-auto"
              >
                Verify Cleanup →
              </Link>

            ) : (

              /* NOT JOINED */

              <button
                type="button"
                onClick={() => setJoined(true)}
                className="w-full rounded-xl bg-[#19D879] px-7 py-3.5 text-sm font-semibold text-[#06110D] transition-all duration-200 hover:bg-[#4DFF9A] hover:shadow-[0_0_35px_rgba(25,216,121,0.18)] sm:w-auto"
              >
                Join Cleanup
              </button>

            )}

          </div>

        </div>

      </section>

    </main>
  );
}
"use client";

import Link from "next/link";

export default function VolunteerDashboard() {
  return (
    <main className="min-h-screen bg-[#06110D] text-[#F4FFF8]">

      {/* NAVBAR */}
      <nav className="mx-auto flex h-[88px] max-w-[1200px] items-center justify-between px-6">
        <Link
          href="/"
          className="text-[22px] font-semibold tracking-[-0.04em]"
        >
          Urban<span className="text-[#19D879]">Triage</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/report"
            className="rounded-xl border border-white/[0.10] bg-white/[0.035] px-4 py-2.5 text-sm text-[#91A99C] transition-all hover:border-[#19D879]/30 hover:text-[#F4FFF8]"
          >
            Report Incident
          </Link>

          <Link
            href="/map"
            className="rounded-xl border border-white/[0.10] bg-white/[0.035] px-4 py-2.5 text-sm text-[#91A99C] transition-all hover:border-[#19D879]/30 hover:text-[#F4FFF8]"
          >
            City Map
          </Link>

          <button
            type="button"
            className="ml-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.035] text-[#91A99C] transition-all hover:border-[#19D879]/30 hover:text-[#F4FFF8]"
          >
            🔔
          </button>
        </div>
      </nav>

      {/* DASHBOARD */}
      <section className="mx-auto max-w-[1200px] px-6 pb-24 pt-16">

        {/* INTRO */}
        <div className="max-w-[700px]">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#19D879]">
            VOLUNTEER NETWORK
          </p>

          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em] md:text-5xl">
            Make an impact
            <br />
            <span className="text-[#91A99C]">
              where it matters.
            </span>
          </h1>

          <p className="mt-5 max-w-[600px] text-sm leading-7 text-[#91A99C] md:text-base">
            Find nearby cleanup tasks, contribute to your community,
            and build your environmental impact.
          </p>
        </div>

        {/* STATS */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6">
            <p className="text-xs text-[#91A99C]">
              Impact Points
            </p>

            <p className="mt-3 text-3xl font-semibold">
              0
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6">
            <p className="text-xs text-[#91A99C]">
              Tasks Completed
            </p>

            <p className="mt-3 text-3xl font-semibold">
              0
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6">
            <p className="text-xs text-[#91A99C]">
              Current Level
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#19D879]">
              Explorer
            </p>
          </div>

        </div>

        {/* MAIN ACTIONS */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">

          <Link
            href="/volunteer/tasks"
            className="group rounded-[28px] border border-[#19D879]/15 bg-[#0B2118]/50 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#19D879]/40 hover:bg-[#0D281C]"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#19D879]">
              CLEANUP NETWORK
            </p>

            <h2 className="mt-4 text-2xl font-semibold">
              Nearby Tasks
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#91A99C]">
              Discover verified cleanup tasks around you and
              join the ones you can help with.
            </p>

            <div className="mt-7 text-sm font-medium text-[#19D879]">
              View tasks →
            </div>
          </Link>

          <Link
            href="/volunteer/leaderboard"
            className="group rounded-[28px] border border-white/[0.09] bg-white/[0.025] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#19D879]/30 hover:bg-[#0B2118]/70"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#91A99C]">
              COMMUNITY IMPACT
            </p>

            <h2 className="mt-4 text-2xl font-semibold">
              Leaderboard
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#91A99C]">
              Track your contribution, achievements and
              position within the volunteer network.
            </p>

            <div className="mt-7 text-sm font-medium text-[#19D879]">
              View leaderboard →
            </div>
          </Link>

        </div>

        {/* REPORT */}
        <Link
          href="/report"
          className="mt-5 flex items-center justify-between rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-7 transition-all duration-300 hover:border-[#19D879]/30 hover:bg-white/[0.045]"
        >
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#91A99C]">
              COMMUNITY REPORTING
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Report a Waste Incident
            </h2>

            <p className="mt-2 text-sm text-[#91A99C]">
              Found waste? Report it and help create a cleanup task.
            </p>
          </div>

          <span className="text-xl text-[#19D879]">
            →
          </span>
        </Link>

      </section>
    </main>
  );
}
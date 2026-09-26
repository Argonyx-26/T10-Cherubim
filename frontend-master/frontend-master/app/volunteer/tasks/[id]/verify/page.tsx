"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

type VerificationStatus =
  | "pending"
  | "verified"
  | "rejected";

export default function VerifyCleanup({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [status, setStatus] =
    useState<VerificationStatus>("pending");

  const [submitted, setSubmitted] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  /*
   * Restore completed task state after refresh/navigation.
   * Demo only — this will later come from the backend.
   */
  useEffect(() => {
    const saved = localStorage.getItem(
      `urbantriage-task-${id}`
    );

    if (!saved) return;

    try {
      const task = JSON.parse(saved);

      if (task.status === "completed") {
        setStatus("verified");
        setSubmitted(true);
        setAlreadyCompleted(true);
      }
    } catch {
      localStorage.removeItem(
        `urbantriage-task-${id}`
      );
    }
  }, [id]);

  /*
   * Demo verification flow.
   *
   * Later:
   * - upload proof to backend
   * - teammate's AI verifies location
   * - teammate's AI verifies timestamp
   * - teammate's AI verifies area match
   * - teammate's AI verifies waste reduction
   */
  const handleSubmit = () => {
    if (alreadyCompleted) return;

    setSubmitted(true);
    setStatus("pending");

    window.setTimeout(() => {
      const completion = {
        status: "completed",
        points: 120,
        completedAt: new Date().toISOString(),
        taskId: id,
        volunteers: [
          "You",
          "Ananya",
          "Rahul",
        ],
      };

      localStorage.setItem(
        `urbantriage-task-${id}`,
        JSON.stringify(completion)
      );

      setStatus("verified");
      setAlreadyCompleted(true);
    }, 1800);
  };

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
            className="rounded-xl px-4 py-2.5 text-sm text-[#91A99C] transition hover:text-[#F4FFF8]"
          >
            Tasks
          </Link>

          <Link
            href="/volunteer/notifications"
            className="rounded-xl px-4 py-2.5 text-sm text-[#91A99C] transition hover:text-[#F4FFF8]"
          >
            Notifications
          </Link>

          <Link
            href="/map"
            className="rounded-xl px-4 py-2.5 text-sm text-[#91A99C] transition hover:text-[#F4FFF8]"
          >
            City Map
          </Link>

        </div>

      </nav>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="mx-auto max-w-[1050px] px-6 pb-24 pt-10">

        {/* Back */}

        <Link
          href={`/volunteer/tasks/${id}`}
          className="text-sm text-[#91A99C] transition hover:text-[#F4FFF8]"
        >
          ← Back to task
        </Link>

        {/* Header */}

        <div className="mt-10">

          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#19D879]">
            CLEANUP VERIFICATION
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] md:text-5xl">
            Verify cleanup
          </h1>

          <p className="mt-4 max-w-[650px] text-sm leading-7 text-[#91A99C] md:text-base">
            Submit proof of the completed cleanup. UrbanTriage
            verifies the location, timestamp, and cleanup result
            before awarding points.
          </p>

        </div>

        {/* =====================================================
            TASK INFO
        ===================================================== */}

        <div className="mt-8 grid gap-4 md:grid-cols-4">

          <InfoCard
            label="TASK"
            value={`#UT-${id}`}
          />

          <InfoCard
            label="LOCATION"
            value="Koramangala"
          />

          <InfoCard
            label="VOLUNTEERS"
            value="3 joined"
          />

          <InfoCard
            label="REWARD"
            value="+120 points"
            highlight
          />

        </div>

        {/* =====================================================
            BEFORE / AFTER
        ===================================================== */}

        <div className="mt-8 grid gap-5 md:grid-cols-2">

          {/* BEFORE */}

          <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.025]">

            <div className="border-b border-white/[0.07] px-6 py-5">

              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#91A99C]">
                BEFORE CLEANUP
              </p>

              <h2 className="mt-2 text-lg font-semibold">
                Reported waste
              </h2>

            </div>

            <div className="flex h-[320px] items-center justify-center bg-[#0B1712]">

              <div className="text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[#FF5364]/20 bg-[#FF5364]/10 text-3xl">
                  ♻
                </div>

                <p className="mt-4 text-sm font-medium">
                  Original incident image
                </p>

                <p className="mt-2 text-xs text-[#91A99C]">
                  Waste detected at this location
                </p>

              </div>

            </div>

          </div>

          {/* AFTER */}

          <div className="overflow-hidden rounded-[28px] border border-[#19D879]/20 bg-[#0B2118]/40">

            <div className="border-b border-white/[0.07] px-6 py-5">

              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#19D879]">
                AFTER CLEANUP
              </p>

              <h2 className="mt-2 text-lg font-semibold">
                Cleanup proof
              </h2>

            </div>

            <div className="flex h-[320px] items-center justify-center bg-[#0B1712]">

              {!submitted ? (

                <div className="px-6 text-center">

                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[#19D879]/20 bg-[#19D879]/10 text-3xl">
                    ↑
                  </div>

                  <p className="mt-4 text-sm font-medium">
                    Upload after-cleanup photo
                  </p>

                  <p className="mx-auto mt-2 max-w-[280px] text-xs leading-5 text-[#91A99C]">
                    Use a live photo or upload proof of the
                    completed cleanup.
                  </p>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={alreadyCompleted}
                    className={`mt-6 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                      alreadyCompleted
                        ? "cursor-default bg-[#19D879]/10 text-[#19D879]"
                        : "bg-[#19D879] text-[#06110D] hover:bg-[#4DFF9A]"
                    }`}
                  >
                    {alreadyCompleted
                      ? "Cleanup already verified ✓"
                      : "Submit for verification"}
                  </button>

                </div>

              ) : (

                <div className="px-6 text-center">

                  {/* VERIFYING */}

                  {status === "pending" && (
                    <>
                      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[#19D879]/20 border-t-[#19D879]" />

                      <p className="mt-5 text-sm font-medium">
                        Verifying cleanup...
                      </p>

                      <p className="mt-2 text-xs text-[#91A99C]">
                        Checking location, timestamp and cleanup
                        evidence.
                      </p>
                    </>
                  )}

                  {/* VERIFIED */}

                  {status === "verified" && (
                    <>
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#19D879]/30 bg-[#19D879]/10 text-2xl text-[#19D879]">
                        ✓
                      </div>

                      <p className="mt-5 text-lg font-semibold text-[#19D879]">
                        Verification passed
                      </p>

                      <p className="mt-2 text-xs leading-5 text-[#91A99C]">
                        Cleanup evidence has been successfully
                        verified.
                      </p>
                    </>
                  )}

                  {/* REJECTED */}

                  {status === "rejected" && (
                    <>
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#FF5364]/30 bg-[#FF5364]/10 text-2xl text-[#FF5364]">
                        !
                      </div>

                      <p className="mt-5 text-lg font-semibold text-[#FF5364]">
                        Verification failed
                      </p>

                      <p className="mt-2 text-xs text-[#91A99C]">
                        Please submit another cleanup proof.
                      </p>
                    </>
                  )}

                </div>

              )}

            </div>

          </div>

        </div>

        {/* =====================================================
            VERIFICATION CHECKS
        ===================================================== */}

        <div className="mt-8 rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-7">

          <div className="flex items-start justify-between gap-6">

            <div>

              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#91A99C]">
                VERIFICATION ENGINE
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Cleanup verification
              </h2>

            </div>

            <span className="rounded-full border border-[#FFB84D]/20 bg-[#FFB84D]/10 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#FFB84D]">
              AI REVIEW
            </span>

          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">

            <VerificationCheck
              title="Location"
              description="Cleanup occurred at the assigned area"
              verified={status === "verified"}
            />

            <VerificationCheck
              title="Timestamp"
              description="Proof was captured after task assignment"
              verified={status === "verified"}
            />

            <VerificationCheck
              title="Area Match"
              description="Proof corresponds to the reported location"
              verified={status === "verified"}
            />

            <VerificationCheck
              title="Waste Reduction"
              description="Visible waste reduction detected"
              verified={status === "verified"}
            />

          </div>

        </div>

        {/* =====================================================
            GROUP COMPLETION
        ===================================================== */}

        <div className="mt-8 rounded-[28px] border border-[#19D879]/15 bg-[#0B2118]/50 p-7">

          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#19D879]">
            GROUP COMPLETION
          </p>

          <h2 className="mt-3 text-xl font-semibold">
            One verified cleanup completes the whole group.
          </h2>

          <p className="mt-3 max-w-[700px] text-sm leading-6 text-[#91A99C]">
            When the cleanup is successfully verified, every
            volunteer who joined this task receives completion
            credit and the associated points.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">

            <Volunteer
              name="You"
              points={status === "verified" ? "+120" : "Pending"}
            />

            <Volunteer
              name="Ananya"
              points={status === "verified" ? "+120" : "Pending"}
            />

            <Volunteer
              name="Rahul"
              points={status === "verified" ? "+120" : "Pending"}
            />

          </div>

        </div>

        {/* =====================================================
            COMPLETION RESULT
        ===================================================== */}

        {status === "verified" && (

          <div className="mt-8 rounded-[28px] border border-[#19D879]/30 bg-[#19D879]/[0.06] p-8 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#19D879] text-xl font-bold text-[#06110D]">
              ✓
            </div>

            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#19D879]">
              TASK COMPLETED
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Cleanup successfully verified
            </h2>

            <p className="mx-auto mt-3 max-w-[550px] text-sm leading-6 text-[#91A99C]">
              All participating volunteers have received
              completion credit for this cleanup.
            </p>

            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-[#19D879]/20 bg-[#19D879]/10 px-6 py-4">

              <span className="text-2xl font-semibold text-[#19D879]">
                +120
              </span>

              <span className="text-sm text-[#91A99C]">
                points awarded
              </span>

            </div>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">

              <Link
                href={`/volunteer/tasks/${id}`}
                className="rounded-xl border border-[#19D879]/25 bg-[#19D879]/10 px-6 py-3 text-sm font-semibold text-[#19D879] transition hover:bg-[#19D879]/15"
              >
                Back to Task
              </Link>

              <Link
                href="/volunteer/leaderboard"
                className="rounded-xl bg-[#19D879] px-6 py-3 text-sm font-semibold text-[#06110D] transition hover:bg-[#4DFF9A]"
              >
                View leaderboard
              </Link>

            </div>

          </div>

        )}

      </section>

    </main>
  );
}

/* ============================================================
   SMALL COMPONENTS
============================================================ */

function InfoCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

      <p className="text-[9px] uppercase tracking-[0.18em] text-[#91A99C]">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-semibold ${
          highlight ? "text-[#19D879]" : ""
        }`}
      >
        {value}
      </p>

    </div>
  );
}

function VerificationCheck({
  title,
  description,
  verified,
}: {
  title: string;
  description: string;
  verified: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-5">

      <div className="flex items-center justify-between">

        <p className="text-sm font-medium">
          {title}
        </p>

        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
            verified
              ? "bg-[#19D879]/15 text-[#19D879]"
              : "bg-white/[0.05] text-[#91A99C]"
          }`}
        >
          {verified ? "✓" : "•"}
        </span>

      </div>

      <p className="mt-2 text-[11px] leading-5 text-[#91A99C]">
        {description}
      </p>

    </div>
  );
}

function Volunteer({
  name,
  points,
}: {
  name: string;
  points: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/10 px-5 py-4">

      <div className="flex items-center gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#19D879]/10 text-xs font-semibold text-[#19D879]">
          {name.charAt(0)}
        </div>

        <span className="text-sm font-medium">
          {name}
        </span>

      </div>

      <span
        className={`text-sm font-semibold ${
          points === "Pending"
            ? "text-[#91A99C]"
            : "text-[#19D879]"
        }`}
      >
        {points}
      </span>

    </div>
  );
}
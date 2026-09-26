"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function ReportIncident() {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | Blob | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<{
    threat_detected: boolean;
    threat_score: number;
    total_objects: number;
    environmental_context: {
      is_designated_waste_zone: boolean;
      environmental_sensitivity: number;
      macro_description: string;
    };
    detections: Array<{
      label: string;
      superclass: string;
      confidence: number;
      bbox: number[];
    }>;
    location: { latitude: number; longitude: number } | string | null;
    is_authentic: boolean;
    annotated_image?: string;
  } | null>(null);

  const [source, setSource] = useState<"upload" | "camera" | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Stop camera whenever the page/component is left
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const openCamera = async () => {
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Camera access is not supported by this browser."
      );
      setCameraOpen(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
          width: {
            ideal: 1920,
          },
          height: {
            ideal: 1080,
          },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraOpen(true);

      // Wait for the camera preview element to appear
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (error) {
      console.error(error);

      setCameraError(
        "Camera access was denied or the camera could not be opened."
      );

      setCameraOpen(true);
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.drawImage(video, 0, 0, width, height);

    const imageUrl = canvas.toDataURL("image/jpeg", 0.92);

    canvas.toBlob((blob) => {
      if (blob) {
        setSelectedFile(blob);
      }
    }, "image/jpeg", 0.92);

    setSelectedImage(imageUrl);
    setSource("camera");
    setAnalysisResult(null);

    stopCamera();
    setCameraOpen(false);
  };

  const closeCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setCameraError(null);
  };

  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduledSuccess, setScheduledSuccess] = useState<boolean>(false);

  // Form State for Schedule Cleanup
  const [placeName, setPlaceName] = useState<string>("Koramangala 5th Block, Bengaluru");
  const [volunteersNeeded, setVolunteersNeeded] = useState<string>("3 needed");
  const [equipmentNeeded, setEquipmentNeeded] = useState<string>("Heavy Duty Gloves, Trash Bags, Rakes");
  const [taskPriority, setTaskPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("HIGH");

  const handlePhotoSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    const imageUrl = URL.createObjectURL(file);

    setSelectedImage(imageUrl);
    setSource("upload");
    setAnalysisResult(null);
    setShowScheduleModal(false);
    setScheduledSuccess(false);
  };

  const resetPhoto = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setAnalysisResult(null);
    setSource(null);
    setShowScheduleModal(false);
    setScheduledSuccess(false);

    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !selectedImage) return;

    setLoading(true);
    setScheduledSuccess(false);
    try {
      const formData = new FormData();
      const fileNameToUse = (selectedFile && "name" in selectedFile)
        ? (selectedFile as File).name
        : "upload.jpg";

      if (selectedFile) {
        formData.append("image", selectedFile, fileNameToUse);
      } else if (selectedImage) {
        const res = await fetch(selectedImage);
        const blob = await res.blob();
        formData.append("image", blob, fileNameToUse);
      }

      // Call relative proxy route /api/analyze to avoid CORS and IPv6 resolution errors
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `Server returned status ${response.status}`);
      }

      setAnalysisResult(data);

      if (data.environmental_context?.recommendations && Array.isArray(data.environmental_context.recommendations)) {
        setEquipmentNeeded(data.environmental_context.recommendations.join(", "));
      }

      if (data.threat_detected) {
        setTaskPriority("HIGH");
      } else {
        setTaskPriority("MEDIUM");
      }
    } catch (err: any) {
      console.error("Analysis failed:", err);
      alert(`Analysis failed: ${err.message || err}. Please ensure backend server is running on http://127.0.0.1:5000`);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisResult) return;

    const lat = (typeof analysisResult.location === "object" && analysisResult.location !== null)
      ? analysisResult.location.latitude 
      : 12.9716;
    const lng = (typeof analysisResult.location === "object" && analysisResult.location !== null)
      ? analysisResult.location.longitude 
      : 77.5946;

    const newTask = {
      id: `UT-${Math.floor(100 + Math.random() * 900)}`,
      type: analysisResult.detections?.length > 0 
        ? `${analysisResult.detections[0].label.toUpperCase()} & Waste` 
        : "Waste Cleanup",
      location: placeName,
      lat: lat,
      lng: lng,
      distance: "0.5 km",
      quantity: analysisResult.total_objects > 3 ? "Large" : "Medium",
      volunteers: volunteersNeeded,
      joined: 1,
      deadline: "Today · 6:30 PM",
      priority: taskPriority,
      equipment: equipmentNeeded,
      status: "Open",
      threatScore: analysisResult.threat_score,
      isAuthentic: analysisResult.is_authentic,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage so tasks persist across pages
    try {
      const existing = localStorage.getItem("urbantriage_cleanup_tasks");
      const currentTasks = existing ? JSON.parse(existing) : [];
      localStorage.setItem("urbantriage_cleanup_tasks", JSON.stringify([newTask, ...currentTasks]));
    } catch (err) {
      console.error("Error saving task to localStorage:", err);
    }

    setShowScheduleModal(false);
    setScheduledSuccess(true);
  };

  return (
    <main className="min-h-screen bg-[#06110D] px-6 text-[#F4FFF8]">

      {/* Navbar */}
<nav className="mx-auto flex h-[88px] max-w-[1200px] items-center justify-between">
  <Link
    href="/"
    className="text-[22px] font-semibold tracking-[-0.04em]"
  >
    Urban<span className="text-[#19D879]">Triage</span>
  </Link>

  <div className="flex items-center gap-2">
    <Link
      href="/report"
      className="rounded-xl bg-[#19D879]/10 px-4 py-2.5 text-sm font-medium text-[#19D879]"
    >
      Report Incident
    </Link>

    <Link
      href="/map"
      className="rounded-xl border border-white/[0.10] bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-[#91A99C] backdrop-blur-xl transition-all duration-200 hover:border-[#19D879]/30 hover:bg-white/[0.07] hover:text-[#F4FFF8]"
    >
      City Map
    </Link>

    <Link
      href="/"
      className="ml-2 rounded-xl border border-white/[0.10] px-4 py-2.5 text-sm text-[#91A99C] transition-colors hover:text-[#F4FFF8]"
    >
      Home
    </Link>
  </div>
</nav>

      {/* Main */}
      <div className="mx-auto max-w-[1000px] pb-24 pt-16">

        {/* Heading */}
        <div className="text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#19D879]">
            REPORT INCIDENT
          </p>

          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em] md:text-5xl">
            Help us identify
            <br />
            <span className="text-[#91A99C]">
              what needs attention.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-[590px] text-sm leading-7 text-[#91A99C] md:text-base">
            Report a waste incident using an existing photo or
            capture it live with location and time information.
          </p>
        </div>

        {/* PHOTO OPTIONS */}
        {!selectedImage && !cameraOpen && (
          <div className="mt-16 grid gap-5 md:grid-cols-2">

            {/* UPLOAD */}
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="group rounded-[28px] border border-white/[0.10] bg-white/[0.035] p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#19D879]/30 hover:bg-[#0B2118]/70"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#19D879]/10 text-[#19D879]">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M12 16V4" />
                  <path d="m7 9 5-5 5 5" />
                  <path d="M5 20h14" />
                </svg>
              </div>

              <h2 className="mt-7 text-2xl font-semibold tracking-[-0.03em]">
                Upload Photo
              </h2>

              <p className="mt-3 max-w-[390px] text-sm leading-6 text-[#91A99C]">
                Upload an existing image from your device.
                We'll try to recover its location, capture time,
                and available metadata automatically.
              </p>

              <div className="mt-8 text-sm font-medium text-[#19D879]">
                Choose from device →
              </div>
            </button>

            {/* CAMERA */}
            <button
              type="button"
              onClick={openCamera}
              className="group rounded-[28px] border border-[#19D879]/20 bg-[#0B2118]/50 p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#19D879]/40 hover:bg-[#0D281C]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#19D879]/10 text-[#19D879]">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>

              <div className="mt-7 flex items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                  Capture Photo
                </h2>

                <span className="rounded-full border border-[#19D879]/20 bg-[#19D879]/10 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-[#19D879]">
                  LIVE
                </span>
              </div>

              <p className="mt-3 max-w-[390px] text-sm leading-6 text-[#91A99C]">
                Take a photo now. Your current location and
                capture time will be associated with the report.
              </p>

              <div className="mt-8 text-sm font-medium text-[#19D879]">
                Open camera →
              </div>
            </button>
          </div>
        )}

        {/* CAMERA VIEW */}
        {cameraOpen && (
          <div className="mx-auto mt-14 max-w-[850px]">

            <div className="overflow-hidden rounded-[28px] border border-white/[0.10] bg-[#071A12] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">

              {!cameraError ? (
                <>
                  {/* Camera */}
                  <div className="relative aspect-video bg-black">

                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />

                    {/* Camera HUD */}
                    <div className="pointer-events-none absolute inset-0">

                      {/* Top status */}
                      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/[0.12] bg-[#06110D]/70 px-3 py-2 backdrop-blur-md">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#19D879]" />

                        <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#F4FFF8]">
                          LIVE CAMERA
                        </span>
                      </div>

                      {/* Camera corners */}
                      <div className="absolute left-8 top-8 h-8 w-8 border-l border-t border-[#19D879]/70" />
                      <div className="absolute right-8 top-8 h-8 w-8 border-r border-t border-[#19D879]/70" />
                      <div className="absolute bottom-8 left-8 h-8 w-8 border-b border-l border-[#19D879]/70" />
                      <div className="absolute bottom-8 right-8 h-8 w-8 border-b border-r border-[#19D879]/70" />

                    </div>
                  </div>

                  {/* Camera controls */}
                  <div className="flex items-center justify-between px-6 py-6 md:px-8">

                    <button
                      type="button"
                      onClick={closeCamera}
                      className="rounded-xl border border-white/[0.10] bg-white/[0.035] px-5 py-3 text-sm text-[#91A99C] transition-colors hover:bg-white/[0.07] hover:text-[#F4FFF8]"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={takePhoto}
                      className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#F4FFF8]/80 bg-[#19D879] shadow-[0_0_35px_rgba(25,216,121,0.25)] transition-transform duration-200 hover:scale-105"
                      aria-label="Take photo"
                    >
                      <span className="h-11 w-11 rounded-full border-2 border-[#06110D]" />
                    </button>

                    <div className="w-[82px]" />
                  </div>
                </>
              ) : (
                /* CAMERA ERROR */
                <div className="flex min-h-[420px] items-center justify-center p-8 text-center">
                  <div className="max-w-md">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF5364]/10 text-[#FF5364]">
                      !
                    </div>

                    <h2 className="mt-6 text-2xl font-semibold">
                      Camera access needed
                    </h2>

                    <p className="mt-4 text-sm leading-6 text-[#91A99C]">
                      UrbanTriage needs access to your camera
                      to capture a live incident photo.
                    </p>

                    <p className="mt-3 text-xs leading-5 text-[#91A99C]/70">
                      Check your browser's camera permission and
                      try again.
                    </p>

                    <button
                      type="button"
                      onClick={openCamera}
                      className="mt-7 rounded-xl bg-[#19D879] px-5 py-3 text-sm font-semibold text-[#06110D] hover:bg-[#4DFF9A]"
                    >
                      Try again
                    </button>

                    <button
                      type="button"
                      onClick={closeCamera}
                      className="ml-3 rounded-xl border border-white/[0.10] px-5 py-3 text-sm text-[#91A99C] hover:text-[#F4FFF8]"
                    >
                      Cancel
                    </button>

                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SELECTED PHOTO */}
        {selectedImage && (
          <div className="mt-16">
            <div className="overflow-hidden rounded-[28px] border border-white/[0.10] bg-white/[0.035]">

              <div className="grid md:grid-cols-[1.15fr_0.85fr]">

                {/* IMAGE */}
                <div className="relative aspect-video bg-[#071A12] md:aspect-auto md:min-h-[430px]">

                  <img
                    src={analysisResult?.annotated_image || selectedImage}
                    alt="Captured incident"
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute left-5 top-5 rounded-full border border-white/[0.12] bg-[#06110D]/75 px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.18em] backdrop-blur-md">
                    {analysisResult
                      ? analysisResult.is_authentic
                        ? "GPS AUTHENTIC"
                        : "UNVERIFIED GPS"
                      : source === "camera"
                      ? "LIVE CAPTURE"
                      : "UPLOADED PHOTO"}
                  </div>

                </div>

                {/* INFORMATION */}
                <div className="flex flex-col justify-center p-8 md:p-10">

                  <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#19D879]">
                    {analysisResult
                      ? analysisResult.threat_detected
                        ? "HIGH PRIORITY INCIDENT"
                        : "LOW RISK INCIDENT"
                      : source === "camera"
                      ? "LIVE INCIDENT"
                      : "PHOTO RECEIVED"}
                  </p>

                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
                    {analysisResult
                      ? `Threat Score: ${analysisResult.threat_score}`
                      : source === "camera"
                      ? "Capture received."
                      : "Photo received."}
                  </h2>

                  <p className="mt-4 text-sm leading-6 text-[#91A99C]">
                    {analysisResult
                      ? analysisResult.environmental_context?.macro_description ||
                        "Analysis completed."
                      : source === "camera"
                      ? "This live capture is ready for location and incident processing."
                      : "We'll attempt to recover location and capture time from this image."}
                  </p>

                  <div className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">

                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${loading ? "animate-pulse bg-[#FFB84D]" : "bg-[#19D879]"}`} />

                      <span className="text-xs font-medium text-[#F4FFF8]">
                        {loading
                          ? "Analyzing with AI..."
                          : analysisResult
                          ? `Objects Detected: ${analysisResult.total_objects}`
                          : "Ready for processing"}
                      </span>
                    </div>

                    <p className="mt-2 pl-5 text-xs leading-5 text-[#91A99C]">
                      {analysisResult
                        ? `Location: ${
                            typeof analysisResult.location === "object" && analysisResult.location !== null
                              ? `${analysisResult.location.latitude}, ${analysisResult.location.longitude}`
                              : (analysisResult.location || "EXIF Stripped - Unverified")
                          } | Authenticity: ${analysisResult.is_authentic}`
                        : "Environmental analysis and metadata processing will happen next."}
                    </p>

                  </div>

                  {/* LLM CLEANUP ADVICE & RECOMMENDATIONS BOX */}
                  {analysisResult && (analysisResult.environmental_context?.cleanup_instructions || analysisResult.environmental_context?.recommendations) && (
                    <div className="mt-4 rounded-2xl border border-[#19D879]/20 bg-[#0B2118]/50 p-4 text-left">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#19D879] mb-1">
                        🤖 AI LLM CLEANUP ADVISORY
                      </div>
                      {analysisResult.environmental_context.cleanup_instructions && (
                        <p className="text-xs leading-5 text-[#F4FFF8] mb-2">
                          <strong>Cleanup Instructions:</strong> {analysisResult.environmental_context.cleanup_instructions}
                        </p>
                      )}
                      {analysisResult.environmental_context.recommendations && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className="text-[11px] text-[#91A99C] mr-1">Recommended Gear:</span>
                          {analysisResult.environmental_context.recommendations.map((rec: string, i: number) => (
                            <span key={i} className="rounded-md border border-[#19D879]/30 bg-[#19D879]/10 px-2 py-0.5 text-[10px] text-[#19D879]">
                              🛠️ {rec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Good Condition / Invalid Report Notice */}
                  {analysisResult && analysisResult.total_objects === 0 && !analysisResult.threat_detected && (
                    <div className="mt-6 rounded-2xl border border-[#FFB84D]/30 bg-[#FFB84D]/10 p-4 text-left">
                      <div className="flex items-center gap-2 text-[#FFB84D]">
                        <span className="font-semibold text-sm">⚠️ REPORT INVALID</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#F4FFF8]">
                        Things appear to be in good condition. No waste or environmental threat was detected in this image. No cleanup report is required.
                      </p>
                    </div>
                  )}

                  {/* Scheduled Success Banner */}
                  {scheduledSuccess && (
                    <div className="mt-6 rounded-2xl border border-[#19D879]/30 bg-[#19D879]/10 p-4 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-[#19D879]">✓ CLEANUP SCHEDULED</span>
                        <div className="flex gap-2">
                          <Link href="/volunteer/tasks" className="text-xs underline text-[#19D879]">View Tasks</Link>
                          <Link href="/map" className="text-xs underline text-[#19D879]">View Map</Link>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-[#91A99C]">
                        Task created successfully! It is now visible on the Volunteer Task network and pinned on the City Map.
                      </p>
                    </div>
                  )}

                  <div className="mt-8 flex flex-wrap gap-3">

                    <button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="rounded-xl bg-[#19D879] px-5 py-3 text-sm font-semibold text-[#06110D] transition-colors hover:bg-[#4DFF9A]"
                    >
                      {loading ? "Analyzing..." : analysisResult ? "Re-Analyze" : "Continue"}
                    </button>

                    {analysisResult && (analysisResult.threat_detected || analysisResult.total_objects > 0) && !scheduledSuccess && (
                      <button
                        type="button"
                        onClick={() => setShowScheduleModal(true)}
                        className="rounded-xl border border-[#19D879]/40 bg-[#19D879]/15 px-5 py-3 text-sm font-semibold text-[#19D879] transition-all hover:bg-[#19D879]/25"
                      >
                        📅 Schedule Cleanup
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={resetPhoto}
                      className="rounded-xl border border-white/[0.10] bg-white/[0.035] px-5 py-3 text-sm text-[#91A99C] transition-colors hover:bg-white/[0.07] hover:text-[#F4FFF8]"
                    >
                      Choose another
                    </button>

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCHEDULE CLEANUP MODAL */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#06110D] p-7 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#19D879]">SCHEDULE CLEANUP</p>
                  <h2 className="text-xl font-semibold mt-1">Assign Task Details</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-full p-2 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleScheduleTask} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#91A99C] mb-1">Place / Location Name</label>
                  <input
                    type="text"
                    required
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-[#19D879] focus:outline-none"
                    placeholder="e.g. Koramangala 5th Block, Bengaluru"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#91A99C] mb-1">Volunteers Needed</label>
                    <select
                      value={volunteersNeeded}
                      onChange={(e) => setVolunteersNeeded(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#071A12] px-4 py-2.5 text-sm text-white focus:border-[#19D879] focus:outline-none"
                    >
                      <option value="2 needed">2 Volunteers</option>
                      <option value="3 needed">3 Volunteers</option>
                      <option value="5 needed">5 Volunteers</option>
                      <option value="8+ needed">8+ Volunteers (Major Dump)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#91A99C] mb-1">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full rounded-xl border border-white/10 bg-[#071A12] px-4 py-2.5 text-sm text-white focus:border-[#19D879] focus:outline-none"
                    >
                      <option value="HIGH">HIGH PRIORITY</option>
                      <option value="MEDIUM">MEDIUM PRIORITY</option>
                      <option value="LOW">LOW PRIORITY</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#91A99C] mb-1">Special Equipment Needed</label>
                  <input
                    type="text"
                    required
                    value={equipmentNeeded}
                    onChange={(e) => setEquipmentNeeded(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-[#19D879] focus:outline-none"
                    placeholder="e.g. Heavy Duty Gloves, Trash Bags, Rakes, Shovels"
                  />
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-[#91A99C]">
                  <p><strong className="text-white">Detected Waste:</strong> {analysisResult?.total_objects || 0} objects</p>
                  <p className="mt-0.5"><strong className="text-white">GPS Coordinates:</strong> {analysisResult?.location ? `${analysisResult.location.latitude}, ${analysisResult.location.longitude}` : "Default (12.9716, 77.5946)"}</p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-medium text-[#91A99C] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#19D879] px-5 py-2.5 text-xs font-semibold text-[#06110D] hover:bg-[#4DFF9A]"
                  >
                    Confirm & Schedule Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hidden upload input */}
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        {/* Hidden canvas */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Footer */}
        <div className="mx-auto mt-10 flex max-w-[720px] items-center justify-center gap-3 text-center text-xs text-[#91A99C]/70">
          <span className="h-1.5 w-1.5 rounded-full bg-[#19D879]" />

          <span>
            Live captures are associated with the reporting
            context at the time of capture.
          </span>
        </div>
      </div>
    </main>
  );
}
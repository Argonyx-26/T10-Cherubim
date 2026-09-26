"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sphere, Stars } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Phase =
  | "rotating"
  | "zoomingIn"
  | "holding"
  | "zoomingOut";

type FocusType = "waste" | "cleanup";

function Globe({
  onPhaseChange,
  onFocusChange,
}: {
  onPhaseChange: (phase: Phase) => void;
  onFocusChange: (focus: FocusType) => void;
}) {
  const globeRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const phase = useRef<Phase>("rotating");
  const focus = useRef<FocusType>("waste");

  const rotationAmount = useRef(0);
  const timer = useRef(0);

  const baseCamera = new THREE.Vector3(0, 0, 5.5);

  const wastePosition = new THREE.Vector3(
    1.05,
    0.55,
    1.15
  );

  const cleanupPosition = new THREE.Vector3(
    -1.15,
    0.35,
    1.05
  );

  useFrame((_, delta) => {
    if (!globeRef.current) return;

    const globe = globeRef.current;

    /*
    ===============================
    ROTATE
    ===============================
    */

    if (phase.current === "rotating") {
      const rotationSpeed = 1.8;

      const step = rotationSpeed * delta;

      globe.rotation.y += step;

      rotationAmount.current += step;

      // ONE complete rotation
      if (rotationAmount.current >= Math.PI ) {
        rotationAmount.current = 0;

        phase.current = "zoomingIn";

        focus.current =
          focus.current === "waste"
            ? "cleanup"
            : "waste";

        onFocusChange(focus.current);
        onPhaseChange("zoomingIn");

        timer.current = 0;
      }

      return;
    }

    /*
    ===============================
    CURRENT HOTSPOT
    ===============================
    */

    const localTarget =
      focus.current === "waste"
        ? wastePosition
        : cleanupPosition;

    const worldTarget = localTarget
      .clone()
      .applyQuaternion(globe.quaternion);

    /*
    ===============================
    ZOOM IN
    ===============================
    */

    if (phase.current === "zoomingIn") {
      timer.current += delta;

      const duration = 1.5;

      const progress = Math.min(
        timer.current / duration,
        1
      );

      const eased =
        progress * progress * (3 - 2 * progress);

      const direction = new THREE.Vector3()
        .subVectors(baseCamera, worldTarget)
        .normalize();

      const closeCamera = worldTarget
        .clone()
        .add(direction.multiplyScalar(1.4));

      camera.position.lerpVectors(
        baseCamera,
        closeCamera,
        eased
      );

      camera.lookAt(worldTarget);

      if (progress >= 1) {
        phase.current = "holding";
        timer.current = 0;

        onPhaseChange("holding");
      }

      return;
    }

    /*
    ===============================
    HOLD
    ===============================
    */

    if (phase.current === "holding") {
      timer.current += delta;

      camera.lookAt(worldTarget);

      if (timer.current >= 3) {
        phase.current = "zoomingOut";

        timer.current = 0;

        onPhaseChange("zoomingOut");
      }

      return;
    }

    /*
    ===============================
    ZOOM OUT
    ===============================
    */

    if (phase.current === "zoomingOut") {
      timer.current += delta;

      const duration = 1.5;

      const progress = Math.min(
        timer.current / duration,
        1
      );

      const eased =
        progress * progress * (3 - 2 * progress);

      camera.position.lerpVectors(
        camera.position,
        baseCamera,
        eased
      );

      camera.lookAt(0, 0, 0);

      if (progress >= 1) {
        camera.position.copy(baseCamera);

        rotationAmount.current = 0;

        phase.current = "rotating";

        onPhaseChange("rotating");

        timer.current = 0;
      }
    }
  });

  return (
    <group ref={globeRef}>

      {/* SPACE */}

      <Stars
        radius={5}
        depth={3}
        count={300}
        factor={1.5}
        saturation={0}
        fade
        speed={0.3}
      />

      {/* EARTH */}

      <Sphere args={[1.45, 64, 64]}>
        <meshStandardMaterial
          color="#071A12"
          roughness={0.9}
          metalness={0.05}
          emissive="#062B1B"
          emissiveIntensity={0.35}
        />
      </Sphere>

      {/* ATMOSPHERE */}

      <Sphere args={[1.53, 64, 64]}>
        <meshBasicMaterial
          color="#19D879"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* LARGE GEOSPATIAL MESH */}

      <Sphere args={[1.72, 32, 32]}>
        <meshBasicMaterial
          color="#4DFF9A"
          wireframe
          transparent
          opacity={0.10}
        />
      </Sphere>

      <Sphere args={[1.82, 24, 24]}>
        <meshBasicMaterial
          color="#19D879"
          wireframe
          transparent
          opacity={0.035}
        />
      </Sphere>

      {/* RED WASTE */}

      <mesh position={[1.05, 0.55, 1.15]}>
        <sphereGeometry args={[0.07, 20, 20]} />
        <meshBasicMaterial color="#FF5364" />
      </mesh>

      <mesh position={[-0.75, -0.65, 1.25]}>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshBasicMaterial color="#FF5364" />
      </mesh>

      {/* GREEN CLEANUPS */}

      <mesh position={[-1.15, 0.35, 1.05]}>
        <sphereGeometry args={[0.065, 20, 20]} />
        <meshBasicMaterial color="#4DFF9A" />
      </mesh>

      <mesh position={[0.55, -0.9, 1.35]}>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshBasicMaterial color="#4DFF9A" />
      </mesh>

      {/* LIGHT */}

      <ambientLight intensity={0.6} />

      <directionalLight
        position={[4, 3, 5]}
        intensity={2}
        color="#8AFFC0"
      />

      <pointLight
        position={[-3, -2, 4]}
        intensity={1.5}
        color="#19D879"
      />

    </group>
  );
}

export default function Earth() {

  const [phase, setPhase] =
    useState<Phase>("rotating");

  const [focus, setFocus] =
    useState<FocusType>("waste");

  /*
  Blink state for the active hotspot
  */

  const [blink, setBlink] =
    useState(false);

  useEffect(() => {

    if (
      phase !== "zoomingIn" &&
      phase !== "holding"
    ) {
      setBlink(false);
      return;
    }

    const interval = setInterval(() => {
      setBlink((value) => !value);
    }, 350);

    return () => clearInterval(interval);

  }, [phase]);

  const showEvidence =
    phase === "zoomingIn" ||
    phase === "holding";

  return (
    <div className="relative h-[620px] w-full">

      {/* ========================= */}
      {/* 3D GLOBE */}
      {/* ========================= */}

      <Canvas
        camera={{
          position: [0, 0, 5.5],
          fov: 42,
        }}
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
        }}
      >

        <Globe
          onPhaseChange={setPhase}
          onFocusChange={setFocus}
        />

      </Canvas>

      {/* ========================= */}
      {/* EVIDENCE PANEL */}
      {/* ========================= */}

      <div
        className={`
          pointer-events-none
          absolute
          right-[-20px]
          top-1/2
          w-[300px]
          -translate-y-1/2
          transition-all
          duration-700
          ease-out
          ${
            showEvidence
              ? "translate-x-0 opacity-100"
              : "translate-x-10 opacity-0"
          }
        `}
      >

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#071A12]/80 shadow-2xl backdrop-blur-xl">

          {/* IMAGE */}

          <div className="relative aspect-[16/9] overflow-hidden">

            <img
              src={
                focus === "waste"
                  ? "/images/waste-scene.png"
                  : "/images/cleanup-scene.png"
              }
              alt={
                focus === "waste"
                  ? "Waste hotspot"
                  : "Community cleanup"
              }
              className="h-full w-full object-cover"
            />

            {/* image gradient */}

            <div className="absolute inset-0 bg-gradient-to-t from-[#06110D]/80 via-transparent to-transparent" />

            {/* hotspot indicator */}

            <div
              className={`
                absolute
                left-4
                top-4
                h-3
                w-3
                rounded-full
                ${
                  focus === "waste"
                    ? "bg-[#FF5364]"
                    : "bg-[#4DFF9A]"
                }
                ${
                  blink
                    ? "scale-150 opacity-40"
                    : "scale-100 opacity-100"
                }
                transition-all
                duration-300
              `}
            />

          </div>

          {/* INFORMATION */}

          <div className="p-4">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[10px] uppercase tracking-[0.2em] text-[#91A99C]">
                  {focus === "waste"
                    ? "Active Intelligence"
                    : "Verified Intelligence"}
                </p>

                <h3 className="mt-1 text-sm font-semibold text-[#F4FFF8]">

                  {focus === "waste"
                    ? "Waste hotspot detected"
                    : "Cleanup activity verified"}

                </h3>

              </div>

              <div
                className={`
                  rounded-full
                  px-2.5
                  py-1
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-wider
                  ${
                    focus === "waste"
                      ? "bg-[#FF5364]/10 text-[#FF5364]"
                      : "bg-[#19D879]/10 text-[#4DFF9A]"
                  }
                `}
              >
                {focus === "waste"
                  ? "Waste"
                  : "Clean"}
              </div>

            </div>

            <p className="mt-3 text-xs leading-5 text-[#91A99C]">

              {focus === "waste"
                ? "AI detected a high-density waste location requiring community action."
                : "Community volunteers completed a cleanup mission at this location."}

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}
"use client";

import Script from "next/script";
import { useCallback, useRef, useState } from "react";
import { StudentAppRestored } from "@/components/student-app-restored";

const assets = [
  ["math-curriculum", "/legacy/math-curriculum-v3.js"],
  ["math-titles", "/legacy/math-title-normalizer.js"],
  ["math-grade4", "/legacy/math-gen4-v3.js"],
  ["math-grade5", "/legacy/math-gen5-v3.js"],
  ["math-generators", "/legacy/math-generators-v3.js"],
  ["russian-curriculum", "/legacy/russian-curriculum-v4.js"],
  ["russian-generators", "/legacy/russian-generators-v4.js"],
] as const;

export function SmartStudentRoot() {
  const loaded = useRef(new Set<string>());
  const [assetsReady, setAssetsReady] = useState(false);
  const markReady = useCallback((id: string) => {
    loaded.current.add(id);
    if (loaded.current.size === assets.length) setAssetsReady(true);
  }, []);

  return <>
    {assets.map(([id, src]) => <Script key={id} id={`smart-student-${id}`} src={src} strategy="afterInteractive" onReady={() => markReady(id)} />)}
    <StudentAppRestored assetsReady={assetsReady} />
  </>;
}

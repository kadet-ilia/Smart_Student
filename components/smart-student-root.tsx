"use client";

import Script from "next/script";
import { useCallback, useRef, useState } from "react";
import { StudentApp } from "@/components/student-app";

const assets = [
  ["curriculum", "/legacy/math-curriculum-v3.js"],
  ["grade4", "/legacy/math-gen4-v3.js"],
  ["grade5", "/legacy/math-gen5-v3.js"],
  ["generators", "/legacy/math-generators-v3.js"],
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
    <StudentApp assetsReady={assetsReady} />
  </>;
}

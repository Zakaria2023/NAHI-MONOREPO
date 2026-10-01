"use client";

import { useEffect, useState } from "react";

/** Milliseconds left until `target`, ticking every 30 seconds; 0 once it has passed. */
export const useCountdown = (target: string): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, new Date(target).getTime() - now);
};

"use client";

import { useState, useEffect, useCallback } from "react";

export function useHealthCheck(intervalMs = 30000) {
  const [aiOnline, setAiOnline] = useState(true);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setAiOnline(data.ai === "online");
    } catch {
      setAiOnline(false);
    }
  }, []);

  useEffect(() => {
    check();
    const timer = setInterval(check, intervalMs);
    return () => clearInterval(timer);
  }, [check, intervalMs]);

  return { aiOnline, check };
}

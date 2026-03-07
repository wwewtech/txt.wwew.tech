"use client";

import * as React from "react";

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
}

function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return { isMobile: false, isTablet: false, isDesktop: true, isTouchDevice: false };
  }
  const w = window.innerWidth;
  const isTouchDevice =
    navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  return {
    isMobile: w < 768,
    isTablet: w >= 768 && w < 1280,
    isDesktop: w >= 1280,
    isTouchDevice,
  };
}

export function useDeviceDetect(): DeviceInfo {
  const [info, setInfo] = React.useState<DeviceInfo>(getDeviceInfo);

  React.useEffect(() => {
    const update = () => setInfo(getDeviceInfo());
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return info;
}

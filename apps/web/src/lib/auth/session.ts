"use client";

import { useEffect, useState } from "react";
import type { ApiRole } from "@/lib/api/client";

export const tokenKeys: Record<ApiRole, string> = {
  professional: "afyalink.professionalToken",
  facility: "afyalink.facilityToken",
  admin: "afyalink.adminToken",
};

export function getToken(role: ApiRole) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(tokenKeys[role]) ?? "";
}

export function setToken(role: ApiRole, token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(tokenKeys[role], token);
  window.dispatchEvent(new Event("afyalink-session-change"));
}

export function clearToken(role: ApiRole) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(tokenKeys[role]);
  window.dispatchEvent(new Event("afyalink-session-change"));
}

export function useSessionToken(role: ApiRole) {
  const [token, setCurrentToken] = useState("");

  useEffect(() => {
    const refresh = () => setCurrentToken(getToken(role));
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("afyalink-session-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("afyalink-session-change", refresh);
    };
  }, [role]);

  return token;
}

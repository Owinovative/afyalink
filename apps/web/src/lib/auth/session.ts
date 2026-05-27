"use client";

import { useEffect, useState } from "react";
import { apiBase, asRecord, type ApiRole } from "@/lib/api/client";

export const tokenKeys: Record<ApiRole, string> = {
  professional: "afyalink.professionalToken",
  facility: "afyalink.facilityToken",
  admin: "afyalink.adminToken",
};

const sessionKeys: Record<ApiRole, string> = {
  professional: "afyalink.professionalSession",
  facility: "afyalink.facilitySession",
  admin: "afyalink.adminSession",
};

export type StoredPortalSession = {
  token: string;
  role: ApiRole;
  roles: string[];
  user?: Record<string, unknown>;
  savedAt: string;
};

export type PortalSessionState = {
  status: "loading" | "signed-out" | "authorized" | "wrong-role";
  token: string;
  requestedRole: ApiRole;
  actualRole: ApiRole | null;
  user: Record<string, unknown> | null;
};

export function getToken(role: ApiRole) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(tokenKeys[role]) ?? "";
}

export function setToken(role: ApiRole, token: string, user?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(tokenKeys[role], token);
  const roles = rolesFromUser(user);
  window.localStorage.setItem(sessionKeys[role], JSON.stringify({
    token,
    role,
    roles,
    user,
    savedAt: new Date().toISOString(),
  } satisfies StoredPortalSession));
  window.dispatchEvent(new Event("afyalink-session-change"));
}

export function clearToken(role: ApiRole) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(tokenKeys[role]);
  window.localStorage.removeItem(sessionKeys[role]);
  window.dispatchEvent(new Event("afyalink-session-change"));
}

export function clearAllTokens() {
  if (typeof window === "undefined") return;
  (Object.keys(tokenKeys) as ApiRole[]).forEach((role) => {
    window.localStorage.removeItem(tokenKeys[role]);
    window.localStorage.removeItem(sessionKeys[role]);
  });
  window.dispatchEvent(new Event("afyalink-session-change"));
}

export function getStoredSession(role: ApiRole): StoredPortalSession | null {
  if (typeof window === "undefined") return null;
  const token = getToken(role);
  if (!token) return null;
  const raw = window.localStorage.getItem(sessionKeys[role]);
  if (!raw) {
    return { token, role, roles: [], savedAt: "" };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredPortalSession>;
    return {
      token,
      role,
      roles: Array.isArray(parsed.roles) ? parsed.roles.map(String) : [],
      user: asRecord(parsed.user),
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
    };
  } catch {
    return { token, role, roles: [], savedAt: "" };
  }
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

export function usePortalSession(requestedRole: ApiRole): PortalSessionState {
  const token = useSessionToken(requestedRole);
  const [state, setState] = useState<PortalSessionState>({
    status: "signed-out",
    token: "",
    requestedRole,
    actualRole: null,
    user: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setState({ status: "signed-out", token: "", requestedRole, actualRole: null, user: null });
        return;
      }

      setState((current) => ({
        ...current,
        status: "loading",
        token,
        requestedRole,
      }));

      try {
        const response = await fetch(`${apiBase()}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = asRecord(await response.json().catch(() => ({})));
        const data = asRecord(payload.data);
        const user = asRecord(data.user);
        const actualRole = resolveRoleGroup(user);

        if (cancelled) return;
        if (!response.ok || !actualRole) {
          clearToken(requestedRole);
          setState({ status: "signed-out", token: "", requestedRole, actualRole: null, user: null });
          return;
        }

        if (actualRole !== requestedRole) {
          setState({ status: "wrong-role", token, requestedRole, actualRole, user });
          return;
        }

        setToken(requestedRole, token, user);
        setState({ status: "authorized", token, requestedRole, actualRole, user });
      } catch {
        if (!cancelled) {
          clearToken(requestedRole);
          setState({ status: "signed-out", token: "", requestedRole, actualRole: null, user: null });
        }
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [requestedRole, token]);

  return state;
}

export function rolesFromUser(user?: Record<string, unknown>) {
  const roles = user && Array.isArray(user.roles) ? user.roles.map(String) : [];
  const legacyRole = user && typeof user.role === "string" ? user.role.toLowerCase() : "";
  if (legacyRole === "admin" || legacyRole === "superadmin") roles.push("admin");
  if (legacyRole === "facilityowner" || legacyRole === "facility") roles.push("facility_admin");
  if (legacyRole === "professional") roles.push("professional");

  return Array.from(new Set(roles));
}

export function resolveRoleGroup(user?: Record<string, unknown>): ApiRole | null {
  const roles = rolesFromUser(user);
  if (roles.includes("admin") || roles.includes("super_admin")) return "admin";
  if (roles.includes("facility_admin") || roles.includes("facility_viewer")) return "facility";
  if (roles.includes("professional")) return "professional";

  return null;
}

export const portalByRole: Record<ApiRole, string> = {
  professional: "/portal/professional/dashboard",
  facility: "/portal/facility/dashboard",
  admin: "/portal/admin/dashboard",
};

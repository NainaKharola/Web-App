import { useEffect, useMemo, useState } from "react";
import { clearAdminToken, getAdminProfile, getAdminToken } from "../services/adminService";
import { AdminAuthContext } from "./AdminAuthContext";

export function AdminAuthProvider({ children }) {
  const [state, setState] = useState({ checking: true, authenticated: false });

  const validateSession = async () => {
    if (!getAdminToken()) {
      setState({ checking: false, authenticated: false });
      return;
    }

    setState((current) => ({ ...current, checking: true }));
    try {
      const response = await getAdminProfile();
      setState({ checking: false, authenticated: true, admin: response.admin });
    } catch {
      clearAdminToken();
      setState({ checking: false, authenticated: false });
    }
  };

  useEffect(() => {
    queueMicrotask(validateSession);
    window.addEventListener("admin-auth-changed", validateSession);
    return () => window.removeEventListener("admin-auth-changed", validateSession);
  }, []);

  const value = useMemo(() => ({ ...state, validateSession }), [state]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

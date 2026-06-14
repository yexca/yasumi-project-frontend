import { Outlet } from "react-router";

import { AppShell } from "@/components/layout/AppShell";

import { AuthPage } from "./AuthPage";
import { useAuth } from "./AuthProvider";

export function AuthGate() {
  const { session, status } = useAuth();

  if (status === "checking") {
    return null;
  }

  if (session === null || status === "signed_out") {
    return <AuthPage />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

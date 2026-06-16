import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useState } from "react";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { PlanningDataProvider } from "@/features/planning/PlanningDataProvider";
import { PowerSyncRuntimeProvider } from "@/features/sync/PowerSyncRuntimeProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeProvider } from "@/styles/ThemeProvider";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PowerSyncRuntimeProvider>
          <PlanningDataProvider>
            <I18nProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </I18nProvider>
          </PlanningDataProvider>
        </PowerSyncRuntimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useState } from "react";

import { I18nProvider } from "@/i18n/I18nProvider";
import { PowerSyncPlaceholderProvider } from "@/repositories/powersync/PowerSyncPlaceholderProvider";
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
      <PowerSyncPlaceholderProvider>
        <I18nProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </I18nProvider>
      </PowerSyncPlaceholderProvider>
    </QueryClientProvider>
  );
}

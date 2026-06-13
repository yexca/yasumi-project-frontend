import { RouterProvider } from "react-router";
import { useState } from "react";

import { AppProviders } from "@/app/providers/AppProviders";
import { createAppRouter } from "@/app/router/router";

export function App() {
  const [router] = useState(createAppRouter);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

import { lazy, Suspense, type ComponentType } from "react";
import { Navigate, createBrowserRouter } from "react-router";

import { AuthGate } from "@/features/auth/AuthGate";
import { InboxPage } from "@/features/inbox/InboxPage";
import { TodayPage } from "@/features/today/TodayPage";

import { ROUTE_PATHS } from "./routes";

const ArchivePage = lazy(() =>
  routeModule(import("@/features/archive/ArchivePage"), "ArchivePage"),
);
const AreaDetailPage = lazy(() =>
  routeModule(import("@/features/areas/AreaDetailPage"), "AreaDetailPage"),
);
const AreasPage = lazy(() => routeModule(import("@/features/areas/AreasPage"), "AreasPage"));
const DeadlinesPage = lazy(() =>
  routeModule(import("@/features/deadlines/DeadlinesPage"), "DeadlinesPage"),
);
const CompletedPage = lazy(() =>
  routeModule(import("@/features/items/CompletedPage"), "CompletedPage"),
);
const IdeaPoolPage = lazy(() =>
  routeModule(import("@/features/items/IdeaPoolPage"), "IdeaPoolPage"),
);
const SettingsPage = lazy(() =>
  routeModule(import("@/features/settings/SettingsPage"), "SettingsPage"),
);
const UpcomingPage = lazy(() =>
  routeModule(import("@/features/upcoming/UpcomingPage"), "UpcomingPage"),
);

function routeModule<T extends Record<K, ComponentType>, K extends keyof T>(
  modulePromise: Promise<T>,
  exportName: K,
) {
  return modulePromise.then((module) => ({ default: module[exportName] }));
}

function renderLazyRoute(Page: ComponentType) {
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  );
}

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: ROUTE_PATHS.root,
      element: <AuthGate />,
      children: [
        { index: true, element: <Navigate to={ROUTE_PATHS.today} replace /> },
        { path: "today", element: <TodayPage /> },
        { path: "inbox", element: <InboxPage /> },
        { path: "upcoming", element: renderLazyRoute(UpcomingPage) },
        { path: "deadlines", element: renderLazyRoute(DeadlinesPage) },
        { path: "ideas", element: renderLazyRoute(IdeaPoolPage) },
        { path: "areas", element: renderLazyRoute(AreasPage) },
        { path: "areas/:areaId", element: renderLazyRoute(AreaDetailPage) },
        { path: "completed", element: renderLazyRoute(CompletedPage) },
        { path: "archive", element: renderLazyRoute(ArchivePage) },
        { path: "settings", element: renderLazyRoute(SettingsPage) },
      ],
    },
  ]);
}

export const router = createAppRouter();

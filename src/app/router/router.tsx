import { Navigate, createBrowserRouter } from "react-router";

import { ArchivePage } from "@/features/archive/ArchivePage";
import { AreaDetailPage } from "@/features/areas/AreaDetailPage";
import { AreasPage } from "@/features/areas/AreasPage";
import { AuthGate } from "@/features/auth/AuthGate";
import { DeadlinesPage } from "@/features/deadlines/DeadlinesPage";
import { InboxPage } from "@/features/inbox/InboxPage";
import { CompletedPage } from "@/features/items/CompletedPage";
import { IdeaPoolPage } from "@/features/items/IdeaPoolPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { TodayPage } from "@/features/today/TodayPage";
import { UpcomingPage } from "@/features/upcoming/UpcomingPage";

import { ROUTE_PATHS } from "./routes";

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: ROUTE_PATHS.root,
      element: <AuthGate />,
      children: [
        { index: true, element: <Navigate to={ROUTE_PATHS.today} replace /> },
        { path: "today", element: <TodayPage /> },
        { path: "inbox", element: <InboxPage /> },
        { path: "upcoming", element: <UpcomingPage /> },
        { path: "deadlines", element: <DeadlinesPage /> },
        { path: "ideas", element: <IdeaPoolPage /> },
        { path: "areas", element: <AreasPage /> },
        { path: "areas/:areaId", element: <AreaDetailPage /> },
        { path: "completed", element: <CompletedPage /> },
        { path: "archive", element: <ArchivePage /> },
        { path: "settings", element: <SettingsPage /> },
      ],
    },
  ]);
}

export const router = createAppRouter();

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type CSSProperties,
} from "react";

import { deleteBackgroundAsset, loadBackgroundAsset } from "./backgroundAssets";

export type ThemeMode = "system" | "light" | "dark";

export type LocalBackgroundPreference =
  | { mode: "none" }
  | { mode: "built_in"; backgroundId: string }
  | { mode: "custom_image"; assetId: string; objectUrl?: string };

type ThemeContextValue = {
  background: LocalBackgroundPreference;
  hasBackground: boolean;
  resolvedMode: Exclude<ThemeMode, "system">;
  resetBackground: () => void;
  setBuiltInBackground: (backgroundId: string) => void;
  setCustomBackground: (assetId: string, objectUrl: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  themeMode: ThemeMode;
};

const THEME_STORAGE_KEY = "yasumi.theme.mode";
const BACKGROUND_STORAGE_KEY = "yasumi.background.preference";

const defaultThemeContext: ThemeContextValue = {
  background: { mode: "none" },
  hasBackground: false,
  resolvedMode: "light",
  resetBackground() {},
  setBuiltInBackground() {},
  setCustomBackground() {},
  setThemeMode() {},
  themeMode: "system",
};

const ThemeContext = createContext<ThemeContextValue>(defaultThemeContext);

function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function getStoredBackground(): LocalBackgroundPreference {
  if (typeof window === "undefined") {
    return { mode: "none" };
  }

  const stored = window.localStorage.getItem(BACKGROUND_STORAGE_KEY);

  if (!stored) {
    return { mode: "none" };
  }

  try {
    const parsed = JSON.parse(stored) as Partial<LocalBackgroundPreference>;

    if (parsed.mode === "built_in" && typeof parsed.backgroundId === "string") {
      return { mode: "built_in", backgroundId: parsed.backgroundId };
    }

    if (parsed.mode === "custom_image" && typeof parsed.assetId === "string") {
      return { mode: "custom_image", assetId: parsed.assetId };
    }
  } catch {
    window.localStorage.removeItem(BACKGROUND_STORAGE_KEY);
  }

  return { mode: "none" };
}

function resolveThemeMode(themeMode: ThemeMode) {
  if (themeMode !== "system") {
    return themeMode;
  }

  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function getBackgroundImage(background: LocalBackgroundPreference) {
  if (background.mode === "built_in") {
    return undefined;
  }

  if (background.mode === "custom_image") {
    return background.objectUrl ? `url("${background.objectUrl}")` : undefined;
  }

  return undefined;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getStoredThemeMode);
  const [resolvedMode, setResolvedMode] = useState<Exclude<ThemeMode, "system">>(() =>
    resolveThemeMode(getStoredThemeMode()),
  );
  const [background, setBackground] = useState<LocalBackgroundPreference>(getStoredBackground);

  useEffect(() => {
    if (background.mode !== "custom_image" || background.objectUrl) {
      return;
    }

    let isActive = true;

    loadBackgroundAsset(background.assetId)
      .then((objectUrl) => {
        if (!isActive) {
          return;
        }

        if (objectUrl) {
          setBackground({ mode: "custom_image", assetId: background.assetId, objectUrl });
          return;
        }

        setBackground({ mode: "none" });
        window.localStorage.setItem(BACKGROUND_STORAGE_KEY, JSON.stringify({ mode: "none" }));
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setBackground({ mode: "none" });
        window.localStorage.setItem(BACKGROUND_STORAGE_KEY, JSON.stringify({ mode: "none" }));
      });

    return () => {
      isActive = false;
    };
  }, [background]);

  useEffect(() => {
    return () => {
      if (background.mode === "custom_image" && background.objectUrl) {
        URL.revokeObjectURL(background.objectUrl);
      }
    };
  }, [background]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");

    function updateResolvedMode() {
      setResolvedMode(resolveThemeMode(themeMode));
    }

    updateResolvedMode();
    media?.addEventListener("change", updateResolvedMode);

    return () => media?.removeEventListener("change", updateResolvedMode);
  }, [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  const persistBackground = useCallback(
    (nextBackground: LocalBackgroundPreference) => {
      const currentBackground = background;

      if (currentBackground.mode === "custom_image" && currentBackground.objectUrl) {
        URL.revokeObjectURL(currentBackground.objectUrl);
      }

      if (
        currentBackground.mode === "custom_image" &&
        nextBackground.mode !== "custom_image" &&
        currentBackground.assetId
      ) {
        void deleteBackgroundAsset(currentBackground.assetId);
      }

      setBackground(nextBackground);
      window.localStorage.setItem(
        BACKGROUND_STORAGE_KEY,
        JSON.stringify(
          nextBackground.mode === "custom_image"
            ? { mode: "custom_image", assetId: nextBackground.assetId }
            : nextBackground,
        ),
      );
    },
    [background],
  );

  const backgroundImage = getBackgroundImage(background);

  const value = useMemo<ThemeContextValue>(() => {
    const hasBackground = Boolean(backgroundImage);

    return {
      background,
      hasBackground,
      resetBackground() {
        persistBackground({ mode: "none" });
      },
      resolvedMode,
      setBuiltInBackground(backgroundId) {
        persistBackground({ mode: "built_in", backgroundId });
      },
      setCustomBackground(assetId, objectUrl) {
        persistBackground({ mode: "custom_image", assetId, objectUrl });
      },
      setThemeMode,
      themeMode,
    };
  }, [background, backgroundImage, persistBackground, resolvedMode, setThemeMode, themeMode]);

  return (
    <ThemeContext.Provider value={value}>
      <div
        className="theme-root"
        data-background={value.hasBackground ? background.mode : "none"}
        data-background-preference={background.mode}
        data-theme={resolvedMode}
        data-theme-mode={themeMode}
        style={{ "--app-background-image": backgroundImage } as CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

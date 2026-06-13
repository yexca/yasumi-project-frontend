import { Image, RotateCcw } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/primitives/Button";
import { SegmentedControl } from "@/components/primitives/ChoiceControls";
import { ContentColumn, PageHeader, SectionHeader } from "@/components/layout/LayoutPrimitives";
import { useTranslation } from "@/i18n/I18nProvider";
import { saveBackgroundAsset, validateBackgroundImage } from "@/styles/backgroundAssets";
import { useTheme, type ThemeMode } from "@/styles/ThemeProvider";

import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  const { t } = useTranslation();
  const { background, resetBackground, setCustomBackground, setThemeMode, themeMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: t("settings.theme.system"), value: "system" },
    { label: t("settings.theme.light"), value: "light" },
    { label: t("settings.theme.dark"), value: "dark" },
  ];

  async function handleCustomBackgroundChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validateBackgroundImage(file);

    if (validationError) {
      setBackgroundError(t(`settings.background.error.${validationError}`));
      return;
    }

    setBackgroundError(null);
    const savedAsset = await saveBackgroundAsset(file);
    setCustomBackground(savedAsset.assetId, savedAsset.objectUrl);
  }

  return (
    <ContentColumn>
      <PageHeader description={t("page.settings.description")} title={t("nav.settings")} />

      <div className={styles.settings}>
        <section className={styles.section}>
          <SectionHeader
            description={t("settings.appearance.description")}
            title={t("settings.appearance.title")}
          />
          <div className={styles.sectionBody}>
            <article className={["surface-row", styles.settingRow].join(" ")}>
              <div className={styles.settingCopy}>
                <span className={styles.settingLabel}>{t("settings.theme.label")}</span>
                <p className={styles.settingDescription}>{t("settings.theme.description")}</p>
              </div>
              <SegmentedControl
                aria-label={t("settings.theme.label")}
                onChange={setThemeMode}
                options={themeOptions}
                value={themeMode}
              />
            </article>

            <article className={["surface-row", styles.settingRow].join(" ")}>
              <div className={styles.settingCopy}>
                <span className={styles.settingLabel}>{t("settings.background.label")}</span>
                <p className={styles.settingDescription}>
                  {background.mode === "none"
                    ? t("settings.background.none")
                    : t("settings.background.active")}
                </p>
                {backgroundError ? <p className={styles.error}>{backgroundError}</p> : null}
              </div>
              <div className={styles.actions}>
                <Button
                  icon={<Image aria-hidden="true" size={16} />}
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                >
                  {t("settings.background.chooseImage")}
                </Button>
                <Button
                  icon={<RotateCcw aria-hidden="true" size={16} />}
                  onClick={resetBackground}
                  variant="quiet"
                >
                  {t("settings.background.reset")}
                </Button>
                <input
                  accept="image/png,image/jpeg,image/webp"
                  aria-label={t("settings.background.chooseImage")}
                  className="visually-hidden"
                  onChange={(event) => void handleCustomBackgroundChange(event)}
                  ref={fileInputRef}
                  type="file"
                />
              </div>
            </article>
          </div>
        </section>
      </div>
    </ContentColumn>
  );
}

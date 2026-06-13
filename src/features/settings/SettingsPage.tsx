import { Image, RotateCcw } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/primitives/Button";
import { SegmentedControl } from "@/components/primitives/ChoiceControls";
import { Select, TextInput } from "@/components/primitives/Field";
import { ContentColumn, PageHeader, SectionHeader } from "@/components/layout/LayoutPrimitives";
import { usePlanningData } from "@/features/planning/usePlanningData";
import { useTranslation } from "@/i18n/I18nProvider";
import { saveBackgroundAsset, validateBackgroundImage } from "@/styles/backgroundAssets";
import { useTheme, type ThemeMode } from "@/styles/ThemeProvider";

import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  const { t } = useTranslation();
  const { settings } = usePlanningData();
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
            description={t("settings.synced.description")}
            title={t("settings.synced.title")}
          />
          <div className={styles.fieldGrid}>
            <Select defaultValue={settings.language} label={t("settings.language.label")}>
              <option value="en">{t("settings.language.en")}</option>
              <option value="zh-Hans">{t("settings.language.zhHans")}</option>
              <option value="ja">{t("settings.language.ja")}</option>
            </Select>
            <TextInput defaultValue={settings.locale} label={t("settings.locale.label")} />
            <Select defaultValue={settings.week_start_day} label={t("settings.weekStart.label")}>
              <option value="sunday">{t("settings.weekStart.sunday")}</option>
              <option value="monday">{t("settings.weekStart.monday")}</option>
            </Select>
            <TextInput defaultValue={settings.time_zone} label={t("settings.timeZone.label")} />
            <TextInput
              defaultValue={settings.date_display_format}
              label={t("settings.dateFormat.label")}
              readOnly
            />
            <Select
              defaultValue={settings.time_display_format}
              label={t("settings.timeFormat.label")}
            >
              <option value="12h">{t("settings.timeFormat.12h")}</option>
              <option value="24h">{t("settings.timeFormat.24h")}</option>
            </Select>
            <TextInput
              defaultValue={settings.today_primary_lookahead_days}
              label={t("settings.primaryLookahead.label")}
              min={1}
              type="number"
            />
            <TextInput
              defaultValue={settings.deadline_awareness_days}
              label={t("settings.deadlineAwareness.label")}
              min={1}
              type="number"
            />
          </div>
        </section>

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

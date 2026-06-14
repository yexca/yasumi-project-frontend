import { Image, KeyRound, RotateCcw, Save } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { Button } from "@/components/primitives/Button";
import { SegmentedControl } from "@/components/primitives/ChoiceControls";
import { Select, TextInput } from "@/components/primitives/Field";
import { ContentColumn, PageHeader, SectionHeader } from "@/components/layout/LayoutPrimitives";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePlanningData, usePlanningMutations } from "@/features/planning/usePlanningData";
import { useTranslation } from "@/i18n/I18nProvider";
import { getDefaultLocale } from "@/i18n/messages";
import { getDirectApiErrorCode } from "@/repositories/direct-api/errorGuards";
import { saveBackgroundAsset, validateBackgroundImage } from "@/styles/backgroundAssets";
import { useTheme, type ThemeMode } from "@/styles/ThemeProvider";

import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  const { t } = useTranslation();
  const { changePassword, session, updateProfile } = useAuth();
  const { settings } = usePlanningData();
  const { updateSettings } = usePlanningMutations();
  const { background, resetBackground, setCustomBackground, setThemeMode, themeMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: t("settings.theme.system"), value: "system" },
    { label: t("settings.theme.light"), value: "light" },
    { label: t("settings.theme.dark"), value: "dark" },
  ];
  function commitPositiveInteger(
    key: "deadline_awareness_days" | "today_primary_lookahead_days",
    value: string,
  ) {
    const parsed = Number(value);

    if (Number.isInteger(parsed) && parsed > 0) {
      updateSettings({ [key]: parsed });
    }
  }

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
            description={t("settings.profile.description")}
            title={t("settings.profile.title")}
          />
          <div className={styles.profileGrid}>
            <ProfileForm
              key={session?.user.display_name ?? ""}
              initialDisplayName={session?.user.display_name ?? ""}
              message={profileMessage}
              onMessage={setProfileMessage}
              onUpdateProfile={updateProfile}
              t={t}
            />
            <PasswordForm
              message={passwordMessage}
              onChangePassword={changePassword}
              onMessage={setPasswordMessage}
              t={t}
            />
          </div>
        </section>

        <section className={styles.section}>
          <SectionHeader
            description={t("settings.synced.description")}
            title={t("settings.synced.title")}
          />
          <div className={styles.fieldGrid}>
            <Select
              label={t("settings.language.label")}
              onChange={(event) => {
                const language = event.target.value as typeof settings.language;
                updateSettings({
                  language,
                  locale: getDefaultLocale(language),
                });
              }}
              value={settings.language}
            >
              <option value="en">{t("settings.language.en")}</option>
              <option value="zh-Hans">{t("settings.language.zhHans")}</option>
              <option value="ja">{t("settings.language.ja")}</option>
            </Select>
            <Select
              label={t("settings.weekStart.label")}
              onChange={(event) =>
                updateSettings({
                  week_start_day: event.target.value as typeof settings.week_start_day,
                })
              }
              value={settings.week_start_day}
            >
              <option value="sunday">{t("settings.weekStart.sunday")}</option>
              <option value="monday">{t("settings.weekStart.monday")}</option>
            </Select>
            <Select
              label={t("settings.timeZone.label")}
              onChange={(event) =>
                updateSettings({
                  time_zone: event.target.value,
                })
              }
              value={settings.time_zone}
            >
              <option value="Asia/Shanghai">{t("settings.timeZone.shanghai")}</option>
              <option value="Asia/Tokyo">{t("settings.timeZone.tokyo")}</option>
              <option value="Europe/London">{t("settings.timeZone.london")}</option>
              <option value="America/New_York">{t("settings.timeZone.newYork")}</option>
            </Select>
            <TextInput
              label={t("settings.weatherCity.label")}
              maxLength={120}
              onBlur={(event) => {
                const nextWeatherCity = event.target.value.trim();
                if (nextWeatherCity) {
                  updateSettings({ weather_city: nextWeatherCity });
                } else {
                  event.currentTarget.value = settings.weather_city;
                }
              }}
              defaultValue={settings.weather_city}
            />
            <TextInput
              label={t("settings.primaryLookahead.label")}
              min={1}
              onChange={(event) =>
                commitPositiveInteger("today_primary_lookahead_days", event.target.value)
              }
              type="number"
              value={settings.today_primary_lookahead_days}
            />
            <TextInput
              label={t("settings.deadlineAwareness.label")}
              min={1}
              onChange={(event) =>
                commitPositiveInteger("deadline_awareness_days", event.target.value)
              }
              type="number"
              value={settings.deadline_awareness_days}
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

type TranslationFn = (key: string) => string;

function ProfileForm({
  initialDisplayName,
  message,
  onMessage,
  onUpdateProfile,
  t,
}: {
  initialDisplayName: string;
  message: string | null;
  onMessage: (message: string | null) => void;
  onUpdateProfile: ReturnType<typeof useAuth>["updateProfile"];
  t: TranslationFn;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [saving, setSaving] = useState(false);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    onMessage(null);

    try {
      await onUpdateProfile({ display_name: displayName.trim() || null });
      onMessage(t("settings.profile.saved"));
    } catch (error) {
      const apiErrorCode = getDirectApiErrorCode(error);

      onMessage(
        apiErrorCode !== null
          ? t(`error.code.${apiErrorCode}`)
          : t("error.code.service_unavailable"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className={[styles.formPanel, styles.profileForm].join(" ")}
      onSubmit={(event) => void submitProfile(event)}
    >
      <TextInput
        autoComplete="name"
        label={t("settings.profile.displayName")}
        onChange={(event) => setDisplayName(event.target.value)}
        value={displayName}
      />
      {message ? <p className={styles.message}>{message}</p> : null}
      <Button
        disabled={saving}
        icon={<Save aria-hidden="true" size={16} />}
        type="submit"
        variant="primary"
      >
        {t("common.save")}
      </Button>
    </form>
  );
}

function PasswordForm({
  message,
  onChangePassword,
  onMessage,
  t,
}: {
  message: string | null;
  onChangePassword: ReturnType<typeof useAuth>["changePassword"];
  onMessage: (message: string | null) => void;
  t: TranslationFn;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    onMessage(null);

    try {
      await onChangePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      onMessage(t("settings.password.saved"));
    } catch (error) {
      const apiErrorCode = getDirectApiErrorCode(error);

      onMessage(
        apiErrorCode !== null
          ? t(`error.code.${apiErrorCode}`)
          : t("error.code.service_unavailable"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className={[styles.formPanel, styles.passwordForm].join(" ")}
      onSubmit={(event) => void submitPassword(event)}
    >
      <TextInput
        autoComplete="current-password"
        label={t("settings.password.current")}
        minLength={8}
        onChange={(event) => setCurrentPassword(event.target.value)}
        required
        type="password"
        value={currentPassword}
      />
      <TextInput
        autoComplete="new-password"
        label={t("settings.password.new")}
        minLength={8}
        onChange={(event) => setNewPassword(event.target.value)}
        required
        type="password"
        value={newPassword}
      />
      {message ? <p className={styles.message}>{message}</p> : null}
      <Button
        disabled={saving}
        icon={<KeyRound aria-hidden="true" size={16} />}
        type="submit"
        variant="secondary"
      >
        {t("settings.password.action")}
      </Button>
    </form>
  );
}

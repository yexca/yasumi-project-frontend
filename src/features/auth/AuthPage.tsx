import { CalendarDays, Inbox, LogIn, Sparkles, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/primitives/Button";
import { TextInput } from "@/components/primitives/Field";
import { usePlanningData, usePlanningMutations } from "@/features/planning/usePlanningData";
import { useTranslation } from "@/i18n/I18nProvider";
import { getDefaultLocale } from "@/i18n/messages";
import { getDirectApiErrorCode } from "@/repositories/direct-api/errorGuards";

import { useAuth } from "./AuthProvider";
import styles from "./AuthPage.module.css";

type AuthMode = "login" | "register";

export function AuthPage() {
  const { language, setLanguage, t } = useTranslation();
  const { login, register, session } = useAuth();
  const { settings } = usePlanningData();
  const { updateSettings } = usePlanningMutations();
  const [mode, setMode] = useState<AuthMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "register" && password !== confirmPassword) {
      setErrorKey("auth.error.passwordMismatch");
      return;
    }

    setSubmitting(true);
    setErrorKey(null);

    try {
      if (mode === "login") {
        await login({ identifier, password });
      } else {
        await register({
          display_name: displayName.trim() || null,
          email,
          password,
          username,
        });
      }
    } catch (error) {
      const apiErrorCode = getDirectApiErrorCode(error);

      setErrorKey(
        apiErrorCode !== null ? `error.code.${apiErrorCode}` : "error.code.service_unavailable",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.story} aria-label="Yasumi">
          <div className={styles.storyBrand}>
            <span className={styles.storyMark}>Y</span>
            <div>
              <p className={styles.eyebrow}>Yasumi</p>
              <p className={styles.storyTitle}>{t("auth.title")}</p>
            </div>
          </div>
          <p className={styles.storyCopy}>{t("auth.description")}</p>
          <div className={styles.preview} aria-hidden="true">
            <div className={styles.previewHeader}>
              <span>{t("nav.today")}</span>
              <span>{t("sync.pending")}</span>
            </div>
            <div className={styles.previewRow}>
              <span className={styles.previewIcon}>
                <CalendarDays size={16} />
              </span>
              <span>{t("today.section.today")}</span>
            </div>
            <div className={styles.previewRow}>
              <span className={styles.previewIcon}>
                <Inbox size={16} />
              </span>
              <span>{t("nav.inbox")}</span>
            </div>
            <div className={styles.previewRow}>
              <span className={styles.previewIcon}>
                <Sparkles size={16} />
              </span>
              <span>{t("today.section.primaryRecommendations")}</span>
            </div>
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="auth-title">
          <div className={styles.brand}>
            <span className={styles.mark}>Y</span>
            <span>Yasumi</span>
            <label className={styles.language}>
              <span className="visually-hidden">{t("settings.language.label")}</span>
              <select
                aria-label={t("settings.language.label")}
                onChange={(event) => {
                  const language = event.target.value as typeof settings.language;
                  if (!session) {
                    setLanguage(language);
                    return;
                  }

                  updateSettings({ language, locale: getDefaultLocale(language) });
                }}
                value={session ? settings.language : language}
              >
                <option value="en">{t("settings.language.en")}</option>
                <option value="zh-Hans">{t("settings.language.zhHans")}</option>
                <option value="ja">{t("settings.language.ja")}</option>
              </select>
            </label>
          </div>
          <div className={styles.header}>
            <h1 id="auth-title">{t("auth.title")}</h1>
            <p>{t("auth.description")}</p>
          </div>
          <div className={styles.tabs} role="tablist" aria-label={t("auth.mode.label")}>
            <button
              className={styles.tab}
              data-active={mode === "login"}
              onClick={() => setMode("login")}
              type="button"
            >
              {t("auth.login.tab")}
            </button>
            <button
              className={styles.tab}
              data-active={mode === "register"}
              onClick={() => setMode("register")}
              type="button"
            >
              {t("auth.register.tab")}
            </button>
          </div>
          <form className={styles.form} onSubmit={(event) => void submit(event)}>
            {mode === "register" ? <p className={styles.requiredNote}>{t("auth.requiredNote")}</p> : null}
            {mode === "login" ? (
              <TextInput
                autoComplete="username"
                label={t("auth.identifier.label")}
                onChange={(event) => setIdentifier(event.target.value)}
                required
                value={identifier}
              />
            ) : (
              <>
                <TextInput
                  autoComplete="username"
                  label={t("auth.username.label")}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  value={username}
                />
                <TextInput
                  autoComplete="email"
                  label={t("auth.email.label")}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
                <TextInput
                  autoComplete="name"
                  label={t("auth.displayName.label")}
                  onChange={(event) => setDisplayName(event.target.value)}
                  value={displayName}
                />
              </>
            )}
            <TextInput
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              label={t("auth.password.label")}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            {mode === "register" ? (
              <TextInput
                autoComplete="new-password"
                error={errorKey === "auth.error.passwordMismatch" ? t(errorKey) : undefined}
                label={t("auth.confirmPassword.label")}
                minLength={8}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (errorKey === "auth.error.passwordMismatch") {
                    setErrorKey(null);
                  }
                }}
                required
                type="password"
                value={confirmPassword}
              />
            ) : null}
            {errorKey ? <p className={styles.error}>{t(errorKey)}</p> : null}
            <Button
              disabled={submitting}
              fullWidth
              icon={mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
              type="submit"
              variant="primary"
            >
              {t(mode === "login" ? "auth.login.submit" : "auth.register.submit")}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}

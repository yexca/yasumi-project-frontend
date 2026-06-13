import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslation } from "@/i18n/I18nProvider";

export function InboxPage() {
  const { t } = useTranslation();

  return <PlaceholderPage description={t("page.inbox.description")} title={t("nav.inbox")} />;
}

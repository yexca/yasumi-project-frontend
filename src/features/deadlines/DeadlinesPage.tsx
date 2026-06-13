import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslation } from "@/i18n/I18nProvider";

export function DeadlinesPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage description={t("page.deadlines.description")} title={t("nav.deadlines")} />
  );
}

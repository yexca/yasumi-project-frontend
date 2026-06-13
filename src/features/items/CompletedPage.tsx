import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslation } from "@/i18n/I18nProvider";

export function CompletedPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage description={t("page.completed.description")} title={t("nav.completed")} />
  );
}

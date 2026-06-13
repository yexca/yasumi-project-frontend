import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslation } from "@/i18n/I18nProvider";

export function AreasPage() {
  const { t } = useTranslation();

  return <PlaceholderPage description={t("page.areas.description")} title={t("nav.areas")} />;
}

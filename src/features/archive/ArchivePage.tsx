import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslation } from "@/i18n/I18nProvider";

export function ArchivePage() {
  const { t } = useTranslation();

  return <PlaceholderPage description={t("page.archive.description")} title={t("nav.archive")} />;
}

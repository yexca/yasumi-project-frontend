import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslation } from "@/i18n/I18nProvider";

export function IdeaPoolPage() {
  const { t } = useTranslation();

  return <PlaceholderPage description={t("page.ideas.description")} title={t("nav.ideas")} />;
}

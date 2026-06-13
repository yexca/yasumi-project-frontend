import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslation } from "@/i18n/I18nProvider";

export function TodayPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      description={t("page.today.description")}
      sections={[
        t("today.section.carriedForward"),
        t("today.section.today"),
        t("today.section.primaryRecommendations"),
        t("today.section.recommendedWork"),
        t("today.section.approachingDeadlines"),
        t("today.section.ideasToRevisit"),
      ]}
      title={t("nav.today")}
    />
  );
}

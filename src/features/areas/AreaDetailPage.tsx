import { useParams } from "react-router";

import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslation } from "@/i18n/I18nProvider";

export function AreaDetailPage() {
  const { areaId } = useParams();
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      description={t("page.areaDetail.description", { areaId: areaId ?? "" })}
      title={t("nav.areas")}
    />
  );
}

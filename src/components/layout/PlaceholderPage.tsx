import { DenseItemRow } from "@/components/items/DenseItemRow";
import { ContentColumn, PageHeader, SectionHeader } from "@/components/layout/LayoutPrimitives";
import { useTranslation } from "@/i18n/I18nProvider";

import styles from "./PlaceholderPage.module.css";

type PlaceholderPageProps = {
  title: string;
  description: string;
  sections?: string[];
};

export function PlaceholderPage({ title, description, sections = [] }: PlaceholderPageProps) {
  const { t } = useTranslation();

  return (
    <ContentColumn>
      <PageHeader description={description} title={title} />

      {sections.length > 0 ? (
        <div className={styles.sectionList} aria-label={title}>
          {sections.map((section, index) => (
            <section className={styles.section} key={section}>
              <SectionHeader count={0} title={section} />
              <DenseItemRow
                date="YYYY-MM-DD"
                moreActionLabel={t("item.action.more")}
                primaryActionLabel={t("item.action.complete")}
                state={index === 2 ? "recommended" : "normal"}
                title={description}
              />
            </section>
          ))}
        </div>
      ) : (
        <div className={["surface-row", styles.emptyState].join(" ")}>{description}</div>
      )}
    </ContentColumn>
  );
}

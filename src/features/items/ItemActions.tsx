import { MoreHorizontal } from "lucide-react";

import { IconButton } from "@/components/primitives/Button";
import { Menu, MenuItem } from "@/components/primitives/Menu";
import type { LocalItemRow } from "@/domain/items/schemas";
import { useTranslation } from "@/i18n/I18nProvider";

import {
  getItemActions,
  getPrimaryAction,
  getPrimaryActionIcon,
  type ItemAction,
} from "./itemPresentation";

type ItemActionsProps = {
  item: LocalItemRow;
  onAction: (action: ItemAction, item: LocalItemRow) => void;
};

export function ItemPrimaryAction({ item, onAction }: ItemActionsProps) {
  const { t } = useTranslation();
  const action = getPrimaryAction(item);
  const label = t(action.labelKey);

  return (
    <IconButton
      aria-label={label}
      icon={getPrimaryActionIcon(action.id)}
      onClick={() => onAction(action, item)}
      tooltip={label}
      variant={action.id === "delete" || action.id === "abandon" ? "danger" : "quiet"}
    />
  );
}

export function ItemOverflowActions({ item, onAction }: ItemActionsProps) {
  const { t } = useTranslation();
  const actions = getItemActions(item).slice(1);

  if (actions.length === 0) {
    return null;
  }

  return (
    <Menu
      trigger={
        <IconButton
          aria-label={t("item.action.more")}
          icon={<MoreHorizontal aria-hidden="true" size={17} />}
          tooltip={t("item.action.more")}
        />
      }
    >
      {actions.map((action) => (
        <MenuItem key={action.id} onSelect={() => onAction(action, item)}>
          {t(action.labelKey)}
        </MenuItem>
      ))}
    </Menu>
  );
}

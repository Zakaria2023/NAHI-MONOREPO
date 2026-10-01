import { StatusPill } from "ui";
import { ItemKind } from "@/db/enum";

type ItemKindPillProps = {
  kind: ItemKind;
};

export const ItemKindPill = ({ kind }: ItemKindPillProps) =>
  kind === "fixed_asset" ? <StatusPill tone="info">Fixed asset</StatusPill> : <StatusPill>Consumable</StatusPill>;

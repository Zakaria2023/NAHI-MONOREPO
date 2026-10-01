"use client";

import { itemSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createItemAction } from "./actions";

export const useItemForm = () =>
  useActionForm(itemSchema, createItemAction, {
    code: "",
    name: "",
    category: "fiber_material",
    kind: "consumable",
    unit: "",
    reorderLevel: 0,
    standardCost: 0,
  });

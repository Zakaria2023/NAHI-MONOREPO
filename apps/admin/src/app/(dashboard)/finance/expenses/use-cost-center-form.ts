"use client";

import { costCenterSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createCostCenterAction } from "./actions";

export const useCostCenterForm = () => useActionForm(costCenterSchema, createCostCenterAction, { code: "", name: "", kind: "department" });

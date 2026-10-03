"use client";

import { studyLineSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

/** Takes the action already bound to the project. */
export const useStudyLineForm = (action: FormAction) => {
  const props = useActionForm(studyLineSchema, action, {
    category: "civil_works",
    description: "",
    unit: "",
    qty: "",
    unitCost: "",
    duration: "0",
    supplyType: "",
    workType: "",
  });
  // Equipment carries how it is supplied; the works carry civil or fiber.
  const category = props.form.watch("category");
  return { ...props, equipment: category === "equipment", works: ["civil_works", "fiber_works", "equipment"].includes(category) };
};

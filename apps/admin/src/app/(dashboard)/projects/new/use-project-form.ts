"use client";

import { createProjectSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createProjectAction } from "./actions";

export const useProjectForm = (projectManagerName: string) =>
  useActionForm(createProjectSchema, createProjectAction, {
    name: "",
    operator: "mobily",
    region: "central",
    city: "",
    siteName: "",
    poNumber: "",
    poValue: 0,
    projectManagerName,
  });

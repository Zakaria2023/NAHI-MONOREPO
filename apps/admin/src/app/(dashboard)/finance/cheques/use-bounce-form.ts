"use client";

import { bounceChequeSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

export const useBounceForm = (action: FormAction) => useActionForm(bounceChequeSchema, action, { reason: "" });

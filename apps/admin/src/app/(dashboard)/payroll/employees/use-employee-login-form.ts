"use client";

import { employeeLoginSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createEmployeeLoginAction } from "./actions";

export const useEmployeeLoginForm = () => useActionForm(employeeLoginSchema, createEmployeeLoginAction, { employeeUuid: "", email: "", password: "" });

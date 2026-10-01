"use client";

import { supplierSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createSupplierAction } from "./actions";

export const useSupplierForm = () =>
  useActionForm(supplierSchema, createSupplierAction, {
    name: "",
    vatNumber: "",
    crNumber: "",
    address: "",
    email: "",
    phone: "",
  });

"use client";

import { useContext, useEffect } from "react";
import { ActionResult } from "@/lib/action-result";
import { DialogCloseContext } from "./dialog-close";

/** A form inside a dialog closes it as soon as its action succeeds, so no form has to wire that itself. */
export const useCloseOnSuccess = (state: ActionResult): void => {
  const close = useContext(DialogCloseContext);
  useEffect(() => {
    if (state.success && !state.error && close) {
      close();
    }
  }, [state, close]);
};

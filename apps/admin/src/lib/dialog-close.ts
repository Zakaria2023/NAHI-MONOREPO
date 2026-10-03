"use client";

import { createContext } from "react";

/** Set by `FormDialog`: how a form inside a dialog closes it once it has saved. Null outside a dialog. */
export const DialogCloseContext = createContext<(() => void) | null>(null);

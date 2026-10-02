"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * Navigation chosen from a dropdown — it cannot be a plain link, because the
 * target is known only once an option is picked.
 */
export const useChoicePicker = (options: { value: string; href: string }[]) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const choose = (value: string) => {
    const target = options.find((o) => o.value === value)?.href;
    if (target) {
      startTransition(() => router.push(target));
    }
  };
  return { choose, isPending };
};

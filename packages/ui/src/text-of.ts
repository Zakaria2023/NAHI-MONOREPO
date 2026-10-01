import { isValidElement, ReactNode } from "react";

/** The visible text inside a rendered cell — what a reader would sort it by. */
export const textOf = (node: ReactNode): string => {
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join(" ");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
};

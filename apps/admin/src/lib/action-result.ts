/** What every Server Action returns to `useActionState`. */
export type ActionResult = {
  error?: string;
  success?: string;
};

/** A Server Action with its record already bound, taking a form's values. */
export type FormAction = (prev: ActionResult, data: unknown) => Promise<ActionResult>;

/** A Server Action with everything bound — one button. */
export type ButtonAction = (prev: ActionResult) => Promise<ActionResult>;

"use client";

import { Upload } from "lucide-react";
import { useUploadForm } from "@/app/(dashboard)/projects/[uuid]/use-project-forms";
import { FormError } from "ui";
import { StcDocumentKey } from "@/db/enum";
import { FormAction } from "@/lib/action-result";

type UploadFormProps = {
  action: FormAction;
  docKey: StcDocumentKey;
  replacing: boolean;
};

/**
 * The MVP keeps the file's name, not the file: there is no storage yet.
 */
export const UploadForm = ({ action, docKey, replacing }: UploadFormProps) => {
  const { state, isPending, onSubmit, onFileChosen } = useUploadForm(action, docKey);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1">
      <label className={`inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-control border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-hover ${isPending ? "opacity-60" : ""}`}>
        <Upload size={13} />
        {isPending ? "Uploading…" : replacing ? "Replace" : "Upload"}
        <input
          type="file"
          className="sr-only"
          onChange={onFileChosen}
        />
      </label>
      <FormError message={state.error} />
    </form>
  );
};

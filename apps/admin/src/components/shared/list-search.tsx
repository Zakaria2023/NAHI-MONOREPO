import { Search } from "lucide-react";

type ListSearchProps = {
  placeholder: string;
  defaultValue?: string;
};

/** A GET form: the search lives in the URL, so it survives a reload and can be shared. */
export const ListSearch = ({ placeholder, defaultValue }: ListSearchProps) => (
  <form className="relative w-full max-w-sm">
    <Search size={15} className="pointer-events-none absolute top-1/2 inset-s-3 -translate-y-1/2 text-faint" />
    <input
      name="search"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="h-9 w-full rounded-full border border-hairline bg-surface ps-9 pe-4 text-sm outline-none transition-colors placeholder:text-faint focus:border-primary focus:ring-4 focus:ring-primary/10"
    />
  </form>
);

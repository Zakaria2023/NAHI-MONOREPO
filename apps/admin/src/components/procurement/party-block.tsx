import { Mail, MapPin, Phone } from "lucide-react";
import { Supplier } from "services";

type PartyBlockProps = {
  /** "From" or "To" — whose side of the document this is. */
  heading: string;
  party: Pick<Supplier, "name" | "vatNumber" | "crNumber" | "address" | "email" | "phone">;
};

/** A company's registration and contacts, as printed on the PO. */
export const PartyBlock = ({ heading, party }: PartyBlockProps) => (
  <div className="flex flex-col gap-2 rounded-control border border-hairline-soft px-4 py-3">
    <span className="text-xs tracking-wide text-muted uppercase">{heading}</span>
    <span className="text-base text-ink">{party.name}</span>
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      <dt className="text-muted">VAT number</dt>
      <dd dir="ltr" className="text-end text-ink">
        {party.vatNumber}
      </dd>
      <dt className="text-muted">CR number</dt>
      <dd dir="ltr" className="text-end text-ink">
        {party.crNumber}
      </dd>
    </dl>
    <div className="flex flex-col gap-1 border-t border-hairline-soft pt-2 text-xs text-secondary">
      <span className="flex items-start gap-1.5">
        <MapPin size={12} className="mt-0.5 shrink-0 text-faint" />
        {party.address}
      </span>
      <span className="flex items-center gap-1.5">
        <Mail size={12} className="shrink-0 text-faint" />
        <span dir="ltr">{party.email}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Phone size={12} className="shrink-0 text-faint" />
        <span dir="ltr">{party.phone}</span>
      </span>
    </div>
  </div>
);

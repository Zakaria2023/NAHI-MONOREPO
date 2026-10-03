import { Boxes, FolderKanban, HandCoins, Landmark, ListTodo, Lock, Receipt, ShoppingCart, Users, Wallet } from "lucide-react";
import { ReactNode } from "react";
import { getCompanyOverview } from "services";
import { OverviewCard } from "./overview-card";

/** Each area's icon and chip colour, keyed by its section. */
const LOOKS: Record<string, { icon: ReactNode; chip: string }> = {
  tasks: { icon: <ListTodo size={18} />, chip: "bg-primary-tint text-primary" },
  people: { icon: <Users size={18} />, chip: "bg-teal-tint text-teal" },
  projects: { icon: <FolderKanban size={18} />, chip: "bg-violet-tint text-violet" },
  procurement: { icon: <ShoppingCart size={18} />, chip: "bg-orange-tint text-orange" },
  warehouse: { icon: <Boxes size={18} />, chip: "bg-warning-tint text-warning" },
  custody: { icon: <Wallet size={18} />, chip: "bg-teal-tint text-teal" },
  payables: { icon: <Receipt size={18} />, chip: "bg-danger-tint text-danger" },
  receivables: { icon: <HandCoins size={18} />, chip: "bg-success-tint text-success" },
  treasury: { icon: <Landmark size={18} />, chip: "bg-primary-tint text-primary" },
  books: { icon: <Lock size={18} />, chip: "bg-hover text-secondary" },
};

const FALLBACK = LOOKS.books;

/** The whole company on one screen: every area of the system with its key figures. */
export const CompanyOverview = async () => {
  const sections = await getCompanyOverview();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium tracking-tight text-ink">Across the company</h2>
        <p className="text-sm text-muted">Every area of the system at a glance — open any figure to see what is behind it.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {sections.map((section) => {
          const look = LOOKS[section.key] ?? FALLBACK;
          return <OverviewCard key={section.key} section={section} icon={look.icon} chip={look.chip} />;
        })}
      </div>
    </div>
  );
};

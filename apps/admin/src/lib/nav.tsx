import {
  Activity,
  BadgeCheck,
  Bell,
  Boxes,
  Building2,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  FileSpreadsheet,
  FileSignature,
  FileText,
  FolderKanban,
  HandCoins,
  IdCard,
  Landmark,
  LayoutDashboard,
  Lock,
  Package,
  PackageX,
  Percent,
  PiggyBank,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";
import { NavGroup } from "ui";

type NavBadges = {
  approvals: number;
  alerts: number;
};

const ICON = 17;

/** The admin's whole menu, grouped as the four specification documents are. */
export const buildNav = ({ approvals, alerts }: NavBadges): NavGroup[] => [
  {
    title: "Overview",
    links: [
      { icon: <LayoutDashboard size={ICON} />, label: "Dashboard", href: "/" },
      { icon: <BadgeCheck size={ICON} />, label: "My approvals", href: "/approvals", badge: approvals },
      { icon: <Bell size={ICON} />, label: "Alerts", href: "/alerts", badge: alerts },
    ],
  },
  {
    title: "Projects",
    links: [{ icon: <FolderKanban size={ICON} />, label: "Mobily & STC projects", href: "/projects" }],
  },
  {
    title: "Procurement",
    links: [
      { icon: <ClipboardList size={ICON} />, label: "Purchase requests", href: "/procurement/requests" },
      { icon: <ShoppingCart size={ICON} />, label: "Purchase orders", href: "/procurement/orders" },
      { icon: <FileSignature size={ICON} />, label: "Annual contracts", href: "/procurement/contracts" },
      { icon: <PackageX size={ICON} />, label: "Returns & debit notes", href: "/procurement/returns" },
      { icon: <Building2 size={ICON} />, label: "Suppliers", href: "/procurement/suppliers" },
    ],
  },
  {
    title: "Warehouse",
    links: [
      { icon: <Boxes size={ICON} />, label: "Stock", href: "/warehouse/stock" },
      { icon: <Truck size={ICON} />, label: "Warehouse documents", href: "/warehouse/documents" },
      { icon: <Package size={ICON} />, label: "Asset custody", href: "/warehouse/custody" },
    ],
  },
  {
    title: "Custody",
    links: [
      { icon: <Wallet size={ICON} />, label: "Cash custody", href: "/custody" },
      { icon: <Users size={ICON} />, label: "Employees & clearance", href: "/custody/employees" },
    ],
  },
  {
    title: "HR & payroll",
    links: [
      { icon: <IdCard size={ICON} />, label: "Employees", href: "/payroll/employees" },
      { icon: <CalendarCheck size={ICON} />, label: "Timesheets & attendance", href: "/payroll/timesheets" },
      { icon: <WalletCards size={ICON} />, label: "Payroll", href: "/payroll/runs" },
    ],
  },
  {
    title: "Finance",
    links: [
      { icon: <Receipt size={ICON} />, label: "Supplier invoices", href: "/finance/payables" },
      { icon: <CalendarClock size={ICON} />, label: "Due schedule & ageing", href: "/finance/schedule" },
      { icon: <HandCoins size={ICON} />, label: "Subcontractors", href: "/finance/subcontracts" },
      { icon: <FileSpreadsheet size={ICON} />, label: "Extracts", href: "/finance/extracts" },
      { icon: <FileText size={ICON} />, label: "Customer invoices", href: "/finance/receivables" },
      { icon: <PiggyBank size={ICON} />, label: "Project budgets", href: "/finance/budgets" },
      { icon: <Lock size={ICON} />, label: "Monthly closing", href: "/finance/closing" },
      { icon: <Percent size={ICON} />, label: "VAT summary", href: "/finance/vat" },
    ],
  },
  {
    title: "System",
    links: [
      { icon: <Activity size={ICON} />, label: "Activity log", href: "/activity" },
      { icon: <Settings size={ICON} />, label: "Settings", href: "/settings" },
    ],
  },
];

export const BRAND_ICON = <Landmark size={19} />;

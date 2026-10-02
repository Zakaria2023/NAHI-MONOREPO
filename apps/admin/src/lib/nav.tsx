import {
  Activity,
  AlarmClock,
  BadgeCheck,
  Bell,
  Boxes,
  Building2,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  Coins,
  FileSignature,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Forklift,
  HandCoins,
  IdCard,
  Landmark,
  LayoutDashboard,
  Lock,
  Network,
  Package,
  PackageX,
  Percent,
  PiggyBank,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  TrendingDown,
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

/** The admin's whole menu, grouped by area of work. */
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
    title: "Payables & receivables",
    links: [
      { icon: <Receipt size={ICON} />, label: "Supplier invoices", href: "/finance/payables" },
      { icon: <CalendarClock size={ICON} />, label: "Due schedule & ageing", href: "/finance/schedule" },
      { icon: <HandCoins size={ICON} />, label: "Subcontractors", href: "/finance/subcontracts" },
      { icon: <FileSpreadsheet size={ICON} />, label: "Extracts", href: "/finance/extracts" },
      { icon: <FileText size={ICON} />, label: "Customer invoices", href: "/finance/receivables" },
    ],
  },
  {
    title: "Treasury",
    links: [
      { icon: <Landmark size={ICON} />, label: "Bank accounts", href: "/finance/bank" },
      { icon: <ScrollText size={ICON} />, label: "Cheques", href: "/finance/cheques" },
      { icon: <ShieldCheck size={ICON} />, label: "Guarantees & retentions", href: "/finance/guarantees" },
    ],
  },
  {
    title: "Cost control",
    links: [
      { icon: <PiggyBank size={ICON} />, label: "Project budgets", href: "/finance/budgets" },
      { icon: <Coins size={ICON} />, label: "Expenses & cost centres", href: "/finance/expenses" },
      { icon: <Network size={ICON} />, label: "Overhead allocation", href: "/finance/overhead" },
    ],
  },
  {
    title: "Accounting",
    links: [
      { icon: <Forklift size={ICON} />, label: "Fixed assets", href: "/finance/assets" },
      { icon: <TrendingDown size={ICON} />, label: "Depreciation", href: "/finance/depreciation" },
      { icon: <Lock size={ICON} />, label: "Monthly closing", href: "/finance/closing" },
      { icon: <Percent size={ICON} />, label: "VAT", href: "/finance/vat" },
      { icon: <AlarmClock size={ICON} />, label: "Tax & insurance calendar", href: "/finance/obligations" },
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

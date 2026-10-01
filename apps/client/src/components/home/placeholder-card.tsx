import { Landmark } from "lucide-react";
import { Card } from "ui";

/**
 * The client app is kept in the monorepo, wired to the same packages and
 * theme, but has no screens yet: the specifications describe an internal
 * system only, and all of it lives in apps/admin.
 */
export const PlaceholderCard = () => (
  <Card className="w-full max-w-lg">
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-control bg-primary text-white">
        <Landmark size={22} />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl text-ink">NAHI — Client</h1>
        <p className="text-sm text-muted">
          This app is reserved for a later phase. Every workflow — projects, procurement, warehouse, custody and finance — is in the admin dashboard.
        </p>
      </div>
    </div>
  </Card>
);

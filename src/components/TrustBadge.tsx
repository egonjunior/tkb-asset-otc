import { LucideIcon } from "lucide-react";

interface TrustBadgeProps {
  icon: LucideIcon;
  label: string;
}

export const TrustBadge = ({ icon: Icon, label }: TrustBadgeProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-full border border-neutral-200 hover:border-primary/30 hover:bg-neutral-100 transition-all duration-300">
      <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
      <span className="text-xs font-medium text-neutral-700">{label}</span>
    </div>
  );
};

import type { LucideIcon } from "lucide-react";

export default function PageContainer({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-900/10 text-blue-900">
              <Icon size={20} />
            </div>
          )}

          <div>
            <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>

        {action}
      </div>

      {children}
    </div>
  );
}

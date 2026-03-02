import { cn } from "@/lib/utils/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "up" | "down" | "neutral";
}

export function Badge({ className, variant = "neutral", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        {
          "bg-emerald-500/10 text-emerald-400": variant === "up",
          "bg-red-500/10 text-red-400": variant === "down",
          "bg-gray-700 text-gray-300": variant === "neutral",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

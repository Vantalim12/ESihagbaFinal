import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-xl border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
        outline: "text-foreground border-border/50 hover:bg-muted/50",
        success: "border-transparent bg-success/10 text-success border-success/20 hover:bg-success/20",
        warning: "border-transparent bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
        pending: "border-transparent bg-warning/10 text-warning border-warning/20 animate-pulse",
        confirmed: "border-transparent bg-success/10 text-success border-success/20",
        failed: "border-transparent bg-destructive/10 text-destructive border-destructive/20",
        flow: "border-transparent bg-flow/10 text-flow border-flow/20 hover:bg-flow/20",
        accent: "border-transparent bg-accent/10 text-accent border-accent/20 hover:bg-accent/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

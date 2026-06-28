import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center uppercase tracking-[1px] border-[2px] rounded-none focus:outline-none focus:ring-0",
  {
    variants: {
      variant: {
        filter: "bg-white text-black border-black text-[10px] px-[12px] py-[4px] hover:bg-black hover:text-white active:bg-black active:text-white",
        default: "bg-white text-black border-black text-[11px] font-semibold px-[10px] py-[2px]",
        active: "bg-white text-success border-success text-[11px] font-semibold px-[10px] py-[2px]",
        warning: "bg-white text-warning border-warning text-[11px] font-semibold px-[10px] py-[2px]",
        error: "bg-white text-error border-error text-[11px] font-semibold px-[10px] py-[2px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

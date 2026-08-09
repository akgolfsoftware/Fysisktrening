import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[15px] font-semibold transition-[background-color,opacity,transform] duration-[var(--dur)] ease-[var(--ease-out)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-pressed active:bg-primary-pressed",
        strength:
          "bg-strength text-primary-foreground hover:bg-strength/90 active:bg-strength/90",
        secondary: "bg-muted text-foreground hover:bg-muted/80",
        outline:
          "border border-border-strong bg-transparent text-primary hover:bg-muted/60",
        ghost: "text-primary hover:bg-muted/60",
        destructive:
          "border border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10",
        link: "text-muted-foreground underline-offset-4 hover:text-foreground",
      },
      size: {
        default: "min-h-11 px-[18px] py-3",
        sm: "min-h-9 rounded-[10px] px-3.5 text-[13px]",
        lg: "min-h-14 rounded-[14px] px-6 text-base",
        icon: "size-12 rounded-xl",
        "icon-sm": "size-9 rounded-[9px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

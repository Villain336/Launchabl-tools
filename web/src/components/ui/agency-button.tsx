import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as ShadcnButton } from "@/components/ui/button";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variantMap: Record<Variant, "default" | "outline" | "ghost"> = {
  primary: "default",
  secondary: "outline",
  ghost: "ghost",
};

const sizeMap: Record<Size, "sm" | "default" | "lg"> = {
  sm: "sm",
  md: "default",
  lg: "lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <ShadcnButton variant={variantMap[variant]} size={sizeMap[size]} className={className} {...props}>
      {children}
    </ShadcnButton>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  target,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  target?: string;
}) {
  return (
    <ShadcnButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={className}
      render={<Link href={href} target={target} />}
      nativeButton={false}
    >
      {children}
    </ShadcnButton>
  );
}

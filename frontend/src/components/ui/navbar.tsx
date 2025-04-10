"use client";

import * as Headless from "@headlessui/react";
import clsx from "clsx";
import { LayoutGroup, motion } from "framer-motion";
import React, { forwardRef, useId } from "react";
import { TouchTarget } from "./button";
import { Link } from "./link";
import { cn } from "@/lib/utils";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

export function Navbar({ children, className }: NavbarProps) {
  return (
    <nav
      className={cn(
        "flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4",
        className
      )}
    >
      {children}
    </nav>
  );
}

export function NavbarDivider({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      aria-hidden="true"
      {...props}
      className={clsx(className, "h-6 w-px bg-zinc-950/10 dark:bg-white/10")}
    />
  );
}

interface NavbarSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function NavbarSection({ children, className }: NavbarSectionProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>{children}</div>
  );
}

export function NavbarSpacer() {
  return <div className="flex-1" />;
}

interface NavbarItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function NavbarItem({ className, ...props }: NavbarItemProps) {
  return <div className={cn("flex items-center", className)} {...props} />;
}

export function NavbarLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"span">) {
  return <span {...props} className={clsx(className, "truncate")} />;
}

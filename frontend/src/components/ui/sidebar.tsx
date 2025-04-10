"use client";

import * as Headless from "@headlessui/react";
import clsx from "clsx";
import { LayoutGroup, motion } from "framer-motion";
import React, { forwardRef, useId } from "react";
import { TouchTarget } from "./button";
import { Link } from "./link";
import { cn } from "@/lib/utils";

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-gray-200 bg-white",
        className
      )}
    >
      {children}
    </aside>
  );
}

interface SidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarHeader({ children, className }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex h-16 items-center border-b border-gray-200 px-4",
        className
      )}
    >
      {children}
    </div>
  );
}

interface SidebarBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarBody({ children, className }: SidebarBodyProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-4", className)}>
      {children}
    </div>
  );
}

interface SidebarFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarFooter({ children, className }: SidebarFooterProps) {
  return (
    <div className={cn("border-t border-gray-200 p-4", className)}>
      {children}
    </div>
  );
}

interface SidebarSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarSection({ children, className }: SidebarSectionProps) {
  return <div className={cn("space-y-1", className)}>{children}</div>;
}

interface SidebarHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarHeading({ children, className }: SidebarHeadingProps) {
  return (
    <h3 className={cn("px-2 text-xs font-semibold text-gray-500", className)}>
      {children}
    </h3>
  );
}

interface SidebarItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  current?: boolean;
  icon?: React.ReactNode;
}

export function SidebarItem({
  current,
  icon,
  children,
  className,
  ...props
}: SidebarItemProps) {
  return (
    <Link
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
        current
          ? "bg-gray-100 text-gray-900"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        className
      )}
      {...props}
    >
      {icon && <span className="h-5 w-5">{icon}</span>}
      {children}
    </Link>
  );
}

export function SidebarLabel({ children }: { children: React.ReactNode }) {
  return <span className="flex-1">{children}</span>;
}

export function SidebarSpacer() {
  return <div className="h-4" />;
}

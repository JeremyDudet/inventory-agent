import * as Headless from "@headlessui/react";
import clsx from "clsx";
import { LayoutGroup, motion } from "framer-motion";
import React, { forwardRef, useId } from "react";
import { TouchTarget } from "./button";
import { Link } from "@/components/ui/link";
import { NavLink, useLocation } from "react-router-dom";

export function Sidebar({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"nav">) {
  return (
    <nav
      {...props}
      className={clsx(className, "flex h-full min-h-0 flex-col")}
    />
  );
}

export function SidebarHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        "flex flex-col border-b border-zinc-950/5 p-4 dark:border-white/5 [&>[data-slot=section]+[data-slot=section]]:mt-2.5"
      )}
    />
  );
}

export function SidebarBody({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        "flex flex-1 flex-col overflow-y-auto p-4 [&>[data-slot=section]+[data-slot=section]]:mt-8"
      )}
    />
  );
}

export function SidebarFooter({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        "flex flex-col border-t border-zinc-950/5 p-4 dark:border-white/5 [&>[data-slot=section]+[data-slot=section]]:mt-2.5"
      )}
    />
  );
}

export function SidebarSection({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  let id = useId();

  return (
    <LayoutGroup id={id}>
      <div
        {...props}
        data-slot="section"
        className={clsx(className, "flex flex-col gap-0.5")}
      />
    </LayoutGroup>
  );
}

export function SidebarDivider({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"hr">) {
  return (
    <hr
      {...props}
      className={clsx(
        className,
        "my-4 border-t border-zinc-950/5 lg:-mx-4 dark:border-white/5"
      )}
    />
  );
}

export function SidebarSpacer({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      aria-hidden="true"
      {...props}
      className={clsx(className, "mt-8 flex-1")}
    />
  );
}

export function SidebarHeading({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      {...props}
      className={clsx(
        className,
        "mb-1 px-2 text-xs/6 font-medium text-zinc-500 dark:text-zinc-400"
      )}
    />
  );
}

export const SidebarItem = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  {
    current?: boolean;
    className?: string;
    children: React.ReactNode;
    href?: string;
  } & (
    | Omit<Headless.ButtonProps, "as" | "className">
    | Omit<React.ComponentPropsWithoutRef<"a">, "className" | "href">
  )
>(function SidebarItem({ current, className, children, href, ...props }, ref) {
  const location = useLocation();
  const isActive =
    href &&
    (location.pathname === href ||
      (href !== "/dashboard" && location.pathname.startsWith(href)));

  // Function to emit custom event for sidebar closure on mobile
  const handleNavClick = () => {
    const closeSidebarEvent = new CustomEvent("close-sidebar");
    window.dispatchEvent(closeSidebarEvent);
  };

  let classes = clsx(
    // Base
    "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium sm:py-2 sm:text-sm/5",
    // Base icon styling
    "*:data-[slot=icon]:size-6 *:data-[slot=icon]:shrink-0 sm:*:data-[slot=icon]:size-5",
    // Trailing icon (down chevron or similar)
    "*:last:data-[slot=icon]:ml-auto *:last:data-[slot=icon]:size-5 sm:*:last:data-[slot=icon]:size-4",
    // Avatar
    "*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-7 sm:*:data-[slot=avatar]:size-6",
    // Hover effects
    "hover:bg-zinc-950/5 dark:hover:bg-white/5"
  );

  return (
    <span className={clsx(className, "relative sidebar-nav-item")}>
      {isActive && (
        <motion.span
          layoutId="sidebar-indicator"
          className="sidebar-indicator absolute inset-y-2 -left-4 w-0.5 rounded-full bg-zinc-950 dark:bg-white"
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        />
      )}

      {href && href.startsWith("/") ? (
        <NavLink
          to={href}
          onClick={handleNavClick}
          className={({ isActive }) =>
            clsx(
              classes,
              // Text styling based on active state
              isActive
                ? "text-zinc-950 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
              // Icon styling based on active state
              isActive
                ? "[&>svg]:text-zinc-950 dark:[&>svg]:text-white"
                : "[&>svg]:text-zinc-500 dark:[&>svg]:text-zinc-400 hover:[&>svg]:text-zinc-700 dark:hover:[&>svg]:text-zinc-200"
            )
          }
          end={href === "/dashboard"}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        >
          <TouchTarget>{children}</TouchTarget>
        </NavLink>
      ) : href ? (
        <a
          href={href}
          onClick={handleNavClick}
          className={classes}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        >
          <TouchTarget>{children}</TouchTarget>
        </a>
      ) : (
        <Headless.Button
          {...(props as any)}
          className={clsx("cursor-default", classes)}
          data-current={current ? "true" : undefined}
          ref={ref as React.ForwardedRef<HTMLButtonElement>}
        >
          <TouchTarget>{children}</TouchTarget>
        </Headless.Button>
      )}
    </span>
  );
});

export function SidebarLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"span">) {
  return <span {...props} className={clsx(className, "truncate")} />;
}

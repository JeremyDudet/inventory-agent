"use client";

import * as Headless from "@headlessui/react";
import clsx from "clsx";
import type React from "react";
import { Button } from "./button";
import { Link } from "./link";
import { Fragment } from "react";
import { Transition } from "@headlessui/react";
import { cn } from "@/lib/utils";

export function Dropdown({ children }: { children: React.ReactNode }) {
  return (
    <Headless.Menu as="div" className="relative">
      {children}
    </Headless.Menu>
  );
}

interface DropdownButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType;
}

export function DropdownButton({
  as: Component = "button",
  className,
  ...props
}: DropdownButtonProps) {
  return (
    <Headless.Menu.Button
      as={Component}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100",
        className
      )}
      {...props}
    />
  );
}

interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
  anchor?: "top start" | "bottom end" | "bottom start" | "top end";
}

export function DropdownMenu({
  children,
  className,
  anchor = "bottom end",
}: DropdownMenuProps) {
  const anchorClasses = {
    "top start": "origin-top-left left-0",
    "bottom end": "origin-bottom-right right-0",
    "bottom start": "origin-bottom-left left-0",
    "top end": "origin-top-right right-0",
  };

  return (
    <Transition
      as={Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Headless.Menu.Items
        className={cn(
          "absolute mt-2 w-56 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
          anchorClasses[anchor],
          className
        )}
      >
        {children}
      </Headless.Menu.Items>
    </Transition>
  );
}

interface DropdownItemProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
}

export function DropdownItem({
  children,
  className,
  ...props
}: DropdownItemProps) {
  return (
    <Headless.Menu.Item>
      {({ active }) => (
        <a
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm text-gray-700",
            active && "bg-gray-100",
            className
          )}
          {...props}
        >
          {children}
        </a>
      )}
    </Headless.Menu.Item>
  );
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return <span className="flex-1">{children}</span>;
}

export function DropdownDivider() {
  return <div className="my-1 h-px bg-gray-200" />;
}

export function DropdownHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      className={clsx(className, "col-span-5 px-3.5 pt-2.5 pb-1 sm:px-3")}
    />
  );
}

export function DropdownSection({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.MenuSectionProps,
  "as" | "className"
>) {
  return (
    <Headless.MenuSection
      {...props}
      className={clsx(
        className,
        // Define grid at the section level instead of the item level if subgrid is supported
        "col-span-full supports-[grid-template-columns:subgrid]:grid supports-[grid-template-columns:subgrid]:grid-cols-[auto_1fr_1.5rem_0.5rem_auto]"
      )}
    />
  );
}

export function DropdownHeading({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.MenuHeadingProps,
  "as" | "className"
>) {
  return (
    <Headless.MenuHeading
      {...props}
      className={clsx(
        className,
        "col-span-full grid grid-cols-[1fr_auto] gap-x-12 px-3.5 pt-2 pb-1 text-sm/5 font-medium text-zinc-500 sm:px-3 sm:text-xs/5 dark:text-zinc-400"
      )}
    />
  );
}

export function DropdownDescription({
  className,
  ...props
}: { className?: string } & Omit<
  Headless.DescriptionProps,
  "as" | "className"
>) {
  return (
    <Headless.Description
      data-slot="description"
      {...props}
      className={clsx(
        className,
        "col-span-2 col-start-2 row-start-2 text-sm/5 text-zinc-500 group-data-focus:text-white sm:text-xs/5 dark:text-zinc-400 forced-colors:group-data-focus:text-[HighlightText]"
      )}
    />
  );
}

export function DropdownShortcut({
  keys,
  className,
  ...props
}: { keys: string | string[]; className?: string } & Omit<
  Headless.DescriptionProps<"kbd">,
  "as" | "className"
>) {
  return (
    <Headless.Description
      as="kbd"
      {...props}
      className={clsx(
        className,
        "col-start-5 row-start-1 flex justify-self-end"
      )}
    >
      {(Array.isArray(keys) ? keys : keys.split("")).map((char, index) => (
        <kbd
          key={index}
          className={clsx([
            "min-w-[2ch] text-center font-sans text-zinc-400 capitalize group-data-focus:text-white forced-colors:group-data-focus:text-[HighlightText]",
            // Make sure key names that are longer than one character (like "Tab") have extra space
            index > 0 && char.length > 1 && "pl-1",
          ])}
        >
          {char}
        </kbd>
      ))}
    </Headless.Description>
  );
}

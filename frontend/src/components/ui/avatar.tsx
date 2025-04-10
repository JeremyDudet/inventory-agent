import * as Headless from "@headlessui/react";
import clsx from "clsx";
import React, { forwardRef } from "react";
import { TouchTarget } from "./button";
import { Link } from "./link";
import { cn } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  square?: boolean;
  initials?: string;
  alt?: string;
  className?: string;
};

export function Avatar({
  src = null,
  square = false,
  initials,
  alt = "",
  className,
  ...props
}: AvatarProps & React.ComponentPropsWithoutRef<"span">) {
  if (initials) {
    return (
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600",
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      className={cn(
        "h-8 w-8 rounded-full object-cover",
        square && "rounded-lg",
        className
      )}
      {...props}
    />
  );
}

export const AvatarButton = forwardRef(function AvatarButton(
  {
    src,
    square = false,
    initials,
    alt,
    className,
    ...props
  }: AvatarProps &
    (
      | Omit<Headless.ButtonProps, "as" | "className">
      | Omit<React.ComponentPropsWithoutRef<typeof Link>, "className">
    ),
  ref: React.ForwardedRef<HTMLElement>
) {
  let classes = clsx(
    className,
    square ? "rounded-[20%]" : "rounded-full",
    "relative inline-grid focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500"
  );

  return "href" in props ? (
    <Link
      {...props}
      className={classes}
      ref={ref as React.ForwardedRef<HTMLAnchorElement>}
    >
      <TouchTarget>
        <Avatar src={src} square={square} initials={initials} alt={alt} />
      </TouchTarget>
    </Link>
  ) : (
    <Headless.Button {...props} className={classes} ref={ref}>
      <TouchTarget>
        <Avatar src={src} square={square} initials={initials} alt={alt} />
      </TouchTarget>
    </Headless.Button>
  );
});

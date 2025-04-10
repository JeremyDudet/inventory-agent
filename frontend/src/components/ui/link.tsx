import * as Headless from "@headlessui/react";
import { Link as RouterLink, type LinkProps } from "react-router-dom";
import React, { forwardRef } from "react";

export const Link = forwardRef(function Link(
  props: LinkProps & React.ComponentPropsWithoutRef<"a">,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <Headless.DataInteractive>
      <RouterLink {...props} ref={ref} />
    </Headless.DataInteractive>
  );
});

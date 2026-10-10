"use client";

import * as React from "react";
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";

type NavigationMenuProps = ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean;
};

// Original, unstyled glue. Replace this module with a project's shadcn adapter
// if desired; Root's viewport toggle prevents a second implicit viewport.
const NavigationMenu = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Root>,
  NavigationMenuProps
>(({ children, viewport = true, ...props }, ref) => (
  <NavigationMenuPrimitive.Root ref={ref} data-slot="navigation-menu" data-viewport={viewport} {...props}>
    {children}
    {viewport ? <NavigationMenuViewport /> : null}
  </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.List>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>((props, ref) => <NavigationMenuPrimitive.List ref={ref} data-slot="navigation-menu-list" {...props} />);
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Item>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Item>
>((props, ref) => <NavigationMenuPrimitive.Item ref={ref} data-slot="navigation-menu-item" {...props} />);
NavigationMenuItem.displayName = NavigationMenuPrimitive.Item.displayName;

const NavigationMenuTrigger = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>((props, ref) => <NavigationMenuPrimitive.Trigger ref={ref} data-slot="navigation-menu-trigger" {...props} />);
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>((props, ref) => <NavigationMenuPrimitive.Content ref={ref} data-slot="navigation-menu-content" {...props} />);
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Link>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>
>((props, ref) => <NavigationMenuPrimitive.Link ref={ref} data-slot="navigation-menu-link" {...props} />);
NavigationMenuLink.displayName = NavigationMenuPrimitive.Link.displayName;

const NavigationMenuViewport = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>((props, ref) => <NavigationMenuPrimitive.Viewport ref={ref} data-slot="navigation-menu-viewport" {...props} />);
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

const NavigationMenuIndicator = forwardRef<
  ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>((props, ref) => <NavigationMenuPrimitive.Indicator ref={ref} data-slot="navigation-menu-indicator" {...props} />);
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName;

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
};

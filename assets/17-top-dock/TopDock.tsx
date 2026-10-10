"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type CSSProperties,
} from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "./navigation-menu";
import { attachTopDockMotion } from "./top-dock-motion";
import { attachTopDockScroll, type TopDockScrollBehavior } from "./top-dock-scroll";
import "./top-dock.css";

export type TopDockGroup = {
  title: string;
  links: { label: string; href: string }[];
};

export type TopDockItem = {
  label: string;
  href?: string;
  groups?: TopDockGroup[];
};

export type TopDockProps = {
  logoSrc: string;
  logoAlt: string;
  homeHref: string;
  items: TopDockItem[];
  theme?: "dark" | "light";
  contentWidth?: string;
  scrollBehavior?: TopDockScrollBehavior;
  glassSurface?: ComponentType<{
    width: string;
    height: string;
    borderRadius: number;
    className?: string;
    style?: CSSProperties;
  }>;
};

export function TopDock({
  logoSrc,
  logoAlt,
  homeHref,
  items,
  theme,
  contentWidth,
  scrollBehavior = "smart",
  glassSurface: GlassSurface,
}: TopDockProps) {
  const [header, setHeader] = useState<HTMLElement | null>(null);
  const [navigation, setNavigation] = useState<HTMLElement | null>(null);
  const setNavigationRef = useCallback((element: HTMLElement | null) => {
    setNavigation(element);
  }, []);

  useEffect(() => attachTopDockMotion(navigation), [navigation]);
  useEffect(() => attachTopDockScroll(header, scrollBehavior), [header, scrollBehavior]);

  const glassStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  };

  const renderGlassBackplate = () =>
    GlassSurface ? (
      <div aria-hidden="true" className="top-dock__glass-layer" style={glassStyle}>
        <GlassSurface
          className="top-dock__glass"
          width="100%"
          height="100%"
          borderRadius={0}
          style={glassStyle}
        />
      </div>
    ) : null;

  return (
    <header
      className="top-dock"
      ref={setHeader}
      data-theme={theme}
      data-scroll-behavior={scrollBehavior}
      data-glass-source={GlassSurface ? "licensed" : "lite"}
      style={contentWidth ? { "--top-dock-content-width": contentWidth } as CSSProperties : undefined}
    >
      <div className="top-dock__bar">
        {renderGlassBackplate()}
        <NavigationMenu
          ref={setNavigationRef}
          className="top-dock__navigation"
          style={{ position: "static" }}
          aria-label="主导航"
          viewport={false}
        >
          <div className="top-dock__inner">
            <a className="top-dock__brand" href={homeHref} aria-label={logoAlt}>
              <img src={logoSrc} alt={logoAlt} />
            </a>
            <div className="top-dock__menu">
              <NavigationMenuList className="top-dock__list">
                {items.map((item) => (
                  <NavigationMenuItem className="top-dock__item" key={item.label}>
                    {item.groups?.length ? (
                      <>
                        <NavigationMenuTrigger className="top-dock__trigger">
                          {item.label}
                          <ChevronDown
                            className="top-dock__chevron"
                            aria-hidden="true"
                            focusable="false"
                            strokeWidth="1.5"
                          />
                        </NavigationMenuTrigger>
                        <NavigationMenuContent className="top-dock__panel">
                          <div className="top-dock__panel-inner">
                            {item.groups.map((group) => (
                              <section key={group.title}>
                                <h2 className="top-dock__group-title">{group.title}</h2>
                                <div className="top-dock__group-links">
                                  {group.links.map((link) => (
                                    <NavigationMenuLink asChild key={link.href}>
                                      <a href={link.href}>{link.label}</a>
                                    </NavigationMenuLink>
                                  ))}
                                </div>
                              </section>
                            ))}
                          </div>
                        </NavigationMenuContent>
                      </>
                    ) : item.href ? (
                      <NavigationMenuLink asChild>
                        <a className="top-dock__link" href={item.href}>{item.label}</a>
                      </NavigationMenuLink>
                    ) : null}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </div>
          </div>
          <NavigationMenuViewport className="top-dock__viewport">
            {renderGlassBackplate()}
          </NavigationMenuViewport>
        </NavigationMenu>
      </div>
    </header>
  );
}

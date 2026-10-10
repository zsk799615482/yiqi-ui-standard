<script setup lang="ts">
import { computed, ref, watchEffect, type Component } from "vue";
import {
  NavigationMenuRoot,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
} from "reka-ui";
import { ChevronDown } from "lucide-vue-next";
import { attachTopDockMotion } from "./top-dock-motion";
import { attachTopDockScroll, type TopDockScrollBehavior } from "./top-dock-scroll";
import "./top-dock.css";

type Group = { title: string; links: { label: string; href: string }[] };
type Item = { label: string; href?: string; groups?: Group[] };

const props = defineProps<{
  logoSrc: string;
  logoAlt: string;
  homeHref: string;
  items: Item[];
  theme?: "dark" | "light";
  contentWidth?: string;
  scrollBehavior?: TopDockScrollBehavior;
  glassMaterial?: Component;
}>();

const activeItem = ref("");
const viewport = ref<{ $el: HTMLElement } | null>(null);
const header = ref<HTMLElement | null>(null);
const visibleItems = computed(() =>
  props.items.filter((item) => item.groups?.length || item.href),
);
// Reka Slot removes its child's ref. Resolve its exposed $el after DOM mounting,
// and track replacement/unmount so observers and playback are always detached.
watchEffect((onCleanup) => {
  const element = viewport.value?.$el;
  if (element?.nodeType === 1) onCleanup(attachTopDockMotion(element));
}, { flush: "post" });
watchEffect((onCleanup) => {
  if (header.value) onCleanup(attachTopDockScroll(header.value, props.scrollBehavior ?? "smart"));
}, { flush: "post" });
</script>

<template>
  <header
    class="top-dock top-dock--vue"
    ref="header"
    :data-theme="theme"
    :data-scroll-behavior="scrollBehavior ?? 'smart'"
    :data-glass-source="glassMaterial || $slots.glassMaterial ? 'licensed' : 'lite'"
    :style="contentWidth ? { '--top-dock-content-width': contentWidth } : undefined"
  >
    <NavigationMenuRoot v-model="activeItem" class="top-dock__navigation" aria-label="主导航">
    <div class="top-dock__bar">
      <div class="top-dock__glass-layer" aria-hidden="true" inert>
        <slot name="glassMaterial" :theme="theme" surface="bar">
          <component :is="glassMaterial" v-if="glassMaterial" :theme="theme" surface="bar" />
        </slot>
      </div>
      <div class="top-dock__inner">
        <a class="top-dock__brand" :href="homeHref" :aria-label="logoAlt">
          <img :src="logoSrc" :alt="logoAlt" />
        </a>
        <div class="top-dock__menu">
          <NavigationMenuList class="top-dock__list">
            <NavigationMenuItem v-for="(item, index) in visibleItems" :key="item.label" :value="`item-${index}`" class="top-dock__item">
              <template v-if="item.groups?.length">
                <NavigationMenuTrigger type="button" class="top-dock__trigger">
                  {{ item.label }}
                  <ChevronDown class="top-dock__chevron" aria-hidden="true" />
                </NavigationMenuTrigger>
                <NavigationMenuContent class="top-dock__panel">
                  <div class="top-dock__panel-inner">
                    <section v-for="group in item.groups" :key="group.title" :aria-label="group.title">
                      <h2 class="top-dock__group-title">{{ group.title }}</h2>
                      <ul class="top-dock__group-links">
                        <li v-for="link in group.links" :key="link.href">
                        <NavigationMenuLink
                          :href="link.href"
                        >{{ link.label }}</NavigationMenuLink>
                        </li>
                      </ul>
                    </section>
                  </div>
                </NavigationMenuContent>
              </template>
              <NavigationMenuLink
                v-else-if="item.href"
                class="top-dock__link"
                :href="item.href"
              >{{ item.label }}</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </div>
      </div>
    </div>
    <!-- A persistent teleport target keeps content outside Reka List's positioned wrapper. -->
    <NavigationMenuViewport ref="viewport" as-child force-mount>
      <div class="top-dock__viewport" :hidden="!activeItem" :inert="!activeItem" :aria-hidden="!activeItem ? true : undefined">
        <div class="top-dock__glass-layer" aria-hidden="true" inert>
          <slot name="glassMaterial" :theme="theme" surface="panel">
            <component :is="glassMaterial" v-if="glassMaterial" :theme="theme" surface="panel" />
          </slot>
        </div>
      </div>
    </NavigationMenuViewport>
    </NavigationMenuRoot>
  </header>
</template>

<style scoped>
.top-dock__navigation { position: static; width: 100%; }
.top-dock__bar { position: relative; isolation: isolate; }
.top-dock__inner { position: relative; z-index: 1; }
.top-dock__menu > :deep(div) { width: 100%; }
.top-dock__viewport {
  inset-inline: 0;
  width: 100% !important;
  max-width: none !important;
  isolation: isolate;
}
.top-dock__viewport[hidden] { display: none !important; }
.top-dock__panel { position: relative; z-index: 1; }
.top-dock__group-links { list-style: none; padding: 0; margin: 0; }
.top-dock__glass-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.top-dock__glass-layer :deep(> *) { width: 100%; height: 100%; }
.top-dock--vue[data-glass-source="licensed"] :is(.top-dock__bar, .top-dock__viewport, .top-dock__panel) {
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .top-dock__glass-layer { display: none; }
  .top-dock--vue[data-glass-source="licensed"] :is(.top-dock__bar, .top-dock__viewport, .top-dock__panel) {
    background: var(--dock-solid);
  }
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .top-dock__glass-layer { display: none; }
  .top-dock--vue[data-glass-source="licensed"] :is(.top-dock__bar, .top-dock__viewport, .top-dock__panel) {
    background: var(--dock-solid);
  }
}
</style>

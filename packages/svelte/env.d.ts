/// <reference types="@open-slide/shared/env" />

declare module '*.svelte' {
  import type { Component } from 'svelte';

  const component: Component;
  export default component;
}

/// <reference types="@open-slide/core/env" />

declare module '*.svelte' {
  import type { Component } from 'svelte';

  const component: Component;
  export default component;
}

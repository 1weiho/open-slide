<script lang="ts">
import config from 'virtual:open-slide/config';
import { loadSlide, slideIds } from 'virtual:open-slide/slides';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type SlideModule } from '@open-slide/core';
import { onMount } from 'svelte';
import type { Page } from '../index.ts';

type Route =
  | { kind: 'home' }
  | { kind: 'slide'; slideId: string }
  | { kind: 'presenter'; slideId: string }
  | { kind: 'not-found' };

type DeckSummary = { id: string; title: string; pages: number };
type PresenterMessage = { type: 'page'; page: number };

let route = parseRoute();
let deck: SlideModule<Page> | null = null;
let deckSummaries: DeckSummary[] = [];
let pageIndex = 0;
let loading = false;
let error = '';
let inspectorOpen = false;
let viewport: HTMLElement;
let scale = 1;
let channel: BroadcastChannel | null = null;

$: activePage = deck?.default[pageIndex] ?? null;
$: nextPage = deck?.default[pageIndex + 1] ?? null;
$: pageCount = deck?.default.length ?? 0;
$: note = deck?.notes?.[pageIndex] ?? '';

function parseRoute(): Route {
  const base = (config.base ?? '/').replace(/\/$/, '');
  const pathname = window.location.pathname.slice(base.length) || '/';
  if (pathname === '/') return { kind: 'home' };
  const match = pathname.match(/^\/s\/([^/]+)(\/presenter)?\/?$/);
  if (!match) return { kind: 'not-found' };
  return {
    kind: match[2] ? 'presenter' : 'slide',
    slideId: decodeURIComponent(match[1]),
  };
}

function initialPage(): number {
  const raw = Number(new URLSearchParams(window.location.search).get('p') ?? '1');
  return Number.isFinite(raw) ? Math.max(0, raw - 1) : 0;
}

async function loadCurrentDeck(): Promise<void> {
  if (route.kind !== 'slide' && route.kind !== 'presenter') return;
  loading = true;
  error = '';
  try {
    deck = await loadSlide(route.slideId);
    pageIndex = Math.min(initialPage(), Math.max(0, deck.default.length - 1));
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
    deck = null;
  } finally {
    loading = false;
  }
}

async function loadSummaries(): Promise<void> {
  const summaries = await Promise.all(
    slideIds.map(async (id) => {
      try {
        const module = await loadSlide(id);
        return { id, title: module.meta?.title ?? id, pages: module.default.length };
      } catch {
        return { id, title: id, pages: 0 };
      }
    }),
  );
  deckSummaries = summaries;
}

function updateScale(): void {
  if (!viewport) return;
  scale = Math.min(viewport.clientWidth / CANVAS_WIDTH, viewport.clientHeight / CANVAS_HEIGHT);
}

function measure(node: HTMLElement): { destroy: () => void } {
  viewport = node;
  const observer = new ResizeObserver(updateScale);
  observer.observe(node);
  updateScale();
  return { destroy: () => observer.disconnect() };
}

function goToPage(next: number, broadcast = true): void {
  if (!deck || deck.default.length === 0) return;
  pageIndex = Math.max(0, Math.min(next, deck.default.length - 1));
  const url = new URL(window.location.href);
  url.searchParams.set('p', String(pageIndex + 1));
  window.history.replaceState({}, '', url);
  if (broadcast) channel?.postMessage({ type: 'page', page: pageIndex } satisfies PresenterMessage);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
    return;
  if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
    event.preventDefault();
    goToPage(pageIndex + 1);
  }
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault();
    goToPage(pageIndex - 1);
  }
  if (event.key.toLowerCase() === 'f') void document.documentElement.requestFullscreen();
  if (event.key.toLowerCase() === 'i' && route.kind === 'slide') inspectorOpen = !inspectorOpen;
  if (event.key === 'Escape' && inspectorOpen) inspectorOpen = false;
}

function openPresenter(): void {
  if (route.kind !== 'slide') return;
  const base = (config.base ?? '/').replace(/\/$/, '');
  window.open(
    `${base}/s/${encodeURIComponent(route.slideId)}/presenter?p=${pageIndex + 1}`,
    '_blank',
  );
}

function backHome(): void {
  const base = config.base ?? '/';
  window.location.assign(base);
}

onMount(() => {
  void loadCurrentDeck();
  if (route.kind === 'home') void loadSummaries();

  const channelName =
    route.kind === 'slide' || route.kind === 'presenter' ? `open-slide:${route.slideId}` : null;
  if (channelName) {
    channel = new BroadcastChannel(channelName);
    channel.onmessage = (event: MessageEvent<PresenterMessage>) => {
      if (event.data?.type === 'page') goToPage(event.data.page, false);
    };
  }

  window.addEventListener('keydown', onKeydown);

  return () => {
    channel?.close();
    window.removeEventListener('keydown', onKeydown);
  };
});
</script>

{#if route.kind === 'home'}
  <main class="home-shell">
    <header class="home-header">
      <div>
        <p class="eyebrow">open-slide · svelte</p>
        <h1>Your slides</h1>
      </div>
      <p class="version">v{config.version}</p>
    </header>

    {#if deckSummaries.length > 0}
      <section class="deck-grid" aria-label="Slides">
        {#each deckSummaries as summary}
          <a class="deck-card" href={`./s/${encodeURIComponent(summary.id)}`}>
            <div class="deck-preview">
              <span>{summary.title.slice(0, 1).toUpperCase()}</span>
            </div>
            <div class="deck-meta">
              <strong>{summary.title}</strong>
              <span>{summary.pages} {summary.pages === 1 ? 'page' : 'pages'}</span>
            </div>
          </a>
        {/each}
      </section>
    {:else}
      <section class="empty-state">
        <p class="eyebrow">No slides yet</p>
        <h2>Add a deck under <code>slides/&lt;id&gt;/index.ts</code></h2>
      </section>
    {/if}
  </main>
{:else if route.kind === 'not-found'}
  <main class="centered-state">
    <p class="eyebrow">404</p>
    <h1>That page does not exist.</h1>
    <button class="button" onclick={backHome}>Back home</button>
  </main>
{:else if loading}
  <main class="centered-state" aria-live="polite">
    <div class="loading-line"></div>
    <p>Loading slide…</p>
  </main>
{:else if error || !deck || !activePage}
  <main class="centered-state">
    <p class="eyebrow">Unable to load slide</p>
    <h1>{error || 'This deck has no pages.'}</h1>
    <button class="button" onclick={backHome}>Back home</button>
  </main>
{:else if route.kind === 'presenter'}
  <main class="presenter-shell">
    <section class="presenter-stage">
    <div class="presenter-current" use:measure>
        <div
          class="canvas"
          style={`transform: translate(-50%, -50%) scale(${scale});`}
        >
          <svelte:component this={activePage} />
        </div>
      </div>
      <div class="presenter-next">
        {#if nextPage}
          <div class="mini-canvas">
            <svelte:component this={nextPage} />
          </div>
        {:else}
          <div class="end-card">End of deck</div>
        {/if}
      </div>
    </section>
    <aside class="presenter-notes">
      <div class="presenter-count">{pageIndex + 1} / {pageCount}</div>
      <h2>Speaker notes</h2>
      <p>{note || 'No notes for this page.'}</p>
      <div class="presenter-actions">
        <button class="button" onclick={() => goToPage(pageIndex - 1)} disabled={pageIndex === 0}>Previous</button>
        <button class="button primary" onclick={() => goToPage(pageIndex + 1)} disabled={pageIndex === pageCount - 1}>Next</button>
      </div>
    </aside>
  </main>
{:else}
  <main class:with-inspector={inspectorOpen} class="viewer-shell">
    <header class="viewer-bar">
      <button class="icon-button" onclick={backHome} aria-label="Back home">←</button>
      <div class="viewer-title">
        <strong>{deck.meta?.title ?? route.slideId}</strong>
        <span>{pageIndex + 1} / {pageCount}</span>
      </div>
      <div class="viewer-actions">
        <button class="button subtle" onclick={() => (inspectorOpen = !inspectorOpen)}>Inspector</button>
        <button class="button" onclick={openPresenter}>Presenter</button>
        <button class="button primary" onclick={() => document.documentElement.requestFullscreen()}>Present</button>
      </div>
    </header>

    <div class="viewer-body">
      <nav class="thumbnail-rail" aria-label="Pages">
        {#each deck.default as PageComponent, index}
          <button
            class:active={index === pageIndex}
            class="thumbnail"
            onclick={() => goToPage(index)}
            aria-label={`Go to page ${index + 1}`}
          >
            <span>{index + 1}</span>
            <div class="thumbnail-canvas">
              <svelte:component this={PageComponent} />
            </div>
          </button>
        {/each}
      </nav>

      <section class="viewport" use:measure aria-label={`Page ${pageIndex + 1}`}>
        <div class="canvas" style={`transform: translate(-50%, -50%) scale(${scale});`}>
          <svelte:component this={activePage} />
        </div>
        <button class="page-hit prev" onclick={() => goToPage(pageIndex - 1)} aria-label="Previous page"></button>
        <button class="page-hit next" onclick={() => goToPage(pageIndex + 1)} aria-label="Next page"></button>
      </section>

      {#if inspectorOpen}
        <aside class="inspector">
          <div class="inspector-heading">
            <div>
              <p class="eyebrow">Inspector</p>
              <h2>Page {pageIndex + 1}</h2>
            </div>
            <button class="icon-button" onclick={() => (inspectorOpen = false)} aria-label="Close inspector">×</button>
          </div>
          <dl>
            <div><dt>Deck</dt><dd>{deck.meta?.title ?? route.slideId}</dd></div>
            <div><dt>Theme</dt><dd>{deck.meta?.theme ?? 'Default'}</dd></div>
            <div><dt>Canvas</dt><dd>{CANVAS_WIDTH} × {CANVAS_HEIGHT}</dd></div>
          </dl>
          <section class="notes-card">
            <p class="eyebrow">Speaker notes</p>
            <p>{note || 'No notes for this page.'}</p>
          </section>
        </aside>
      {/if}
    </div>
  </main>
{/if}

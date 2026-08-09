<script lang="ts">
import config from 'virtual:open-slide/config';
import folderManifest from 'virtual:open-slide/folders';
import { loadSlide, slideCreatedAt, slideIds, slideThemes } from 'virtual:open-slide/slides';
import { loadThemeDemo, themes } from 'virtual:open-slide/themes';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  cssVarsToString,
  type DesignSystem,
  designToCssVars,
  type EntryDirection,
  type FoldersManifest,
  type SlideModule,
  type StepAggregate,
  type StepController,
} from '@open-slide/shared';
import {
  type AssetEntry,
  deleteAsset,
  listAssets,
  renameAsset,
  uploadAsset,
} from '@open-slide/shared/client';
import { en, ja, type Locale, zhCN, zhTW } from '@open-slide/shared/locale';
import { onMount } from 'svelte';
import type { Page } from '../index.ts';
import { exportHtml, exportPdf } from './export.ts';
import StepHost from './StepHost.svelte';

type Route =
  | { kind: 'home' }
  | { kind: 'themes' }
  | { kind: 'theme'; themeId: string }
  | { kind: 'assets' }
  | { kind: 'slide'; slideId: string }
  | { kind: 'presenter'; slideId: string }
  | { kind: 'not-found' };

type DeckSummary = {
  id: string;
  title: string;
  pages: number;
  theme?: string;
  createdAt: number;
};
type PresenterMessage =
  | { type: 'hello' }
  | { type: 'advance' }
  | { type: 'retreat' }
  | { type: 'page'; page: number }
  | { type: 'steps'; revealed: number; stepCount: number }
  | { type: 'blackout'; value: 'black' | 'white' | null }
  | {
      type: 'state';
      page: number;
      blackout: 'black' | 'white' | null;
      revealed: number;
      stepCount: number;
    };
type SortKey = 'created-desc' | 'created-asc' | 'title-asc' | 'title-desc';
type Appearance = 'light' | 'dark' | 'system';
type SelectedElement = {
  file: string;
  line: number;
  column: number;
  tag: string;
  text: string;
};

const locales: Record<Locale['id'], Locale> = { en, ja, 'zh-CN': zhCN, 'zh-TW': zhTW };

let route = parseRoute();
let deck: SlideModule<Page> | null = null;
let deckSummaries: DeckSummary[] = [];
let folders: FoldersManifest = structuredClone(folderManifest);
let searchQuery = '';
let sortKey: SortKey = 'created-desc';
let selectedFolder = 'all';
let creatingFolder = false;
let newFolderName = '';
let commandOpen = false;
let commandQuery = '';
let appearance: Appearance = 'system';
let localeId: Locale['id'] = 'en';
let themeModule: SlideModule<Page> | null = null;
let themePageIndex = 0;
let themePromptOpen = false;
let assetScope = '@global';
let assets: AssetEntry[] = [];
let assetsLoading = false;
let assetSearch = '';
let assetError = '';
let notesDraft = '';
let notesSaving = false;
let exporting = false;
let designDraft: DesignSystem | null = null;
let designWarning = '';
let selectedElement: SelectedElement | null = null;
let elementSaving = false;
let pageIndex = 0;
let entryDirection: EntryDirection = 'jump';
let stepController: StepController | null = null;
let stepAggregate: StepAggregate = { revealed: 0, stepCount: 0 };
let loading = false;
let error = '';
let inspectorOpen = sessionStorage.getItem('open-slide:inspector-open') === 'true';
let presenting = false;
let overviewOpen = false;
let overviewIndex = 0;
let helpOpen = false;
let blackout: 'black' | 'white' | null = null;
let laserEnabled = false;
let laserX = 0;
let laserY = 0;
let jumpDigits = '';
let viewport: HTMLElement;
let scale = 1;
let channel: BroadcastChannel | null = null;
let presenterLinked = false;
let remoteStepRevealed = 0;
let remoteStepCount = 0;
let lastWheelAt = 0;
let touchStartX: number | null = null;

$: activePage = deck?.default[pageIndex] ?? null;
$: activeTransition = activePage?.transition ?? deck?.transition;
$: nextPage = deck?.default[pageIndex + 1] ?? null;
$: pageCount = deck?.default.length ?? 0;
$: note = deck?.notes?.[pageIndex] ?? '';
$: currentSlideId = route.kind === 'slide' || route.kind === 'presenter' ? route.slideId : '';
$: locale = locales[localeId];
$: selectedTheme =
  route.kind === 'theme' ? themes.find((theme) => theme.id === route.themeId) : null;
$: themePage = themeModule?.default[themePageIndex] ?? null;
$: visibleSummaries = deckSummaries.filter((summary) => {
  const folderMatches =
    selectedFolder === 'all'
      ? true
      : selectedFolder === 'draft'
        ? !folders.assignments[summary.id]
        : folders.assignments[summary.id] === selectedFolder;
  if (!folderMatches) return false;
  const query = searchQuery.trim().toLowerCase();
  return (
    !query ||
    summary.id.toLowerCase().includes(query) ||
    summary.title.toLowerCase().includes(query)
  );
});
$: sortedSummaries = visibleSummaries.slice().sort((a, b) => {
  if (sortKey === 'title-asc') return a.title.localeCompare(b.title);
  if (sortKey === 'title-desc') return b.title.localeCompare(a.title);
  if (sortKey === 'created-asc') return a.createdAt - b.createdAt;
  return b.createdAt - a.createdAt;
});
$: commandDecks = deckSummaries.filter((summary) => {
  const query = commandQuery.trim().toLowerCase();
  return (
    !query ||
    summary.id.toLowerCase().includes(query) ||
    summary.title.toLowerCase().includes(query)
  );
});
$: commandPageIndexes = commandQuery.trim()
  ? Array.from({ length: pageCount }, (_, index) => index).filter((index) =>
      `page ${index + 1}`.includes(commandQuery.trim().toLowerCase()),
    )
  : [];
$: visibleAssets = assets.filter((asset) =>
  asset.name.toLowerCase().includes(assetSearch.trim().toLowerCase()),
);
$: designCss = deck?.design ? cssVarsToString(designToCssVars(deck.design)) : '';

function parseRoute(): Route {
  const base = (config.base ?? '/').replace(/\/$/, '');
  const pathname = window.location.pathname.slice(base.length) || '/';
  if (pathname === '/') return { kind: 'home' };
  if (pathname === '/themes' || pathname === '/themes/') return { kind: 'themes' };
  if (pathname === '/assets' || pathname === '/assets/') return { kind: 'assets' };
  const themeMatch = pathname.match(/^\/themes\/([^/]+)\/?$/);
  if (themeMatch) return { kind: 'theme', themeId: decodeURIComponent(themeMatch[1]) };
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
    notesDraft = deck.notes?.[pageIndex] ?? '';
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
        return {
          id,
          title: module.meta?.title ?? id,
          pages: module.default.length,
          theme: module.meta?.theme ?? slideThemes[id],
          createdAt: slideCreatedAt[id] ?? (Date.parse(module.meta?.createdAt ?? '') || 0),
        };
      } catch {
        return { id, title: id, pages: 0, createdAt: slideCreatedAt[id] ?? 0 };
      }
    }),
  );
  deckSummaries = summaries;
}

async function loadCurrentTheme(): Promise<void> {
  if (route.kind !== 'theme' || !selectedTheme?.hasDemo) return;
  try {
    themeModule = await loadThemeDemo(route.themeId);
  } catch {
    themeModule = null;
  }
}

function applyAppearance(next: Appearance): void {
  appearance = next;
  localStorage.setItem('open-slide:appearance', next);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle(
    'dark',
    next === 'dark' || (next === 'system' && prefersDark),
  );
}

function applyCommandAppearance(next: Appearance): void {
  applyAppearance(next);
  commandOpen = false;
}

function applyLocale(next: Locale['id']): void {
  localeId = next;
  localStorage.setItem('open-slide:locale', next);
}

function applySort(next: SortKey): void {
  sortKey = next;
  localStorage.setItem('open-slide:home-sort', next);
}

async function createFolder(): Promise<void> {
  const name = newFolderName.trim();
  if (!name) return;
  const response = await fetch('/__folders/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, icon: { type: 'emoji', value: '📁' } }),
  });
  if (!response.ok) return;
  const folder = (await response.json()) as FoldersManifest['folders'][number];
  folders = { ...folders, folders: [...folders.folders, folder] };
  selectedFolder = folder.id;
  newFolderName = '';
  creatingFolder = false;
}

async function deleteFolder(folderId: string): Promise<void> {
  const response = await fetch(`/__folders/${encodeURIComponent(folderId)}`, { method: 'DELETE' });
  if (!response.ok) return;
  folders = {
    folders: folders.folders.filter((folder) => folder.id !== folderId),
    assignments: Object.fromEntries(
      Object.entries(folders.assignments).filter(([, assigned]) => assigned !== folderId),
    ),
  };
  if (selectedFolder === folderId) selectedFolder = 'all';
}

async function assignSlide(slideId: string, folderId: string | null): Promise<void> {
  const response = await fetch('/__folders/assign', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slideId, folderId }),
  });
  if (!response.ok) return;
  const assignments = { ...folders.assignments };
  if (folderId) assignments[slideId] = folderId;
  else delete assignments[slideId];
  folders = { ...folders, assignments };
}

async function renameSlide(summary: DeckSummary): Promise<void> {
  const name = window.prompt('Slide name', summary.title)?.trim();
  if (!name || name === summary.title) return;
  const response = await fetch(`/__slides/${encodeURIComponent(summary.id)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (response.ok) {
    deckSummaries = deckSummaries.map((candidate) =>
      candidate.id === summary.id ? { ...candidate, title: name } : candidate,
    );
  }
}

async function duplicateSlide(summary: DeckSummary): Promise<void> {
  const newId = window.prompt('New slide id', `${summary.id}-copy`)?.trim();
  if (!newId) return;
  const response = await fetch(`/__slides/${encodeURIComponent(summary.id)}/duplicate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ newId }),
  });
  if (!response.ok) return;
  const body = (await response.json()) as { slideId: string };
  deckSummaries = [
    ...deckSummaries,
    { ...summary, id: body.slideId, title: `${summary.title} Copy`, createdAt: Date.now() },
  ];
}

async function removeSlide(summary: DeckSummary): Promise<void> {
  if (!window.confirm(`Delete ${summary.title}?`)) return;
  const response = await fetch(`/__slides/${encodeURIComponent(summary.id)}`, {
    method: 'DELETE',
  });
  if (!response.ok) return;
  deckSummaries = deckSummaries.filter((candidate) => candidate.id !== summary.id);
  const assignments = { ...folders.assignments };
  delete assignments[summary.id];
  folders = { ...folders, assignments };
}

async function reorderPage(target: number): Promise<void> {
  if (!deck || !currentSlideId || target < 0 || target >= pageCount || target === pageIndex) return;
  const order = Array.from({ length: pageCount }, (_, index) => index);
  [order[pageIndex], order[target]] = [order[target], order[pageIndex]];
  const response = await fetch(`/__slides/${encodeURIComponent(currentSlideId)}/reorder`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ order }),
  });
  if (!response.ok) return;
  const pages = order.map((index) => deck!.default[index]);
  const notes = order.map((index) => deck!.notes?.[index]);
  deck = { ...deck, default: pages, notes };
  goToPage(target);
}

async function duplicatePage(): Promise<void> {
  if (!deck || !currentSlideId) return;
  const response = await fetch(
    `/__slides/${encodeURIComponent(currentSlideId)}/pages/${pageIndex}/duplicate`,
    { method: 'POST' },
  );
  if (!response.ok) return;
  const pages = [...deck.default];
  pages.splice(pageIndex + 1, 0, pages[pageIndex]);
  const notes = [...(deck.notes ?? [])];
  notes.splice(pageIndex + 1, 0, notes[pageIndex]);
  deck = { ...deck, default: pages, notes };
  goToPage(pageIndex + 1);
}

async function deletePage(): Promise<void> {
  if (!deck || !currentSlideId || pageCount <= 1) return;
  if (!window.confirm(`Delete page ${pageIndex + 1}?`)) return;
  const response = await fetch(
    `/__slides/${encodeURIComponent(currentSlideId)}/pages/${pageIndex}`,
    { method: 'DELETE' },
  );
  if (!response.ok) return;
  const pages = [...deck.default];
  const notes = [...(deck.notes ?? [])];
  pages.splice(pageIndex, 1);
  notes.splice(pageIndex, 1);
  deck = { ...deck, default: pages, notes };
  goToPage(Math.min(pageIndex, pages.length - 1));
}

function navigate(pathname: string): void {
  const base = (config.base ?? '/').replace(/\/$/, '');
  window.location.assign(`${base}${pathname}` || '/');
}

function focus(node: HTMLElement): void {
  queueMicrotask(() => node.focus());
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
  const target = Math.max(0, Math.min(next, deck.default.length - 1));
  entryDirection = target > pageIndex ? 'forward' : target < pageIndex ? 'backward' : 'jump';
  pageIndex = target;
  selectedElement = null;
  notesDraft = deck.notes?.[pageIndex] ?? '';
  const url = new URL(window.location.href);
  url.searchParams.set('p', String(pageIndex + 1));
  window.history.replaceState({}, '', url);
  if (broadcast) channel?.postMessage({ type: 'page', page: pageIndex } satisfies PresenterMessage);
}

async function saveNotes(): Promise<void> {
  if (!deck || !currentSlideId) return;
  notesSaving = true;
  const response = await fetch('/__notes', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slideId: currentSlideId, index: pageIndex, text: notesDraft }),
  });
  if (response.ok) {
    const next = [...(deck.notes ?? [])];
    next[pageIndex] = notesDraft || undefined;
    deck = { ...deck, notes: next };
  }
  notesSaving = false;
}

async function loadDesign(): Promise<void> {
  if (!currentSlideId) return;
  const response = await fetch(`/__design?slideId=${encodeURIComponent(currentSlideId)}`);
  if (!response.ok) return;
  const body = (await response.json()) as { design: DesignSystem; warning?: string | null };
  designDraft = body.design;
  designWarning = body.warning ?? '';
}

async function saveDesign(patch: Partial<DesignSystem>): Promise<void> {
  if (!currentSlideId) return;
  const response = await fetch(`/__design?slideId=${encodeURIComponent(currentSlideId)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ patch }),
  });
  const body = (await response.json()) as { design?: DesignSystem; error?: string };
  if (!response.ok || !body.design) {
    designWarning = body.error ?? `Save failed (${response.status}).`;
    return;
  }
  designDraft = body.design;
  if (deck) deck = { ...deck, design: body.design };
  designWarning = '';
}

function toggleInspector(): void {
  setInspectorOpen(!inspectorOpen);
  if (inspectorOpen && !designDraft) void loadDesign();
}

function setInspectorOpen(open: boolean): void {
  inspectorOpen = open;
  sessionStorage.setItem('open-slide:inspector-open', String(open));
}

function inspectElement(event: Event): void {
  if (!inspectorOpen || !(event.target instanceof Element)) return;
  const element = event.target.closest<HTMLElement>('[data-osd-loc][data-osd-file]');
  if (!element) return;
  event.preventDefault();
  event.stopPropagation();
  const [line, column] = (element.dataset.osdLoc ?? '').split(':').map(Number);
  if (!Number.isInteger(line) || !Number.isInteger(column) || !element.dataset.osdFile) return;
  selectedElement = {
    file: element.dataset.osdFile,
    line,
    column,
    tag: element.tagName.toLowerCase(),
    text: element.textContent?.trim() ?? '',
  };
}

async function saveSelectedElement(): Promise<void> {
  if (!selectedElement) return;
  elementSaving = true;
  const response = await fetch('/__svelte-edit', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(selectedElement),
  });
  elementSaving = false;
  if (!response.ok) designWarning = `Element edit failed (${response.status}).`;
}

async function runExport(format: 'html' | 'pdf'): Promise<void> {
  if (!deck || !currentSlideId || exporting) return;
  exporting = true;
  try {
    if (format === 'html') await exportHtml(deck, currentSlideId);
    else await exportPdf(deck, currentSlideId);
  } finally {
    exporting = false;
  }
}

async function loadAssets(): Promise<void> {
  assetsLoading = true;
  assetError = '';
  try {
    assets = await listAssets(assetScope);
  } catch (caught) {
    assets = [];
    assetError = caught instanceof Error ? caught.message : String(caught);
  } finally {
    assetsLoading = false;
  }
}

async function addAsset(file: File): Promise<void> {
  const response = await uploadAsset(assetScope, file);
  if (response.status === 409) {
    assetError = `${file.name} already exists.`;
    return;
  }
  if (!response.ok) {
    assetError = `Upload failed (${response.status}).`;
    return;
  }
  await loadAssets();
}

async function removeAsset(name: string): Promise<void> {
  const response = await deleteAsset(assetScope, name);
  if (response.ok) assets = assets.filter((asset) => asset.name !== name);
}

async function changeAssetName(from: string, to: string): Promise<void> {
  const name = to.trim();
  if (!name || name === from) return;
  const response = await renameAsset(assetScope, from, name);
  if (response.ok) await loadAssets();
}

function advance(): void {
  if (stepController?.advance()) return;
  goToPage(pageIndex + 1);
}

function updateStepController(controller: StepController, mounted: boolean): void {
  if (mounted) stepController = controller;
  else if (stepController === controller) stepController = null;
}

function updateStepAggregate(controller: StepController, aggregate: StepAggregate): void {
  if (stepController !== controller) return;
  stepAggregate = aggregate;
  if (route.kind === 'slide' && presenting) {
    channel?.postMessage({ type: 'steps', ...aggregate } satisfies PresenterMessage);
  }
}

function retreat(): void {
  if (stepController?.retreat()) return;
  goToPage(pageIndex - 1);
}

function openOverview(): void {
  overviewIndex = pageIndex;
  overviewOpen = true;
}

function closeTransientOverlays(): boolean {
  if (overviewOpen) {
    overviewOpen = false;
    return true;
  }
  if (helpOpen) {
    helpOpen = false;
    return true;
  }
  if (blackout) {
    blackout = null;
    channel?.postMessage({ type: 'blackout', value: null });
    return true;
  }
  return false;
}

function enterPresentMode(): void {
  presenting = true;
  setInspectorOpen(false);
}

function onWheel(event: WheelEvent): void {
  const now = Date.now();
  if (now - lastWheelAt < 350 || Math.abs(event.deltaY) < 30) return;
  lastWheelAt = now;
  if (event.deltaY > 0) advance();
  else retreat();
}

function onPointerMove(event: MouseEvent): void {
  laserX = event.clientX;
  laserY = event.clientY;
}

function onTouchStart(event: TouchEvent): void {
  touchStartX = event.touches[0]?.clientX ?? null;
}

function onTouchEnd(event: TouchEvent): void {
  if (touchStartX === null) return;
  const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
  touchStartX = null;
  if (Math.abs(delta) < 50) return;
  if (delta < 0) advance();
  else retreat();
}

function toggleBlackout(value: 'black' | 'white'): void {
  blackout = blackout === value ? null : value;
  channel?.postMessage({ type: 'blackout', value: blackout });
}

function onKeydown(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    commandOpen = !commandOpen;
    return;
  }
  if (commandOpen && event.key === 'Escape') {
    commandOpen = false;
    return;
  }
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
    return;
  if (event.key === '/' && !presenting) {
    event.preventDefault();
    commandOpen = true;
    return;
  }
  if (overviewOpen) {
    if (event.key === 'Escape' || event.key.toLowerCase() === 'o') overviewOpen = false;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      overviewIndex = Math.min(pageCount - 1, overviewIndex + 1);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      overviewIndex = Math.max(0, overviewIndex - 1);
    }
    if (event.key === 'Enter') {
      goToPage(overviewIndex);
      overviewOpen = false;
    }
    return;
  }

  if (presenting && /^\d$/.test(event.key)) {
    jumpDigits = `${jumpDigits}${event.key}`.replace(/^0+/, '').slice(0, 3);
    return;
  }
  if (presenting && event.key === 'Enter' && jumpDigits) {
    goToPage(Number(jumpDigits) - 1);
    jumpDigits = '';
    return;
  }
  if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
    event.preventDefault();
    advance();
  }
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault();
    retreat();
  }
  if (presenting && event.key === 'Home') goToPage(0);
  if (presenting && event.key === 'End') goToPage(pageCount - 1);
  if (event.key === 'Enter' && route.kind === 'slide' && !presenting) enterPresentMode();
  if (event.key.toLowerCase() === 'o') openOverview();
  if (presenting && event.key.toLowerCase() === 'b') toggleBlackout('black');
  if (presenting && event.key.toLowerCase() === 'w') toggleBlackout('white');
  if (presenting && event.key.toLowerCase() === 'l') laserEnabled = !laserEnabled;
  if (presenting && event.key === '?') helpOpen = !helpOpen;
  if (presenting && event.key.toLowerCase() === 'p') openPresenter();
  if (event.key.toLowerCase() === 'f') void document.documentElement.requestFullscreen();
  if (event.key.toLowerCase() === 'i' && route.kind === 'slide') toggleInspector();
  if (event.key === 'Escape') {
    if (closeTransientOverlays()) return;
    if (presenting) {
      presenting = false;
      laserEnabled = false;
      jumpDigits = '';
      return;
    }
    if (inspectorOpen) setInspectorOpen(false);
  }
}

function openPresenter(): void {
  if (route.kind !== 'slide') return;
  const base = (config.base ?? '/').replace(/\/$/, '');
  window.open(
    `${base}/s/${encodeURIComponent(route.slideId)}/presenter?p=${pageIndex + 1}`,
    '_blank',
  );
}

function presenterAdvance(): void {
  if (presenterLinked) channel?.postMessage({ type: 'advance' } satisfies PresenterMessage);
  else advance();
}

function presenterRetreat(): void {
  if (presenterLinked) channel?.postMessage({ type: 'retreat' } satisfies PresenterMessage);
  else retreat();
}

function backHome(): void {
  const base = config.base ?? '/';
  window.location.assign(base);
}

onMount(() => {
  void loadCurrentDeck();
  if (route.kind === 'home') void loadSummaries();
  if (route.kind === 'assets') {
    void loadSummaries();
    void loadAssets();
  }
  if (route.kind === 'theme') void loadCurrentTheme();

  const storedLocale = localStorage.getItem('open-slide:locale');
  const seededLocale = storedLocale ?? config.locale?.id;
  if (seededLocale && seededLocale in locales) localeId = seededLocale as Locale['id'];
  const storedAppearance = localStorage.getItem('open-slide:appearance');
  applyAppearance(
    storedAppearance === 'light' || storedAppearance === 'dark' ? storedAppearance : 'system',
  );
  const storedSort = localStorage.getItem('open-slide:home-sort');
  if (storedSort === 'created-asc' || storedSort === 'title-asc' || storedSort === 'title-desc') {
    sortKey = storedSort;
  }

  const channelName =
    route.kind === 'slide' || route.kind === 'presenter' ? `open-slide:${route.slideId}` : null;
  if (channelName) {
    channel = new BroadcastChannel(channelName);
    channel.onmessage = (event: MessageEvent<PresenterMessage>) => {
      if (event.data?.type === 'hello' && route.kind === 'slide') {
        presenterLinked = true;
        channel?.postMessage({
          type: 'state',
          page: pageIndex,
          blackout,
          revealed: stepAggregate.revealed,
          stepCount: stepAggregate.stepCount,
        } satisfies PresenterMessage);
      }
      if (event.data?.type === 'state' && route.kind === 'presenter') {
        presenterLinked = true;
        blackout = event.data.blackout;
        remoteStepRevealed = event.data.revealed;
        remoteStepCount = event.data.stepCount;
        goToPage(event.data.page, false);
      }
      if (event.data?.type === 'advance' && route.kind === 'slide') advance();
      if (event.data?.type === 'retreat' && route.kind === 'slide') retreat();
      if (event.data?.type === 'page') {
        presenterLinked = true;
        remoteStepRevealed = 0;
        remoteStepCount = 0;
        goToPage(event.data.page, false);
      }
      if (event.data?.type === 'steps') {
        presenterLinked = true;
        remoteStepRevealed = event.data.revealed;
        remoteStepCount = event.data.stepCount;
      }
      if (event.data?.type === 'blackout') {
        presenterLinked = true;
        blackout = event.data.value;
      }
    };
    if (route.kind === 'presenter')
      channel.postMessage({ type: 'hello' } satisfies PresenterMessage);
  }

  window.addEventListener('keydown', onKeydown);

  return () => {
    channel?.close();
    window.removeEventListener('keydown', onKeydown);
  };
});
</script>

{#if route.kind === 'home'}
  <main class="home-shell home-layout">
    <aside class="home-sidebar">
      <a class="home-brand" href={config.base ?? '/'}>open-slide</a>
      <nav aria-label={locale.home.folders}>
        <button class:active={selectedFolder === 'all'} onclick={() => (selectedFolder = 'all')}>
          <span>🎞️</span><span>{locale.home.slides}</span><small>{deckSummaries.length}</small>
        </button>
        <button class:active={selectedFolder === 'draft'} onclick={() => (selectedFolder = 'draft')}>
          <span>📝</span><span>{locale.home.draft}</span><small>{deckSummaries.filter((summary) => !folders.assignments[summary.id]).length}</small>
        </button>
        {#each folders.folders as folder}
          <div class="folder-row">
            <button class:active={selectedFolder === folder.id} onclick={() => (selectedFolder = folder.id)}>
              <span>{folder.icon.type === 'emoji' ? folder.icon.value : '●'}</span><span>{folder.name}</span><small>{deckSummaries.filter((summary) => folders.assignments[summary.id] === folder.id).length}</small>
            </button>
            <button class="folder-delete" aria-label={`Delete ${folder.name}`} onclick={() => deleteFolder(folder.id)}>×</button>
          </div>
        {/each}
      </nav>
      {#if creatingFolder}
        <div class="new-folder-form">
          <input
            use:focus
            placeholder={locale.home.folderName}
            bind:value={newFolderName}
            onkeydown={(event) => {
              if (event.key === 'Enter') void createFolder();
              if (event.key === 'Escape') creatingFolder = false;
            }}
          />
          <button class="button" onclick={() => createFolder()}>{locale.common.add}</button>
        </div>
      {:else}
        <button class="new-folder-button" onclick={() => (creatingFolder = true)}>＋ {locale.home.newFolder}</button>
      {/if}
      <div class="sidebar-spacer"></div>
      <a class="sidebar-link" href="./themes">🎨 {locale.home.themes}</a>
      <a class="sidebar-link" href="./assets">🗂 Assets</a>
      <button class="sidebar-link" onclick={() => (commandOpen = true)}>⌘ {locale.home.menu}</button>
      <div class="preference-row">
        <select
          aria-label="Change language"
          value={localeId}
          onchange={(event) => applyLocale(event.currentTarget.value as Locale['id'])}
        >
          <option value="en">English</option>
          <option value="zh-TW">繁體中文</option>
          <option value="zh-CN">简体中文</option>
          <option value="ja">日本語</option>
        </select>
        <select
          aria-label="Toggle theme"
          value={appearance}
          onchange={(event) => applyAppearance(event.currentTarget.value as Appearance)}
        >
          <option value="system">{locale.common.system}</option>
          <option value="light">{locale.common.light}</option>
          <option value="dark">{locale.common.dark}</option>
        </select>
      </div>
      <p class="version">v{config.version}</p>
    </aside>

    <section class="home-content">
      <header class="home-header">
        <div>
          <p class="eyebrow">open-slide · svelte</p>
          <h1>
            {selectedFolder === 'all'
              ? locale.home.slides
              : selectedFolder === 'draft'
                ? locale.home.draft
                : folders.folders.find((folder) => folder.id === selectedFolder)?.name ?? locale.home.slides}
          </h1>
        </div>
        <div class="home-tools">
          <select
            aria-label={locale.home.sortLabel}
            value={sortKey}
            onchange={(event) => applySort(event.currentTarget.value as SortKey)}
          >
            <option value="created-desc">{locale.home.sortByCreatedDesc}</option>
            <option value="created-asc">{locale.home.sortByCreatedAsc}</option>
            <option value="title-asc">{locale.home.sortByTitleAsc}</option>
            <option value="title-desc">{locale.home.sortByTitleDesc}</option>
          </select>
          <div class="search-field">
            <input placeholder={locale.home.searchPlaceholder} bind:value={searchQuery} />
            {#if searchQuery}
              <button aria-label={locale.home.clearSearch} onclick={() => (searchQuery = '')}>×</button>
            {/if}
          </div>
          <button class="icon-button" aria-label="Open command menu" onclick={() => (commandOpen = true)}>⌘</button>
        </div>
      </header>

      {#if deckSummaries.length === 0}
        <section class="empty-state">
          <p class="eyebrow">{locale.home.noSlidesYet}</p>
          <h2>Add a deck under <code>slides/&lt;id&gt;/index.ts</code></h2>
        </section>
      {:else if sortedSummaries.length === 0}
        <section class="empty-state">
          <p class="eyebrow">{locale.home.noMatches}</p>
          <h2>{locale.home.nothingMatchesPrefix}<strong>{searchQuery}</strong>.</h2>
        </section>
      {:else}
        <ul class="deck-grid" aria-label={locale.home.slides}>
          {#each sortedSummaries as summary}
            <li>
              <a class="deck-card" href={`./s/${encodeURIComponent(summary.id)}`} aria-label={summary.title}>
                <div class="deck-preview">
                  <span>{summary.title.slice(0, 1).toUpperCase()}</span>
                </div>
                <div class="deck-meta">
                  <h3>{summary.title}</h3>
                  <span>{summary.pages} {summary.pages === 1 ? 'page' : 'pages'}</span>
                </div>
              </a>
              <div class="deck-actions">
                {#if summary.theme}
                  <a href={`./themes/${encodeURIComponent(summary.theme)}`}>{summary.theme}</a>
                {/if}
                <select
                  aria-label={`Move ${summary.title} to folder`}
                  value={folders.assignments[summary.id] ?? ''}
                  onchange={(event) => assignSlide(summary.id, event.currentTarget.value || null)}
                >
                  <option value="">{locale.home.draft}</option>
                  {#each folders.folders as folder}<option value={folder.id}>{folder.name}</option>{/each}
                </select>
                <button aria-label={`Rename ${summary.title}`} onclick={() => renameSlide(summary)}>Rename</button>
                <button aria-label={`Duplicate ${summary.title}`} onclick={() => duplicateSlide(summary)}>Duplicate</button>
                <button aria-label={`Delete ${summary.title}`} onclick={() => removeSlide(summary)}>Delete</button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </main>
{:else if route.kind === 'themes'}
  <main class="home-shell themes-shell">
    <header class="home-header">
      <div><p class="eyebrow">open-slide</p><h1>{locale.themes.title}</h1></div>
      <button class="button" onclick={backHome}>{locale.common.backToHome}</button>
    </header>
    <ul class="themes-grid">
      {#each themes as theme}
        <li><a class="theme-card" href={`./themes/${encodeURIComponent(theme.id)}`}><span>🎨</span><h2>{theme.name}</h2><p>{theme.description}</p></a></li>
      {/each}
    </ul>
  </main>
{:else if route.kind === 'theme' && selectedTheme}
  <main class="home-shell theme-detail-shell">
    <header class="home-header">
      <div><p class="eyebrow">{locale.themes.title}</p><h1>{selectedTheme.name}</h1></div>
      <a class="button" href="../themes">{locale.common.backToHome}</a>
    </header>
    <p class="theme-description">{selectedTheme.description}</p>
    {#if themePage}
      <section class="theme-demo">
        <div class="theme-demo-canvas"><svelte:component this={themePage} /></div>
      </section>
      <div class="theme-demo-controls">
        <button class="button" onclick={() => (themePageIndex = Math.max(0, themePageIndex - 1))} disabled={themePageIndex === 0}>Previous</button>
        <span>{themePageIndex + 1} / {themeModule?.default.length ?? 0}</span>
        <button class="button" onclick={() => (themePageIndex = Math.min((themeModule?.default.length ?? 1) - 1, themePageIndex + 1))} disabled={themePageIndex === (themeModule?.default.length ?? 1) - 1}>Next</button>
      </div>
    {/if}
    <button class="theme-prompt-toggle" aria-expanded={themePromptOpen} onclick={() => (themePromptOpen = !themePromptOpen)}>
      {themePromptOpen ? 'Collapse prompt' : 'Expand prompt'}
    </button>
    {#if themePromptOpen}<pre class="theme-prompt">{selectedTheme.body}</pre>{/if}
  </main>
{:else if route.kind === 'assets'}
  <main class="home-shell assets-shell">
    <header class="home-header">
      <div><p class="eyebrow">open-slide</p><h1>Assets</h1></div>
      <button class="button" onclick={backHome}>{locale.common.backToHome}</button>
    </header>
    <section class="asset-toolbar">
      <select
        aria-label="Asset scope"
        value={assetScope}
        onchange={(event) => {
          assetScope = event.currentTarget.value;
          void loadAssets();
        }}
      >
        <option value="@global">Global assets</option>
        {#each deckSummaries as summary}<option value={summary.id}>{summary.title}</option>{/each}
      </select>
      <input placeholder="Search assets" bind:value={assetSearch} />
      <label class="button asset-upload">
        Upload
        <input
          type="file"
          onchange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void addAsset(file);
            event.currentTarget.value = '';
          }}
        />
      </label>
    </section>
    {#if assetError}<p class="asset-error" role="alert">{assetError}</p>{/if}
    {#if assetsLoading}
      <section class="empty-state"><p class="eyebrow">Loading assets…</p></section>
    {:else if visibleAssets.length === 0}
      <section class="empty-state"><p class="eyebrow">No assets</p><h2>Upload a file to this scope.</h2></section>
    {:else}
      <ul class="asset-grid">
        {#each visibleAssets as asset}
          <li>
            <div class="asset-preview">
              {#if asset.mime.startsWith('image/')}
                <img src={asset.url} alt={asset.name} />
              {:else}<span>{asset.name.split('.').pop()?.toUpperCase()}</span>{/if}
            </div>
            <input
              aria-label={`Rename ${asset.name}`}
              value={asset.name}
              onkeydown={(event) => {
                if (event.key === 'Enter') void changeAssetName(asset.name, event.currentTarget.value);
              }}
            />
            <div class="asset-meta">
              <span>{Math.max(1, Math.round(asset.size / 1024))} KB</span>
              {#if asset.unused}<span>Unused</span>{/if}
              <button aria-label={`Delete ${asset.name}`} onclick={() => removeAsset(asset.name)}>Delete</button>
            </div>
          </li>
        {/each}
      </ul>
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
{:else if presenting}
  <main
    class="play-shell"
    data-step-count={stepAggregate.stepCount}
    data-step-revealed={stepAggregate.revealed}
    onmousemove={onPointerMove}
    onwheel={onWheel}
    ontouchstart={onTouchStart}
    ontouchend={onTouchEnd}
  >
    <section class="play-viewport" use:measure aria-label={`Page ${pageIndex + 1}`}>
      <div class="canvas play-canvas" style={`transform: translate(-50%, -50%) scale(${scale}); ${designCss}`}>
        {#key pageIndex}
          <StepHost
            {entryDirection}
            component={activePage}
            pageTransition={activeTransition}
            {pageIndex}
            {pageCount}
            onController={updateStepController}
            onAggregate={updateStepAggregate}
          />
        {/key}
      </div>
    </section>

    {#if blackout === 'black'}
      <div class="absolute inset-0 bg-black blackout-layer"></div>
    {:else if blackout === 'white'}
      <div class="absolute inset-0 bg-white blackout-layer"></div>
    {/if}

    {#if laserEnabled}
      <div
        class="z-[60] laser-pointer"
        style={`left: ${laserX}px; top: ${laserY}px;`}
        aria-hidden="true"
      ></div>
    {/if}

    {#if helpOpen}
      <section class="play-overlay help-overlay" aria-label="Keyboard shortcuts">
        <h2>Keyboard shortcuts</h2>
        <dl>
          <div><dt>Next / previous</dt><dd>← →</dd></div>
          <div><dt>Overview</dt><dd>O</dd></div>
          <div><dt>Black / white screen</dt><dd>B / W</dd></div>
          <div><dt>Laser pointer</dt><dd>L</dd></div>
          <div><dt>Presenter view</dt><dd>P</dd></div>
          <div><dt>Exit</dt><dd>Esc</dd></div>
        </dl>
      </section>
    {/if}

    {#if jumpDigits}
      <div class="jump-indicator" aria-live="polite">{jumpDigits}</div>
    {/if}

    <nav class="play-controls" aria-label="Presentation controls">
      <button class="icon-button" onclick={retreat} aria-label="Previous slide (←)" disabled={pageIndex === 0 && stepAggregate.revealed === 0}>←</button>
      <span>{String(pageIndex + 1).padStart(2, '0')} / {String(pageCount).padStart(2, '0')}</span>
      <button class="icon-button" onclick={advance} aria-label="Next slide (→)" disabled={pageIndex === pageCount - 1 && stepAggregate.revealed === stepAggregate.stepCount}>→</button>
      <button class="button" onclick={openOverview}>Overview</button>
      <button class="button" onclick={openPresenter}>Presenter</button>
      <button class="button" onclick={() => (presenting = false)}>Exit</button>
    </nav>
  </main>
{:else if route.kind === 'presenter'}
  <main class="presenter-shell">
    <section class="presenter-stage">
    <div class="presenter-current" use:measure>
        <div
          class="canvas"
          style={`transform: translate(-50%, -50%) scale(${scale}); ${designCss}`}
        >
          {#key pageIndex}
            <StepHost
              {entryDirection}
              component={activePage}
              pageTransition={activeTransition}
              controlledRevealed={remoteStepRevealed}
              {pageIndex}
              {pageCount}
              onController={updateStepController}
              onAggregate={updateStepAggregate}
            />
          {/key}
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
      <div class="presenter-status">
        <strong>Presenter</strong>
        <span>{presenterLinked ? 'Linked' : 'Not linked'}</span>
      </div>
      <div class="presenter-count">{String(pageIndex + 1).padStart(2, '0')} / {String(pageCount).padStart(2, '0')}</div>
      {#if remoteStepCount > 0}<p class="presenter-steps">Step {remoteStepRevealed} / {remoteStepCount}</p>{/if}
      <h2>Speaker notes</h2>
      <p>{note || 'No speaker notes for this slide.'}</p>
      {#if pageIndex === pageCount - 1}<p class="presenter-last">Last slide</p>{/if}
      <div class="presenter-blackout">
        <button class="button" aria-pressed={blackout === 'black'} onclick={() => toggleBlackout('black')}>Black</button>
        <button class="button" aria-pressed={blackout === 'white'} onclick={() => toggleBlackout('white')}>White</button>
      </div>
      <label class="presenter-jump">
        Jump to slide
        <input
          type="number"
          min="1"
          max={pageCount}
          value={pageIndex + 1}
          onkeydown={(event) => {
            if (event.key === 'Enter') goToPage(Number(event.currentTarget.value) - 1);
          }}
        />
      </label>
      <div class="presenter-actions">
        <button class="button" onclick={presenterRetreat} disabled={pageIndex === 0 && remoteStepRevealed === 0}>Prev</button>
        <button class="button primary" onclick={presenterAdvance} disabled={pageIndex === pageCount - 1 && remoteStepRevealed >= remoteStepCount}>Next</button>
      </div>
    </aside>
  </main>
{:else}
  <main class:with-inspector={inspectorOpen} class="viewer-shell">
    <header class="viewer-bar">
      <button class="icon-button" onclick={backHome} aria-label="Back home">←</button>
      <div class="viewer-title">
        <strong>{deck.meta?.title ?? currentSlideId}</strong>
        <span>{pageIndex + 1} / {pageCount}</span>
      </div>
      <div class="viewer-actions">
        <button class="button subtle" aria-label="Open command menu" onclick={() => (commandOpen = true)}>⌘K</button>
        <button class="button subtle" onclick={toggleInspector}>Inspector</button>
        <button class="button subtle" onclick={() => runExport('html')} disabled={exporting}>Export HTML</button>
        <button class="button subtle" onclick={() => runExport('pdf')} disabled={exporting}>Export PDF</button>
        <button class="button subtle" aria-label="Move page earlier" onclick={() => reorderPage(pageIndex - 1)} disabled={pageIndex === 0}>↑</button>
        <button class="button subtle" aria-label="Move page later" onclick={() => reorderPage(pageIndex + 1)} disabled={pageIndex === pageCount - 1}>↓</button>
        <button class="button subtle" onclick={duplicatePage}>Duplicate page</button>
        <button class="button subtle" onclick={deletePage} disabled={pageCount <= 1}>Delete page</button>
        <button class="button" onclick={openPresenter}>Presenter</button>
        <button class="button primary" onclick={enterPresentMode}>Present</button>
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

      <div
        class="viewport"
        use:measure
        onwheel={onWheel}
        ontouchstart={onTouchStart}
        ontouchend={onTouchEnd}
        onclick={inspectElement}
        onkeydown={(event) => {
          if (event.key === 'Enter') inspectElement(event);
        }}
        role="button"
        tabindex="0"
        aria-label={`Page ${pageIndex + 1}`}
      >
        <div class="canvas" style={`transform: translate(-50%, -50%) scale(${scale}); ${designCss}`}>
          {#key pageIndex}
            <StepHost
              {entryDirection}
              component={activePage}
              pageTransition={activeTransition}
              {pageIndex}
              {pageCount}
              onController={updateStepController}
              onAggregate={updateStepAggregate}
            />
          {/key}
        </div>
        {#if !inspectorOpen}
          <button class="page-hit prev" onclick={() => goToPage(pageIndex - 1)} aria-label="Previous page"></button>
          <button class="page-hit next" onclick={() => goToPage(pageIndex + 1)} aria-label="Next page"></button>
        {/if}
      </div>

      {#if inspectorOpen}
        <aside class="inspector">
          <div class="inspector-heading">
            <div>
              <p class="eyebrow">Inspector</p>
              <h2>Page {pageIndex + 1}</h2>
            </div>
            <button class="icon-button" onclick={() => setInspectorOpen(false)} aria-label="Close inspector">×</button>
          </div>
          <dl>
            <div><dt>Deck</dt><dd>{deck.meta?.title ?? currentSlideId}</dd></div>
            <div><dt>Theme</dt><dd>{deck.meta?.theme ?? 'Default'}</dd></div>
            <div><dt>Canvas</dt><dd>{CANVAS_WIDTH} × {CANVAS_HEIGHT}</dd></div>
          </dl>
          {#if selectedElement}
            <section class="element-card">
              <p class="eyebrow">Selected &lt;{selectedElement.tag}&gt;</p>
              <label>
                Text
                <textarea aria-label="Selected element text" bind:value={selectedElement.text}></textarea>
              </label>
              <button class="button" onclick={saveSelectedElement} disabled={elementSaving}>
                {elementSaving ? 'Saving…' : 'Save element'}
              </button>
            </section>
          {:else}
            <p class="inspector-hint">Click an element on the slide to edit its direct text.</p>
          {/if}
          {#if designDraft}
            <section class="design-card">
              <p class="eyebrow">Design system</p>
              <label>Background <input type="color" aria-label="Design background" value={designDraft.palette.bg} onchange={(event) => saveDesign({ palette: { ...designDraft!.palette, bg: event.currentTarget.value } })} /></label>
              <label>Text <input type="color" aria-label="Design text" value={designDraft.palette.text} onchange={(event) => saveDesign({ palette: { ...designDraft!.palette, text: event.currentTarget.value } })} /></label>
              <label>Accent <input type="color" aria-label="Design accent" value={designDraft.palette.accent} onchange={(event) => saveDesign({ palette: { ...designDraft!.palette, accent: event.currentTarget.value } })} /></label>
              <label>Display font <input aria-label="Display font" value={designDraft.fonts.display} onchange={(event) => saveDesign({ fonts: { ...designDraft!.fonts, display: event.currentTarget.value } })} /></label>
              <label>Body font <input aria-label="Body font" value={designDraft.fonts.body} onchange={(event) => saveDesign({ fonts: { ...designDraft!.fonts, body: event.currentTarget.value } })} /></label>
              {#if designWarning}<p role="alert">{designWarning}</p>{/if}
            </section>
          {/if}
          <section class="notes-card">
            <p class="eyebrow">Speaker notes</p>
            <textarea aria-label="Speaker notes" bind:value={notesDraft} placeholder="Add speaker notes…"></textarea>
            <button class="button" onclick={() => saveNotes()} disabled={notesSaving}>
              {notesSaving ? 'Saving…' : 'Save notes'}
            </button>
          </section>
        </aside>
      {/if}
    </div>
  </main>
{/if}

{#if commandOpen}
  <dialog open class="command-dialog" aria-label="Command menu">
    <button class="command-backdrop" aria-label="Close command menu" onclick={() => (commandOpen = false)}></button>
    <section class="command-panel">
      <input
        use:focus
        placeholder={route.kind === 'slide' ? 'Search this deck or run a command' : 'Search decks or run a command'}
        bind:value={commandQuery}
      />
      <div class="command-results" role="listbox" aria-label="Commands">
        {#if route.kind === 'slide' && deck}
          <p>Pages</p>
          {#each commandPageIndexes as index}
            <button
              role="option"
              aria-selected="false"
              aria-label={`Page ${index + 1}`}
              onclick={() => {
                goToPage(index);
                commandOpen = false;
              }}
            >Page {index + 1}</button>
          {/each}
          <p>Actions</p>
          <button
            role="option"
            aria-selected="false"
            onclick={() => {
              commandOpen = false;
              openOverview();
            }}
          >Slide overview</button>
          <button role="option" aria-selected="false" onclick={() => runExport('html')}>Export HTML</button>
          <button role="option" aria-selected="false" onclick={() => runExport('pdf')}>Export PDF</button>
          <button role="option" aria-selected="false" onclick={() => applyCommandAppearance('light')}>Theme: Light</button>
          <button role="option" aria-selected="false" onclick={() => applyCommandAppearance('dark')}>Theme: Dark</button>
        {:else}
          <p>Decks</p>
          {#each commandDecks as summary}
            <button role="option" aria-selected="false" onclick={() => navigate(`/s/${encodeURIComponent(summary.id)}`)}>{summary.title}</button>
          {/each}
          <p>Actions</p>
          <button role="option" aria-selected="false" onclick={() => navigate('/themes')}>{locale.home.themes}</button>
          <button role="option" aria-selected="false" onclick={() => applyCommandAppearance('light')}>Theme: Light</button>
          <button role="option" aria-selected="false" onclick={() => applyCommandAppearance('dark')}>Theme: Dark</button>
        {/if}
      </div>
    </section>
  </dialog>
{/if}

{#if overviewOpen && deck}
  <dialog open class="overview-overlay" aria-label="Slide overview">
    <div class="overview-header">
      <h2>Slide overview</h2>
      <button class="icon-button" onclick={() => (overviewOpen = false)} aria-label="Close overview">×</button>
    </div>
    <div class="overview-grid">
      {#each deck.default as PageComponent, index}
        <button
          class:active={index === overviewIndex}
          class="overview-item"
          aria-label={`Go to slide ${index + 1}`}
          aria-current={index === pageIndex ? 'true' : undefined}
          onclick={() => {
            goToPage(index);
            overviewOpen = false;
          }}
        >
          <span>{index + 1}</span>
          <div class="overview-canvas"><svelte:component this={PageComponent} /></div>
        </button>
      {/each}
    </div>
  </dialog>
{/if}

<script lang="ts">
import { getSlidePageNumber } from '@open-slide/svelte';
import ImagePlaceholder from '@open-slide/svelte/ImagePlaceholder.svelte';
import MorphElement from '@open-slide/svelte/MorphElement.svelte';

const pageNumber = getSlidePageNumber();
</script>

<div class="page">
  <MorphElement id="beta-heading"><h1>Beta page</h1></MorphElement>
  <p>Page {pageNumber.index + 1} of {pageNumber.total}</p>
  <div class="placeholder"><ImagePlaceholder hint="Beta chart" width={360} height={180} /></div>
</div>

<style>
  .page { width: 100%; height: 100%; padding: 120px; color: #171719; background: #f5f2eb; font-family: system-ui, sans-serif; }
  h1 { margin: 0; font-size: 96px; }
  p { font-size: 40px; }
  .placeholder { margin-top: 40px; }
</style>

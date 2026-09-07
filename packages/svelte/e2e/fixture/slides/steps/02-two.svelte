<script lang="ts">
import Step from '@open-slide/svelte/Step.svelte';
</script>

<div class="page">
  <h1>Steps page two</h1>
  <Step><p>First reveal</p></Step>
  <Step><p>Second reveal</p></Step>
</div>

<style>
  .page { width: 100%; height: 100%; padding: 120px; color: white; background: #101014; }
  h1 { font-size: 96px; }
  p { font-size: 48px; }
</style>

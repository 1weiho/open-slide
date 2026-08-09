<script lang="ts">
export let hint: string;
export let width: number | undefined = undefined;
export let height: number | undefined = undefined;
</script>

<div
  class="image-placeholder"
  data-slide-placeholder={hint}
  data-placeholder-w={width}
  data-placeholder-h={height}
  role="img"
  aria-label={hint}
  style:width={width ? `${width}px` : '100%'}
  style:height={height ? `${height}px` : '100%'}
>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM4 16l4-4 3 3 2-2 7 6M15.5 9.5h.01" /></svg>
  <span>Image</span>
  <strong>{hint}</strong>
  {#if width && height}<small>{width} × {height}</small>{/if}
</div>

<style>
  .image-placeholder {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 24px;
    overflow: hidden;
    color: rgb(90 90 100 / 70%);
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif;
    flex-direction: column;
    gap: 8px;
    background: linear-gradient(135deg, rgb(120 120 130 / 6%), rgb(120 120 130 / 2%));
    border: 1px dashed rgb(120 120 130 / 35%);
    border-radius: 12px;
  }

  svg {
    width: 36px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
  }

  span {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.55;
  }

  strong {
    max-width: 85%;
    color: rgb(60 60 70 / 85%);
    font-size: 16px;
    font-weight: 500;
    line-height: 1.4;
  }

  small {
    font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
    opacity: 0.5;
  }
</style>

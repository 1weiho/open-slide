<main class="page">
  <section>
    <p class="eyebrow">A natural authoring model</p>
    <h1>One deck index.<br />Any number of pages.</h1>
  </section>

  <pre><code><span>import</span> Cover <span>from</span> './01-cover.svelte';
<span>import</span> Results <span>from</span> './02-results.svelte';

<span>export default</span> [Cover, Results];</code></pre>
</main>

<style>
  .page {
    display: grid;
    width: 100%;
    height: 100%;
    padding: 136px 144px;
    color: #16141b;
    grid-template-columns: 1.15fr 0.85fr;
    align-items: center;
    gap: 100px;
    background: #f2eff9;
  }

  .eyebrow {
    margin: 0 0 32px;
    color: #6a45ed;
    font-size: 23px;
    font-weight: 680;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: 94px;
    font-weight: 570;
    line-height: 1;
    letter-spacing: -0.06em;
  }

  pre {
    padding: 52px;
    overflow: hidden;
    color: #ddd6f7;
    font-size: 25px;
    line-height: 1.7;
    background: #17141d;
    border-radius: 28px;
    box-shadow: 0 32px 80px rgb(47 35 75 / 18%);
  }

  code {
    font-family: 'SFMono-Regular', Consolas, monospace;
  }

  span {
    color: #a890ff;
  }
</style>

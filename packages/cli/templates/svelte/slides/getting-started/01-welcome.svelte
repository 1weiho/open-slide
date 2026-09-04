<svelte:head>
  <title>Getting started · open-slide</title>
</svelte:head>

<main class="page">
  <p class="eyebrow">open-slide · svelte</p>
  <h1>Slides should feel like writing your app.</h1>
  <div class="features">
    <div><span>01</span><strong>Native Svelte components</strong></div>
    <div><span>02</span><strong>Instant Vite HMR</strong></div>
    <div><span>03</span><strong>1920 × 1080 canvas</strong></div>
  </div>
</main>

<style>
  .page {
    display: flex;
    width: 100%;
    height: 100%;
    padding: 128px 144px;
    color: #f4f0ff;
    flex-direction: column;
    justify-content: space-between;
    background:
      radial-gradient(circle at 80% 18%, rgb(135 103 255 / 34%), transparent 30%),
      #111014;
  }

  .eyebrow {
    margin: 0;
    color: #a996ff;
    font-size: 24px;
    font-weight: 650;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  h1 {
    max-width: 1450px;
    margin: 0;
    font-size: 132px;
    font-weight: 560;
    line-height: 0.96;
    letter-spacing: -0.065em;
  }

  .features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
  }

  .features div {
    display: flex;
    padding-top: 24px;
    border-top: 1px solid rgb(255 255 255 / 22%);
    flex-direction: column;
    gap: 14px;
  }

  .features span {
    color: #77727f;
    font-size: 20px;
  }

  .features strong {
    font-size: 32px;
    font-weight: 480;
  }
</style>

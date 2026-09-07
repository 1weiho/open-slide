<script lang="ts">
const packages = [
  ['core', 'types · discovery · files'],
  ['react', 'existing production runtime'],
  ['svelte', 'native viewer · presenter · inspector'],
];
</script>

<main>
  <div>
    <p>Intentional boundaries</p>
    <h1>Shared logic stays shared.</h1>
  </div>
  <section>
    {#each packages as item}
      <article><strong>{item[0]}</strong><span>{item[1]}</span></article>
    {/each}
  </section>
</main>

<style>
  main {
    display: grid;
    width: 100%;
    height: 100%;
    padding: 132px 148px;
    color: #17141d;
    grid-template-columns: 1fr 0.82fr;
    align-items: center;
    gap: 96px;
    background: #f2eff9;
  }

  p {
    margin: 0 0 32px;
    color: #704bea;
    font-size: 23px;
    font-weight: 680;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: 108px;
    font-weight: 570;
    line-height: 0.96;
    letter-spacing: -0.06em;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  article {
    display: flex;
    padding: 28px 32px;
    align-items: baseline;
    justify-content: space-between;
    background: rgb(255 255 255 / 68%);
    border: 1px solid rgb(58 46 81 / 12%);
    border-radius: 16px;
  }

  strong {
    font-size: 31px;
  }

  span {
    color: #746e7c;
    font-size: 22px;
  }
</style>

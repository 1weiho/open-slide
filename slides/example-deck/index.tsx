import type { DeckMeta, SlidePage } from '../../src/lib/sdk';

const Title: SlidePage = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #5b8def 0%, #2a3cb0 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    <h1 style={{ fontSize: 128, margin: 0 }}>open-slide</h1>
    <p style={{ fontSize: 36, opacity: 0.85, marginTop: 24 }}>
      A React slide deck written by an agent.
    </p>
  </div>
);

const Contract: SlidePage = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      padding: 120,
      background: '#fff',
      color: '#111',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    <h2 style={{ fontSize: 72, marginTop: 0 }}>The contract</h2>
    <ul style={{ fontSize: 40, lineHeight: 1.6 }}>
      <li>
        File: <code>slides/&lt;id&gt;/index.tsx</code>
      </li>
      <li>
        Canvas: <b>1920 × 1080</b> (absolute pixels)
      </li>
      <li>
        <code>export default</code> an array of React components
      </li>
      <li>
        Assets: <code>./assets/*</code>, import them as ES modules
      </li>
    </ul>
  </div>
);

const Closing: SlidePage = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#0f1115',
      color: '#fff',
      display: 'grid',
      placeItems: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 200 }}>←/→</div>
      <div style={{ fontSize: 48, color: '#8b93a1', marginTop: 24 }}>
        use arrow keys · press F to go fullscreen
      </div>
    </div>
  </div>
);

export const meta: DeckMeta = { title: 'Example deck' };

export default [Title, Contract, Closing] satisfies SlidePage[];

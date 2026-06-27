import {
  type DesignSystem,
  type Page,
  unstable_SharedElement as SharedElement,
  type SlideMeta,
  type SlideTransition,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#090908', text: '#f6f1e8', accent: '#7bdcb5' },
  fonts: {
    display: 'Avenir Next, "SF Pro Display", system-ui, sans-serif',
    body: 'Avenir, "SF Pro Text", system-ui, sans-serif',
  },
  typeScale: { hero: 132, body: 30 },
  radius: 28,
};

export const meta: SlideMeta = {
  title: 'Magic Move Prototype',
  createdAt: '2026-06-22T17:00:36.438Z',
};

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

export const transition: SlideTransition = {
  duration: 1250,
  easing: EASE,
  sharedElements: {
    duration: 1250,
    easing: EASE,
  },
};

const blue = '#8ab4ff';
const coral = '#ff8a75';
const yellow = '#f4ce63';
const muted = 'rgba(246, 241, 232, 0.54)';
const faint = 'rgba(246, 241, 232, 0.16)';

const root: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
};

const Title = () => (
  <SharedElement id="magic-title">
    <h1
      style={{
        position: 'absolute',
        left: 130,
        top: 106,
        margin: 0,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 'var(--osd-size-hero)',
        lineHeight: 0.96,
        fontWeight: 820,
        letterSpacing: 0,
      }}
    >
      Magic Move
    </h1>
  </SharedElement>
);

const Caption = ({ id, text }: { id: string; text: string }) => (
  <SharedElement id={`caption-${id}`}>
    <div
      style={{
        position: 'absolute',
        left: 136,
        top: 258,
        fontSize: 'var(--osd-size-body)',
        lineHeight: 1,
        color: muted,
        letterSpacing: 0,
      }}
    >
      {text}
    </div>
  </SharedElement>
);

const Stage = ({ children }: { children: ReactNode }) => (
  <section style={root}>
    <Title />
    {children}
  </section>
);

const Dot = ({
  id,
  left,
  top,
  size,
  color,
}: {
  id: string;
  left: number;
  top: number;
  size: number;
  color: string;
}) => (
  <SharedElement id={`dot-${id}`}>
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: 999,
        background: color,
      }}
    />
  </SharedElement>
);

const Ring = ({ left, top, size }: { left: number; top: number; size: number }) => (
  <SharedElement id="focus-ring">
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius: 999,
        border: `2px solid ${faint}`,
        boxSizing: 'border-box',
      }}
    />
  </SharedElement>
);

const Arrange: Page = () => (
  <Stage>
    <Caption id="arrange" text="01 Arrange" />
    <Dot id="a" left={676} top={494} size={122} color="var(--osd-accent)" />
    <Dot id="b" left={904} top={510} size={88} color={blue} />
    <Dot id="c" left={1084} top={528} size={56} color={coral} />
  </Stage>
);

const Shift: Page = () => (
  <Stage>
    <Caption id="shift" text="02 Shift" />
    <Ring left={844} top={330} size={392} />
    <Dot id="a" left={748} top={346} size={76} color="var(--osd-accent)" />
    <Dot id="b" left={1006} top={430} size={164} color={blue} />
    <Dot id="c" left={716} top={684} size={104} color={coral} />
    <Dot id="d" left={1192} top={704} size={46} color={yellow} />
  </Stage>
);

const Scale: Page = () => (
  <Stage>
    <Caption id="scale" text="03 Scale" />
    <Ring left={676} top={292} size={560} />
    <Dot id="a" left={574} top={320} size={154} color="var(--osd-accent)" />
    <Dot id="b" left={942} top={408} size={74} color={blue} />
    <Dot id="c" left={1150} top={610} size={128} color={coral} />
    <Dot id="d" left={816} top={694} size={92} color={yellow} />
  </Stage>
);

const Settle: Page = () => (
  <Stage>
    <Caption id="settle" text="04 Settle" />
    <Dot id="a" left={776} top={476} size={96} color="var(--osd-accent)" />
    <Dot id="b" left={916} top={476} size={96} color={blue} />
    <Dot id="c" left={1056} top={476} size={96} color={coral} />
  </Stage>
);

export default [Arrange, Shift, Scale, Settle] satisfies Page[];

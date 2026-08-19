import type { MermaidConfig } from 'mermaid';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

export interface MermaidProps {
  chart: string;
  className?: string;
  style?: CSSProperties;
  config?: MermaidConfig;
  fallback?: ReactNode;
}

type RenderedDiagram = {
  element: SVGSVGElement;
  bindFunctions?: (element: Element) => void;
};

let mermaidPromise: Promise<typeof import('mermaid')['default']> | undefined;
let renderSequence = 0;

function loadMermaid(config?: MermaidConfig) {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        ...config,
        startOnLoad: false,
        securityLevel: config?.securityLevel ?? 'strict',
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

function nextRenderId(): string {
  renderSequence += 1;
  return `open-slide-mermaid-${renderSequence}`;
}

function normalizeSvg(svg: string): SVGSVGElement {
  const template = document.createElement('template');
  template.innerHTML = svg.trim();
  const element = template.content.querySelector('svg');
  if (!element) throw new Error('Mermaid did not return an SVG');
  element.setAttribute('width', '100%');
  element.setAttribute('height', '100%');
  element.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  element.setAttribute('data-mermaid-svg', '');
  element.style.display = 'block';
  element.style.maxWidth = '100%';
  element.style.maxHeight = '100%';
  return element;
}

export function Mermaid({ chart, className, style, config, fallback }: MermaidProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const renderVersion = useRef(0);
  const [diagram, setDiagram] = useState<RenderedDiagram | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    const version = ++renderVersion.current;
    setDiagram(null);
    setError(null);

    loadMermaid(config)
      .then((mermaid) => mermaid.render(nextRenderId(), chart, wrapperRef.current ?? undefined))
      .then(({ svg, bindFunctions }) => {
        if (!active || version !== renderVersion.current) return;
        setDiagram({ element: normalizeSvg(svg), bindFunctions });
      })
      .catch((cause: unknown) => {
        if (!active || version !== renderVersion.current) return;
        wrapperRef.current?.replaceChildren();
        setError(cause);
      });

    return () => {
      active = false;
    };
  }, [chart, config]);

  useEffect(() => {
    if (!diagram || !diagramRef.current) return;
    const container = diagramRef.current;
    container.replaceChildren(diagram.element);
    diagram.bindFunctions?.(container);
    return () => diagram.element.remove();
  }, [diagram]);

  return (
    <div
      ref={wrapperRef}
      data-waitfor="svg"
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {diagram ? (
        <div ref={diagramRef} data-mermaid-diagram="" style={{ width: '100%', height: '100%' }} />
      ) : error ? (
        <>
          {fallback ?? <DefaultFallback />}
          <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }} />
        </>
      ) : null}
    </div>
  );
}

function DefaultFallback() {
  return (
    <div
      role="alert"
      data-mermaid-error=""
      style={{
        maxWidth: '80%',
        padding: '20px 24px',
        border: '1px solid rgba(220, 38, 38, 0.3)',
        borderRadius: 10,
        background: 'rgba(220, 38, 38, 0.08)',
        color: 'currentColor',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 24,
        lineHeight: 1.4,
        textAlign: 'center',
      }}
    >
      Unable to render Mermaid diagram. Check the chart syntax.
    </div>
  );
}

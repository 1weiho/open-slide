import { ImageResponse } from "next/og";

export const alt = "open-slide — slides as React code, crafted by agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0a0a0c";
const PANEL = "#111114";
const TEXT = "#f6f5f0";
const MUTED = "#7f7e78";
const ACCENT = "#7170ff";
const ACCENT_DEEP = "#5e6ad2";

async function loadGoogleFont(
  family: string,
  weight: number,
  italic = false,
) {
  const axes = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
  // Omit User-Agent so Google Fonts returns a TTF src (Satori can't read woff2).
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${axes}&display=swap`,
  ).then((r) => r.text());
  const match = css.match(
    /src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/,
  );
  if (!match) throw new Error(`Could not resolve TTF font: ${family}`);
  return fetch(match[1]).then((r) => r.arrayBuffer());
}

export default async function OpengraphImage() {
  const [geist, geistMed, instrumentItalic, mono] = await Promise.all([
    loadGoogleFont("Geist", 400),
    loadGoogleFont("Geist", 500),
    loadGoogleFont("Instrument Serif", 400, true),
    loadGoogleFont("JetBrains Mono", 500),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: INK,
        backgroundImage: `radial-gradient(900px 600px at 12% 18%, ${ACCENT}36 0%, transparent 60%), radial-gradient(800px 560px at 96% 98%, ${ACCENT_DEEP}22 0%, transparent 62%)`,
        color: TEXT,
        fontFamily: "Geist",
        padding: 72,
      }}
    >
      {/* corner brackets */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 28,
          width: 28,
          height: 28,
          borderTop: `2px solid ${ACCENT}`,
          borderLeft: `2px solid ${ACCENT}`,
          borderTopLeftRadius: 6,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 28,
          right: 28,
          width: 28,
          height: 28,
          borderTop: `2px solid ${ACCENT}`,
          borderRight: `2px solid ${ACCENT}`,
          borderTopRightRadius: 6,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 28,
          width: 28,
          height: 28,
          borderBottom: `2px solid ${ACCENT}`,
          borderLeft: `2px solid ${ACCENT}`,
          borderBottomLeftRadius: 6,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 28,
          right: 28,
          width: 28,
          height: 28,
          borderBottom: `2px solid ${ACCENT}`,
          borderRight: `2px solid ${ACCENT}`,
          borderBottomRightRadius: 6,
        }}
      />

      {/* brand lockup */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: "JetBrains Mono",
          fontSize: 22,
          letterSpacing: "-0.01em",
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            backgroundColor: ACCENT,
            boxShadow: `0 0 28px ${ACCENT}`,
          }}
        />
        <span style={{ color: TEXT }}>open-slide</span>
      </div>

      {/* headline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 120,
          lineHeight: 0.98,
          letterSpacing: "-0.035em",
        }}
      >
        <div
          style={{
            fontFamily: "Geist",
            fontWeight: 500,
            fontSize: 128,
            color: TEXT,
          }}
        >
          Slides as code.
        </div>
        <div
          style={{
            fontFamily: "Instrument Serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 128,
            color: TEXT,
            display: "flex",
            alignItems: "baseline",
          }}
        >
          <span>Crafted by&nbsp;</span>
          <span
            style={{
              color: ACCENT,
              position: "relative",
              display: "flex",
              alignItems: "baseline",
            }}
          >
            agents
            <span
              style={{
                position: "absolute",
                left: 4,
                right: 2,
                bottom: -8,
                height: 6,
                borderRadius: 3,
                background: `linear-gradient(90deg, ${ACCENT}00, ${ACCENT}, ${ACCENT}00)`,
              }}
            />
          </span>
          <span>.</span>
        </div>
      </div>

      {/* footer strip */}
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          fontFamily: "JetBrains Mono",
          fontSize: 20,
          color: MUTED,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        <span>a React-first slide framework</span>
      </div>

      {/* subtle dotted grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle at 1px 1px, ${PANEL} 1.2px, transparent 0)`,
          backgroundSize: "28px 28px",
          opacity: 0.55,
          pointerEvents: "none",
        }}
      />
    </div>,
    {
      ...size,
      fonts: [
        { name: "Geist", data: geist, style: "normal", weight: 400 },
        { name: "Geist", data: geistMed, style: "normal", weight: 500 },
        {
          name: "Instrument Serif",
          data: instrumentItalic,
          style: "italic",
          weight: 400,
        },
        { name: "JetBrains Mono", data: mono, style: "normal", weight: 500 },
      ],
    },
  );
}

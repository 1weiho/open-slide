# Editable PPTX Math Design

**Goal:** Export STEM-level LaTeX equations to editable PowerPoint math instead of approximate text or raster images.

**Approved approach:** Convert LaTeX to MathML with Temml, convert MathML to OMML with mathml2omml, and inject the generated OMML into the PPTX slide XML. Keep visible fallback text only when conversion fails.

## Architecture

1. `PptxEquation` keeps the author-provided LaTeX string as the source of truth.
2. The DOM collector stores the LaTeX, fallback text, inline/display mode, and equation text style in the scene.
3. The PPTX writer creates a temporary text token with normal pptxgenjs APIs so sizing, positioning, and relationships are valid.
4. After pptxgenjs writes the file, the writer replaces the token paragraph with generated OMML.
5. If conversion fails, the token is replaced by readable fallback text and the scene reports a reduced-fidelity diagnostic.

## Dependency Choice

- `temml`: MIT, JavaScript TeX-to-MathML conversion.
- `mathml2omml`: LGPL-3.0-or-later, JavaScript MathML-to-OMML conversion.

This path keeps equations editable in PowerPoint. SVG/raster equation rendering remains a future diagnostic fallback, not the default.

## Gauntlet Coverage

Add a new `05 / STEM MATH` slide with:

- inline formulas in prose
- an aligned step-by-step derivation
- a matrix/eigenvalue expression
- a summation/binomial expression

The slide should stress the actual converter with common undergraduate STEM notation instead of simple Unicode fallback text.

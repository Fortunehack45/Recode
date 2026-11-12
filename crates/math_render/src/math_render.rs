//! Pure-Rust LaTeX math renderer for Recode.
//!
//! Renders LaTeX math expressions to self-contained SVG strings using
//! `latex-rust` and its embedded STIX Two Math font outlines.

use std::sync::OnceLock;

use anyhow::Result;
use gpui::{Hsla, Rgba};
use latex_rust::{
    layout_with_em_size_pt, parse, render_svg, Color, Dim, MathFont, MathStyle, SvgOptions,
};

/// Styling parameters for rendering math.
#[derive(Debug, Clone, Copy)]
pub struct MathTheme {
    /// Foreground text color matching the active editor/preview theme.
    pub color: Hsla,
    /// Font size in points.
    pub font_size_pt: f32,
}

impl Default for MathTheme {
    fn default() -> Self {
        Self {
            color: Hsla::default(),
            font_size_pt: 12.0,
        }
    }
}

/// Rendered SVG output together with math box metrics in em units.
#[derive(Debug, Clone)]
pub struct RenderedMath {
    /// Self-contained SVG document string.
    pub svg: String,
    /// Bounding box width in em units.
    pub width_em: f32,
    /// Height above the baseline in em units.
    pub height_em: f32,
    /// Depth below the baseline in em units.
    pub depth_em: f32,
}

static MATH_FONT: OnceLock<Result<MathFont, String>> = OnceLock::new();

fn get_math_font() -> Result<&'static MathFont> {
    MATH_FONT
        .get_or_init(|| MathFont::stix_two_math().map_err(|e| e.to_string()))
        .as_ref()
        .map_err(|e| anyhow::anyhow!("failed to load STIX Two Math font: {e}"))
}

/// Renders a LaTeX math string into a self-contained SVG with box metrics.
///
/// Strips optional surrounding `$` or `$$` delimiters before parsing.
pub fn render_to_svg(latex: &str, display: bool, theme: &MathTheme) -> Result<RenderedMath> {
    let font = get_math_font()?;
    let trimmed = latex.trim();
    let unquoted = trimmed
        .strip_prefix("$$")
        .and_then(|s| s.strip_suffix("$$"))
        .unwrap_or(trimmed)
        .trim();
    let normalized = unquoted
        .strip_prefix('$')
        .and_then(|s| s.strip_suffix('$'))
        .unwrap_or(unquoted)
        .trim();

    if normalized.is_empty() {
        return Ok(RenderedMath {
            svg: String::new(),
            width_em: 0.0,
            height_em: 0.0,
            depth_em: 0.0,
        });
    }

    let ast = parse(normalized).map_err(|e| anyhow::anyhow!("LaTeX parse error: {e:?}"))?;
    let style = if display {
        MathStyle::Display
    } else {
        MathStyle::Text
    };

    let font_size_pt = Dim::parse(&format!("{:.2}", theme.font_size_pt.max(1.0)));
    let boxed = layout_with_em_size_pt(&ast, font, style, &font_size_pt)
        .map_err(|e| anyhow::anyhow!("LaTeX layout error: {e:?}"))?;

    let rgba = Rgba::from(theme.color);
    let color = Color::rgb(
        (rgba.r.clamp(0.0, 1.0) * 255.0).round() as u8,
        (rgba.g.clamp(0.0, 1.0) * 255.0).round() as u8,
        (rgba.b.clamp(0.0, 1.0) * 255.0).round() as u8,
    );

    let options = SvgOptions {
        font_size_pt,
        color,
        display,
    };

    let svg = render_svg(&boxed, font, &options)
        .map_err(|e| anyhow::anyhow!("LaTeX SVG render error: {e:?}"))?;

    let width_em = boxed.width.to_dec_string().parse::<f32>().unwrap_or(0.0);
    let height_em = boxed.height.to_dec_string().parse::<f32>().unwrap_or(0.0);
    let depth_em = boxed.depth.to_dec_string().parse::<f32>().unwrap_or(0.0);

    Ok(RenderedMath {
        svg,
        width_em,
        height_em,
        depth_em,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_render_rk4_inline_formula() {
        let theme = MathTheme {
            color: Hsla::default(),
            font_size_pt: 14.0,
        };
        let formula = r"\frac{d\vec{y}}{dt} = \vec{f}(t, \vec{y})";
        let rendered = render_to_svg(formula, false, &theme).expect("inline RK4 should render");
        assert!(rendered.svg.contains("<svg"));
        assert!(rendered.svg.contains("xmlns=\"http://www.w3.org/2000/svg\""));
        assert!(rendered.width_em > 0.0);
        assert!(rendered.height_em > 0.0);

        let opt = usvg::Options::default();
        let tree = usvg::Tree::from_str(&rendered.svg, &opt);
        assert!(tree.is_ok(), "SVG should be valid and parsable by usvg");
    }

    #[test]
    fn test_render_display_formula() {
        let theme = MathTheme {
            color: Hsla::default(),
            font_size_pt: 14.0,
        };
        let formula = r"\vec{k}_2 = \vec{f}\left(t_n + \frac{\Delta t}{2}, \vec{y}_n + \frac{\Delta t}{2}\vec{k}_1\right)";
        let rendered = render_to_svg(formula, true, &theme).expect("display RK4 should render");
        assert!(rendered.svg.contains("<svg"));
        assert!(rendered.width_em > 0.0);

        let opt = usvg::Options::default();
        let tree = usvg::Tree::from_str(&rendered.svg, &opt);
        assert!(tree.is_ok(), "Display math SVG should be valid for usvg");
    }

    #[test]
    fn test_render_velocity_verlet() {
        let theme = MathTheme {
            color: Hsla::default(),
            font_size_pt: 12.0,
        };
        let formula = r"\vec{x}(t + \Delta t) = \vec{x}(t) + \vec{v}(t)\Delta t + \frac{1}{2}\vec{a}(t)\Delta t^2";
        let rendered = render_to_svg(formula, true, &theme).expect("Verlet should render");
        assert!(rendered.svg.contains("<svg"));
    }

    #[test]
    fn test_render_empty_formula() {
        let theme = MathTheme::default();
        let rendered = render_to_svg("", false, &theme).expect("empty math should succeed");
        assert!(rendered.svg.is_empty());
    }

    #[test]
    fn test_render_malformed_formula_returns_err() {
        let theme = MathTheme::default();
        let result = render_to_svg(r"\frac{1}", false, &theme);
        assert!(result.is_err(), "missing argument should return Err, not panic");
    }
}

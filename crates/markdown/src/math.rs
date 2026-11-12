//! LaTeX math rendering module for Markdown.
//!
//! Provides rendering and caching for inline (`$...$`) and display (`$$...$$`)
//! math expressions using `math_render`.

use std::collections::{HashMap, HashSet};
use std::sync::{Arc, OnceLock};
use std::time::Duration;

use gpui::{
    Animation, AnimationExt, AnyElement, App, ClipboardItem, Context, Entity, Hsla, ImageSource,
    IntoElement, Pixels, RenderImage, Rgba, SMOOTH_SVG_SCALE_FACTOR, SharedString, Task, Window,
    div, h_flex, img, px, pulsating_between,
};
use math_render::MathTheme;
use ui::{
    Color, CopyButton, ElementId, FluentBuilder, Label, LabelCommon, LabelSize, ParentElement,
    Styled,
};

use crate::{CopyButtonVisibility, Markdown, MarkdownStyle, parser::ParsedMarkdownMath};

/// Cache key for rendered math formulas.
#[derive(Clone, PartialEq, Eq, Hash, Debug)]
pub(crate) struct MathCacheKey {
    pub contents: SharedString,
    pub display: bool,
}

/// Extracted box metrics in em units.
#[derive(Clone, Copy, Debug)]
pub(crate) struct RenderedMathMetrics {
    pub width_em: f32,
    pub height_em: f32,
    pub depth_em: f32,
}

/// A cached math formula rasterization task and its results.
pub(crate) struct CachedMathFormula {
    pub render_image: Arc<OnceLock<anyhow::Result<Arc<RenderImage>>>>,
    pub metrics: Arc<OnceLock<Option<RenderedMathMetrics>>>,
    pub _task: Task<()>,
}

impl CachedMathFormula {
    pub(crate) fn new(
        contents: SharedString,
        display: bool,
        theme: MathTheme,
        cx: &mut Context<Markdown>,
    ) -> Self {
        let render_image = Arc::new(OnceLock::new());
        let metrics = Arc::new(OnceLock::new());
        let svg_renderer = cx.svg_renderer();

        let task = cx.spawn({
            let render_image = render_image.clone();
            let metrics = metrics.clone();
            let contents = contents.clone();
            async move |this, cx| {
                let result = cx
                    .background_spawn(async move {
                        let rendered = math_render::render_to_svg(&contents, display, &theme)?;
                        let tree = svg_renderer
                            .parse_svg(rendered.svg.as_bytes())
                            .map_err(|e| anyhow::anyhow!("{e}"))?;
                        let tree = Arc::new(tree);
                        let image = svg_renderer
                            .render_parsed(&tree, SMOOTH_SVG_SCALE_FACTOR)
                            .map_err(|e| anyhow::anyhow!("{e}"))?;
                        anyhow::Ok((
                            image,
                            RenderedMathMetrics {
                                width_em: rendered.width_em,
                                height_em: rendered.height_em,
                                depth_em: rendered.depth_em,
                            },
                        ))
                    })
                    .await;

                match result {
                    Ok((image, m)) => {
                        metrics.set(Some(m)).ok();
                        render_image.set(Ok(image)).ok();
                    }
                    Err(err) => {
                        metrics.set(None).ok();
                        render_image.set(Err(err)).ok();
                    }
                }
                this.update(cx, |_, cx| cx.notify()).ok();
            }
        });

        Self {
            render_image,
            metrics,
            _task: task,
        }
    }

    pub(crate) fn drop_images(&self, cx: &mut App) {
        if let Some(Ok(render_image)) = self.render_image.get() {
            cx.drop_image(render_image.clone(), None);
        }
    }
}

/// State tracking math rendering and caching per `Markdown` entity.
#[derive(Default, Clone)]
pub(crate) struct MathState {
    pub(crate) cache: HashMap<MathCacheKey, Arc<CachedMathFormula>>,
}

impl MathState {
    pub(crate) fn clear(&mut self, cx: &mut App) {
        for cached in self.cache.values() {
            cached.drop_images(cx);
        }
        self.cache.clear();
    }

    pub(crate) fn update(
        &mut self,
        math_formulas: &std::collections::BTreeMap<usize, ParsedMarkdownMath>,
        cx: &mut Context<Markdown>,
    ) {
        let math_theme = build_math_theme(cx);
        let mut active_keys = HashSet::default();
        for math in math_formulas.values() {
            let key = MathCacheKey {
                contents: math.contents.clone(),
                display: math.display,
            };
            active_keys.insert(key.clone());
            if !self.cache.contains_key(&key) {
                let cached = Arc::new(CachedMathFormula::new(
                    math.contents.clone(),
                    math.display,
                    math_theme,
                    cx,
                ));
                self.cache.insert(key, cached);
            }
        }
        self.cache.retain(|key, _| active_keys.contains(key));
    }

    pub(crate) fn get(
        &self,
        contents: &SharedString,
        display: bool,
    ) -> Option<&Arc<CachedMathFormula>> {
        let key = MathCacheKey {
            contents: contents.clone(),
            display,
        };
        self.cache.get(&key)
    }
}

pub(crate) fn build_math_theme(cx: &Context<Markdown>) -> MathTheme {
    let colors = cx.theme().colors();
    MathTheme {
        color: colors.text,
        font_size_pt: 12.0,
    }
}

/// Renders a block-level display equation (`$$...$$`).
pub(crate) fn render_display_math(
    math: &ParsedMarkdownMath,
    math_state: &MathState,
    style: &MarkdownStyle,
    markdown: Entity<Markdown>,
    source_offset: usize,
    copy_button_visibility: CopyButtonVisibility,
    _window: &mut Window,
    _cx: &mut App,
) -> AnyElement {
    let cached = math_state.get(&math.contents, true);
    let render_result = cached.and_then(|c| c.render_image.get());
    let code = math.contents.clone();
    let show_interactive = copy_button_visibility != CopyButtonVisibility::Hidden;

    let mut container = div()
        .group("math_block")
        .relative()
        .w_full()
        .my_2()
        .p_3()
        .flex()
        .flex_col()
        .items_center()
        .justify_center()
        .rounded_md();
    container.style().refine(&style.code_block);

    match render_result {
        Some(Ok(render_image)) => {
            let device_size = render_image.size(0);
            let display_width = px(device_size.width.0 as f32 / SMOOTH_SVG_SCALE_FACTOR);
            let display_height = px(device_size.height.0 as f32 / SMOOTH_SVG_SCALE_FACTOR);

            let body = div()
                .w_full()
                .flex()
                .justify_center()
                .overflow_x_scroll()
                .child(
                    img(ImageSource::Render(render_image.clone()))
                        .w(display_width)
                        .h(display_height),
                );

            container
                .child(body)
                .when(show_interactive, |el| {
                    el.child(render_math_copy_button(source_offset, code.to_string(), markdown))
                })
                .into_any_element()
        }
        Some(Err(_)) => {
            // Malformed LaTeX - render the raw equation gracefully
            let code_display = div()
                .w_full()
                .flex()
                .justify_center()
                .child(
                    Label::new(format!("$${code}$$"))
                        .size(LabelSize::Small)
                        .color(Color::Muted),
                );
            container
                .child(code_display)
                .when(show_interactive, |el| {
                    el.child(render_math_copy_button(source_offset, code.to_string(), markdown))
                })
                .into_any_element()
        }
        None => {
            // Still rendering
            let loading_display = div()
                .w_full()
                .flex()
                .justify_center()
                .child(
                    Label::new(format!("$${code}$$"))
                        .size(LabelSize::Small)
                        .color(Color::Muted)
                        .with_animation(
                            "math-loading-pulse",
                            Animation::new(Duration::from_secs(2))
                                .repeat()
                                .with_easing(pulsating_between(0.4, 0.8)),
                            |label, delta| label.alpha(delta),
                        ),
                );
            container
                .child(loading_display)
                .when(show_interactive, |el| {
                    el.child(render_math_copy_button(source_offset, code.to_string(), markdown))
                })
                .into_any_element()
        }
    }
}

/// Renders an inline math expression (`$...$`), baseline-aligned.
pub(crate) fn render_inline_math_element(
    contents: &SharedString,
    math_state: &MathState,
    style: &MarkdownStyle,
    window: &mut Window,
    _cx: &mut App,
) -> AnyElement {
    let font_size = style.base_text_style.font_size.to_pixels(window.rem_size());
    let cached = math_state.get(contents, false);

    if let Some(cached) = cached
        && let Some(Ok(render_image)) = cached.render_image.get()
        && let Some(Some(metrics)) = cached.metrics.get()
    {
        let width = px(metrics.width_em * font_size.0);
        let height = px((metrics.height_em + metrics.depth_em) * font_size.0);
        let depth = px(metrics.depth_em * font_size.0);

        div()
            .inline_block()
            .h(height)
            .w(width)
            .mb(-depth)
            .child(
                img(ImageSource::Render(render_image.clone()))
                    .w(width)
                    .h(height),
            )
            .into_any_element()
    } else {
        // Fallback: styled text chip
        div()
            .inline_block()
            .px_1()
            .rounded_xs()
            .bg(style.base_text_style.color.opacity(0.08))
            .child(
                Label::new(format!("${contents}$"))
                    .size(LabelSize::Small),
            )
            .into_any_element()
    }
}

fn render_math_copy_button(
    source_offset: usize,
    code: String,
    markdown: Entity<Markdown>,
) -> impl IntoElement {
    let id = ElementId::NamedChild(
        Arc::new(ElementId::from(("copy-math-code", markdown.entity_id()))),
        source_offset.to_string().into(),
    );

    h_flex()
        .absolute()
        .top_1()
        .right_1()
        .child(
            CopyButton::new(id.clone(), code.clone())
                .visible_on_hover("math_block")
                .custom_on_click({
                    move |_window, cx| {
                        let id = id.clone();
                        markdown.update(cx, |this, cx| {
                            this.copied_code_blocks.insert(id.clone());
                            cx.write_to_clipboard(ClipboardItem::new_string(code.clone()));
                            cx.spawn(async move |this, cx| {
                                cx.background_executor().timer(Duration::from_secs(2)).await;
                                cx.update(|cx| {
                                    this.update(cx, |this, cx| {
                                        this.copied_code_blocks.remove(&id);
                                        cx.notify();
                                    })
                                    .ok();
                                });
                            })
                            .detach();
                            cx.notify();
                        });
                    }
                }),
        )
}

use std::sync::Arc;
use std::time::Instant;

use gpui::{App, Global, ReadGlobal, SharedString};
use parking_lot::RwLock;

#[derive(Default)]
struct FontFamilyCacheState {
    loaded_at: Option<Instant>,
    font_families: Vec<SharedString>,
}

/// A cache for the list of font families.
///
/// Listing the available font families from the text system is expensive,
/// so we do it once and then use the cached values each render.
#[derive(Default)]
pub struct FontFamilyCache {
    state: Arc<RwLock<FontFamilyCacheState>>,
}

#[derive(Default)]
struct GlobalFontFamilyCache(Arc<FontFamilyCache>);

impl Global for GlobalFontFamilyCache {}

impl FontFamilyCache {
    /// Initializes the global font family cache.
    pub fn init_global(cx: &mut App) {
        cx.default_global::<GlobalFontFamilyCache>();
    }

    /// Returns the global font family cache.
    pub fn global(cx: &App) -> Arc<Self> {
        GlobalFontFamilyCache::global(cx).0.clone()
    }

    /// Returns the list of font families.
    pub fn list_font_families(&self, cx: &App) -> Vec<SharedString> {
        if self.state.read().loaded_at.is_some() {
            return self.state.read().font_families.clone();
        }

        let mut lock = self.state.write();
        let mut names: Vec<SharedString> = cx
            .text_system()
            .all_font_names()
            .into_iter()
            .filter(|name| {
                name != ".ZedMono" && name != ".ZedSans" && name != "ZedMono" && name != "ZedSans" && name != "Zed Plex Mono" && name != "Zed Plex Sans"
            })
            .map(SharedString::from)
            .collect();
        if !names.iter().any(|n| n.as_ref() == ".RecodeMono") {
            names.insert(0, SharedString::from(".RecodeMono"));
        }
        if !names.iter().any(|n| n.as_ref() == ".RecodeSans") {
            names.insert(1, SharedString::from(".RecodeSans"));
        }
        lock.font_families = names;
        lock.loaded_at = Some(Instant::now());

        lock.font_families.clone()
    }

    /// Returns the list of font families if they have been loaded
    pub fn try_list_font_families(&self) -> Option<Vec<SharedString>> {
        self.state
            .try_read()
            .filter(|state| state.loaded_at.is_some())
            .map(|state| state.font_families.clone())
    }

    /// Prefetch all font names in the background
    pub async fn prefetch(&self, cx: &gpui::AsyncApp) {
        if self
            .state
            .try_read()
            .is_none_or(|state| state.loaded_at.is_some())
        {
            return;
        }

        let text_system = cx.update(|cx| App::text_system(cx).clone());

        let state = self.state.clone();

        cx.background_executor()
            .spawn(async move {
                // We take this lock in the background executor to ensure that synchronous calls to `list_font_families` are blocked while we are prefetching,
                // while not blocking the main thread and risking deadlocks
                let mut lock = state.write();
                let mut all_font_names: Vec<SharedString> = text_system
                    .all_font_names()
                    .into_iter()
                    .filter(|name| {
                        name != ".ZedMono" && name != ".ZedSans" && name != "ZedMono" && name != "ZedSans" && name != "Zed Plex Mono" && name != "Zed Plex Sans"
                    })
                    .map(SharedString::from)
                    .collect();
                if !all_font_names.iter().any(|n| n.as_ref() == ".RecodeMono") {
                    all_font_names.insert(0, SharedString::from(".RecodeMono"));
                }
                if !all_font_names.iter().any(|n| n.as_ref() == ".RecodeSans") {
                    all_font_names.insert(1, SharedString::from(".RecodeSans"));
                }
                lock.font_families = all_font_names;
                lock.loaded_at = Some(Instant::now());
            })
            .await;
    }
}

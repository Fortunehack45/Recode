//! Semantic design tokens and theme engine with hot-reloading and safe fallbacks.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// RGBA color representation with alpha blending and hex parsing.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct RgbaColor {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

impl RgbaColor {
    pub const fn new(r: u8, g: u8, b: u8, a: u8) -> Self {
        Self { r, g, b, a }
    }

    pub const fn rgb(r: u8, g: u8, b: u8) -> Self {
        Self { r, g, b, a: 255 }
    }

    /// Parses a 6-digit or 8-digit hexadecimal color string (e.g., `#1e1e1e` or `#1e1e1eff`).
    pub fn from_hex(hex: &str) -> Option<Self> {
        let clean = hex.trim().trim_start_matches('#');
        match clean.len() {
            6 => {
                let r = u8::from_str_radix(&clean[0..2], 16).ok()?;
                let g = u8::from_str_radix(&clean[2..4], 16).ok()?;
                let b = u8::from_str_radix(&clean[4..6], 16).ok()?;
                Some(Self::rgb(r, g, b))
            }
            8 => {
                let r = u8::from_str_radix(&clean[0..2], 16).ok()?;
                let g = u8::from_str_radix(&clean[2..4], 16).ok()?;
                let b = u8::from_str_radix(&clean[4..6], 16).ok()?;
                let a = u8::from_str_radix(&clean[6..8], 16).ok()?;
                Some(Self::new(r, g, b, a))
            }
            _ => None,
        }
    }

    /// Converts to standard CSS `#RRGGBB` or `#RRGGBBAA` string.
    pub fn to_hex(&self) -> String {
        if self.a == 255 {
            format!("#{:02x}{:02x}{:02x}", self.r, self.g, self.b)
        } else {
            format!("#{:02x}{:02x}{:02x}{:02x}", self.r, self.g, self.b, self.a)
        }
    }
}

/// Abstract semantic UI token keys specified in `spec/theming_layout.md`.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, Serialize, Deserialize)]
pub enum SemanticColorToken {
    // Surfaces
    SurfaceCanvas,
    SurfacePanel,
    SurfaceHeader,
    SurfaceActive,
    SurfaceHover,

    // Borders
    BorderDivider,
    BorderSubtle,
    BorderFocus,

    // Typography
    TextPrimary,
    TextMuted,
    TextAccent,

    // Editor-specific
    EditorBackground,
    EditorForeground,
    EditorGutterInactive,
    EditorGutterActive,
    EditorCurrentLine,
    EditorCaret,
    EditorSelection,

    // Status
    StatusError,
    StatusWarning,
    StatusSuccess,
    StatusInfo,
}

impl SemanticColorToken {
    /// String identifier for serialized themes.
    pub const fn token_name(&self) -> &'static str {
        match self {
            Self::SurfaceCanvas => "surface.canvas",
            Self::SurfacePanel => "surface.panel",
            Self::SurfaceHeader => "surface.header",
            Self::SurfaceActive => "surface.active",
            Self::SurfaceHover => "surface.hover",
            Self::BorderDivider => "border.divider",
            Self::BorderSubtle => "border.subtle",
            Self::BorderFocus => "border.focus",
            Self::TextPrimary => "text.primary",
            Self::TextMuted => "text.muted",
            Self::TextAccent => "text.accent",
            Self::EditorBackground => "editor.background",
            Self::EditorForeground => "editor.foreground",
            Self::EditorGutterInactive => "editor.gutter.foreground",
            Self::EditorGutterActive => "editor.gutter.activeForeground",
            Self::EditorCurrentLine => "editor.currentLine.background",
            Self::EditorCaret => "editor.caret.color",
            Self::EditorSelection => "editor.selection.background",
            Self::StatusError => "status.error",
            Self::StatusWarning => "status.warning",
            Self::StatusSuccess => "status.success",
            Self::StatusInfo => "status.info",
        }
    }
}

/// A complete application theme defining token colors and appearance mode.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct AppTheme {
    pub name: String,
    pub is_dark: bool,
    pub colors: HashMap<String, RgbaColor>,
}

impl AppTheme {
    /// Constructs an empty theme.
    pub fn new(name: impl Into<String>, is_dark: bool) -> Self {
        Self {
            name: name.into(),
            is_dark,
            colors: HashMap::new(),
        }
    }

    /// Resolves a semantic color token, returning the fallback if unassigned.
    pub fn resolve(&self, token: SemanticColorToken) -> RgbaColor {
        if let Some(&color) = self.colors.get(token.token_name()) {
            return color;
        }

        // Built-in intelligent defaults if token is omitted
        match token {
            SemanticColorToken::SurfaceCanvas => RgbaColor::rgb(0x0f, 0x14, 0x1c),
            SemanticColorToken::SurfacePanel => RgbaColor::rgb(0x13, 0x18, 0x22),
            SemanticColorToken::SurfaceHeader => RgbaColor::rgb(0x18, 0x1e, 0x2a),
            SemanticColorToken::SurfaceActive => RgbaColor::rgb(0x21, 0x28, 0x3b),
            SemanticColorToken::SurfaceHover => RgbaColor::new(0xff, 0xff, 0xff, 0x10),
            SemanticColorToken::BorderDivider => RgbaColor::rgb(0x26, 0x2e, 0x3d),
            SemanticColorToken::BorderSubtle => RgbaColor::rgb(0x1e, 0x25, 0x33),
            SemanticColorToken::BorderFocus => RgbaColor::rgb(0x40, 0x82, 0xef),
            SemanticColorToken::TextPrimary => RgbaColor::rgb(0xee, 0xf1, 0xf8),
            SemanticColorToken::TextMuted => RgbaColor::rgb(0x7e, 0x88, 0x9b),
            SemanticColorToken::TextAccent => RgbaColor::rgb(0x3e, 0x8c, 0xf0),
            SemanticColorToken::EditorBackground => RgbaColor::rgb(0x0f, 0x14, 0x1c),
            SemanticColorToken::EditorForeground => RgbaColor::rgb(0xee, 0xf1, 0xf8),
            SemanticColorToken::EditorGutterInactive => RgbaColor::rgb(0x56, 0x60, 0x73),
            SemanticColorToken::EditorGutterActive => RgbaColor::rgb(0xee, 0xf1, 0xf8),
            SemanticColorToken::EditorCurrentLine => RgbaColor::new(0xff, 0xff, 0xff, 0x0a),
            SemanticColorToken::EditorCaret => RgbaColor::rgb(0x3e, 0x8c, 0xf0),
            SemanticColorToken::EditorSelection => RgbaColor::new(0x40, 0x82, 0xef, 0x40),
            SemanticColorToken::StatusError => RgbaColor::rgb(0xf2, 0x55, 0x55),
            SemanticColorToken::StatusWarning => RgbaColor::rgb(0xf2, 0xb8, 0x4b),
            SemanticColorToken::StatusSuccess => RgbaColor::rgb(0x42, 0xc7, 0x77),
            SemanticColorToken::StatusInfo => RgbaColor::rgb(0x40, 0x9f, 0xef),
        }
    }

    /// Sets a semantic token color using hex code.
    pub fn set_token_hex(&mut self, token: SemanticColorToken, hex: &str) {
        if let Some(color) = RgbaColor::from_hex(hex) {
            self.colors.insert(token.token_name().to_string(), color);
        }
    }

    /// Returns the default fallback theme: "Recode Dark".
    pub fn default_dark() -> Self {
        let mut theme = Self::new("Recode Dark", true);
        theme.set_token_hex(SemanticColorToken::SurfaceCanvas, "#0f141c");
        theme.set_token_hex(SemanticColorToken::SurfacePanel, "#131822");
        theme.set_token_hex(SemanticColorToken::SurfaceHeader, "#181e2a");
        theme.set_token_hex(SemanticColorToken::SurfaceActive, "#21283b");
        theme.set_token_hex(SemanticColorToken::BorderDivider, "#262e3d");
        theme.set_token_hex(SemanticColorToken::TextPrimary, "#eef1f8");
        theme.set_token_hex(SemanticColorToken::TextMuted, "#7e889b");
        theme.set_token_hex(SemanticColorToken::TextAccent, "#3e8cf0");
        theme
    }
}

/// The runtime theme engine providing active theme storage and hot-reload.
#[derive(Clone, Debug)]
pub struct ThemeEngine {
    active_theme: AppTheme,
    generation: u64,
}

impl Default for ThemeEngine {
    fn default() -> Self {
        Self::new(AppTheme::default_dark())
    }
}

impl ThemeEngine {
    /// Constructs a theme engine with an initial theme.
    pub fn new(theme: AppTheme) -> Self {
        Self {
            active_theme: theme,
            generation: 1,
        }
    }

    /// Returns the current active theme.
    pub fn theme(&self) -> &AppTheme {
        &self.active_theme
    }

    /// Current theme generation counter (increments on hot reload).
    pub fn generation(&self) -> u64 {
        self.generation
    }

    /// Updates the active theme in place, incrementing generation counter for instant re-render.
    pub fn set_theme(&mut self, theme: AppTheme) {
        self.active_theme = theme;
        self.generation += 1;
    }

    /// Safely loads a theme from JSON text. Falls back to default dark on syntax error.
    pub fn load_from_json(&mut self, json_str: &str) -> Result<(), String> {
        match serde_json::from_str::<AppTheme>(json_str) {
            Ok(theme) => {
                self.set_theme(theme);
                Ok(())
            }
            Err(e) => {
                // Safe fallback without crashing
                self.set_theme(AppTheme::default_dark());
                Err(format!("Theme parsing error: {e}. Reverted to Recode Dark."))
            }
        }
    }
}

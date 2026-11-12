use indexmap::IndexMap;
use serde::Deserialize;
use strum::EnumIter;

#[derive(Debug, PartialEq, Eq, Deserialize)]
#[serde(untagged)]
pub enum VsCodeTokenScope {
    One(String),
    Many(Vec<String>),
}

#[derive(Debug, Deserialize)]
pub struct VsCodeTokenColor {
    pub name: Option<String>,
    pub scope: Option<VsCodeTokenScope>,
    pub settings: VsCodeTokenColorSettings,
}

#[derive(Debug, Deserialize)]
pub struct VsCodeTokenColorSettings {
    pub foreground: Option<String>,
    pub background: Option<String>,
    #[serde(rename = "fontStyle")]
    pub font_style: Option<String>,
}

#[derive(Debug, PartialEq, Copy, Clone, EnumIter)]
pub enum RecodeSyntaxToken {
    Attribute,
    Boolean,
    Comment,
    CommentDoc,
    Constant,
    Constructor,
    Embedded,
    Emphasis,
    EmphasisStrong,
    Enum,
    Function,
    Hint,
    Keyword,
    Label,
    LinkText,
    LinkUri,
    Number,
    Operator,
    Predictive,
    Preproc,
    Primary,
    Property,
    Punctuation,
    PunctuationBracket,
    PunctuationDelimiter,
    PunctuationListMarker,
    PunctuationSpecial,
    String,
    StringEscape,
    StringRegex,
    StringSpecial,
    StringSpecialSymbol,
    Tag,
    TextLiteral,
    Title,
    Type,
    Variable,
    VariableSpecial,
    Variant,
}

impl std::fmt::Display for RecodeSyntaxToken {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                RecodeSyntaxToken::Attribute => "attribute",
                RecodeSyntaxToken::Boolean => "boolean",
                RecodeSyntaxToken::Comment => "comment",
                RecodeSyntaxToken::CommentDoc => "comment.doc",
                RecodeSyntaxToken::Constant => "constant",
                RecodeSyntaxToken::Constructor => "constructor",
                RecodeSyntaxToken::Embedded => "embedded",
                RecodeSyntaxToken::Emphasis => "emphasis",
                RecodeSyntaxToken::EmphasisStrong => "emphasis.strong",
                RecodeSyntaxToken::Enum => "enum",
                RecodeSyntaxToken::Function => "function",
                RecodeSyntaxToken::Hint => "hint",
                RecodeSyntaxToken::Keyword => "keyword",
                RecodeSyntaxToken::Label => "label",
                RecodeSyntaxToken::LinkText => "link_text",
                RecodeSyntaxToken::LinkUri => "link_uri",
                RecodeSyntaxToken::Number => "number",
                RecodeSyntaxToken::Operator => "operator",
                RecodeSyntaxToken::Predictive => "predictive",
                RecodeSyntaxToken::Preproc => "preproc",
                RecodeSyntaxToken::Primary => "primary",
                RecodeSyntaxToken::Property => "property",
                RecodeSyntaxToken::Punctuation => "punctuation",
                RecodeSyntaxToken::PunctuationBracket => "punctuation.bracket",
                RecodeSyntaxToken::PunctuationDelimiter => "punctuation.delimiter",
                RecodeSyntaxToken::PunctuationListMarker => "punctuation.list_marker",
                RecodeSyntaxToken::PunctuationSpecial => "punctuation.special",
                RecodeSyntaxToken::String => "string",
                RecodeSyntaxToken::StringEscape => "string.escape",
                RecodeSyntaxToken::StringRegex => "string.regex",
                RecodeSyntaxToken::StringSpecial => "string.special",
                RecodeSyntaxToken::StringSpecialSymbol => "string.special.symbol",
                RecodeSyntaxToken::Tag => "tag",
                RecodeSyntaxToken::TextLiteral => "text.literal",
                RecodeSyntaxToken::Title => "title",
                RecodeSyntaxToken::Type => "type",
                RecodeSyntaxToken::Variable => "variable",
                RecodeSyntaxToken::VariableSpecial => "variable.special",
                RecodeSyntaxToken::Variant => "variant",
            }
        )
    }
}

impl RecodeSyntaxToken {
    pub fn find_best_token_color_match<'a>(
        &self,
        token_colors: &'a [VsCodeTokenColor],
    ) -> Option<&'a VsCodeTokenColor> {
        let mut ranked_matches = IndexMap::new();

        for (ix, token_color) in token_colors.iter().enumerate() {
            if token_color.settings.foreground.is_none() {
                continue;
            }

            let Some(rank) = self.rank_match(token_color) else {
                continue;
            };

            if rank > 0 {
                ranked_matches.insert(ix, rank);
            }
        }

        ranked_matches
            .into_iter()
            .max_by_key(|(_, rank)| *rank)
            .map(|(ix, _)| &token_colors[ix])
    }

    fn rank_match(&self, token_color: &VsCodeTokenColor) -> Option<u32> {
        let candidate_scopes = match token_color.scope.as_ref()? {
            VsCodeTokenScope::One(scope) => vec![scope],
            VsCodeTokenScope::Many(scopes) => scopes.iter().collect(),
        }
        .iter()
        .flat_map(|scope| scope.split(',').map(|s| s.trim()))
        .collect::<Vec<_>>();

        let scopes_to_match = self.to_vscode();
        let number_of_scopes_to_match = scopes_to_match.len();

        let mut matches = 0;

        for (ix, scope) in scopes_to_match.into_iter().enumerate() {
            // Assign each entry a weight that is inversely proportional to its
            // position in the list.
            //
            // Entries towards the front are weighted higher than those towards the end.
            let weight = (number_of_scopes_to_match - ix) as u32;

            if candidate_scopes.contains(&scope) {
                matches += 1 + weight;
            }
        }

        Some(matches)
    }

    pub fn fallbacks(&self) -> &[Self] {
        match self {
            RecodeSyntaxToken::CommentDoc => &[RecodeSyntaxToken::Comment],
            RecodeSyntaxToken::Number => &[RecodeSyntaxToken::Constant],
            RecodeSyntaxToken::VariableSpecial => &[RecodeSyntaxToken::Variable],
            RecodeSyntaxToken::PunctuationBracket
            | RecodeSyntaxToken::PunctuationDelimiter
            | RecodeSyntaxToken::PunctuationListMarker
            | RecodeSyntaxToken::PunctuationSpecial => &[RecodeSyntaxToken::Punctuation],
            RecodeSyntaxToken::StringEscape
            | RecodeSyntaxToken::StringRegex
            | RecodeSyntaxToken::StringSpecial
            | RecodeSyntaxToken::StringSpecialSymbol => &[RecodeSyntaxToken::String],
            _ => &[],
        }
    }

    fn to_vscode(self) -> Vec<&'static str> {
        match self {
            RecodeSyntaxToken::Attribute => vec!["entity.other.attribute-name"],
            RecodeSyntaxToken::Boolean => vec!["constant.language"],
            RecodeSyntaxToken::Comment => vec!["comment"],
            RecodeSyntaxToken::CommentDoc => vec!["comment.block.documentation"],
            RecodeSyntaxToken::Constant => vec!["constant", "constant.language", "constant.character"],
            RecodeSyntaxToken::Constructor => {
                vec![
                    "entity.name.tag",
                    "entity.name.function.definition.special.constructor",
                ]
            }
            RecodeSyntaxToken::Embedded => vec!["meta.embedded"],
            RecodeSyntaxToken::Emphasis => vec!["markup.italic"],
            RecodeSyntaxToken::EmphasisStrong => vec![
                "markup.bold",
                "markup.italic markup.bold",
                "markup.bold markup.italic",
            ],
            RecodeSyntaxToken::Enum => vec!["support.type.enum"],
            RecodeSyntaxToken::Function => vec![
                "entity.function",
                "entity.name.function",
                "variable.function",
            ],
            RecodeSyntaxToken::Hint => vec![],
            RecodeSyntaxToken::Keyword => vec![
                "keyword",
                "keyword.other.fn.rust",
                "keyword.control",
                "keyword.control.fun",
                "keyword.control.class",
                "punctuation.accessor",
                "entity.name.tag",
            ],
            RecodeSyntaxToken::Label => vec![
                "label",
                "entity.name",
                "entity.name.import",
                "entity.name.package",
            ],
            RecodeSyntaxToken::LinkText => vec!["markup.underline.link", "string.other.link"],
            RecodeSyntaxToken::LinkUri => vec!["markup.underline.link", "string.other.link"],
            RecodeSyntaxToken::Number => vec!["constant.numeric", "number"],
            RecodeSyntaxToken::Operator => vec!["operator", "keyword.operator"],
            RecodeSyntaxToken::Predictive => vec![],
            RecodeSyntaxToken::Preproc => vec![
                "preproc",
                "meta.preprocessor",
                "punctuation.definition.preprocessor",
            ],
            RecodeSyntaxToken::Primary => vec![],
            RecodeSyntaxToken::Property => vec![
                "variable.member",
                "support.type.property-name",
                "variable.object.property",
                "variable.other.field",
            ],
            RecodeSyntaxToken::Punctuation => vec![
                "punctuation",
                "punctuation.section",
                "punctuation.accessor",
                "punctuation.separator",
                "punctuation.definition.tag",
            ],
            RecodeSyntaxToken::PunctuationBracket => vec![
                "punctuation.bracket",
                "punctuation.definition.tag.begin",
                "punctuation.definition.tag.end",
            ],
            RecodeSyntaxToken::PunctuationDelimiter => vec![
                "punctuation.delimiter",
                "punctuation.separator",
                "punctuation.terminator",
            ],
            RecodeSyntaxToken::PunctuationListMarker => {
                vec!["markup.list punctuation.definition.list.begin"]
            }
            RecodeSyntaxToken::PunctuationSpecial => vec!["punctuation.special"],
            RecodeSyntaxToken::String => vec!["string"],
            RecodeSyntaxToken::StringEscape => {
                vec!["string.escape", "constant.character", "constant.other"]
            }
            RecodeSyntaxToken::StringRegex => vec!["string.regex"],
            RecodeSyntaxToken::StringSpecial => vec!["string.special", "constant.other.symbol"],
            RecodeSyntaxToken::StringSpecialSymbol => {
                vec!["string.special.symbol", "constant.other.symbol"]
            }
            RecodeSyntaxToken::Tag => vec!["tag", "entity.name.tag", "meta.tag.sgml"],
            RecodeSyntaxToken::TextLiteral => vec!["text.literal", "string"],
            RecodeSyntaxToken::Title => vec!["title", "entity.name"],
            RecodeSyntaxToken::Type => vec![
                "entity.name.type",
                "entity.name.type.primitive",
                "entity.name.type.numeric",
                "keyword.type",
                "support.type",
                "support.type.primitive",
                "support.class",
            ],
            RecodeSyntaxToken::Variable => vec![
                "variable",
                "variable.language",
                "variable.member",
                "variable.parameter",
                "variable.parameter.function-call",
            ],
            RecodeSyntaxToken::VariableSpecial => vec![
                "variable.special",
                "variable.member",
                "variable.annotation",
                "variable.language",
            ],
            RecodeSyntaxToken::Variant => vec!["variant"],
        }
    }
}

//! High-performance fuzzy subsequence scoring and matching character index calculation.

use serde::{Deserialize, Serialize};

/// Result of a fuzzy match query against a candidate string.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
pub struct FuzzyMatchResult {
    pub score: i32,
    pub match_indices: Vec<usize>,
}

/// Evaluates how closely `query` matches `target`, returning a score and matching indices.
/// Higher score indicates higher relevance. Returns `None` if query is not a subsequence.
pub fn fuzzy_match(query: &str, target: &str) -> Option<FuzzyMatchResult> {
    if query.is_empty() {
        return Some(FuzzyMatchResult {
            score: 0,
            match_indices: Vec::new(),
        });
    }

    let q_chars: Vec<char> = query.to_lowercase().chars().collect();
    let t_chars: Vec<char> = target.chars().collect();
    let t_chars_lower: Vec<char> = target.to_lowercase().chars().collect();

    let mut q_idx = 0;
    let mut match_indices = Vec::with_capacity(q_chars.len());
    let mut score: i32 = 0;
    let mut prev_match_idx: Option<usize> = None;

    for (t_idx, &t_ch) in t_chars_lower.iter().enumerate() {
        if q_idx < q_chars.len() && t_ch == q_chars[q_idx] {
            match_indices.push(t_idx);

            // Base score for match
            score += 10;

            // Consecutive match bonus
            if let Some(prev) = prev_match_idx {
                if prev + 1 == t_idx {
                    score += 15;
                }
            }

            // Word-boundary bonus
            let is_word_boundary = if t_idx == 0 {
                true
            } else {
                let prev_char = t_chars[t_idx - 1];
                prev_char == ' '
                    || prev_char == '_'
                    || prev_char == '-'
                    || prev_char == '/'
                    || prev_char == ':'
                    || prev_char == '.'
                    || (prev_char.is_lowercase() && t_chars[t_idx].is_uppercase())
            };

            if is_word_boundary {
                score += 30;
            }

            prev_match_idx = Some(t_idx);
            q_idx += 1;
        }
    }

    if q_idx == q_chars.len() {
        // Exact prefix match bonus
        if match_indices.first() == Some(&0) {
            score += 50;
        }
        Some(FuzzyMatchResult {
            score,
            match_indices,
        })
    } else {
        None
    }
}

pub use env_var::{EnvVar, bool_env_var, env_var};
use std::sync::LazyLock;

/// Whether Recode is running in stateless mode.
/// When true, Recode will use in-memory databases instead of persistent storage.
pub static RECODE_STATELESS: LazyLock<bool> = bool_env_var!("RECODE_STATELESS");

use client::RECODE_URL_SCHEME;
use gpui::{AsyncApp, actions};

actions!(
    cli,
    [
        /// Registers the recode:// URL scheme handler.
        RegisterRecodeScheme
    ]
);

pub async fn register_recode_scheme(cx: &AsyncApp) -> anyhow::Result<()> {
    let _ = cx.update(|cx| cx.register_url_scheme(RECODE_URL_SCHEME)).await;
    Ok(())
}

use client::ZED_URL_SCHEME;
use gpui::{AsyncApp, actions};

actions!(
    cli,
    [
        /// Registers the zed:// URL scheme handler.
        RegisterZedScheme
    ]
);

pub async fn register_zed_scheme(cx: &AsyncApp) -> anyhow::Result<()> {
    let (task1, task2) = cx.update(|cx| {
        (
            cx.register_url_scheme("recode"),
            cx.register_url_scheme(ZED_URL_SCHEME),
        )
    });
    let _ = task1.await;
    let _ = task2.await;
    Ok(())
}

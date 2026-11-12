# Cli

## Testing

You can test your changes to the `cli` crate by first building the main recode binary:

```
cargo build -p recode
```

And then building and running the `cli` crate with the following parameters:

```
 cargo run -p cli -- --recode ./target/debug/recode.exe
```

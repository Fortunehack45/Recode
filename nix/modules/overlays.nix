{ inputs, ... }:
{
  flake.overlays.default =
    final: _:
    let
      mkRecode = import ../toolchain.nix { inherit inputs; };
    in
    {
      recode-editor = mkRecode final;
    };
}

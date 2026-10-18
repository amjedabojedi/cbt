# A fresh x86_64 worker needs Node, PostgreSQL and Nix, not host apt libraries.
# Keep this toolchain pin aligned with webkit-runtime.nix's native ABI pin.
let
  pkgs = import (builtins.fetchTarball {
    url = "https://codeload.github.com/NixOS/nixpkgs/tar.gz/8b27c1239e5c421a2bbc2c65d52e4a6fbf2ff296";
    sha256 = "1gx0hihb7kcddv5h0k7dysp2xhf1ny0aalxhjbpj2lmvj7h9g80a";
  }) { system = "x86_64-linux"; config = {}; overlays = []; };
in
pkgs.mkShell {
  packages = with pkgs; [
    nodejs_22 postgresql_16 nix cacert git bash coreutils
    # npm native modules may need node-gyp when no prebuilt binary is available.
    python3 gnumake gcc
  ];
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
}

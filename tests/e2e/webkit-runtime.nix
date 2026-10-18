# Native libraries only: browser binaries remain in .cache/ms-playwright.
# Pin the dependency ABI independently of Replit's workspace Nix channel.
let
  pkgs = import (builtins.fetchTarball {
    url = "https://codeload.github.com/NixOS/nixpkgs/tar.gz/8b27c1239e5c421a2bbc2c65d52e4a6fbf2ff296";
    sha256 = "1gx0hihb7kcddv5h0k7dysp2xhf1ny0aalxhjbpj2lmvj7h9g80a";
  }) { system = "x86_64-linux"; config = {}; overlays = []; };
  libs = with pkgs; [
    stdenv.cc.cc.lib glibc glib gtk3 gtk4 pango harfbuzz cairo gdk-pixbuf
    graphene vulkan-loader icu74 libxml2 sqlite libxslt lcms2 libevent
    systemd libgcrypt libgpg-error libtasn1 libpsl nghttp2 zlib x264
    libopus flite libwebp libavif libepoxy libjpeg8 libpng harfbuzzFull
    wayland libmanette enchant2 libdrm libsecret hyphen at-spi2-atk
    libxkbcommon libglvnd mesa expat fontconfig freetype dbus
    xorg.libX11 xorg.libXcomposite xorg.libXdamage xorg.libXext
    xorg.libXfixes xorg.libXrandr xorg.libxcb xorg.libXrender
    gst_all_1.gstreamer gst_all_1.gst-plugins-base
    gst_all_1.gst-plugins-good gst_all_1.gst-plugins-bad
  ];
in
assert pkgs.stdenv.hostPlatform.is64bit;
pkgs.writeText "resilience-webkit-runtime.json" (builtins.toJSON {
  schema = 1;
  libraryPath = pkgs.lib.makeLibraryPath libs;
  interpreter = "${pkgs.glibc}/lib/ld-linux-x86-64.so.2";
  patchelf = "${pkgs.patchelf}/bin/patchelf";
  ldd = "${pkgs.glibc.bin}/bin/ldd";
  eglLibrary = "${pkgs.mesa.drivers}/lib/libEGL_mesa.so.0";
  glesLibrary = "${pkgs.libglvnd}/lib/libGLESv2.so.2";
  x264Library = "${pkgs.lib.getLib pkgs.x264}/lib/libx264.so";
  driPath = "${pkgs.mesa.drivers}/lib/dri";
  driLibrary = "${pkgs.mesa.drivers}/lib/dri/swrast_dri.so";
  fontConfig = pkgs.makeFontsConf { fontDirectories = [ pkgs.dejavu_fonts ]; };
})

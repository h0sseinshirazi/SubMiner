# Dictionary engine notices

These notices accompany the three locally rebuilt Hoshidicts WASM runtimes.
`SOURCE.json` in the extension root records the Hoshidicts revision, external
dependency commits, and Emscripten 6.0.9 toolchain version. The corresponding
source and rebuild instructions are in SubMiner's `vendor/hachidori/` snapshot.

The engine links Glaze, Zstandard, unordered_dense, libdeflate, utf8proc,
UTF8-CPP, xxHash, lzokay, and gumbo-parser, and uses kanji-processor data.
Each component's original license is included here. Emscripten, musl, libc++,
libc++abi, compiler-rt, and libunwind notices come from the installed 6.0.9
Emscripten toolchain. `reader-and-language-NOTICE` covers upstream reader and
Japanese language adaptations elsewhere in the extension.

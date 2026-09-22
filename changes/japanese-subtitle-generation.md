type: added
area: subtitles

- Generate Japanese SRT subtitles locally with whisper.cpp from a modal (Ctrl+Shift+G), the empty subtitle sidebar's generation button, or `subminer generate-subs`, with progress, cancellation, and automatic loading into mpv.
- Pick an official multilingual model (including quantized variants) with size and accuracy guidance and download it in-app, or point Settings at an existing model. `large-v3-turbo` is recommended when CUDA support is detected, `small` otherwise. whisper-cli, ffmpeg, and ffprobe are found on PATH unless overridden, and missing tools are named before any download starts.
- Optional "Focus on spoken dialogue" mode uses a separately downloadable Silero VAD model, keeping uncertain audible sections so dialogue under music is not dropped (songs may be transcribed too).
- Long passages are split near detected speech starts or quiet pauses, guided by an eligible embedded or external subtitle track already loaded in mpv when one is available, to reduce early subtitle timing. Each passage runs in a fresh Whisper process to avoid repeated-character output.

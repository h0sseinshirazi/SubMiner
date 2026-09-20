type: fixed
area: overlay

- Fixed the Hyprland overlay covering fullscreen mpv on fractionally scaled monitors. Monitor bounds from `hyprctl -j monitors` are reported in physical pixels, so a 1920x1080 screen at scale 1.25 sized the overlay to 1920x1080 instead of the 1536x864 of layout space mpv actually occupies, hiding the video behind a full-screen subtitle layer.

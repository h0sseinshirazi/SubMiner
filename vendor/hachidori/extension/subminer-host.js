// SubMiner's popup contract is shared with its default Yomitan backend.
// SPDX-License-Identifier: GPL-3.0-or-later
(function () {
  "use strict";
  const emit = (name) => window.dispatchEvent(new CustomEvent(name));
  globalThis.SubMinerHachidori = {
    prioritizeCharacterResults(results, { primaryReading = "" } = {}, presentation = []) {
      const prefix = "SubMiner Character Dictionary";
      const aliases = new Map(presentation.map(entry => [entry.title, entry.displayName]));
      const character = glossary => glossary?.dictionary?.startsWith(prefix)
        || aliases.get(glossary?.dictionary)?.startsWith(prefix) || false;
      // Keep the native linguistic ranking ahead of the character preference,
      // matching Yomitan's boost before frequency and user dictionary order.
      const ranked = results.map(result => ({ ...result, term: { ...result.term,
        glossaries: [...result.term.glossaries].sort((a, b) => Number(character(b)) - Number(character(a))),
      } }));
      return ranked.sort((a, b) =>
        (primaryReading ? Number(b.term.reading === primaryReading) - Number(a.term.reading === primaryReading) : 0)
        || (b.matched || b.term.expression).length - (a.matched || a.term.expression).length
        || (a.preprocessorSteps ?? 0) - (b.preprocessorSteps ?? 0)
        || (a.trace?.length ?? 0) - (b.trace?.length ?? 0)
        || Number(b.term.expression === b.deinflected) - Number(a.term.expression === a.deinflected)
        || Number(character(b.term.glossaries[0])) - Number(character(a.term.glossaries[0])));
    },
    markHost(host, visible) {
      host?.setAttribute("data-subminer-yomitan-popup-host", "true");
      host?.setAttribute("data-subminer-yomitan-popup-visible", String(visible));
    },
    attention(host, visible) {
      this.markHost(host, visible);
      emit(visible ? "yomitan-popup-shown" : "yomitan-popup-hidden");
    },
    lookup() { emit("subminer-yomitan-lookup"); },
    popup(popup) {
      popup.addEventListener("mouseenter", () => emit("yomitan-popup-mouse-enter"));
      popup.addEventListener("mouseleave", () => emit("yomitan-popup-mouse-leave"));
    },
    connect({ hide, clear, action, keydown, scroll, cycleAudio }) {
      const listener = (event) => {
        const detail = event.detail;
        if (!detail || typeof detail !== "object") return;
        switch (detail.type) {
          case "setVisible": if (detail.visible === false) hide(); break;
          case "clearActiveTextSource": clear(); break;
          case "mineSelected": action("addNote"); break;
          case "scanSelectedText": action("scanSelectedText"); break;
          case "playCurrentAudio": action("playAudio"); break;
          case "cycleAudioSource": cycleAudio(detail.direction === -1 ? -1 : 1); break;
          case "scrollBy":
            scroll(Number.isFinite(detail.deltaX) ? detail.deltaX : 0,
              Number.isFinite(detail.deltaY) ? detail.deltaY : 0);
            break;
          case "simulateHotkey":
          case "forwardKeyDown": {
            if (typeof detail.key !== "string" || !Array.isArray(detail.modifiers)) return;
            const modifiers = detail.modifiers;
            keydown(new KeyboardEvent("keydown", {
              key: detail.key, code: typeof detail.code === "string" ? detail.code : "",
              repeat: detail.repeat === true, cancelable: true,
              altKey: modifiers.includes("alt"), ctrlKey: modifiers.includes("ctrl"),
              metaKey: modifiers.includes("meta"), shiftKey: modifiers.includes("shift"),
            }));
            break;
          }
        }
      };
      window.addEventListener("subminer-yomitan-popup-command", listener);
      return () => window.removeEventListener("subminer-yomitan-popup-command", listener);
    },
  };
}());

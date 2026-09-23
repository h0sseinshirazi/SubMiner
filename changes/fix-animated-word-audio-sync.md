type: fixed
area: anki

- Added `ankiConnect.fields.wordAudio` so word audio is read separately from the sentence-audio destination, fixing animated images that started moving immediately when `fields.audio` pointed to `SentenceAudio`.

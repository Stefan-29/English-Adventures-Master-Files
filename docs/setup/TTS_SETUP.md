# Lesson listening voices

The **Listen to Lesson** control uses the browser's built-in Web Speech API.
It is free, needs no account or API key, and works with the English voices
available in the learner's browser and operating system.

## Use it

1. Open a lesson and choose **Listen to Lesson**.
2. Leave **Best available voice** selected to use the service's preferred
   English voice, or choose another English voice installed in the browser.
3. Use **Pause**, **Resume**, or **Stop** while listening.

The voice list appears when the browser finishes loading available voices.
Natural or neural-sounding voices are preferred automatically when the
browser exposes them. Voice quality and availability vary by browser, device,
and installed language packs. No third-party account or configuration is
required.

Playback uses a slightly slower default pace to make explanations easier to
follow. Lesson text is read as prose, with HTML markup omitted. Longer lessons
are spoken in short sections to keep playback responsive.

## Voice preference

Choosing a voice saves its browser voice identifier in local storage for the
next visit on that browser. Select **Best available voice** to return to
automatic voice selection. The preference does not leave the device.

## Availability and troubleshooting

- Use a current browser that supports speech synthesis, such as a recent
  Chrome, Edge, Firefox, or Safari.
- If the voice menu is empty, wait briefly for the browser's voice list or
  install/enable an English speech voice in the device's language settings.
- If no audio plays, check that the device is not muted and that the browser
  has permission to play audio after a user gesture.
- Voice names and quality depend on the device; the app does not download or
  promise a specific commercial voice.

## Technical reference

- [MDN: Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MDN: SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [MDN: SpeechSynthesisUtterance](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance)

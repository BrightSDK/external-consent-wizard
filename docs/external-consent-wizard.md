# external-consent-wizard

GitHub: https://github.com/BrightSDK/external-consent-wizard  
Live app: https://brightsdk.github.io/external-consent-wizard/  
License: MIT

## Purpose

A React 19 web application that lets developers visually configure and preview a `bright-sdk-external-consent` dialog before integration. The wizard generates the exact `ConsentModule.create()` call parameters needed to embed the consent UI in their BrightSDK app.

Key capabilities from source:
- Real-time consent dialog preview (renders live using `window.ConsentModule`)
- Configuration of all visual and text fields through a split-panel UI
- URL sharing — config is base64-encoded into the URL hash
- One-click copy of the shareable URL
- Step-by-step implementation guide modal
- Focus-based preview highlighting: focused form field highlights the corresponding dialog element

---

## Hosted URL

The wizard is deployed as a static site on GitHub Pages:

```
https://brightsdk.github.io/external-consent-wizard/
```

Configurations can be shared by appending a base64 fragment:

```
https://brightsdk.github.io/external-consent-wizard/#<btoa(JSON.stringify(config))>
```

---

## Configuration Fields

From `getDefaultConfig()` in `ConsentConfigurator.jsx`:

| Field | Default | Description |
|---|---|---|
| `logo` | `"img/logo.png"` | App logo shown in dialog |
| `qrCode` | `""` | Optional QR code image URL |
| `title` | `"Bright SDK Consent"` | Dialog heading/title |
| `benefitText` | `"To support the app"` | Explanatory text under title |
| `acceptButton` | `""` | Custom image for Accept button |
| `declineButton` | `""` | Custom image for Decline button |
| `acceptButtonText` | `"Accept"` | Label on Accept button |
| `declineButtonText` | `"Decline"` | Label on Decline button |
| `backgroundColor` | `"rgba(255, 255, 255, 0.25)"` | Dialog background color |
| `accentColor` | `"#667eea"` | Title/heading accent color |
| `acceptTextColor` | `"#FFFFFF"` | Accept button text color |
| `declineTextColor` | `"rgba(0, 0, 0, 0.9)"` | Decline button text color |
| `borderColor` | `"rgba(64, 28, 28, 0.3)"` | Decline button border color |
| `outlineColor` | `"rgba(0, 0, 0, 0.5)"` | Dialog outer outline color |
| `language` | `"en"` | Language code passed to ConsentModule |

---

## Live Preview Mechanism

From `ConsentConfigurator.jsx` source — the preview is rendered by calling the actual `ConsentModule` inside a `div#consent-container` in the right panel:

```js
window.ConsentModule.create("consent-container", params).show();
```

This means the preview is a live instance of the same consent dialog that would appear in an actual app. The `bright-sdk-external-consent` bundle is loaded from `public/lib` or via `dist/index.html`.

Changes to config fields trigger a debounced preview recreate. While a form field has focus (`isEditingRef.current = true`), text and color changes are applied directly to the live DOM without recreating the preview, to preserve caret position and avoid input interruption.

---

## URL Config Sharing

From source — `handleShare()`:

```js
window.location.hash = btoa(JSON.stringify(config));
navigator.clipboard.writeText(window.location.href);
```

URL hash is only updated on explicit Share click, not on every config change. On page load, `getConfigFromURL()` decodes the hash and restores saved config. If no hash is found, defaults are applied.

---

## Focus Highlighting Behavior

When a form field is focused, `highlightPreviewElement(fieldName)` applies visual outlines to the corresponding element in the live preview to indicate which element is being edited:

| Field type | Highlight color |
|---|---|
| `accentColor` | yellow `rgba(255, 193, 7, ...)` |
| `acceptTextColor`, `declineTextColor` | purple `rgba(138, 43, 226, ...)` |
| `logo`, `qrCode`, `acceptButton`, `declineButton` | teal `rgba(0, 150, 136, ...)` |
| `borderColor` | red-orange `rgba(255, 69, 0, ...)` |
| `backgroundColor`, `outlineColor`, `language` | whole popup element highlighted |
| all others | yellow default |

A tooltip label appears above the highlighted element identifying what is being edited.

Highlights are cleared on blur unless focus moved into the preview itself (in which case focus is restored to the input).

---

## Color Input Handling

Color fields use a hidden native `<input type="color">` element appended to `document.body`. When the user clicks a color swatch in the MUI form, the wizard:

1. Syncs the current hex value into the native input.
2. Calls `native.showPicker()` (or `.click()` as fallback) to open the OS color picker — this must happen inside a user gesture event to satisfy browser policy.
3. Propagates `input`/`change` events from the native picker back through `handleChange` to update state.

Key/press events on color fields are stopped from propagating to avoid conflicts with the app's own keydown handlers.

---

## Components

### `ConsentConfigurator.jsx`

Main component. Manages:
- `config` state
- `isEditingRef` — editing guard to prevent preview recreate while typing
- `activeElementRef` / `lastFocusedFieldRef` — for focus restoration
- `lastBlurAt` — triggers preview recreation on field blur
- `EnhancedTextField` / `EnhancedSelect` — wrappers adding `onFocus`/`onBlur`/`onChange` to MUI inputs
- Left panel: form fields (visual elements, text content, color palette)
- Right panel: live preview via `ConsentModule`
- Action buttons: Reset, View Implementation Steps, Share

### `ImplementationSteps.jsx`

Modal dialog (MUI `<Dialog>`) showing the step-by-step integration guide with code examples generated from the current config. Opened by "View Implementation Steps" button.

### `App.jsx`

Trivially renders `<ConsentConfigurator />`. Exists for clarity.

---

## Stack

- React 19 with hooks
- Material-UI (MUI) 6: `Button`, `Card`, `TextField`, `Select`, `Tabs`, `Dialog`, `Typography`, `Grid`
- Webpack 5 with babel-loader, style-loader, css-loader
- `@babel/preset-env` + `@babel/preset-react`
- `@fontsource/roboto` for typography

---

## Development

```bash
npm install
npm start       # dev server at http://localhost:8081 with hot reload
npm run build   # production bundle to dist/
npm run serve   # serve built dist/
```

Webpack dev server config: serves `public/` as static root, enables HMR, opens browser automatically.

---

## Project Structure

```
external-consent-wizard/
├── public/
│   ├── index.html          ← HTML template used by webpack HtmlWebpackPlugin
│   ├── img/                ← sample images (logo.png, qr.png, …)
│   └── lib                 ← ConsentModule runtime (loaded in index.html)
├── src/
│   ├── index.js            ← ReactDOM.createRoot → mounts ConsentConfigurator
│   ├── App.jsx             ← thin shell rendering ConsentConfigurator
│   └── components/
│       ├── ConsentConfigurator.jsx  ← main app logic + UI
│       └── ImplementationSteps.jsx  ← implementation guide modal
├── dist/                   ← built output (bundle.js, fonts, img)
├── webpack.config.js
└── package.json
```

---

## Integration Code Generated by the Wizard

The wizard generates `ConsentModule.create()` calls ready to paste. Example based on default config:

```js
ConsentModule.create("your-container-id", {
  logo: "img/logo.png",
  title: "Bright SDK Consent",
  benefitText: "To support the app",
  acceptButtonText: "Accept",
  declineButtonText: "Decline",
  backgroundColor: "rgba(255, 255, 255, 0.25)",
  accentColor: "#667eea",
  acceptTextColor: "#FFFFFF",
  declineTextColor: "rgba(0, 0, 0, 0.9)",
  borderColor: "rgba(64, 28, 28, 0.3)",
  outlineColor: "rgba(0, 0, 0, 0.5)",
  language: "en",
  onAccept: () => { /* user opted in */ },
  onDecline: () => { /* user opted out */ },
}).show();
```

This is consumed by `bright-sdk-external-consent` (the separate component library), not by the wizard itself.

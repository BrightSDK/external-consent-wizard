import "@fontsource/roboto";
import { Button, Card, CardContent, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Snackbar, Tab, Tabs, TextField, Typography } from "@mui/material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ImplementationSteps from "./ImplementationSteps";

// Force React to be used - prevents auto-removal
const _forceReactUsage = React.createElement;

// TabPanel component for managing tab content
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      style={{
        backgroundColor: 'transparent',
        background: 'none'
      }}
      {...other}
    >
      {value === index && (
        <div style={{
          paddingTop: '16px',
          backgroundColor: 'transparent',
          background: 'none'
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

const ConsentConfigurator = () => {
  // Helpers to normalize colors to #RRGGBB for implementation output
  const normalizeHex = (hex) => {
    if (typeof hex !== 'string') return null;
    let h = hex.trim();
    if (!h.startsWith('#')) return null;
    h = h.slice(1);
    if (h.length === 3) {
      h = h.split('').map(ch => ch + ch).join('');
    } else if (h.length === 4) {
      // #RGBA -> expand and drop alpha
      const r = h[0] + h[0];
      const g = h[1] + h[1];
      const b = h[2] + h[2];
      h = r + g + b;
    } else if (h.length === 8) {
      // #RRGGBBAA -> drop alpha
      h = h.slice(0, 6);
    }
    if (h.length !== 6) return null;
    if (!/^([0-9a-fA-F]{6})$/.test(h)) return null;
    return '#' + h.toUpperCase();
  };

  const rgbToHex = (r, g, b) => {
    const toHex = (n) => {
      const clamped = Math.max(0, Math.min(255, Math.round(Number(n) || 0)));
      return clamped.toString(16).padStart(2, '0');
    };
    return ('#' + toHex(r) + toHex(g) + toHex(b)).toUpperCase();
  };

  const parseRgbString = (str) => {
    if (typeof str !== 'string') return null;
    const m = str.trim().match(/^rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
    if (!m) return null;
    const [_, r, g, b] = m;
    return rgbToHex(r, g, b);
  };

  const anyCssToHex = (val) => {
    if (typeof val !== 'string') return null;
    // Try direct hex normalization first
    const asHex = normalizeHex(val);
    if (asHex) return asHex;
    // Try rgb/rgba()
    const fromRgb = parseRgbString(val);
    if (fromRgb) return fromRgb;
    // Fallback: let the browser resolve named/hsl/etc. using a temp element
    try {
      const el = document.createElement('span');
      el.style.color = val;
      document.body.appendChild(el);
      const computed = getComputedStyle(el).color; // rgb(a)
      el.remove();
      const resolved = parseRgbString(computed);
      if (resolved) return resolved;
    } catch (_) {}
    return null;
  };

  const colorKeys = new Set([
    'backgroundColor',
    'accentColor',
    'acceptTextColor',
    'declineTextColor',
    'borderColor',
    'outlineColor',
  ]);

  // Build a config object without empty props and with colors normalized to hex
  const buildImplementationConfig = (cfg) => {
    const result = {};
    try {
      Object.entries(cfg || {}).forEach(([k, v]) => {
        if (v == null) return; // drop null/undefined
        if (typeof v === 'string') {
          const trimmed = v.trim();
          if (!trimmed) return; // drop empty strings
          if (colorKeys.has(k)) {
            const hex = anyCssToHex(trimmed);
            if (hex) {
              result[k] = hex; // pass colors as #RRGGBB
            } else {
              result[k] = trimmed.startsWith('#') ? trimmed : trimmed; // fallback
            }
          } else {
            result[k] = v;
          }
          return;
        }
        if (Array.isArray(v)) {
          if (v.length) result[k] = v; // keep non-empty arrays
          return;
        }
        if (typeof v === 'object') {
          const nested = buildImplementationConfig(v);
          if (Object.keys(nested).length) result[k] = nested; // keep non-empty objects
          return;
        }
        // numbers, booleans, others
        result[k] = v;
      });
    } catch (_) {}
    return result;
  };

  const getDefaultConfig = () => ({
    logo: "img/logo.png",
    qrCode: "",
    title: "Bright SDK Consent",
    benefitText: "To support the app",
    acceptButton: "",
    declineButton: "",
    acceptButtonText: "Accept",
    declineButtonText: "Decline",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    accentColor: "#667eea",
    acceptTextColor: "#FFFFFF",
    declineTextColor: "rgba(0, 0, 0, 0.9)",
    borderColor: "rgba(64, 28, 28, 0.3)",
    outlineColor: "rgba(0, 0, 0, 0.5)",
    language: "en"
  });

  const getConfigFromURL = () => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      try {
        return JSON.parse(atob(hash));
      } catch (e) {
        console.error("Invalid hash data");
      }
    }
    return getDefaultConfig();
  };

  const [config, setConfig] = useState(getConfigFromURL);
  const implementationConfig = useMemo(() => buildImplementationConfig(config), [config]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const updateTimeoutRef = useRef(null);
  const activeElementRef = useRef(null);
  const isEditingRef = useRef(false);
  const lastFocusedFieldRef = useRef(null);
  const tabSwitchingRef = useRef(false);
  const justFocusedAtRef = useRef(0);
  const [lastBlurAt, setLastBlurAt] = useState(0);
  const suppressRefocusUntilRef = useRef(0);
  const nativeColorInputRef = useRef(null);
  const activeColorFieldRef = useRef(null);
  // Enable extra focus/blur logging by adding ?debugFocus=1 to the app URL
  const DEBUG_FOCUS = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debugFocus') === '1';

  // When debugging is enabled, attach lightweight instrumentation to capture
  // the event timeline (focus/blur/keydown/keypress/keyup/pointerdown) and
  // snapshots of document.activeElement. Paste the console output so I can
  // analyze why numeric keys close the native color picker.
  useEffect(() => {
    if (!DEBUG_FOCUS) return;
    const tag = '[CONSENT-FOCUS-DBG]';
    const snap = () => {
      const ae = document.activeElement;
      try {
        return {
          time: Date.now(),
          activeTag: ae && ae.tagName,
          activeName: ae && (ae.getAttribute ? ae.getAttribute('name') : undefined),
          activeType: ae && ae.type,
          activeId: ae && ae.id,
        };
      } catch (_) { return { time: Date.now(), active: String(ae) }; }
    };

    const logEvent = (prefix, e) => {
      try {
        const t = e.target || {};
        console.log(tag, prefix, {
          key: e.key, code: e.code, type: e.type, isTrusted: e.isTrusted, cancelled: e.defaultPrevented,
          targetTag: t.tagName, targetName: t.name, targetType: t.type, targetId: t.id,
          snapshot: snap()
        });
      } catch (err) { console.log(tag, prefix, 'err', err); }
    };

    const onKeyDownC = (e) => logEvent('keydown(capture)', e);
    const onKeyPressC = (e) => logEvent('keypress(capture)', e);
    const onKeyUpC = (e) => logEvent('keyup(capture)', e);
    const onKeyDownB = (e) => logEvent('keydown(bubble)', e);
    const onFocusIn = (e) => logEvent('focusin', e);
    const onFocusOut = (e) => logEvent('focusout', e);
    const onPointerDown = (e) => logEvent('pointerdown', e);
    const onMouseDown = (e) => logEvent('mousedown', e);

    document.addEventListener('keydown', onKeyDownC, true);
    document.addEventListener('keypress', onKeyPressC, true);
    document.addEventListener('keyup', onKeyUpC, true);
    document.addEventListener('keydown', onKeyDownB, false);
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('mousedown', onMouseDown, true);

    // Also log input/change events for color inputs as they appear
    const onInput = (e) => logEvent('input', e);
    const onChange = (e) => logEvent('change', e);
    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onChange, true);

    console.log(tag, 'DEBUG FOCUS instrumentation active — interact with a color input now');

    return () => {
      document.removeEventListener('keydown', onKeyDownC, true);
      document.removeEventListener('keypress', onKeyPressC, true);
      document.removeEventListener('keyup', onKeyUpC, true);
      document.removeEventListener('keydown', onKeyDownB, false);
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('change', onChange, true);
      console.log(tag, 'DEBUG FOCUS instrumentation removed');
    };
  }, [DEBUG_FOCUS]);

  // Helper: is a DOM node inside the preview container?
  const isNodeInPreview = (node) => {
    const c = document.getElementById('consent-container');
    return !!(c && node instanceof Node && c.contains(node));
  };

  // Common preview selectors for mapping fields to preview elements
  const fieldSelectors = {
    title: 'h1, h2, h3, .title, [class*="title"], [class*="heading"]',
    benefitText: 'p, .text, .description, .benefit, [class*="text"], [class*="benefit"]',
    acceptButtonText: 'button[class*="accept"], .button[class*="accept"], [class*="accept"][role="button"], button[id*="accept"], button[class*="ok"], button[class*="agree"], a[class*="accept"], div[class*="accept"][role="button"], span[class*="accept"][role="button"]',
    declineButtonText: 'button[class*="decline"], .button[class*="decline"], [class*="decline"][role="button"], button[id*="decline"], button[class*="cancel"], button[class*="no"], a[class*="decline"], div[class*="decline"][role="button"], span[class*="decline"][role="button"]',
    logo: 'img[src*="logo"], .logo, [class*="logo"]',
    qrCode: 'img[src*="qr"], .qr, [class*="qr"]',
    acceptButton: 'button[class*="accept"], .button[class*="accept"], [class*="accept"][role="button"], button[id*="accept"], button[class*="ok"], button[class*="agree"], a[class*="accept"], div[class*="accept"][role="button"], span[class*="accept"][role="button"]',
    declineButton: 'button[class*="decline"], .button[class*="decline"], [class*="decline"][role="button"], button[id*="decline"], button[class*="cancel"], button[class*="no"], a[class*="decline"], div[class*="decline"][role="button"], span[class*="decline"][role="button"]',
    backgroundColor: '.consent-popup, [class*="consent"], [class*="dialog"], [class*="popup"], div',
    outlineColor: '.consent-popup, [class*="consent"], [class*="dialog"], [class*="popup"], div',
    accentColor: 'h1, h2, h3, .title, [class*="title"], [class*="heading"]',
    acceptTextColor: 'button[class*="accept"], .button[class*="accept"], [class*="accept"][role="button"], button[id*="accept"], button[class*="ok"], button[class*="agree"], a[class*="accept"], div[class*="accept"][role="button"], span[class*="accept"][role="button"]',
    declineTextColor: 'button[class*="decline"], .button[class*="decline"], [class*="decline"][role="button"], button[id*="decline"], button[class*="cancel"], button[class*="no"], a[class*="decline"], div[class*="decline"][role="button"], span[class*="decline"][role="button"]',
    borderColor: 'button[class*="decline"], .button[class*="decline"], [class*="decline"][role="button"], button[id*="decline"], button[class*="cancel"], button[class*="no"], a[class*="decline"], div[class*="decline"][role="button"], span[class*="decline"][role="button"]'
  };

  const queryFirst = (root, selector) => { try { return root.querySelector(selector); } catch (_) { return null; } };

  // Safely update only the text node of an element, preserving child markup
  const setTextPreservingChildren = (el, text) => {
    try {
      let textNode = Array.from(el.childNodes).find(n => n && n.nodeType === Node.TEXT_NODE);
      if (!textNode) {
        textNode = document.createTextNode('');
        el.insertBefore(textNode, el.firstChild || null);
      }
      textNode.nodeValue = String(text ?? '');
    } catch (_) {}
  };

  // Helper: is node a form control in our editor (not inside preview)?
  const isFormField = (node) => {
    return !!(node && node instanceof HTMLElement &&
      typeof node.matches === 'function' &&
      node.matches('input, textarea, select') &&
      !isNodeInPreview(node));
  };

  // Robust detection for color inputs used across handlers
  const isColorInputElement = (node) => {
    try {
      if (!node) return false;
      if (node.tagName === 'INPUT' && (node.type === 'color' || node.getAttribute && node.getAttribute('type') === 'color')) return true;
      if (node.querySelector && node.querySelector('input[type="color"]')) return true;
    } catch (_) {}
    return false;
  };

  // Common glassmorphism styling for form fields
  const glassFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'rgba(102, 126, 234, 0.8)',
      },
    },
  };

  // Use a separate effect for preview updates with focus retention
  useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounced preview update on any config/tab/blur changes
    updateTimeoutRef.current = setTimeout(() => {
      // If the user is currently editing a field, avoid recreating the preview
      // DOM. Live-patching happens in `handleChange` while editing. Recreating
      // the preview causes transient focus loss which closes native pickers.
      if (isEditingRef.current) {
        if (DEBUG_FOCUS) console.log('Skipping preview recreate while editing');
        return;
      }
      try {
        console.log("🔄 Updating preview");

        const container = document.getElementById("consent-container");
        if (container && window.ConsentModule) {
          container.innerHTML = "";
          const params = { ...config, preview: true };

          // Make the entire preview subtree inert and hidden from a11y to avoid focus stealing
          try {
            container.setAttribute('inert', '');
          } catch (e) {
            // inert not supported in some browsers; fall back to strict guards below
          }
          container.setAttribute('aria-hidden', 'true');

          window.ConsentModule.create("consent-container", params).show();

          // Make all consent elements non-focusable immediately in preview mode
          setTimeout(() => {
            const consentElements = container.querySelectorAll('button, input, select, textarea, a, [tabindex]');
            consentElements.forEach(el => {
              el.setAttribute('tabindex', '-1');
              el.style.pointerEvents = 'none';
            });
          }, 10);

          // Interactive preview highlighting removed
        }
      } catch (error) {
        console.error("Error updating preview:", error);
      }
    }, 300);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [config, activeTab, lastBlurAt]);

  // Global focus/mouse guards: if editing, prevent any focus within the preview and restore input focus
  useEffect(() => {
    const getContainer = () => document.getElementById('consent-container');

    // Ensure container is inert on mount if present
    const container = getContainer();
    if (container) {
      try {
        container.setAttribute('inert', '');
      } catch (e) {
        // ignore
      }
      container.setAttribute('aria-hidden', 'true');
    }

    const isInPreview = (node) => {
      const c = getContainer();
      return !!(c && node instanceof Node && c.contains(node));
    };

    const refocusActive = () => {
      const el = activeElementRef.current;
      if (el && typeof el.focus === 'function') {
        setTimeout(() => {
          try { el.focus(); } catch (e) {}
        }, 0);
      }
    };

    const onFocusIn = (e) => {
      if (DEBUG_FOCUS) console.log('[focusin] target=', e.target, 'activeEditing=', isEditingRef.current, 'isInPreview=', isInPreview(e.target));
      // If a visible color input gained focus, ensure the hidden native input is
      // synced so reopening the native picker displays the current color.
      try {
        const tgt = e.target;
        if (tgt && tgt.tagName === 'INPUT' && tgt.type === 'color') {
          const native = nativeColorInputRef.current;
          if (native) {
            // Determine the logical field name and a reliable source element to read
            // the user's last-entered value. If focus landed on the hidden/native
            // input (`tgt === native`), prefer the visible input referenced by
            // `activeColorFieldRef.current` or query it by name. Otherwise use the
            // actual event target.
            let name = null;
            let sourceEl = tgt;
            if (tgt === native) {
              name = activeColorFieldRef.current || null;
              if (name) {
                try {
                  const q = document.querySelector(`input[type=\"color\"][name=\"${name}\"]`);
                  if (q) sourceEl = q;
                } catch (e) {}
              }
            } else {
              name = tgt.getAttribute && tgt.getAttribute('name');
            }

            // Prefer the current DOM value the user just edited (sourceEl.value).
            let hex = '#000000';
            try {
              const fromTarget = anyCssToHex(sourceEl && sourceEl.value);
              const fromConfig = anyCssToHex(config && config[name]);
              hex = fromTarget || fromConfig || native.value || '#000000';
            } catch (err) {
              hex = (sourceEl && sourceEl.value) || (config && config[name]) || native.value || '#000000';
            }
            // Normalize to 6-digit hex.
            try {
              if (!/^#([0-9a-fA-F]{6})$/.test(hex)) {
                hex = anyCssToHex(hex) || '#000000';
              }
            } catch (e) {
              hex = '#000000';
            }
            try { native.value = hex; } catch (_) {}
            activeColorFieldRef.current = name || activeColorFieldRef.current;
            if (DEBUG_FOCUS) console.log('[focusin] synced native color input for', name, 'value', hex, 'source=', sourceEl);
          }
        }
      } catch (_) {}
      if (isEditingRef.current && isInPreview(e.target)) {
        // Attempt to blur the target and immediately restore focus to the active input
        if (e.target && typeof e.target.blur === 'function') {
          try { e.target.blur(); } catch (err) {}
        }
        e.stopPropagation();
        refocusActive();
      }
    };

    const onMouseOrTouch = (e) => {
      if (DEBUG_FOCUS) console.log('[mouse/touch] target=', e.target, 'isInPreview=', isInPreview(e.target));
      // If the user started interacting with a color input, set a short suppression
      // period so the blur handler won't immediately steal focus back while the
      // native color picker opens.
      // Find the actual visible input[type=color] element if present (target or descendant).
      // Ignore the hidden native input we append to <body> and only accept inputs
      // that are visible (have client rects) to avoid triggering when clicking
      // arbitrary parts of the page (body/queryRoot will include our hidden input).
      let targetColorInput = null;
      try {
        const nativeRef = nativeColorInputRef && nativeColorInputRef.current;
        const isVisible = (el) => {
          try {
            if (!el || !(el instanceof Element)) return false;
            if (el === nativeRef) return false;
            const rects = el.getClientRects();
            if (rects && rects.length) return true;
            const style = getComputedStyle(el);
            if (!style) return false;
            if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false;
            const r = el.getBoundingClientRect();
            return !!(r && (r.width > 0 || r.height > 0));
          } catch (_) { return false; }
        };

        // Prefer using the event's composed path to find if a color input was
        // actually inside the clicked subtree. This prevents global queries
        // (like document.querySelector) from matching inputs that are unrelated
        // to the click target.
        const path = (typeof e.composedPath === 'function' && e.composedPath()) || (e.path || null);
        if (path && Array.isArray(path)) {
          for (let i = 0; i < path.length; i++) {
            const node = path[i];
            if (!node || !(node instanceof Element)) continue;
            if (node.tagName === 'INPUT' && node.type === 'color' && isVisible(node)) {
              targetColorInput = node; break;
            }
            // If an ancestor contains a color input as a direct descendant that is
            // also within the path, it's safe to open for that input.
            try {
              const cand = node.querySelector && node.querySelector('input[type="color"]');
              if (cand && isVisible(cand) && path.includes(cand)) { targetColorInput = cand; break; }
            } catch (_) {}
          }
        } else {
          // Fallback: conservative local checks only
          if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'color' && isVisible(e.target)) {
            targetColorInput = e.target;
          } else if (e.target && e.target.querySelector) {
            const cand = e.target.querySelector('input[type="color"]');
            if (cand && isVisible(cand)) targetColorInput = cand;
          } else if (e.target && e.target.closest) {
            const cand = e.target.closest && e.target.closest('input[type="color"]');
            if (cand && isVisible(cand)) targetColorInput = cand;
          }
        }
      } catch (_) { targetColorInput = null; }

      if (targetColorInput) {
        suppressRefocusUntilRef.current = Date.now() + 1000; // 1s suppression
        if (DEBUG_FOCUS) console.log('[mouse/touch] detected color input interaction, suppress refocus until', suppressRefocusUntilRef.current, 'input=', targetColorInput);

        // Open the hidden native color input synchronously while handling the pointer/mousedown
        try {
          const native = nativeColorInputRef.current;
          if (native) {
            // remember which logical field we're editing
            const name = targetColorInput.getAttribute && targetColorInput.getAttribute('name');
            activeColorFieldRef.current = name || activeColorFieldRef.current;
            const hex = anyCssToHex(config[name]) || targetColorInput.value || native.value || '#000000';
            try { native.value = hex; } catch (_) {}

            // To satisfy browser visibility/user-gesture heuristics move the native
            // input under the pointer, make it tiny but visible, trigger the picker
            // synchronously, then restore it offscreen.
            const restore = () => {
              try {
                native.style.left = '-9999px';
                native.style.top = '-9999px';
                native.style.width = '1px';
                native.style.height = '1px';
                native.style.opacity = '0';
                native.style.pointerEvents = 'none';
              } catch (_) {}
            };

            try {
              const x = (e.clientX || 0) - 10;
              const y = (e.clientY || 0) - 10;
              native.style.position = 'fixed';
              native.style.left = `${x}px`;
              native.style.top = `${y}px`;
              native.style.width = '20px';
              native.style.height = '20px';
              native.style.opacity = '0';
              native.style.pointerEvents = 'auto';
              // focus then open picker
              try { native.focus(); } catch (_) {}
              if (typeof native.showPicker === 'function') native.showPicker(); else native.click();
            } catch (err) {
              if (DEBUG_FOCUS) console.log('[mouse/touch] failed to position/open native picker', err);
            } finally {
              // Restore after short delay to let picker open
              setTimeout(restore, 600);
            }

            if (DEBUG_FOCUS) console.log('[mouse/touch] attempted native picker for', name, 'value', hex);
          }
        } catch (err) {
          if (DEBUG_FOCUS) console.log('[mouse/touch] failed to open native picker', err);
        }
      }
      if (isEditingRef.current && isInPreview(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        refocusActive();
      }
    };

    // Capture-phase keydown handler: when a color input is focused, stop other
    // global handlers from observing printable key presses (numbers/letters)
    // which can cause the native color picker to close. We only stop propagation
    // for printable single-character keys and let arrows/ctrl/meta pass through.
    const onKeyDownCapture = (e) => {
      try {
        const ae = document.activeElement;
        if (!ae) return;
        if (!isColorInputElement(ae)) return;
        // Allow navigation keys and modifiers
        const navKeys = new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Escape','Enter','Shift','Control','Alt','Meta','Backspace','Delete']);
        if (navKeys.has(e.key)) return;
        // Printable single-character keys usually have length 1
        if (typeof e.key === 'string' && e.key.length === 1) {
          // Stop other listeners (capture-phase) so they don't close the picker.
          e.stopImmediatePropagation();
          // Do not call preventDefault — allow the key to be applied to the input.
        }
      } catch (_) {}
    };

    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('mousedown', onMouseOrTouch, true);
    document.addEventListener('touchstart', onMouseOrTouch, true);
    document.addEventListener('keydown', onKeyDownCapture, true);

    return () => {
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('mousedown', onMouseOrTouch, true);
      document.removeEventListener('touchstart', onMouseOrTouch, true);
      document.removeEventListener('keydown', onKeyDownCapture, true);
    };
  }, []);

  // Create a single hidden native color input to open the browser's color picker
  // without depending on the MUI input node (prevents re-mounts closing the picker).
  useEffect(() => {
    try {
      const inp = document.createElement('input');
      inp.type = 'color';
      inp.style.position = 'fixed';
      inp.style.left = '-9999px';
      inp.style.width = '1px';
      inp.style.height = '1px';
      inp.tabIndex = -1;
      const onNativeInput = (e) => {
        try {
          const name = activeColorFieldRef.current;
          const val = inp.value; // already #rrggbb
          if (name) {
            setConfig(prev => ({ ...prev, [name]: val }));
            // Live patch preview while editing
            const container = document.getElementById('consent-container');
            if (container) {
              // apply same live updates used elsewhere
              if (name === 'backgroundColor' || name === 'outlineColor') {
                const popup = queryFirst(container, fieldSelectors[name]) || container.firstElementChild;
                if (popup) {
                  if (name === 'backgroundColor') popup.style.backgroundColor = val;
                  else if (name === 'outlineColor') popup.style.outline = `3px solid ${val}`;
                }
              } else if (name === 'accentColor') {
                const titleEl = queryFirst(container, fieldSelectors.accentColor);
                if (titleEl) titleEl.style.color = val;
              } else if (['acceptTextColor','declineTextColor','borderColor'].includes(name)) {
                const el = queryFirst(container, fieldSelectors[name]);
                if (el) {
                  if (name === 'borderColor') el.style.borderColor = val;
                  else el.style.color = val;
                }
              }
            }
          }
        } catch (_) {}
      };
      inp.addEventListener('input', onNativeInput);
      inp.addEventListener('change', onNativeInput);
      document.body.appendChild(inp);
      nativeColorInputRef.current = inp;
      return () => {
        try { inp.removeEventListener('input', onNativeInput); inp.removeEventListener('change', onNativeInput); } catch(_){}
        try { document.body.removeChild(inp); } catch(_){}
        nativeColorInputRef.current = null;
        activeColorFieldRef.current = null;
      };
    } catch (_) {}
  }, []);

  // Focus-based preview highlighting (hover highlighting removed)
  const clearPreviewHighlights = () => {
    const container = document.getElementById("consent-container");
    if (!container) return;
    const highlightedElements = container.querySelectorAll('[data-input-highlighted="true"]');
    highlightedElements.forEach(element => {
      const originalOutline = element.dataset.originalOutline || 'none';
      const originalBoxShadow = element.dataset.originalBoxShadow || 'none';
      const originalBackgroundColor = element.dataset.originalBackgroundColor || 'transparent';
      const originalTransform = element.dataset.originalTransform || 'scale(1)';
      element.style.outline = originalOutline;
      element.style.boxShadow = originalBoxShadow;
      element.style.backgroundColor = originalBackgroundColor;
      element.style.transform = originalTransform;
      element.removeAttribute('data-input-highlighted');
      element.removeAttribute('data-original-outline');
      element.removeAttribute('data-original-box-shadow');
      element.removeAttribute('data-original-background-color');
      element.removeAttribute('data-original-transform');
    });
    hideInputFocusTooltip();
  };

  const showInputFocusTooltip = (element, fieldName) => {
    hideInputFocusTooltip();
    const tooltip = document.createElement('div');
    tooltip.id = 'input-focus-tooltip';
    const fieldLabels = {
      'title': 'Title',
      'benefitText': 'Benefit Text',
      'acceptButtonText': 'Accept Button Text',
      'declineButtonText': 'Decline Button Text',
      'logo': 'Logo',
      'qrCode': 'QR Code',
      'acceptButton': 'Accept Button Image URL',
      'declineButton': 'Decline Button Image URL',
      'language': 'Language',
      'backgroundColor': 'Background Color',
      'accentColor': 'Accent Color (Title Color)',
      'acceptTextColor': 'Accept Button Text Color',
      'declineTextColor': 'Decline Button Text Color',
      'borderColor': 'Border Color (Decline Button)',
      'outlineColor': 'Outline Color'
    };
    tooltip.textContent = `Editing: ${fieldLabels[fieldName] || fieldName}`;
    tooltip.style.cssText = `
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 193, 7, 0.95);
      color: #333;
      padding: 8px 16px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: bold;
      white-space: nowrap;
      z-index: 10001;
      backdrop-filter: blur(10px);
      box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4);
      pointer-events: none;
      animation: bounce 0.3s ease-in-out;
    `;
    element.style.position = 'relative';
    element.appendChild(tooltip);
  };

  const hideInputFocusTooltip = () => {
    const existingTooltip = document.getElementById('input-focus-tooltip');
    if (existingTooltip) existingTooltip.remove();
  };

  const highlightPreviewElement = (fieldName) => {
    const container = document.getElementById("consent-container");
    if (!container) return;
    clearPreviewHighlights();

    if (fieldName === 'language' || fieldName === 'backgroundColor' || fieldName === 'outlineColor') {
      const popup = container.querySelector('.consent-popup, [class*="consent"], [class*="dialog"], [class*="popup"], div') || container.firstElementChild;
      if (!popup) return;
      popup.dataset.originalOutline = popup.style.outline || 'none';
      const computedStyle = getComputedStyle(popup);
      popup.dataset.originalBoxShadow = popup.style.boxShadow || computedStyle.boxShadow || 'none';
      popup.dataset.originalBackgroundColor = popup.style.backgroundColor || 'transparent';
      popup.dataset.originalTransform = popup.style.transform || 'scale(1)';
      const originalBoxShadow = popup.dataset.originalBoxShadow !== 'none' ? popup.dataset.originalBoxShadow : '';
      const shadowPrefix = originalBoxShadow ? `${originalBoxShadow}, ` : '';
      if (fieldName === 'backgroundColor') {
        popup.style.outline = '4px dashed rgba(138, 43, 226, 0.8)';
        popup.style.outlineOffset = '6px';
        popup.style.boxShadow = `${shadowPrefix}0 0 25px rgba(138, 43, 226, 0.6), inset 0 0 15px rgba(138, 43, 226, 0.1)`;
      } else if (fieldName === 'outlineColor') {
        popup.style.outline = '4px dotted rgba(50, 205, 50, 0.8)';
        popup.style.outlineOffset = '4px';
        popup.style.boxShadow = `${shadowPrefix}0 0 20px rgba(50, 205, 50, 0.6)`;
      } else {
        popup.style.outline = '4px solid rgba(255, 193, 7, 0.9)';
        popup.style.outlineOffset = '4px';
        popup.style.boxShadow = `${shadowPrefix}0 0 30px rgba(255, 193, 7, 0.8), inset 0 0 20px rgba(255, 193, 7, 0.1)`;
      }
      popup.style.transform = 'scale(1.01)';
      popup.dataset.inputHighlighted = 'true';
      showInputFocusTooltip(popup, fieldName);
      return;
    }

    let el = container.querySelector(`[data-field="${fieldName}"]`);
    if (!el && fieldSelectors[fieldName]) {
      el = queryFirst(container, fieldSelectors[fieldName]);
    }
    if (!el) return;
    el.dataset.originalOutline = el.style.outline || 'none';
    const computed = getComputedStyle(el);
    el.dataset.originalBoxShadow = el.style.boxShadow || computed.boxShadow || 'none';
    el.dataset.originalBackgroundColor = el.style.backgroundColor || 'transparent';
    el.dataset.originalTransform = el.style.transform || 'scale(1)';
    const originalBoxShadow = el.dataset.originalBoxShadow !== 'none' ? el.dataset.originalBoxShadow : '';
    const shadowPrefix = originalBoxShadow ? `${originalBoxShadow}, ` : '';

    if (['acceptTextColor', 'declineTextColor'].includes(fieldName)) {
      el.style.outline = '3px solid rgba(138, 43, 226, 0.9)';
      el.style.outlineOffset = '3px';
      el.style.boxShadow = `${shadowPrefix}0 0 20px rgba(138, 43, 226, 0.7)`;
      el.style.backgroundColor = 'rgba(138, 43, 226, 0.15)';
    } else if (fieldName === 'accentColor') {
      el.style.outline = '3px solid rgba(255, 193, 7, 0.9)';
      el.style.outlineOffset = '3px';
      el.style.boxShadow = `${shadowPrefix}0 0 20px rgba(255, 193, 7, 0.7)`;
      el.style.backgroundColor = 'rgba(255, 193, 7, 0.15)';
    } else if (['logo', 'qrCode', 'acceptButton', 'declineButton'].includes(fieldName)) {
      el.style.outline = '3px solid rgba(0, 150, 136, 0.9)';
      el.style.outlineOffset = '3px';
      el.style.boxShadow = `${shadowPrefix}0 0 20px rgba(0, 150, 136, 0.7)`;
      el.style.backgroundColor = 'rgba(0, 150, 136, 0.15)';
    } else if (fieldName === 'borderColor') {
      el.style.outline = '6px solid rgba(255, 69, 0, 0.8)';
      el.style.outlineOffset = '2px';
      el.style.boxShadow = `${shadowPrefix}0 0 20px rgba(255, 69, 0, 0.6)`;
      el.style.backgroundColor = 'rgba(255, 69, 0, 0.1)';
    } else {
      el.style.outline = '3px solid rgba(255, 193, 7, 0.9)';
      el.style.outlineOffset = '3px';
      el.style.boxShadow = `${shadowPrefix}0 0 20px rgba(255, 193, 7, 0.7)`;
      el.style.backgroundColor = 'rgba(255, 193, 7, 0.15)';
    }
    el.style.transform = 'scale(1.02)';
    el.dataset.inputHighlighted = 'true';
    showInputFocusTooltip(el, fieldName);
  };

  // Store active element on field change
  const handleChange = (e) => {
    // Save reference to the active element
    const target = e.target;
    if (DEBUG_FOCUS) {
      try {
        console.log('[CONSENT-DBG] handleChange', { name: target.name, value: target.value, type: target.type, selectionStart: target.selectionStart, selectionEnd: target.selectionEnd, eventType: e.type });
      } catch (_) {}
    }
    activeElementRef.current = target;

    // Preserve caret/selection if possible
    const hasSelection = typeof target.selectionStart === 'number' && typeof target.selectionEnd === 'number';
    const selStart = hasSelection ? target.selectionStart : null;
    const selEnd = hasSelection ? target.selectionEnd : null;

    const { name, value } = target;

    // Update state using the functional form
    setConfig(prevConfig => ({
      ...prevConfig,
      [name]: value
    }));

    // Live patch the preview for specific fields while editing, without recreating the preview
    if (isEditingRef.current) {
      const container = document.getElementById('consent-container');
      if (container) {
        // Text content fields
        if (name === 'title' || name === 'benefitText' || name === 'acceptButtonText' || name === 'declineButtonText') {
          let el = container.querySelector(`[data-field="${name}"]`) || queryFirst(container, fieldSelectors[name]);
          if (el) {
            setTextPreservingChildren(el, value);
          }
        }
        // Asset fields
        if (name === 'logo' || name === 'qrCode') {
          let el = queryFirst(container, fieldSelectors[name]);
          if (el && el.tagName === 'IMG') {
            try { if (el.src !== value) el.src = value; } catch (_) {}
          }
        }
        if (name === 'acceptButton' || name === 'declineButton') {
          let btn = queryFirst(container, fieldSelectors[name]);
          if (btn) {
            try { btn.style.backgroundImage = value ? `url(${value})` : ''; } catch (_) {}
          }
        }
        // Color fields
        if (name === 'backgroundColor' || name === 'outlineColor') {
          let popup = queryFirst(container, fieldSelectors[name]) || container.firstElementChild;
          if (popup) {
            if (name === 'backgroundColor') {
              try { popup.style.backgroundColor = value; } catch (_) {}
            } else if (name === 'outlineColor') {
              try { popup.style.outline = `3px solid ${value}`; } catch (_) {}
            }
          }
        }
        if (name === 'accentColor') {
          let titleEl = queryFirst(container, fieldSelectors.accentColor);
          if (titleEl) {
            try { titleEl.style.color = value; } catch (_) {}
          }
          // Also affect accept button text as per mapping note
          let accBtn = queryFirst(container, fieldSelectors.acceptTextColor);
          if (accBtn) {
            try { accBtn.style.color = value; } catch (_) {}
          }
        }
        if (name === 'acceptTextColor' || name === 'declineTextColor') {
          let btn = queryFirst(container, fieldSelectors[name]);
          if (btn) {
            try { btn.style.color = value; } catch (_) {}
          }
        }
        if (name === 'borderColor') {
          let declineBtn = queryFirst(container, fieldSelectors.borderColor);
          if (declineBtn) {
            try {
              declineBtn.style.borderColor = value;
              if (!declineBtn.style.borderWidth) declineBtn.style.borderWidth = '2px';
              if (!declineBtn.style.borderStyle) declineBtn.style.borderStyle = 'solid';
            } catch (_) {}
          }
        }
      }
    }

    // After React re-render, force focus back to the same input while editing
    if (isEditingRef.current) {
      requestAnimationFrame(() => {
        try {
          // Re-query mounted field by name to avoid focusing a stale (detached) node
          const field = document.querySelector(
            `input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`
          ) || target;
          if (typeof field.focus === 'function') {
            if (document.activeElement !== field) field.focus();
            if (hasSelection && typeof field.setSelectionRange === 'function') {
              // Restore caret to previous position (fallback to end)
              const len = typeof field.value === 'string' ? field.value.length : value.length;
              const endPos = Math.min(len, selEnd ?? len);
              const startPos = Math.min(len, selStart ?? endPos);
              field.setSelectionRange(startPos, endPos);
            }
          }
        } catch (_) {}
      });
    }
  };

  // Handle focus events on input fields
  const handleFieldFocus = (e) => {
    isEditingRef.current = true;
    // Track the focused element for restoration if needed
    activeElementRef.current = e.target;
    lastFocusedFieldRef.current = e.target?.name || null;
    justFocusedAtRef.current = Date.now();
    const fieldName = e.target.name;
    console.log(`🎯 Field focused: ${fieldName}`);
    // Highlight corresponding preview element for the focused field
    setTimeout(() => {
      if (document.activeElement === e.target) {
        highlightPreviewElement(fieldName);
      }
    }, 100);
  };

  // Handle blur events on input fields
  const handleFieldBlur = (e) => {
    const fieldName = e.target.name;
    const blurredTarget = e.target;
    console.log(`👋 Field blurred: ${fieldName}`);

    // Defer decision until after the next microtask to see where focus went
    setTimeout(() => {
      // Ignore transient blur during an intentional tab switch focus
      if (tabSwitchingRef.current) {
        return;
      }
  const nextActive = document.activeElement;
  // If focus legitimately moved to another side-panel form field, accept it
  if (isFormField(nextActive)) {
        isEditingRef.current = true;
        activeElementRef.current = nextActive;
        lastFocusedFieldRef.current = nextActive.getAttribute('name') || lastFocusedFieldRef.current;
        return;
      }
      // Ignore spurious blur that happens immediately after focus (e.g., first click)
      // Increase threshold to accomodate different browser/platform color picker timings.
      const sinceFocus = Date.now() - justFocusedAtRef.current;
      if (sinceFocus < 300) {
        // If we recently detected a pointer interaction with a color input, allow
        // the native picker to open by skipping refocus during suppression window.
        if (suppressRefocusUntilRef.current && Date.now() < suppressRefocusUntilRef.current) {
          if (DEBUG_FOCUS) console.log('[blur] skipping refocus due to suppression window', { now: Date.now(), until: suppressRefocusUntilRef.current });
          isEditingRef.current = true;
          return;
        }
        if (DEBUG_FOCUS) console.log('[blur] transient blur detected', { fieldName, sinceFocus, blurredTarget, activeNow: document.activeElement });
        // Robust detection for color inputs: the blur target might be a wrapper element
        // (e.g., MUI TextField). Check the target and any input descendants for type=color.
        const isColorInputElement = (node) => {
          try {
            if (!node) return false;
            if (node.tagName === 'INPUT' && (node.type === 'color' || node.getAttribute('type') === 'color')) return true;
            // check descendants
            const found = node.querySelector && node.querySelector('input[type="color"]');
            if (found) return true;
          } catch (_) {}
          return false;
        };
        const isColorInput = isColorInputElement(blurredTarget) || isColorInputElement(document.activeElement);
        if (isColorInput) {
          // Let native color picker open/own focus; keep editing mode active.
          if (DEBUG_FOCUS) console.log('[blur] detected color input - allowing native picker', { blurredTarget, activeNow: document.activeElement });
          isEditingRef.current = true;
          return;
        }
        // For other very-short blurs, restore focus to avoid accidental losing of caret
        try { blurredTarget.focus(); } catch (_) {}
        return;
      }


      // If focus fell back to body/null, restore to the input
      if (!nextActive || nextActive === document.body) {
        isEditingRef.current = true;
        activeElementRef.current = blurredTarget;
        try { blurredTarget.focus(); } catch (_) {}
        return;
      }
      // If focus jumped into the preview, treat it as stolen and restore
      if (isNodeInPreview(nextActive)) {
        console.log('⚠️ Focus moved into preview on blur; restoring to input');
        isEditingRef.current = true;
        activeElementRef.current = blurredTarget;
        try {
          blurredTarget.focus();
        } catch (_) {}
        // Do NOT clear highlights or refresh preview in this case
        return;
      }

  // Otherwise, end editing and allow preview refresh
      isEditingRef.current = false;
  clearPreviewHighlights();
  setLastBlurAt(Date.now());
    }, 0);
  };

  // Enhanced input component with focus/blur handlers
  const EnhancedTextField = (props) => (
    <TextField
      {...props}
      onFocus={handleFieldFocus}
      onBlur={handleFieldBlur}
      onChange={handleChange}
      onFocusCapture={(e) => {
        try {
          // Sync the hidden native color input value when a color field is focused,
          // but do NOT open the picker here. Opening is performed synchronously
          // on pointer events to satisfy browser user-gesture heuristics and to
          // avoid reopening the picker when focus is restored programmatically.
          if (props && props.type === 'color') {
            const native = nativeColorInputRef.current;
            if (native) {
              activeColorFieldRef.current = props.name;
              const hex = anyCssToHex(config[props.name]) || native.value || '#000000';
              try { native.value = hex; } catch (_) {}
            }
          }
        } catch (_) {}
      }}
      onKeyDown={(e) => {
        if (DEBUG_FOCUS) {
          try { console.log('[CONSENT-DBG] EnhancedTextField onKeyDown', { key: e.key, type: props && props.type, name: props && props.name }); } catch (_) {}
        }
        // If this is a color input, prevent global handlers from seeing printable keys
        try {
          if (props && props.type === 'color') {
            // Stop React propagation
            e.stopPropagation();
            // Stop native event propagation so non-React listeners don't run
            if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
              e.nativeEvent.stopImmediatePropagation();
            }
          }
        } catch (_) {}
        // Call any user-provided handler
        if (props && typeof props.onKeyDown === 'function') props.onKeyDown(e);
      }}
      onKeyPress={(e) => {
        if (DEBUG_FOCUS) {
          try { console.log('[CONSENT-DBG] EnhancedTextField onKeyPress', { key: e.key, type: props && props.type, name: props && props.name }); } catch (_) {}
        }
        try {
          if (props && props.type === 'color') {
            e.stopPropagation();
            if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
              e.nativeEvent.stopImmediatePropagation();
            }
          }
        } catch (_) {}
        if (props && typeof props.onKeyPress === 'function') props.onKeyPress(e);
      }}
      onInput={(e) => { if (DEBUG_FOCUS) { try { console.log('[CONSENT-DBG] EnhancedTextField onInput', { data: e.data, inputType: e.inputType, name: props && props.name, value: e.target && e.target.value }); } catch(_) {} } if (props && typeof props.onInput === 'function') props.onInput(e); }}
    />
  );

  // Enhanced select component with focus/blur handlers
  const EnhancedSelect = (props) => (
    <Select
      {...props}
      onFocus={handleFieldFocus}
      onBlur={handleFieldBlur}
      onChange={handleChange}
    />
  );

  const handleReset = () => {
  // Clear editing flags so the reset immediately reflects in the UI and
  // preview updates are not suppressed by editing guards.
  isEditingRef.current = false;
  activeElementRef.current = null;
  activeColorFieldRef.current = null;
  lastFocusedFieldRef.current = null;
  setLastBlurAt(Date.now());
  setConfig(getDefaultConfig());
    // Don't update hash until share
  };

  const handleShare = () => {
    // Only update the URL hash when sharing
    window.location.hash = btoa(JSON.stringify(config));

    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setSnackbarOpen(true);
    });
  };

  return (
    <>
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateX(-50%) translateY(0);
            }
            40% {
              transform: translateX(-50%) translateY(-10px);
            }
            60% {
              transform: translateX(-50%) translateY(-5px);
            }
          }

          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
            100% {
              transform: scale(1);
            }
          }

          .preview-highlight-transition {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
        `}
      </style>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px"
      }}>
      <Grid container spacing={3} style={{ height: "100vh" }}>
        <Grid item xs={3} style={{ maxWidth: "25%" }}>
          <Card style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            borderRadius: "15px",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
          }}>
            <CardContent>
            <Typography variant="h6" style={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
              ⚙️ Consent Configuration
            </Typography>
            <Divider style={{
              margin: "10px 0",
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              height: '1px'
            }} />

            <Tabs
              value={activeTab}
              onChange={(e, newValue) => {
                // Start guarded tab switching cycle
                tabSwitchingRef.current = true;
                // Remember preferred field name (current or last known)
                const preferredName = document.activeElement?.getAttribute('name') || lastFocusedFieldRef.current;
                setActiveTab(newValue);
                // After render, focus preferred field in the target tab (fallback to first input)
                requestAnimationFrame(() => {
                  try {
                    const panel = document.getElementById(`config-tabpanel-${newValue}`);
                    let field = null;
                    if (panel && preferredName) {
                      field = panel.querySelector(`input[name="${preferredName}"], textarea[name="${preferredName}"], select[name="${preferredName}"]`);
                    }
                    if (!field && panel) {
                      field = panel.querySelector('input, textarea, select');
                    }
                    if (field && typeof field.focus === 'function') {
                      field.focus();
                      activeElementRef.current = field;
                      lastFocusedFieldRef.current = field.getAttribute('name') || preferredName || null;
                      isEditingRef.current = true;
                      if (typeof field.setSelectionRange === 'function' && typeof field.value === 'string') {
                        const len = field.value.length;
                        field.setSelectionRange(len, len);
                      }
                      if (field.name) {
                        highlightPreviewElement(field.name);
                      }
                    } else {
                      // No focusable inputs in this tab; end editing mode
                      isEditingRef.current = false;
                    }
                  } catch (_) {
                    // In case of any error, end editing mode to allow preview updates
                    isEditingRef.current = false;
                  } finally {
                    // End guarded tab switching cycle
                    tabSwitchingRef.current = false;
                  }
                });
              }}
              variant="fullWidth"
              sx={{
                backgroundColor: 'transparent !important',
                background: 'none !important',
                '& .MuiTabs-flexContainer': {
                  backgroundColor: 'transparent !important',
                },
                '& .MuiTabs-scroller': {
                  backgroundColor: 'transparent !important',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'rgba(102, 126, 234, 0.8)',
                },
                '& .MuiTab-root': {
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  color: 'rgba(0, 0, 0, 0.7)',
                  backgroundColor: 'transparent !important',
                  '&.Mui-selected': {
                    color: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'transparent !important',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.1) !important',
                  },
                },
              }}
            >
              <Tab label="🏠 Main" />
              <Tab label="📝 Text" />
              <Tab label="🎨 Color" />
              <Tab label="🖼️ Assets" />
            </Tabs>

            {/* Main Tab - Most popular inputs */}
            <TabPanel value={activeTab} index={0}>
              <EnhancedTextField
                fullWidth
                label="Title"
                name="title"
                value={config.title}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                label="Logo URL"
                name="logo"
                value={config.logo}
                margin="normal"
                sx={glassFieldStyle}
              />
              <FormControl fullWidth margin="normal" sx={glassFieldStyle}>
                <InputLabel>🌐 Language</InputLabel>
                <EnhancedSelect
                  name="language"
                  value={config.language}
                  label="🌐 Language"
                >
                  <MenuItem value="en">🇺🇸 English</MenuItem>
                  <MenuItem value="ar">🇦 العربية</MenuItem>
                  <MenuItem value="de">�� Deutsch</MenuItem>
                  <MenuItem value="es">🇸 Español</MenuItem>
                  <MenuItem value="fr">�� Français</MenuItem>
                  <MenuItem value="hi">�� हिन्दी</MenuItem>
                  <MenuItem value="it">�� Italiano</MenuItem>
                  <MenuItem value="ja">🇯🇵 日本語</MenuItem>
                  <MenuItem value="nl">🇳🇱 Nederlands</MenuItem>
                  <MenuItem value="pt">�� Português</MenuItem>
                  <MenuItem value="ru">�� Русский</MenuItem>
                  <MenuItem value="tr">🇹🇷 Türkçe</MenuItem>
                  <MenuItem value="zh">🇨🇳 中文</MenuItem>
                </EnhancedSelect>
              </FormControl>
            </TabPanel>

            {/* Text Tab */}
            <TabPanel value={activeTab} index={1}>
              <EnhancedTextField
                fullWidth
                label="Title"
                name="title"
                value={config.title}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                label="Benefit Text"
                name="benefitText"
                value={config.benefitText}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                label="Accept Button Text"
                name="acceptButtonText"
                value={config.acceptButtonText}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                label="Decline Button Text"
                name="declineButtonText"
                value={config.declineButtonText}
                margin="normal"
                sx={glassFieldStyle}
              />
            </TabPanel>

            {/* Color Tab */}
            <TabPanel value={activeTab} index={2}>
              <EnhancedTextField
                fullWidth
                type="color"
                label="Background Color"
                name="backgroundColor"
                value={anyCssToHex(config.backgroundColor) || ''}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                type="color"
                label="Accent Color"
                name="accentColor"
                value={anyCssToHex(config.accentColor) || ''}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                type="color"
                label="Accept Button Text Color"
                name="acceptTextColor"
                value={anyCssToHex(config.acceptTextColor) || ''}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                type="color"
                label="Decline Button Text Color"
                name="declineTextColor"
                value={anyCssToHex(config.declineTextColor) || ''}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                type="color"
                label="Border Color"
                name="borderColor"
                value={anyCssToHex(config.borderColor) || ''}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                type="color"
                label="Outline Color"
                name="outlineColor"
                value={anyCssToHex(config.outlineColor) || ''}
                margin="normal"
                sx={glassFieldStyle}
              />
            </TabPanel>

            {/* Assets Tab */}
            <TabPanel value={activeTab} index={3}>
              <EnhancedTextField
                fullWidth
                label="Logo URL"
                name="logo"
                value={config.logo}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                label="Accept Button Image URL"
                name="acceptButton"
                value={config.acceptButton}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                label="Decline Button Image URL"
                name="declineButton"
                value={config.declineButton}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                label="QR Code URL"
                name="qrCode"
                value={config.qrCode}
                margin="normal"
                sx={glassFieldStyle}
              />
            </TabPanel>

            <Button
              variant="contained"
              color="secondary"
              fullWidth
              style={{
                marginTop: "20px",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "#333" // Dark text color for visibility
              }}
              onClick={handleReset}
            >
              RESET ALL
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={9} style={{ maxWidth: "75%" }}>
        <Card style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          borderRadius: "15px",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
        }}>
          <CardContent>
            <Typography variant="h6" style={{ fontWeight: 'bold', fontSize: '1.3rem' }}>
              👁️ Consent Preview
            </Typography>
            <Divider style={{ margin: "10px 0" }} />
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              padding: '20px'
            }}>
              <div id="consent-container"></div>
            </div>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              style={{
                marginTop: "10px",
                background: "rgba(102, 126, 234, 0.8)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "white"
              }}
              onClick={() => setDialogOpen(true)}
            >
              View Implementation Steps
            </Button>
            <Button
              variant="contained"
              style={{
                backgroundColor: "rgba(46, 204, 113, 0.8)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "white",
                marginTop: "10px"
              }}
              fullWidth
              onClick={handleShare}
            >
              Share
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="URL copied to clipboard!"
      />

      <ImplementationSteps
        config={implementationConfig}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
      </Grid>
    </div>
    </>
  );
};

export default ConsentConfigurator;

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
      if (isEditingRef.current && isInPreview(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        refocusActive();
      }
    };

    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('mousedown', onMouseOrTouch, true);
    document.addEventListener('touchstart', onMouseOrTouch, true);

    return () => {
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('mousedown', onMouseOrTouch, true);
      document.removeEventListener('touchstart', onMouseOrTouch, true);
    };
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
      const sinceFocus = Date.now() - justFocusedAtRef.current;
      if (sinceFocus < 160) {
        // Keep editing state and restore focus if needed
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
                value={config.backgroundColor}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                type="color"
                label="Accent Color"
                name="accentColor"
                value={config.accentColor}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                type="color"
                label="Accept Button Text Color"
                name="acceptTextColor"
                value={config.acceptTextColor}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                type="color"
                label="Decline Button Text Color"
                name="declineTextColor"
                value={config.declineTextColor}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                type="color"
                label="Border Color"
                name="borderColor"
                value={config.borderColor}
                margin="normal"
                sx={glassFieldStyle}
              />
              <EnhancedTextField
                fullWidth
                type="color"
                label="Outline Color"
                name="outlineColor"
                value={config.outlineColor}
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

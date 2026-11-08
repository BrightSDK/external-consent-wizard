import DOMPurify from "dompurify";

export const getDefaultConfig = () => ({
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

export const SUPPORTED_LANGUAGES = new Set([
  "en", "ar", "de", "es", "fr", "hi", "it", "ja", "nl", "pt", "ru", "tr", "zh"
]);

export const sanitizeLanguage = (lang) => {
  if (typeof lang === "string") {
    const normalized = lang.toLowerCase().trim();
    if (SUPPORTED_LANGUAGES.has(normalized)) {
      return normalized;
    }
  }
  return "en";
};

export const isSafeUrl = (url) => {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Reject control characters, quotes, and parens that can break CSS url(...) or attribute contexts
  if (/[\x00-\x1f\x7f<>"'()\\]/.test(trimmed)) return false;
  if (/^(javascript|vbscript):/i.test(trimmed)) return false;
  if (/^data:/i.test(trimmed)) {
    // Only permit safe raster image formats; reject SVG and executable data types
    return /^data:image\/(png|jpe?g|gif|webp);base64,[a-zA-Z0-9+/=\s]+$/i.test(trimmed);
  }
  try {
    const base = typeof window !== "undefined" && window.location ? window.location.origin : "https://localhost";
    const parsed = new URL(trimmed, base);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_) {
    return false;
  }
};

export const isSafeCssColor = (val) => {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed) return true;
  if (/[<>"'`\\;\r\n]|url\(|expression\(/i.test(trimmed)) return false;
  if (/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) return true;
  if (/^rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?(?:\s*,\s*[\d.]+%?)?\s*\)$/i.test(trimmed)) return true;
  if (/^hsla?\(\s*[\d.]+(?:deg|rad|turn)?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?(?:\s*,\s*[\d.]+%?)?\s*\)$/i.test(trimmed)) return true;
  if (/^[a-zA-Z]{1,30}$/.test(trimmed)) return true;
  return false;
};

const getPurifier = () => {
  if (typeof DOMPurify?.sanitize === "function") {
    return DOMPurify;
  }
  if (typeof window !== "undefined" && typeof DOMPurify === "function") {
    return DOMPurify(window);
  }
  return null;
};

const escapeHtml = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

export const sanitizeHtml = (dirty, options = {}) => {
  if (typeof dirty !== "string") return "";
  const purifier = getPurifier();
  if (purifier && typeof purifier.sanitize === "function") {
    return purifier.sanitize(dirty, options);
  }
  return escapeHtml(dirty);
};

export const sanitizeText = (dirty) => {
  if (typeof dirty !== "string") return "";
  const purifier = getPurifier();
  if (purifier && typeof purifier.sanitize === "function") {
    const cleanHtml = purifier.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    if (typeof document !== "undefined" && typeof document.createElement === "function") {
      const temp = document.createElement("div");
      temp.innerHTML = cleanHtml;
      return temp.textContent || "";
    }
    return cleanHtml
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
  return dirty;
};

const ALLOWED_CSS_PROPERTIES = new Set([
  "color",
  "font-weight",
  "font-style",
  "font-size",
  "text-decoration",
  "text-transform",
  "letter-spacing",
  "font-family"
]);

export const sanitizeInlineStyle = (styleStr) => {
  if (typeof styleStr !== "string") return "";
  const declarations = styleStr.split(";");
  const safeDeclarations = [];
  for (const decl of declarations) {
    const trimmed = decl.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;
    const prop = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const val = trimmed.slice(colonIdx + 1).trim();
    if (!ALLOWED_CSS_PROPERTIES.has(prop)) continue;
    // Reject dangerous constructs (url(), expression(), quotes, brackets, control characters)
    if (/[\x00-\x1f\x7f<>"'`\\;\r\n]|url\(|expression\(/i.test(val)) continue;
    safeDeclarations.push(`${prop}: ${val}`);
  }
  return safeDeclarations.join("; ");
};

const TITLE_PURIFY_OPTIONS = {
  ALLOWED_TAGS: ["span", "b", "strong", "i", "em", "u", "br", "p", "font", "small", "sub", "sup"],
  ALLOWED_ATTR: ["style", "class", "color"],
  FORBID_TAGS: ["script", "iframe", "object", "embed", "link", "style", "form", "input", "button", "svg", "math", "img", "video", "audio", "source", "a"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "href", "src", "action", "formaction", "data"]
};

export const sanitizeTitle = (title) => {
  if (typeof title !== "string") return "";
  const cleanHtml = sanitizeHtml(title, TITLE_PURIFY_OPTIONS);
  if (typeof document !== "undefined" && typeof document.createElement === "function") {
    const temp = document.createElement("div");
    temp.innerHTML = cleanHtml;
    const styledElements = temp.querySelectorAll("[style]");
    styledElements.forEach((el) => {
      const safeStyle = sanitizeInlineStyle(el.getAttribute("style"));
      if (safeStyle) {
        el.setAttribute("style", safeStyle);
      } else {
        el.removeAttribute("style");
      }
    });
    return temp.innerHTML;
  }
  return cleanHtml.replace(/style="([^"]*)"/gi, (_, styleVal) => {
    const safe = sanitizeInlineStyle(styleVal);
    return safe ? `style="${safe}"` : "";
  });
};

export const sanitizeConfig = (raw) => {
  const defaults = getDefaultConfig();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }

  return {
    logo: typeof raw.logo === "string" ? (isSafeUrl(raw.logo) ? raw.logo.trim() : (raw.logo.trim() === "" ? "" : defaults.logo)) : defaults.logo,
    qrCode: typeof raw.qrCode === "string" ? (isSafeUrl(raw.qrCode) ? raw.qrCode.trim() : (raw.qrCode.trim() === "" ? "" : defaults.qrCode)) : defaults.qrCode,
    title: typeof raw.title === "string" ? sanitizeTitle(raw.title) : defaults.title,
    benefitText: typeof raw.benefitText === "string" ? sanitizeText(raw.benefitText) : defaults.benefitText,
    acceptButton: typeof raw.acceptButton === "string" ? (isSafeUrl(raw.acceptButton) ? raw.acceptButton.trim() : (raw.acceptButton.trim() === "" ? "" : defaults.acceptButton)) : defaults.acceptButton,
    declineButton: typeof raw.declineButton === "string" ? (isSafeUrl(raw.declineButton) ? raw.declineButton.trim() : (raw.declineButton.trim() === "" ? "" : defaults.declineButton)) : defaults.declineButton,
    acceptButtonText: typeof raw.acceptButtonText === "string" ? sanitizeText(raw.acceptButtonText) : defaults.acceptButtonText,
    declineButtonText: typeof raw.declineButtonText === "string" ? sanitizeText(raw.declineButtonText) : defaults.declineButtonText,
    backgroundColor: typeof raw.backgroundColor === "string" && isSafeCssColor(raw.backgroundColor) ? raw.backgroundColor.trim() : defaults.backgroundColor,
    accentColor: typeof raw.accentColor === "string" && isSafeCssColor(raw.accentColor) ? raw.accentColor.trim() : defaults.accentColor,
    acceptTextColor: typeof raw.acceptTextColor === "string" && isSafeCssColor(raw.acceptTextColor) ? raw.acceptTextColor.trim() : defaults.acceptTextColor,
    declineTextColor: typeof raw.declineTextColor === "string" && isSafeCssColor(raw.declineTextColor) ? raw.declineTextColor.trim() : defaults.declineTextColor,
    borderColor: typeof raw.borderColor === "string" && isSafeCssColor(raw.borderColor) ? raw.borderColor.trim() : defaults.borderColor,
    outlineColor: typeof raw.outlineColor === "string" && isSafeCssColor(raw.outlineColor) ? raw.outlineColor.trim() : defaults.outlineColor,
    language: sanitizeLanguage(raw.language)
  };
};

export const safeBase64Encode = (str) => {
  if (typeof TextEncoder !== "undefined") {
    try {
      const bytes = new TextEncoder().encode(str);
      let binary = "";
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (_) {}
  }
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ));
  } catch (_) {
    return "";
  }
};

export const safeBase64Decode = (str) => {
  let binary = "";
  try {
    binary = atob(str);
  } catch (_) {
    return "";
  }
  if (typeof TextDecoder !== "undefined") {
    try {
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (_) {}
  }
  try {
    return decodeURIComponent(
      Array.prototype.map.call(binary, (c) =>
        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
      ).join("")
    );
  } catch (_) {
    return binary;
  }
};

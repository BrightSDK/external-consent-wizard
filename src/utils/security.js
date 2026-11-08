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
  if (typeof lang === "string" && SUPPORTED_LANGUAGES.has(lang.toLowerCase().trim())) {
    return lang.toLowerCase().trim();
  }
  return "en";
};

export const isSafeUrl = (url) => {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (/^(javascript|vbscript):/i.test(trimmed)) return false;
  if (/^data:/i.test(trimmed)) {
    return /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[a-zA-Z0-9+/=\s]+$/i.test(trimmed);
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
  return sanitizeHtml(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

const TITLE_PURIFY_OPTIONS = {
  ALLOWED_TAGS: ["span", "b", "strong", "i", "em", "u", "br", "p", "font", "small", "sub", "sup"],
  ALLOWED_ATTR: ["style", "class", "color"],
  FORBID_TAGS: ["script", "iframe", "object", "embed", "link", "style", "form", "input", "button", "svg", "math", "img", "video", "audio", "source", "a"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "href", "src", "action", "formaction", "data"]
};

const BENEFIT_PURIFY_OPTIONS = {
  ALLOWED_TAGS: ["span", "b", "strong", "i", "em", "u", "br", "p"],
  ALLOWED_ATTR: ["style", "class", "color"],
  FORBID_TAGS: ["script", "iframe", "object", "embed", "link", "style", "form", "input", "button", "svg", "math", "img", "video", "audio", "source", "a"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "href", "src", "action", "formaction", "data"]
};

export const sanitizeConfig = (raw) => {
  const defaults = getDefaultConfig();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }

  return {
    logo: typeof raw.logo === "string" && isSafeUrl(raw.logo) ? raw.logo.trim() : defaults.logo,
    qrCode: typeof raw.qrCode === "string" && isSafeUrl(raw.qrCode) ? raw.qrCode.trim() : defaults.qrCode,
    title: typeof raw.title === "string" ? sanitizeHtml(raw.title, TITLE_PURIFY_OPTIONS) : defaults.title,
    benefitText: typeof raw.benefitText === "string" ? sanitizeHtml(raw.benefitText, BENEFIT_PURIFY_OPTIONS) : defaults.benefitText,
    acceptButton: typeof raw.acceptButton === "string" && isSafeUrl(raw.acceptButton) ? raw.acceptButton.trim() : defaults.acceptButton,
    declineButton: typeof raw.declineButton === "string" && isSafeUrl(raw.declineButton) ? raw.declineButton.trim() : defaults.declineButton,
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
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (_) {
    return btoa(str);
  }
};

export const safeBase64Decode = (str) => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (_) {
    return atob(str);
  }
};

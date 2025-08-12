import "@fontsource/roboto";
import { Button, Card, CardContent, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Snackbar, Tab, Tabs, TextField, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const updateTimeoutRef = useRef(null);
  const activeElementRef = useRef(null);

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

    // Check if any input field is currently focused - if so, skip preview update entirely
    const currentlyFocused = document.activeElement;
    const isTyping = currentlyFocused && (
      currentlyFocused.tagName === 'INPUT' ||
      currentlyFocused.tagName === 'SELECT' ||
      currentlyFocused.tagName === 'TEXTAREA'
    );

    if (isTyping) {
      console.log("⏸️ Skipping preview update - user is typing in:", currentlyFocused);
      return; // Exit early, don't update preview while typing
    }

    updateTimeoutRef.current = setTimeout(() => {
      try {
        console.log("� Updating preview - no input focus detected");

        const container = document.getElementById("consent-container");
        if (container && window.ConsentModule) {
          container.innerHTML = "";
          const params = { ...config, preview: true };

          window.ConsentModule.create("consent-container", params).show();

          // Make all consent elements non-focusable immediately
          setTimeout(() => {
            const consentElements = container.querySelectorAll('button, input, select, textarea, a, [tabindex]');
            consentElements.forEach(el => {
              el.setAttribute('tabindex', '-1');
              el.style.pointerEvents = 'none';
            });
          }, 10);

          // Only add interactive highlighting after the user has interacted (not on initial load)
          // Check if user has changed tabs or if there's a focused form field
          const hasUserInteracted = activeTab > 0 || document.querySelector('input:focus, select:focus');

          if (hasUserInteracted) {
            setTimeout(() => {
              addInteractiveHighlighting();
            }, 500);
          } else {
            // On initial load, add interactive highlighting without any initial selection
            setTimeout(() => {
              addInteractiveHighlighting();
            }, 500);
          }
        }
      } catch (error) {
        console.error("Error updating preview:", error);
      }
    }, 800); // Increased debounce time to allow more typing

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [config, activeTab]);

  // Function to add interactive highlighting to preview elements
  const addInteractiveHighlighting = () => {
    console.log("🎯 Adding interactive highlighting for tab:", activeTab);
    const container = document.getElementById("consent-container");
    if (!container) {
      console.log("❌ Container not found");
      return;
    }

    console.log("✅ Container found:", container);

    // Define mappings between preview elements and form fields with tab categories
    const allElementMappings = [
      {
        selector: 'h1, h2, h3, .title, [class*="title"], [class*="heading"]',
        field: 'title',
        label: 'Title',
        tabs: [0, 1] // Main and Text tabs
      },
      {
        selector: 'h1, h2, h3, .title, [class*="title"], [class*="heading"]',
        field: 'accentColor',
        label: 'Title (Accent Color - also affects Accept Button)',
        tabs: [2] // Color tab only
      },
      {
        selector: 'p, .text, .description, .benefit, [class*="text"], [class*="benefit"]',
        field: 'benefitText',
        label: 'Benefit Text',
        tabs: [1] // Text tab only
      },
      {
        selector: 'button[class*="accept"], .button[class*="accept"], [class*="accept"][role="button"], button[id*="accept"], button[class*="ok"], button[class*="agree"], a[class*="accept"], div[class*="accept"][role="button"], span[class*="accept"][role="button"]',
        field: 'acceptButtonText',
        label: 'Accept Button Text',
        tabs: [1] // Text tab only
      },
      {
        selector: 'button[class*="decline"], .button[class*="decline"], [class*="decline"][role="button"], button[id*="decline"], button[class*="cancel"], button[class*="no"], a[class*="decline"], div[class*="decline"][role="button"], span[class*="decline"][role="button"]',
        field: 'declineButtonText',
        label: 'Decline Button Text',
        tabs: [1] // Text tab only
      },
      {
        selector: 'img[src*="logo"], .logo, [class*="logo"]',
        field: 'logo',
        label: 'Logo',
        tabs: [0, 3] // Main and Assets tabs
      },
      {
        selector: 'img[src*="qr"], .qr, [class*="qr"]',
        field: 'qrCode',
        label: 'QR Code',
        tabs: [3] // Assets tab only
      },
      {
        selector: 'button[class*="accept"], .button[class*="accept"], [class*="accept"][role="button"], button[id*="accept"], button[class*="ok"], button[class*="agree"], a[class*="accept"], div[class*="accept"][role="button"], span[class*="accept"][role="button"]',
        field: 'acceptButton',
        label: 'Accept Button Image URL',
        tabs: [3] // Assets tab only
      },
      {
        selector: 'button[class*="decline"], .button[class*="decline"], [class*="decline"][role="button"], button[id*="decline"], button[class*="cancel"], button[class*="no"], a[class*="decline"], div[class*="decline"][role="button"], span[class*="decline"][role="button"]',
        field: 'declineButton',
        label: 'Decline Button Image URL',
        tabs: [3] // Assets tab only
      },
      // Color field mappings
      {
        selector: '.consent-popup, [class*="consent"], [class*="dialog"], [class*="popup"], div',
        field: 'backgroundColor',
        label: 'Background Color',
        tabs: [2] // Color tab only
      },
      {
        selector: 'button[class*="accept"], .button[class*="accept"], [class*="accept"][role="button"], button[id*="accept"], button[class*="ok"], button[class*="agree"], a[class*="accept"], div[class*="accept"][role="button"], span[class*="accept"][role="button"]',
        field: 'acceptTextColor',
        label: 'Accept Button Text Color',
        tabs: [2] // Color tab only
      },
      {
        selector: 'button[class*="decline"], .button[class*="decline"], [class*="decline"][role="button"], button[id*="decline"], button[class*="cancel"], button[class*="no"], a[class*="decline"], div[class*="decline"][role="button"], span[class*="decline"][role="button"]',
        field: 'declineTextColor',
        label: 'Decline Button Text Color',
        tabs: [2] // Color tab only
      },
      {
        selector: 'button[class*="decline"], .button[class*="decline"], [class*="decline"][role="button"], button[id*="decline"], button[class*="cancel"], button[class*="no"], a[class*="decline"], div[class*="decline"][role="button"], span[class*="decline"][role="button"]',
        field: 'borderColor',
        label: 'Border Color (Decline Button)',
        tabs: [2] // Color tab only
      },
      {
        selector: '.consent-popup, [class*="consent"], [class*="dialog"], [class*="popup"], div',
        field: 'outlineColor',
        label: 'Outline Color',
        tabs: [2] // Color tab only
      },
      // Fallback selectors for button images - more generic patterns
      {
        selector: '#consent-container button:first-of-type, #consent-container .button:first-of-type, #consent-container [role="button"]:first-of-type, #consent-container a:first-of-type',
        field: 'acceptButton',
        label: 'Accept Button Image URL (Fallback)',
        tabs: [3] // Assets tab only
      },
      {
        selector: '#consent-container button:last-of-type, #consent-container .button:last-of-type, #consent-container [role="button"]:last-of-type, #consent-container a:last-of-type',
        field: 'declineButton',
        label: 'Decline Button Image URL (Fallback)',
        tabs: [3] // Assets tab only
      }
    ];

    // Filter mappings based on active tab
    const elementMappings = allElementMappings.filter(mapping =>
      mapping.tabs.includes(activeTab)
    );

    console.log(`🔍 Filtering for tab ${activeTab}, found ${elementMappings.length} relevant mappings:`,
      elementMappings.map(m => m.label));

    let totalElementsFound = 0;

    // Apply interactive highlighting to each mapped element
    elementMappings.forEach(mapping => {
      const elements = container.querySelectorAll(mapping.selector);
      console.log(`🔍 Found ${elements.length} elements for ${mapping.label} with selector: ${mapping.selector}`);

      elements.forEach((element, index) => {
        // Skip if already processed
        if (element.dataset.interactive) return;

        // Special case: Only make the first paragraph interactive for benefit text
        if (mapping.field === 'benefitText' && index > 0) {
          console.log(`⏭️ Skipping ${mapping.label} #${index} (only first paragraph gets tooltip)`);
          return;
        }

        // Special case: For color fields targeting the main container, only use the first/main element
        if (['backgroundColor', 'outlineColor'].includes(mapping.field) && index > 0) {
          console.log(`⏭️ Skipping ${mapping.label} #${index} (only main container gets color tooltip)`);
          return;
        }
        // Special case: For button-related color fields, prefer the most specific button element
        else if (['acceptTextColor'].includes(mapping.field) && mapping.selector.includes('accept')) {
          // Only highlight the first accept button found
          if (index > 0) {
            console.log(`⏭️ Skipping ${mapping.label} #${index} (only first accept button gets tooltip)`);
            return;
          }
        }
        else if (['declineTextColor', 'borderColor'].includes(mapping.field) && mapping.selector.includes('decline')) {
          // Only highlight the first decline button found
          if (index > 0) {
            console.log(`⏭️ Skipping ${mapping.label} #${index} (only first decline button gets tooltip)`);
            return;
          }
        }
        // Special case: For accent color title mapping, only use the first title element
        else if (mapping.field === 'accentColor' && mapping.selector.includes('title') && index > 0) {
          console.log(`⏭️ Skipping ${mapping.label} #${index} (only first title gets tooltip)`);
          return;
        }
        // Special case: For button image fields, only use the first image found
        else if (['acceptButton', 'declineButton'].includes(mapping.field) && index > 0) {
          console.log(`⏭️ Skipping ${mapping.label} #${index} (only first button image gets tooltip)`);
          return;
        }
        // Special case: For asset fields, only use the first element found
        else if (['logo', 'qrCode'].includes(mapping.field) && index > 0) {
          console.log(`⏭️ Skipping ${mapping.label} #${index} (only first asset gets tooltip)`);
          return;
        }

        console.log(`✨ Making ${mapping.label} #${index} interactive:`, element);

        element.dataset.interactive = 'true';
        element.dataset.field = mapping.field;
        element.style.position = 'relative';
        element.style.cursor = 'pointer';
        element.style.transition = 'all 0.3s ease';        // Add hover effects
        const addHoverEffect = () => {
          console.log(`🎯 Hovering ${mapping.label}`);
          element.style.outline = '3px solid rgba(102, 126, 234, 0.8)';
          element.style.outlineOffset = '3px';
          element.style.boxShadow = '0 0 15px rgba(102, 126, 234, 0.5)';
          element.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';

          // Show tooltip
          showTooltip(element, mapping.label);
        };

        const removeHoverEffect = () => {
          element.style.outline = 'none';
          element.style.boxShadow = 'none';
          element.style.backgroundColor = 'transparent';
          hideTooltip();
        };

        // Add click handler to focus form field
        const handleClick = (e) => {
          console.log(`🖱️ Clicked ${mapping.label}, focusing field: ${mapping.field}`);
          e.preventDefault();
          e.stopPropagation();
          focusFormField(mapping.field);
        };

        element.addEventListener('mouseenter', addHoverEffect);
        element.addEventListener('mouseleave', removeHoverEffect);
        element.addEventListener('click', handleClick);

        totalElementsFound++;
      });
    });

    console.log(`🎉 Interactive highlighting complete! ${totalElementsFound} elements made interactive`);
  };  // Function to show tooltip
  const showTooltip = (element, label) => {
    hideTooltip(); // Remove any existing tooltip

    const tooltip = document.createElement('div');
    tooltip.id = 'preview-tooltip';
    tooltip.textContent = `Edit ${label}`;
    tooltip.style.cssText = `
      position: absolute;
      top: -35px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(102, 126, 234, 0.9);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      white-space: nowrap;
      z-index: 10000;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      pointer-events: none;
    `;

    element.style.position = 'relative';
    element.appendChild(tooltip);
  };

  // Function to hide tooltip
  const hideTooltip = () => {
    const existingTooltip = document.getElementById('preview-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
  };

  // Function to focus specific form field
  const focusFormField = (fieldName) => {
    // Clear any existing highlights before focusing new field
    clearPreviewHighlights();

    const formField = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`);
    if (formField) {
      formField.focus();
      formField.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add a temporary highlight to the focused field
      const originalStyle = formField.style.cssText;
      formField.style.outline = '3px solid rgba(102, 126, 234, 0.8)';
      formField.style.outlineOffset = '2px';

      setTimeout(() => {
        formField.style.cssText = originalStyle;
      }, 2000);
    }
  };

  // Function to highlight preview elements when form field is focused
  const highlightPreviewElement = (fieldName) => {
    console.log(`🎯 Highlighting preview element for field: ${fieldName}`);

    const container = document.getElementById("consent-container");
    if (!container) return;

    // Clear any existing highlights
    clearPreviewHighlights();

    // Special case for language field - highlight the entire popup
    if (fieldName === 'language') {
      console.log(`🌐 Language field focused - highlighting entire popup`);

      // Find the main consent popup/dialog element
      const popupElement = container.querySelector('.consent-popup, [class*="consent"], [class*="dialog"], [class*="popup"], div') || container.firstElementChild;
      if (popupElement) {
        console.log(`✨ Found popup element for language:`, popupElement);

        // Store original styles
        popupElement.dataset.originalOutline = popupElement.style.outline || 'none';
        const computedStyle = getComputedStyle(popupElement);
        popupElement.dataset.originalBoxShadow = popupElement.style.boxShadow || computedStyle.boxShadow || 'none';
        popupElement.dataset.originalBackgroundColor = popupElement.style.backgroundColor || 'transparent';
        popupElement.dataset.originalTransform = popupElement.style.transform || 'scale(1)';

        // Add highlighting to the entire popup (preserving original box-shadow)
        const originalBoxShadow = popupElement.dataset.originalBoxShadow !== 'none' ? popupElement.dataset.originalBoxShadow : '';
        const shadowPrefix = originalBoxShadow ? `${originalBoxShadow}, ` : '';

        popupElement.style.outline = '4px solid rgba(255, 193, 7, 0.9)';
        popupElement.style.outlineOffset = '4px';
        popupElement.style.boxShadow = `${shadowPrefix}0 0 30px rgba(255, 193, 7, 0.8), inset 0 0 20px rgba(255, 193, 7, 0.1)`;
        popupElement.style.backgroundColor = 'rgba(255, 193, 7, 0.05)';
        popupElement.style.transform = 'scale(1.01)';

        // Mark as highlighted
        popupElement.dataset.inputHighlighted = 'true';

        // Show input focus tooltip
        showInputFocusTooltip(popupElement, fieldName);
      }
      return;
    }

    // Special cases for color fields - highlight the entire popup with different styles
    if (['backgroundColor', 'outlineColor'].includes(fieldName)) {
      console.log(`🎨 Color field focused (${fieldName}) - highlighting entire popup`);

      const popupElement = container.querySelector('.consent-popup, [class*="consent"], [class*="dialog"], [class*="popup"], div') || container.firstElementChild;
      if (popupElement) {
        console.log(`✨ Found popup element for ${fieldName}:`, popupElement);

        // Store original styles
        popupElement.dataset.originalOutline = popupElement.style.outline || 'none';
        const computedStyle = getComputedStyle(popupElement);
        popupElement.dataset.originalBoxShadow = popupElement.style.boxShadow || computedStyle.boxShadow || 'none';
        popupElement.dataset.originalBackgroundColor = popupElement.style.backgroundColor || 'transparent';
        popupElement.dataset.originalTransform = popupElement.style.transform || 'scale(1)';

        // Add color-specific highlighting (preserving original box-shadow)
        const originalBoxShadow = popupElement.dataset.originalBoxShadow !== 'none' ? popupElement.dataset.originalBoxShadow : '';
        const shadowPrefix = originalBoxShadow ? `${originalBoxShadow}, ` : '';

        if (fieldName === 'backgroundColor') {
          popupElement.style.outline = '4px dashed rgba(138, 43, 226, 0.8)';
          popupElement.style.outlineOffset = '6px';
          popupElement.style.boxShadow = `${shadowPrefix}0 0 25px rgba(138, 43, 226, 0.6), inset 0 0 15px rgba(138, 43, 226, 0.1)`;
        } else if (fieldName === 'outlineColor') {
          popupElement.style.outline = '4px dotted rgba(50, 205, 50, 0.8)';
          popupElement.style.outlineOffset = '4px';
          popupElement.style.boxShadow = `${shadowPrefix}0 0 20px rgba(50, 205, 50, 0.6)`;
        }

        popupElement.style.transform = 'scale(1.01)';
        popupElement.dataset.inputHighlighted = 'true';
        showInputFocusTooltip(popupElement, fieldName);
      }
      return;
    }

    // Find the corresponding preview element for other fields
    const element = container.querySelector(`[data-field="${fieldName}"]`);
    if (element) {
      console.log(`✨ Found preview element for ${fieldName}:`, element);

      // Store original styles
      element.dataset.originalOutline = element.style.outline || 'none';
      const computedStyle = getComputedStyle(element);
      element.dataset.originalBoxShadow = element.style.boxShadow || computedStyle.boxShadow || 'none';
      element.dataset.originalBackgroundColor = element.style.backgroundColor || 'transparent';
      element.dataset.originalTransform = element.style.transform || 'scale(1)';

      // Add highlighting with different colors for button color fields (preserving original box-shadow)
      const originalBoxShadow = element.dataset.originalBoxShadow !== 'none' ? element.dataset.originalBoxShadow : '';
      const shadowPrefix = originalBoxShadow ? `${originalBoxShadow}, ` : '';

      if (['acceptTextColor', 'declineTextColor'].includes(fieldName)) {
        // Use purple highlight for button text color fields
        element.style.outline = '3px solid rgba(138, 43, 226, 0.9)';
        element.style.outlineOffset = '3px';
        element.style.boxShadow = `${shadowPrefix}0 0 20px rgba(138, 43, 226, 0.7)`;
        element.style.backgroundColor = 'rgba(138, 43, 226, 0.15)';
      } else if (fieldName === 'accentColor') {
        // Use yellow highlight for accent color (title color)
        element.style.outline = '3px solid rgba(255, 193, 7, 0.9)';
        element.style.outlineOffset = '3px';
        element.style.boxShadow = `${shadowPrefix}0 0 20px rgba(255, 193, 7, 0.7)`;
        element.style.backgroundColor = 'rgba(255, 193, 7, 0.15)';
      } else if (['logo', 'qrCode', 'acceptButton', 'declineButton'].includes(fieldName)) {
        // Use teal highlight for asset fields
        element.style.outline = '3px solid rgba(0, 150, 136, 0.9)';
        element.style.outlineOffset = '3px';
        element.style.boxShadow = `${shadowPrefix}0 0 20px rgba(0, 150, 136, 0.7)`;
        element.style.backgroundColor = 'rgba(0, 150, 136, 0.15)';
      } else if (fieldName === 'borderColor') {
        // Use orange highlight specifically for border color (decline button border)
        element.style.outline = '6px solid rgba(255, 69, 0, 0.8)';
        element.style.outlineOffset = '2px';
        element.style.boxShadow = `${shadowPrefix}0 0 20px rgba(255, 69, 0, 0.6)`;
        element.style.backgroundColor = 'rgba(255, 69, 0, 0.1)';
      } else {
        // Default yellow highlighting for other fields
        element.style.outline = '3px solid rgba(255, 193, 7, 0.9)';
        element.style.outlineOffset = '3px';
        element.style.boxShadow = `${shadowPrefix}0 0 20px rgba(255, 193, 7, 0.7)`;
        element.style.backgroundColor = 'rgba(255, 193, 7, 0.15)';
      }

      element.style.transform = 'scale(1.02)';

      // Mark as highlighted
      element.dataset.inputHighlighted = 'true';

      // Show input focus tooltip
      showInputFocusTooltip(element, fieldName);
    }
  };  // Function to clear preview highlights
  const clearPreviewHighlights = () => {
    const container = document.getElementById("consent-container");
    if (!container) return;

    const highlightedElements = container.querySelectorAll('[data-input-highlighted="true"]');
    highlightedElements.forEach(element => {
      // Store original styles before clearing
      const originalOutline = element.dataset.originalOutline || 'none';
      const originalBoxShadow = element.dataset.originalBoxShadow || 'none';
      const originalBackgroundColor = element.dataset.originalBackgroundColor || 'transparent';
      const originalTransform = element.dataset.originalTransform || 'scale(1)';

      // Restore original styles
      element.style.outline = originalOutline;
      element.style.boxShadow = originalBoxShadow;
      element.style.backgroundColor = originalBackgroundColor;
      element.style.transform = originalTransform;
      element.removeAttribute('data-input-highlighted');

      // Clean up stored original styles
      element.removeAttribute('data-original-outline');
      element.removeAttribute('data-original-box-shadow');
      element.removeAttribute('data-original-background-color');
      element.removeAttribute('data-original-transform');
    });

    hideInputFocusTooltip();
  };

  // Function to show input focus tooltip
  const showInputFocusTooltip = (element, fieldName) => {
    hideInputFocusTooltip(); // Remove any existing tooltip

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

  // Function to hide input focus tooltip
  const hideInputFocusTooltip = () => {
    const existingTooltip = document.getElementById('input-focus-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
  };

  // Store active element on field change
  const handleChange = (e) => {
    // Save reference to the active element
    activeElementRef.current = e.target;

    const { name, value } = e.target;

    // Update state using the functional form
    setConfig(prevConfig => ({
      ...prevConfig,
      [name]: value
    }));
  };

  // Handle focus events on input fields
  const handleFieldFocus = (e) => {
    const fieldName = e.target.name;
    console.log(`🎯 Field focused: ${fieldName}`);
    // Use a small delay to ensure focus is stable before highlighting
    setTimeout(() => {
      // Only highlight if the field is still focused
      if (document.activeElement === e.target) {
        highlightPreviewElement(fieldName);
      }
    }, 100);
  };

  // Handle blur events on input fields
  const handleFieldBlur = (e) => {
    const fieldName = e.target.name;
    console.log(`👋 Field blurred: ${fieldName}`);
    clearPreviewHighlights();
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
              onChange={(e, newValue) => setActiveTab(newValue)}
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
              Reset
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

      <ImplementationSteps config={config} open={dialogOpen} onClose={() => setDialogOpen(false)} />
      </Grid>
    </div>
    </>
  );
};

export default ConsentConfigurator;

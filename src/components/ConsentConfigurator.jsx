import "@fontsource/roboto";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography
} from "@mui/material";
import React, { Suspense, useEffect, useRef, useState } from "react";

// Lazy load ImplementationSteps
const ImplementationSteps = React.lazy(() => import("./ImplementationSteps"));

const ConsentConfigurator = () => {
  const supportedLanguages = [
    { code: "en_US", name: "English" },
    { code: "ar_SA", name: "العربية (Arabic)" },
    { code: "de_DE", name: "Deutsch (German)" },
    { code: "es_ES", name: "Español (Spanish)" },
    { code: "fr_FR", name: "Français (French)" },
    { code: "hi_IN", name: "हिन्दी (Hindi)" },
    { code: "it_IT", name: "Italiano (Italian)" },
    { code: "ja_JP", name: "日本語 (Japanese)" },
    { code: "nl_NL", name: "Nederlands (Dutch)" },
    { code: "pt_PT", name: "Português (Portuguese)" },
    { code: "ru_RU", name: "Русский (Russian)" },
    { code: "tr_TR", name: "Türkçe (Turkish)" },
    { code: "zh_Hans_CN", name: "中文 (Chinese Simplified)" }
  ];

  const getDefaultConfig = () => ({
    logo: "img/logo.png",
    qrCode: "",
    title: "Bright SDK Consent",
    benefitText: "To support the app",
    acceptButton: "",
    declineButton: "",
    acceptButtonText: "Accept",
    declineButtonText: "Decline",
    backgroundColor: "#FBEFCF",
    accentColor: "#D36B2E",
    acceptTextColor: "#FFF",
    declineTextColor: "#9D9B9B",
    borderColor: "#AA99EC",
    outlineColor: "#9DA9E8",
    language: "en_US"
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
  const updateTimeoutRef = useRef(null);
  const activeElementRef = useRef(null);

  // Use a separate effect for preview updates with focus retention
  useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      try {
        // Store the currently focused element before updating preview
        if (document.activeElement) {
          activeElementRef.current = document.activeElement;
        }

        const container = document.getElementById("consent-container");
        if (container && window.ConsentModule) {
          container.innerHTML = "";
          // Convert language format from locale codes to external consent library format
          const convertLanguageCode = (languageCode) => {
            const languageMap = {
              'en_US': 'en-US',
              'ar_SA': 'ar-SA',
              'de_DE': 'de-DE',
              'es_ES': 'es-ES',
              'fr_FR': 'fr-FR',
              'hi_IN': 'hi-IN',
              'it_IT': 'it-IT',
              'ja_JP': 'ja-JP',
              'nl_NL': 'nl-NL',
              'pt_PT': 'pt-PT',
              'ru_RU': 'ru-RU',
              'tr_TR': 'tr-TR',
              'zh_Hans_CN': 'zh-CN'
            };
            return languageMap[languageCode] || 'en-US';
          };

          const convertedLanguage = convertLanguageCode(config.language);
          const params = { ...config, language: convertedLanguage, preview: true };
          window.ConsentModule.create("consent-container", params).show();
        }

        // Restore focus after updating preview
        if (activeElementRef.current) {
          activeElementRef.current.focus();
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
  }, [config]);

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
    <Grid container spacing={3} style={{ height: "100vh", padding: "20px" }}>
      <Grid item xs={4} style={{ maxWidth: "30%" }}>
        <Card>
          <CardContent>
            <Typography variant="h6">Consent Configuration</Typography>
            <Divider style={{ margin: "10px 0" }} />
            <FormControl fullWidth margin="normal">
              <InputLabel>Language</InputLabel>
              <Select
                name="language"
                value={config.language}
                onChange={handleChange}
                label="Language"
              >
                {supportedLanguages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth label="Logo URL" name="logo" value={config.logo} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="QR Code URL" name="qrCode" value={config.qrCode} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Benefit Text" name="benefitText" value={config.benefitText} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Accept Button Image URL" name="acceptButton" value={config.acceptButton} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Decline Button Image URL" name="declineButton" value={config.declineButton} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Title" name="title" value={config.title} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Accept Button Text" name="acceptButtonText" value={config.acceptButtonText} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Decline Button Text" name="declineButtonText" value={config.declineButtonText} onChange={handleChange} margin="normal" />
            <TextField fullWidth type="color" label="Background Color" name="backgroundColor" value={config.backgroundColor} onChange={handleChange} margin="normal" />
            <TextField fullWidth type="color" label="Accent Color" name="accentColor" value={config.accentColor} onChange={handleChange} margin="normal" />
            <TextField fullWidth type="color" label="Accept Button Text Color" name="acceptTextColor" value={config.acceptTextColor} onChange={handleChange} margin="normal" />
            <TextField fullWidth type="color" label="Decline Button Text Color" name="declineTextColor" value={config.declineTextColor} onChange={handleChange} margin="normal" />
            <TextField fullWidth type="color" label="Border Color" name="borderColor" value={config.borderColor} onChange={handleChange} margin="normal" />
            <TextField fullWidth type="color" label="Outline Color" name="outlineColor" value={config.outlineColor} onChange={handleChange} margin="normal" />
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              style={{ marginTop: "20px" }}
              onClick={handleReset}
            >
              Reset
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={8} style={{ maxWidth: "70%" }}>
        <Card>
          <CardContent>
            <Typography variant="h6">Consent Preview</Typography>
            <Divider style={{ margin: "10px 0" }} />
            <div id="consent-container"></div>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              style={{ marginTop: "10px" }}
              onClick={() => setDialogOpen(true)}
            >
              View Implementation Steps
            </Button>
            <Button
              variant="contained"
              style={{ backgroundColor: "green", color: "white", marginTop: "10px" }}
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

      <Suspense fallback={
        <Box display="flex" justifyContent="center" alignItems="center" p={2}>
          <CircularProgress size={24} />
        </Box>
      }>
        <ImplementationSteps config={config} open={dialogOpen} onClose={() => setDialogOpen(false)} />
      </Suspense>
    </Grid>
  );
};

export default ConsentConfigurator;

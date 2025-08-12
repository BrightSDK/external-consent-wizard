import "@fontsource/roboto";
import { Button, Card, CardContent, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Snackbar, TextField, Typography } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import ImplementationSteps from "./ImplementationSteps";

// Force React to be used - prevents auto-removal
const _forceReactUsage = React.createElement;

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
    backgroundColor: "#FBEFCF",
    accentColor: "#D36B2E",
    acceptTextColor: "#FFF",
    declineTextColor: "#9D9B9B",
    borderColor: "#AA99EC",
    outlineColor: "#9DA9E8",
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
          const params = { ...config, preview: true };
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
            <Divider style={{ margin: "10px 0" }} />
            <TextField fullWidth label="Title" name="title" value={config.title} onChange={handleChange} margin="normal" />
            <FormControl fullWidth margin="normal">
              <InputLabel>🌐 Language</InputLabel>
              <Select
                name="language"
                value={config.language}
                onChange={handleChange}
                label="🌐 Language"
              >
                <MenuItem value="en">🇺🇸 English</MenuItem>
                <MenuItem value="es">🇪🇸 Español</MenuItem>
                <MenuItem value="fr">🇫🇷 Français</MenuItem>
                <MenuItem value="de">🇩🇪 Deutsch</MenuItem>
                <MenuItem value="it">🇮🇹 Italiano</MenuItem>
                <MenuItem value="pt">🇵🇹 Português</MenuItem>
                <MenuItem value="ru">🇷🇺 Русский</MenuItem>
                <MenuItem value="ja">🇯🇵 日本語</MenuItem>
                <MenuItem value="ko">🇰🇷 한국어</MenuItem>
                <MenuItem value="zh">🇨🇳 中文</MenuItem>
                <MenuItem value="ar">🇸🇦 العربية</MenuItem>
                <MenuItem value="hi">🇮🇳 हिन्दी</MenuItem>
                <MenuItem value="tr">🇹🇷 Türkçe</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Logo URL" name="logo" value={config.logo} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Benefit Text" name="benefitText" value={config.benefitText} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Accept Button Text" name="acceptButtonText" value={config.acceptButtonText} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Decline Button Text" name="declineButtonText" value={config.declineButtonText} onChange={handleChange} margin="normal" />
            <TextField fullWidth type="color" label="Background Color" name="backgroundColor" value={config.backgroundColor} onChange={handleChange} margin="normal" />
            <TextField fullWidth type="color" label="Accent Color" name="accentColor" value={config.accentColor} onChange={handleChange} margin="normal" />
            <TextField fullWidth type="color" label="Accept Button Text Color" name="acceptTextColor" value={config.acceptTextColor} onChange={handleChange} margin="normal" />
            <TextField fullWidth type="color" label="Decline Button Text Color" name="declineTextColor" value={config.declineTextColor} onChange={handleChange} margin="normal" />
            <TextField fullWidth type="color" label="Border Color" name="borderColor" value={config.borderColor} onChange={handleChange} margin="normal" />
            <TextField fullWidth type="color" label="Outline Color" name="outlineColor" value={config.outlineColor} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Accept Button Image URL" name="acceptButton" value={config.acceptButton} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Decline Button Image URL" name="declineButton" value={config.declineButton} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="QR Code URL" name="qrCode" value={config.qrCode} onChange={handleChange} margin="normal" />
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              style={{
                marginTop: "20px",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                color: "white"
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
  );
};

export default ConsentConfigurator;

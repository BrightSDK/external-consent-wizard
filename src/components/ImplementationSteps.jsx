import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

const ImplementationSteps = ({ config, open, onClose }) => {
  const scriptName = 'consent.bundle.js';
  const scriptUrl = `https://brightsdk.github.io/bright-sdk-external-consent/releases/latest/${scriptName}`;
  const curlCommand = `curl -o ${scriptName} ${scriptUrl}`;
  const scriptTag = `<script type="text/javascript" src="${scriptName}"></script>`;
  const elemId = 'consent-container';
  const divTag = `
<style type="text/css">
  #${elemId} {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9998;
}
</style>
<div id="${elemId}"></div>
`;
  const implementationCode = `var dialog = ConsentModule.create("consent-container", ${JSON.stringify({...config,
    onShow: '() => {/* callback to execute on dialog display */}',
    onClose: '() => {/* callback to execute on dialog close */}',
    onAccept: '() => {/* callback to execute on dialog accept */}',
    onDecline: '() => {/* callback to execute on dialog decline */}',
  }, null, 2)});`.replace(/"\(/g, '(').replace(/\}"/g, '}').concat(`

  // to show the consent dialog, call
  dialog.show();

  // please note that dialog is created only once, so plan your callbacks accordingly

  `);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Implementation Steps</DialogTitle>
      <DialogContent>
        <Typography variant="body1">1. Download the dialog script:</Typography>
        <pre style={{ background: "#f4f4f4", padding: "10px", borderRadius: "5px", overflowX: "auto" }}>{curlCommand}</pre>
        <Button onClick={() => copyToClipboard(curlCommand)} color="primary">Copy</Button>

        <Typography variant="body1" style={{ marginTop: "10px" }}>2. Import the dialog script into your index.html:</Typography>
        <pre style={{ background: "#f4f4f4", padding: "10px", borderRadius: "5px", overflowX: "auto" }}>{scriptTag}</pre>
        <Button onClick={() => copyToClipboard(scriptTag)} color="primary">Copy</Button>

        <Typography variant="body1" style={{ marginTop: "10px" }}>3. Create a div element for the dialog:</Typography>
        <pre style={{ background: "#f4f4f4", padding: "10px", borderRadius: "5px", overflowX: "auto" }}>{divTag}</pre>
        <Button onClick={() => copyToClipboard(divTag)} color="primary">Copy</Button>

        <Typography variant="body1" style={{ marginTop: "10px" }}>4. Add implementation code:</Typography>
        <pre style={{ background: "#f4f4f4", padding: "10px", borderRadius: "5px", overflowX: "auto" }}>{implementationCode}</pre>
        <Button onClick={() => copyToClipboard(implementationCode)} color="primary">Copy</Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImplementationSteps;

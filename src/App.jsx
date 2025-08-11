import { Box, CircularProgress } from "@mui/material";
import React, { Suspense } from "react";

// Lazy load the main components
const ConsentConfigurator = React.lazy(() => import("./components/ConsentConfigurator"));

const LoadingSpinner = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ConsentConfigurator />
    </Suspense>
  );
};

export default App;

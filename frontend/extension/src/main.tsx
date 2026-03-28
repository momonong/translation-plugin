import { HashRouter } from "react-router-dom";
import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, useMediaQuery } from "@mui/material";
import './index.css'
import App from './App.tsx'

function AppWithTheme() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWithTheme />
  </StrictMode>
);

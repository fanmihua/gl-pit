import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource-variable/roboto-condensed";
import { App } from "./App.jsx";
import { PitRadioProvider } from "./PitRadioContext.jsx";
import "./styles.css";
import "./pit-radio.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PitRadioProvider>
      <App />
    </PitRadioProvider>
  </React.StrictMode>,
);

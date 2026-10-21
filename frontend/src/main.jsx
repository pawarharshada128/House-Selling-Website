import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter
} from "react-router-dom";

import RouterApp from "./RouterApp";
import { LocaleProvider } from "./LocaleContext";

import "./index.css";
import "./App.css";
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>

    <BrowserRouter>
      <LocaleProvider>
        <RouterApp />
      </LocaleProvider>
    </BrowserRouter>

  </React.StrictMode>
);
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LadderGame } from "../app/LadderGame";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LadderGame />
  </StrictMode>,
);

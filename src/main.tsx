import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LadderGame } from "../app/LadderGame";
import { AdminPage } from "../app/AdminPage";
import "../app/globals.css";

const isAdminPage = window.location.pathname.replace(/\/+$/, "") === "/admin";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isAdminPage ? <AdminPage /> : <LadderGame />}
  </StrictMode>,
);

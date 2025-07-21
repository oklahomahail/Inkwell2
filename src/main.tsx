import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ToastProvider } from "@/context/ToastContext";
import { ClaudeProvider } from "@/context/ClaudeProvider";
import { WritingPlatformProvider } from "@/context/WritingPlatformProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ToastProvider>
      <ClaudeProvider>
        <WritingPlatformProvider>
          <App />
        </WritingPlatformProvider>
      </ClaudeProvider>
    </ToastProvider>
  </React.StrictMode>
);

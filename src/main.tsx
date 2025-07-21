import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import CompleteWritingPlatform from "@/components/CompleteWritingPlatform";
import { WritingPlatformProvider } from "@/context/WritingPlatformProvider";
import { ClaudeProvider } from "@/context/ClaudeProvider"; // Now a named export
import { ToastProvider } from "@/context/ToastContext";

// Optional: If you want routing support later
// import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* <BrowserRouter> */}
    <WritingPlatformProvider>
      <ClaudeProvider>
        <ToastProvider>
          <CompleteWritingPlatform />
        </ToastProvider>
      </ClaudeProvider>
    </WritingPlatformProvider>
    {/* </BrowserRouter> */}
  </React.StrictMode>
);

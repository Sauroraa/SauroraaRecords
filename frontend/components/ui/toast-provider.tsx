"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#111111",
          color: "#f5f3ef",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px",
          fontSize: "14px",
          fontFamily: "var(--font-inter), var(--font-space), sans-serif"
        },
        success: {
          iconTheme: {
            primary: "#8b5cf6",
            secondary: "#111111"
          }
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#111111"
          }
        }
      }}
    />
  );
}

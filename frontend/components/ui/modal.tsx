"use client";

import { Fragment, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl"
};

export function Modal({ open, onClose, title, children, size = "md", className }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className={cn(
                "relative w-full rounded-[20px] border border-[rgba(255,255,255,0.1)] bg-surface p-6 shadow-soft",
                sizeClasses[size],
                className
              )}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-cream">{title}</h2>
                  <button
                    onClick={onClose}
                    className="rounded-sm p-1.5 text-cream/40 transition hover:text-cream/80 hover:bg-white/8"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {!title && (
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-sm p-1.5 text-cream/40 transition hover:text-cream/80 hover:bg-white/8"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {children}
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}

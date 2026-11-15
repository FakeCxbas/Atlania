"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

function DetailModalPortal({
  onClose,
  eyebrow,
  title,
  icon,
  children,
}: Omit<DetailModalProps, "isOpen">) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setEntered(true);
    });

    document.body.classList.add("overflow-hidden");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("overflow-hidden");
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#101321]/60 p-4 backdrop-blur-md transition-opacity duration-300 ease-out md:p-6 ${
        entered ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-xl transform rounded-2xl border border-[#55527D]/35 bg-[#121626]/95 p-6 shadow-2xl transition-all duration-300 ease-out md:p-8 ${
          entered ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute top-5 right-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#55527D]/35 bg-[#181B2C] text-[#A3A1BD] transition-colors hover:border-[#55527D]/35 hover:bg-[#27233E] hover:text-[#E4DFD5]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2.5 pr-10">
          {icon}
          <span className="font-mono text-xs font-medium tracking-[0.2em] text-[#C5A36D] uppercase">
            {eyebrow}
          </span>
        </div>

        <h3 className="mt-4 pr-6 text-xl font-semibold leading-snug text-[#E4DFD5] sm:text-2xl">
          {title}
        </h3>

        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Centered viewport modal with smooth scale/opacity transition,
 * Escape/backdrop/X closing, and body scroll lock.
 */
export function DetailModal({ isOpen, ...rest }: DetailModalProps) {
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return <DetailModalPortal {...rest} />;
}

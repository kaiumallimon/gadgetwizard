"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface AdminErrorToastProps {
  message: string | null;
}

export function AdminErrorToast({ message }: AdminErrorToastProps) {
  const lastShownRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message || lastShownRef.current === message) {
      return;
    }

    lastShownRef.current = message;
    toast.error(message);
  }, [message]);

  return null;
}

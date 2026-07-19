"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Browser-native print, which any modern browser can also "Save as PDF" from. */
export function PrintButton() {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()} className="print:hidden">
      <Printer aria-hidden="true" />
      Print / save as PDF
    </Button>
  );
}

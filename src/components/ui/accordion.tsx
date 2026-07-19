"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn("border-line border-b", className)}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "font-display group flex flex-1 items-center justify-between gap-4 py-5 text-left text-base font-medium transition-colors hover:text-teal-700",
          className,
        )}
        {...props}
      >
        {children}
        <Plus
          aria-hidden="true"
          className="text-ink-subtle size-5 shrink-0 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-soft)] group-data-[state=open]:rotate-45"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className="overflow-hidden data-[state=closed]:animate-[acc-up_180ms_var(--ease-out-soft)] data-[state=open]:animate-[acc-down_180ms_var(--ease-out-soft)]"
      {...props}
    >
      <div className={cn("text-ink-muted pb-5 text-sm leading-relaxed", className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

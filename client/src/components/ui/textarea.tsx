import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  React.useEffect(() => {
    if (textareaRef.current) {
      const computedStyle = window.getComputedStyle(textareaRef.current);
      console.log('🔍 TEXTAREA DEBUG:', {
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        transform: computedStyle.transform,
        clipPath: computedStyle.clipPath,
        overflow: computedStyle.overflow,
        textShadow: computedStyle.textShadow,
        filter: computedStyle.filter,
        mixBlendMode: computedStyle.mixBlendMode,
        webkitTextFillColor: computedStyle.webkitTextFillColor || 'not set',
        webkitTextStroke: computedStyle.webkitTextStroke || 'not set',
        value: textareaRef.current.value,
        valueLength: textareaRef.current.value.length
      });
    }
  });
  
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={(node) => {
        (textareaRef as any).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

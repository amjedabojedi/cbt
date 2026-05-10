import * as React from "react"

import { cn } from "@/lib/utils"
import { VoiceDictateButton } from "@/components/ui/voice-dictate-button"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  voiceInput?: boolean
  voiceLanguage?: string
}

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ className, voiceInput = true, voiceLanguage, value, onChange, readOnly, disabled, ...props }, ref) => {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null)
  React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement)

  const isControlled = value !== undefined && onChange !== undefined
  const showMic = voiceInput && !readOnly && !disabled

  const appendTranscript = React.useCallback(
    (text: string) => {
      const node = innerRef.current
      if (!node) return
      const trimmed = text.trim()
      if (!trimmed) return

      const current = isControlled ? String(value ?? "") : node.value
      const sep = current && !/\s$/.test(current) ? " " : ""
      const next = `${current}${sep}${trimmed}`

      if (isControlled) {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value",
        )?.set
        setter?.call(node, next)
        node.dispatchEvent(new Event("input", { bubbles: true }))
      } else {
        node.value = next
        node.dispatchEvent(new Event("input", { bubbles: true }))
      }
    },
    [isControlled, value],
  )

  return (
    <div className={cn("relative w-full", showMic && "pr-0")}>
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          showMic && "pr-11",
          className
        )}
        ref={innerRef}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        disabled={disabled}
        {...props}
      />
      {showMic && (
        <div className="absolute bottom-2 right-2">
          <VoiceDictateButton
            onTranscript={appendTranscript}
            language={voiceLanguage}
            size="sm"
          />
        </div>
      )}
    </div>
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

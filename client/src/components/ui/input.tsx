import * as React from "react"

import { cn } from "@/lib/utils"
import { VoiceDictateButton } from "@/components/shared/voice-dictate-button"

export interface InputProps extends React.ComponentProps<"input"> {
  voiceInput?: boolean
  voiceLanguage?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, voiceInput = false, voiceLanguage, value, onChange, readOnly, disabled, ...props },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null)
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement)

    const dictationEligible =
      voiceInput &&
      !readOnly &&
      !disabled &&
      (!type || type === "text" || type === "search")

    const isControlled = value !== undefined && onChange !== undefined

    const appendTranscript = React.useCallback(
      (text: string) => {
        const node = innerRef.current
        if (!node) return
        const trimmed = text.trim()
        if (!trimmed) return

        const current = isControlled ? String(value ?? "") : node.value
        const sep = current && !/\s$/.test(current) ? " " : ""
        const next = `${current}${sep}${trimmed}`

        if (isControlled && onChange) {
          // Set DOM value then call onChange directly so react-hook-form
          // and other controlled-input patterns pick up the new value.
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set
          setter?.call(node, next)
          onChange({ target: node } as React.ChangeEvent<HTMLInputElement>)
        } else {
          node.value = next
          node.dispatchEvent(new Event("input", { bubbles: true }))
        }
      },
      [isControlled, value, onChange],
    )

    if (!dictationEligible) {
      return (
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={innerRef}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          disabled={disabled}
          {...props}
        />
      )
    }

    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-11 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={innerRef}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          disabled={disabled}
          {...props}
        />
        <div className="absolute top-1/2 right-1.5 -translate-y-1/2">
          <VoiceDictateButton
            onTranscript={appendTranscript}
            language={voiceLanguage}
            size="sm"
          />
        </div>
      </div>
    )
  },
)
Input.displayName = "Input"

export { Input }

import { cn } from "@/lib/utils";

interface ColorWithContrastProps {
  color: string;
  children: React.ReactNode;
  className?: string;
  asBackground?: boolean;
  asBorder?: boolean;
  withIcon?: boolean;
  icon?: React.ReactNode;
}

/**
 * Utility component to ensure text has sufficient contrast over a colored background
 * - Automatically determines if text should be white or black based on background color
 * - Supports background colors, text colors, and border colors
 */
export function ColorWithContrast({
  color,
  children,
  className,
  asBackground = true, 
  asBorder = false,
  withIcon = false,
  icon
}: ColorWithContrastProps) {
  // Convert color formats to RGB values
  function parseColor(colorStr: string): [number, number, number] {
    // Create a temporary element to compute the color
    const tempEl = document.createElement('div');
    tempEl.style.color = colorStr;
    document.body.appendChild(tempEl);
    
    // Get computed color
    const computedColor = getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);
    
    // Extract RGB values
    const rgbMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) {
      return [
        parseInt(rgbMatch[1], 10),
        parseInt(rgbMatch[2], 10),
        parseInt(rgbMatch[3], 10)
      ];
    }
    
    // Default to black if parsing fails
    return [0, 0, 0];
  }
  
  // Calculate relative luminance according to WCAG formula
  function getLuminance(rgb: [number, number, number]): number {
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  
  // Determine if text should be white or black based on background color
  function getTextColor(bgColor: string): string {
    const rgb = parseColor(bgColor);
    const luminance = getLuminance(rgb);
    
    // WCAG recommends 4.5:1 contrast for normal text
    // White text has higher contrast on dark backgrounds
    return luminance > 0.45 ? "text-gray-900" : "text-white";
  }
  
  // Set the appropriate style based on props
  let styles = {};
  let textColor = '';
  
  if (asBackground) {
    styles = { backgroundColor: color };
    textColor = getTextColor(color);
  } else if (asBorder) {
    styles = { borderColor: color, borderWidth: '1px' };
  } else {
    styles = { color };
  }
  
  return (
    <div
      className={cn(
        asBackground && textColor,
        withIcon && "flex items-center gap-1.5",
        className
      )}
      style={styles}
    >
      {withIcon && icon}
      {children}
    </div>
  );
}
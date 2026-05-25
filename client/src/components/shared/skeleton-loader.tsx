import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
  circle?: boolean;
  inline?: boolean;
  animated?: boolean;
}

/**
 * Skeleton loader component for content placeholders during loading
 */
export function SkeletonLoader({
  className,
  count = 1,
  height = "1rem",
  width = "100%",
  circle = false,
  inline = false,
  animated = true
}: SkeletonLoaderProps) {
  
  const skeletonArray = Array.from({ length: count }, (_, index) => index);
  
  const baseClasses = cn(
    "bg-gray-200 dark:bg-gray-700",
    animated && "animate-pulse",
    circle && "rounded-full",
    !circle && "rounded-md",
    inline && "inline-block",
    className
  );
  
  return (
    <>
      {skeletonArray.map((index) => (
        <div
          key={index}
          className={baseClasses}
          style={{
            height,
            width,
            marginBottom: index < count - 1 ? "0.5rem" : 0
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

/**
 * Pre-configured skeleton for text content
 */
export function TextSkeleton({ lines = 3, className }: { lines?: number, className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLoader 
          key={i} 
          height="0.85rem" 
          width={i === lines - 1 && lines > 1 ? "60%" : "100%"} 
        />
      ))}
    </div>
  );
}

/**
 * Pre-configured skeleton for card content
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-5", className)}>
      <SkeletonLoader height="1.5rem" width="70%" />
      <TextSkeleton lines={3} />
      <div className="flex justify-end space-x-2">
        <SkeletonLoader height="2.25rem" width="6rem" />
        <SkeletonLoader height="2.25rem" width="6rem" />
      </div>
    </div>
  );
}

/**
 * Pre-configured skeleton for avatar or profile picture
 */
export function AvatarSkeleton({ size = "2.5rem", className }: { size?: string, className?: string }) {
  return (
    <SkeletonLoader 
      height={size} 
      width={size} 
      circle 
      className={className} 
    />
  );
}

/**
 * Pre-configured skeleton for data table
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className 
}: { 
  rows?: number, 
  columns?: number, 
  className?: string 
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex space-x-4">
        {Array.from({ length: columns }, (_, i) => (
          <SkeletonLoader key={i} height="1.5rem" width={`${100 / columns}%`} />
        ))}
      </div>
      
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }, (_, colIndex) => (
            <SkeletonLoader 
              key={colIndex} 
              height="1rem" 
              width={`${100 / columns}%`} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Pre-configured skeleton for chart or data visualization
 */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <SkeletonLoader height="1.5rem" width="50%" />
      <SkeletonLoader height="12rem" width="100%" />
      <div className="flex justify-between">
        <SkeletonLoader height="0.75rem" width="15%" />
        <SkeletonLoader height="0.75rem" width="15%" />
        <SkeletonLoader height="0.75rem" width="15%" />
        <SkeletonLoader height="0.75rem" width="15%" />
      </div>
    </div>
  );
}
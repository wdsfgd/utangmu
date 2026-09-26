"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const Meteors = ({
  number = 60,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const meteors = new Array(number).fill(true);
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {meteors.map((_, idx) => {
        // Distribute meteors across the sky (-10% to 120% so edges are full)
        const left = (Math.random() * 130 - 15).toFixed(1);
        const top = (Math.random() * 55 - 15).toFixed(1);
        const delay = (Math.random() * 5).toFixed(2);
        const duration = (Math.random() * 2.5 + 2.2).toFixed(2);
        const tailLength = Math.floor(Math.random() * 60 + 100);

        return (
          <span
            key={"meteor" + idx}
            className={cn(
              "animate-meteor-effect absolute h-1 w-1 rounded-full bg-emerald-300 shadow-[0_0_15px_4px_rgba(52,211,153,0.95)]",
              "before:absolute before:top-1/2 before:h-[2px] before:-translate-y-[50%] before:transform before:bg-gradient-to-r before:from-emerald-300 before:via-teal-400/80 before:to-transparent before:content-['']",
              className
            )}
            style={
              {
                top: `${top}%`,
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                "--meteor-tail": `${tailLength}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
};

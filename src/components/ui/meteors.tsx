"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const Meteors = ({
  number = 40,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const meteors = new Array(number).fill(true);
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 h-[58vh] max-h-[580px] overflow-hidden z-0",
        "[mask-image:linear-gradient(to_bottom,black_45%,transparent_98%)]",
        "[-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_98%)]",
        className
      )}
    >
      {meteors.map((_, idx) => {
        // Distribute across upper sky
        const left = (Math.random() * 130 - 15).toFixed(1);
        const top = (Math.random() * 35 - 10).toFixed(1);
        const delay = (Math.random() * 5).toFixed(2);
        const duration = (Math.random() * 2.5 + 2.4).toFixed(2);
        const tailLength = Math.floor(Math.random() * 40 + 70); // 70px - 110px tail for distant perspective

        return (
          <span
            key={"meteor" + idx}
            className="animate-meteor-effect absolute h-0.5 w-0.5 rounded-full bg-emerald-300 shadow-[0_0_10px_2px_rgba(52,211,153,0.85)] before:absolute before:top-1/2 before:h-[1px] before:-translate-y-[50%] before:transform before:bg-gradient-to-r before:from-emerald-300 before:via-teal-400/60 before:to-transparent before:content-['']"
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

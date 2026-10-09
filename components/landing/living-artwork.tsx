"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

type Props = ComponentProps<"img"> & {
  motion?: "float" | "swim" | "sway" | "breathe";
};

/** Animate only decorative artwork, and pause when offscreen or in a hidden tab. */
export function LivingArtwork({ motion = "float", className = "", style, ...props }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const image = ref.current;
    if (!image) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(image);
    const onVisibility = () => setTabVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <img
      {...props}
      ref={ref}
      className={`living-artwork living-artwork--${motion} ${className}`}
      style={{ ...style, animationPlayState: inView && tabVisible ? "running" : "paused" }}
    />
  );
}

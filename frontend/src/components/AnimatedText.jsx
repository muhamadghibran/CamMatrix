import React, { useState, useEffect, useRef } from "react";

export default function AnimatedText({ text, delayOffset = 0, className = "", splitBy = "char" }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const chunks = text ? (splitBy === "word" ? text.split(" ") : text.split("")) : [];

  return (
    <span ref={ref} className={`${className} inline-block`}>
      {chunks.map((chunk, index) => (
        <span
          key={index}
          className={`inline-block transition-all duration-800 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: `${delayOffset + index * (splitBy === "word" ? 100 : 40)}ms` }}
        >
          {chunk === " " ? "\u00A0" : chunk}{splitBy === "word" && index !== chunks.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}

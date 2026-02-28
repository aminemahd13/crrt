"use client";

export function CircuitTrace() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-30">
      <svg
        className="w-full h-full"
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* Horizontal traces */}
        <path
          d="M0 200 H 200 L 220 180 H 400 L 420 200 H 600"
          className="circuit-path animate"
          style={{ animationDelay: "0.5s" }}
        />
        <path
          d="M600 400 H 800 L 820 380 H 1000 L 1020 400 H 1200"
          className="circuit-path animate"
          style={{ animationDelay: "1.5s" }}
        />

        {/* Vertical trace */}
        <path
          d="M400 0 V 100 L 420 120 V 300 L 400 320 V 500"
          className="circuit-path animate"
          style={{ animationDelay: "2.5s" }}
        />

        {/* Connection nodes */}
        <circle cx="200" cy="200" r="3" fill="var(--signal-orange)" opacity="0.4" />
        <circle cx="600" cy="200" r="3" fill="var(--signal-orange)" opacity="0.4" />
        <circle cx="800" cy="400" r="3" fill="var(--signal-orange)" opacity="0.4" />
        <circle cx="400" cy="300" r="3" fill="var(--signal-orange)" opacity="0.4" />
      </svg>
    </div>
  );
}

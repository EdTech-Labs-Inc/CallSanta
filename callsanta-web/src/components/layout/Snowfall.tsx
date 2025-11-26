"use client";

export function Snowfall() {
  return (
    <div className="snowfall" aria-hidden="true">
      {Array.from({ length: 20 }).map((_, i) => (
        <span key={i} className="snowflake">
          *
        </span>
      ))}
    </div>
  );
}

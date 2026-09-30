import { useId } from "react";

export function UlamifyLogoMark({ className = "h-10 w-10" }: { className?: string }) {
  const rawId = useId();
  const gradId = `ulamify_gold_${rawId.replace(/:/g, "_")}`;

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="20"
          y1="20"
          x2="180"
          y2="180"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="25%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="75%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>

      {/* Pot Lid Top Knob */}
      <path
        d="M85 34 C85 24 115 24 115 34"
        stroke={`url(#${gradId})`}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Pot Lid Dome */}
      <path
        d="M44 66 C44 46 68 38 100 38 C132 38 156 46 156 66"
        stroke={`url(#${gradId})`}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Pot Lid Rim */}
      <path
        d="M38 66 H162"
        stroke={`url(#${gradId})`}
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Pot Main Body */}
      <path
        d="M44 74 V116 C44 138 62 152 100 152 C138 152 156 138 156 116 V74"
        stroke={`url(#${gradId})`}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Pot Left Handle */}
      <path
        d="M44 86 C28 86 26 104 44 104"
        stroke={`url(#${gradId})`}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Pot Right Handle */}
      <path
        d="M156 86 C172 86 174 104 156 104"
        stroke={`url(#${gradId})`}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Spoon Handle extending up-right */}
      <path
        d="M124 58 L164 18"
        stroke={`url(#${gradId})`}
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Lightning Bolt */}
      <path
        d="M124 58 L82 104 H110 L88 162 L132 94 H104 L124 58 Z"
        fill={`url(#${gradId})`}
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UlamifyLogo({
  className = "",
  textClassName = "text-foreground",
  subtitleClassName = "text-muted-foreground",
}: {
  className?: string;
  textClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <UlamifyLogoMark className="h-10 w-10 shrink-0" />
      <div className="flex flex-col leading-none">
        <span className={`font-display text-xl font-black tracking-tight ${textClassName}`}>
          ULAMIFY
        </span>
        <span className={`mt-0.5 text-[9px] font-extrabold tracking-[0.2em] uppercase ${subtitleClassName}`}>
          FOOD APP
        </span>
      </div>
    </div>
  );
}

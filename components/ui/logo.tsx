import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <svg 
        viewBox="0 0 260 80" 
        className="w-full h-auto max-h-12" 
        fill="currentColor" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* H */}
          <path d="M 10 20 L 10 60 M 10 40 L 40 40 M 40 20 L 40 60" />
          
          {/* A */}
          <path d="M 55 60 L 75 20 L 95 60" />
          <circle cx="75" cy="45" r="4" fill="currentColor" stroke="none" />
          
          {/* Q */}
          <circle cx="130" cy="40" r="18" />
          <path d="M 140 50 L 152 62" />
          
          {/* A */}
          <path d="M 165 60 L 185 20 L 205 60" />
          <circle cx="185" cy="45" r="4" fill="currentColor" stroke="none" />
          
          {/* N */}
          <path d="M 220 60 L 220 20 L 250 60 L 250 20" />
        </g>
      </svg>
      {showText && (
        <div className="text-[0.65rem] sm:text-xs tracking-[0.4em] font-medium text-primary mt-1 pl-[0.4em]">
          WEAR
        </div>
      )}
    </div>
  );
}

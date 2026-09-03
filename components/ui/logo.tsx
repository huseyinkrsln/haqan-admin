import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "full" | "hq" | "sidebar";
}

export function Logo({ className, showText = true, variant = "full" }: LogoProps) {
  // 1. Yalnızca Vektörel HQ Simgesi (Collapsed / Mini)
  if (variant === "hq") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <svg 
          viewBox="0 0 100 80" 
          className="w-full h-auto max-h-10" 
          fill="currentColor" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* H */}
            <path d="M 12 20 L 12 60 M 12 40 L 42 40 M 42 20 L 42 60" />
            {/* Q */}
            <circle cx="72" cy="40" r="18" />
            <path d="M 82 50 L 92 62" />
          </g>
        </svg>
      </div>
    );
  }

  // 2. Sidebar İçin Özel Yatay 'HAQAN WEAR' Tasarımı
  if (variant === "sidebar") {
    return (
      <div className={cn("flex items-center gap-2.5 select-none", className)}>
        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
          <svg 
            viewBox="0 0 100 80" 
            className="w-5 h-auto text-primary" 
            fill="currentColor" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 12 20 L 12 60 M 12 40 L 42 40 M 42 20 L 42 60" />
              <circle cx="72" cy="40" r="18" />
              <path d="M 82 50 L 92 62" />
            </g>
          </svg>
        </div>
        <div className="flex flex-col text-left">
          <span className="font-serif text-base font-bold tracking-[0.18em] text-foreground leading-none">
            HAQAN
          </span>
          <span className="text-[9px] tracking-[0.35em] text-primary font-bold uppercase mt-1">
            WEAR
          </span>
        </div>
      </div>
    );
  }

  // 3. Standart Tam Logo
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

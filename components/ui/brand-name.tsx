import {
  PLATFORM_ACCENT,
  PLATFORM_NAME,
  PLATFORM_PREFIX,
} from "@/lib/branding";

export function BrandName({
  className = "",
  smartClassName = "text-white",
  riaxClassName = "text-[#ffc400]",
}: {
  className?: string;
  smartClassName?: string;
  riaxClassName?: string;
}) {
  return (
    <span aria-label={PLATFORM_NAME} className={`whitespace-nowrap ${className}`}>
      <span className={smartClassName}>{PLATFORM_PREFIX}</span>{" "}
      <span className={riaxClassName}>{PLATFORM_ACCENT}</span>
    </span>
  );
}

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
};

function normalizeImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;

  const trimmed = url.trim();

  if (!trimmed) return undefined;

  // Local uploaded/blob images
  if (
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  // Already a complete URL
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Convert www.example.com into https://www.example.com
  return `https://${trimmed}`;
}

export default function Avatar({
  src,
  name,
  size = "md",
}: AvatarProps) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
    xl: "h-24 w-24 text-3xl",
  };

  const normalizedSrc = normalizeImageUrl(src);

  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 font-semibold text-gray-600 ${sizes[size]}`}
    >
      {normalizedSrc ? (
        <img
          src={normalizedSrc}
          alt={name || "User avatar"}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <span>{initials}</span>
      )}

      {normalizedSrc && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-transparent">
          {initials}
        </span>
      )}
    </div>
  );
}
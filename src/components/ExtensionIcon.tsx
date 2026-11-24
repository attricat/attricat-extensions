import { useState } from 'react';
import { Blocks } from 'lucide-react';

interface Props {
  url: string | null;
  className?: string;
  /** Rendered size of the icon inside its frame. */
  size?: number;
}

const DEFAULT_SIZE = 28;

/** The registry icon, or the generic extension glyph when there is none or it fails to load. */
export const ExtensionIcon = ({ url, className, size = DEFAULT_SIZE }: Props) => {
  const [failed, setFailed] = useState(false);
  return (
    <span className={className} aria-hidden="true">
      {url && !failed ? (
        <img src={url} alt="" width={size} height={size} onError={() => setFailed(true)} />
      ) : (
        <Blocks size={Math.round(size * 0.8)} />
      )}
    </span>
  );
};

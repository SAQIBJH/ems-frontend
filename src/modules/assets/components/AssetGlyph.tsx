import { LaptopIcon, MonitorIcon, SmartphoneIcon, BoxIcon } from 'lucide-react';
import type { AssetType } from '../types/assets.types';

const ICON_MAP: Record<AssetType, React.ElementType> = {
  Laptop: LaptopIcon,
  Monitor: MonitorIcon,
  Phone: SmartphoneIcon,
  Other: BoxIcon,
};

interface AssetGlyphProps {
  type: AssetType;
}

export function AssetGlyph({ type }: AssetGlyphProps) {
  const Icon = ICON_MAP[type] ?? BoxIcon;
  return (
    <span className="grid size-[30px] shrink-0 place-items-center rounded-lg bg-surface-2 text-fg-muted">
      <Icon size={16} aria-hidden />
    </span>
  );
}

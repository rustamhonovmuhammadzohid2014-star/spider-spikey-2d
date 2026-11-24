import React, { useState } from 'react';
import { getBuiltInAvatarById, getProfileFrameById } from '../game/localPersistence';
import { SkinPreviewCanvas } from './SkinPreviewCanvas';

interface AvatarBadgeProps {
  avatarId?: string;
  customAvatarDataUrl?: string | null;
  profileFrameId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  avatarId,
  customAvatarDataUrl,
  profileFrameId,
  size = 'md',
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const avatar = getBuiltInAvatarById(avatarId);
  const frame = getProfileFrameById(profileFrameId);

  const dimClass =
    size === 'xs'
      ? 'w-9 h-9'
      : size === 'sm'
      ? 'w-12 h-12'
      : size === 'lg'
      ? 'w-24 h-24'
      : 'w-16 h-16';

  const showCustom = Boolean(customAvatarDataUrl && !imgFailed);

  return (
    <div
      className={`relative shrink-0 overflow-hidden border-2 bg-slate-950 flex items-center justify-center ${dimClass} ${className}`}
      style={{
        background: showCustom ? '#090d16' : avatar.bgGradient,
        borderColor: frame.borderHex || avatar.borderHex,
        boxShadow: `0 0 14px ${frame.glowRgba}`,
      }}
    >
      {showCustom ? (
        <img
          src={customAvatarDataUrl ?? ''}
          alt={avatar.name}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover pixelated"
        />
      ) : (
        <SkinPreviewCanvas
          skinId={avatar.skinId}
          size={size === 'lg' ? 'lg' : 'sm'}
          anim="idle"
          className="border-0 bg-transparent !w-full !h-full"
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 border border-white/15"
      />
    </div>
  );
};

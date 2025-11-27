'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

type AsSeenBarProps = {
  className?: string;
};

const PLATFORMS = [
  { name: 'Instagram', src: '/1.png', size: 36 },
  { name: 'TikTok', src: '/2.png', size: 36 },
  { name: 'X', src: '/3.png', size: 36 },
  { name: 'Facebook', src: '/4.png', size: 36 },
  { name: 'YouTube', src: '/5.png', size: 36 },
  { name: 'Reddit', src: '/6.png', size: 40 },
];

export function AsSeenBar({ className }: AsSeenBarProps) {
  return (
    <div
      className={cn(
        'bg-white border-b border-gray-200',
        className
      )}
    >
      <div className="py-4 px-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500 text-center mb-3">
          As seen on
        </p>

        <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {PLATFORMS.map((platform) => (
            <Image
              key={platform.name}
              src={platform.src}
              alt={platform.name}
              width={platform.size}
              height={platform.size}
              className="opacity-80"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

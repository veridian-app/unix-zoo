'use client';

import React from 'react';
import { AnimalType } from '@/types';

interface PetAvatarProps {
    animal: AnimalType;
    size?: number;
    hunger?: number;
    happiness?: number;
    equippedHat?: string | null;
    equippedAccessory?: string | null;
    animate?: boolean;
    onClick?: () => void;
}

const animalPaths: Record<AnimalType, { body: string; detail: string; color: string; eyeColor?: string }> = {
    dolphin: {
        color: '#4FC3F7',
        body: 'M50 25 C65 15 85 20 90 35 C95 50 85 70 70 78 C60 82 45 80 35 75 C20 68 10 55 15 40 C20 28 35 20 50 25 Z',
        detail: 'M75 40 C80 38 85 40 83 45 M40 50 Q50 65 65 55',
    },
    tiger: {
        color: '#FF8A65',
        body: 'M50 20 C70 15 88 25 90 45 C92 60 85 75 70 82 C55 88 40 88 28 82 C15 75 8 60 10 45 C12 28 30 15 50 20 Z',
        detail: 'M35 35 L40 25 L45 38 M55 38 L60 25 L65 35 M30 55 Q50 72 70 55',
    },
    monkey: {
        color: '#A1887F',
        body: 'M50 18 C68 14 85 25 88 42 C90 58 82 74 68 82 C55 88 45 88 32 82 C18 74 10 58 12 42 C15 25 32 14 50 18 Z',
        detail: 'M25 40 C18 38 15 42 18 48 C22 52 28 48 25 40 M75 40 C82 38 85 42 82 48 C78 52 72 48 75 40 M35 58 Q50 70 65 58',
    },
    squirrel: {
        color: '#FFB74D',
        body: 'M50 22 C65 16 82 24 86 40 C88 52 82 68 70 78 C58 84 42 84 30 78 C18 68 12 52 14 40 C18 24 35 16 50 22 Z',
        detail: 'M38 30 L34 18 L42 28 M58 28 L66 18 L62 30 M35 55 Q50 66 65 55',
    },
    koala: {
        color: '#90A4AE',
        body: 'M50 22 C66 16 83 26 86 42 C88 55 82 70 68 80 C56 86 44 86 32 80 C18 70 12 55 14 42 C17 26 34 16 50 22 Z',
        detail: 'M22 32 C14 26 10 34 16 40 C22 46 28 38 22 32 M78 32 C86 26 90 34 84 40 C78 46 72 38 78 32 M38 58 Q50 68 62 58',
    },
    giraffe: {
        color: '#FDD835',
        body: 'M50 28 C62 22 78 28 82 42 C85 54 80 68 68 78 C58 84 42 84 32 78 C20 68 15 54 18 42 C22 28 38 22 50 28 Z',
        detail: 'M40 18 L38 8 L43 16 M60 18 L62 8 L57 16 M36 55 Q50 66 64 55 M42 38 A2 2 0 1 1 42 42 M58 38 A2 2 0 1 1 58 42',
    },
    lioness: {
        color: '#FFCA28',
        body: 'M50 18 C72 10 92 22 92 42 C92 60 82 76 68 84 C56 90 44 90 32 84 C18 76 8 60 8 42 C8 22 28 10 50 18 Z',
        detail: 'M30 55 Q50 72 70 55 M38 40 A3 3 0 1 1 38 46 M58 40 A3 3 0 1 1 58 46',
    },
    leopard: {
        color: '#FFAB40',
        body: 'M50 20 C68 14 85 24 88 42 C90 56 83 72 68 80 C56 86 44 86 32 80 C17 72 10 56 12 42 C15 24 32 14 50 20 Z',
        detail: 'M36 30 L32 20 L40 28 M60 28 L68 20 L64 30 M32 55 Q50 68 68 55',
    },
    cat: {
        color: '#CE93D8',
        body: 'M50 22 C66 16 82 26 85 42 C87 55 81 70 68 80 C56 86 44 86 32 80 C19 70 13 55 15 42 C18 26 34 16 50 22 Z',
        detail: 'M35 28 L30 12 L42 26 M58 26 L70 12 L65 28 M38 58 Q50 66 62 58 M46 52 L50 56 L54 52',
    },
    kangaroo: {
        color: '#8D6E63',
        body: 'M50 20 C66 15 82 24 86 40 C88 54 83 70 70 80 C58 86 42 86 30 80 C17 70 12 54 14 40 C18 24 34 15 50 20 Z',
        detail: 'M38 28 L36 16 L44 26 M56 26 L64 16 L62 28 M34 55 Q50 68 66 55',
    },
};

const hatOverlays: Record<string, string> = {
    'hat-party': '🎉',
    'hat-cowboy': '🤠',
    'hat-crown': '👑',
    'hat-wizard': '🧙',
    'hat-flower': '💐',
};

const accessoryOverlays: Record<string, string> = {
    'acc-glasses': '😎',
    'acc-bowtie': '🎀',
    'acc-scarf': '🧣',
    'acc-medal': '🏅',
    'acc-cape': '🦸',
};

export default function PetAvatar({
    animal,
    size = 120,
    hunger = 80,
    happiness = 80,
    equippedHat = null,
    equippedAccessory = null,
    animate = true,
    onClick,
}: PetAvatarProps) {
    const data = animalPaths[animal];
    const mood = (hunger + happiness) / 2;
    const isHappy = mood > 60;
    const isSad = mood < 30;

    const bodyOpacity = Math.max(0.6, mood / 100);
    const animationName = isSad ? 'none' : isHappy ? 'float' : 'none';
    const animationDuration = isHappy ? '3s' : '0s';

    return (
        <div
            onClick={onClick}
            style={{
                width: size,
                height: size,
                position: 'relative',
                cursor: onClick ? 'pointer' : 'default',
                animation: animate ? `${animationName} ${animationDuration} ease-in-out infinite` : 'none',
                transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
                if (onClick) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
            }}
        >
            <svg
                viewBox="0 0 100 100"
                width={size}
                height={size}
                style={{ filter: `saturate(${bodyOpacity + 0.3})` }}
            >
                {/* Shadow */}
                <ellipse cx="50" cy="90" rx="25" ry="5" fill="rgba(0,0,0,0.15)" />

                {/* Body */}
                <path
                    d={data.body}
                    fill={data.color}
                    stroke={darken(data.color, 0.2)}
                    strokeWidth="1.5"
                    opacity={bodyOpacity}
                />

                {/* Body highlight */}
                <path
                    d={data.body}
                    fill="url(#bodyGradient)"
                    opacity="0.3"
                />

                {/* Face details */}
                <path
                    d={data.detail}
                    fill="none"
                    stroke={darken(data.color, 0.4)}
                    strokeWidth="2"
                    strokeLinecap="round"
                />

                {/* Eyes */}
                <circle cx="40" cy="42" r="4" fill={isSad ? '#555' : '#2d2d2d'} />
                <circle cx="60" cy="42" r="4" fill={isSad ? '#555' : '#2d2d2d'} />
                <circle cx="41.5" cy="40.5" r="1.5" fill="white" opacity={isHappy ? 0.9 : 0.5} />
                <circle cx="61.5" cy="40.5" r="1.5" fill="white" opacity={isHappy ? 0.9 : 0.5} />

                {/* Blush when happy */}
                {isHappy && (
                    <>
                        <circle cx="32" cy="50" r="5" fill="#ff9999" opacity="0.3" />
                        <circle cx="68" cy="50" r="5" fill="#ff9999" opacity="0.3" />
                    </>
                )}

                {/* Tears when sad */}
                {isSad && (
                    <>
                        <path d="M42 48 Q43 54 42 58" stroke="#64B5F6" strokeWidth="1.5" fill="none" opacity="0.7" />
                        <path d="M58 48 Q57 54 58 58" stroke="#64B5F6" strokeWidth="1.5" fill="none" opacity="0.7" />
                    </>
                )}

                {/* Gradient definitions */}
                <defs>
                    <radialGradient id="bodyGradient" cx="40%" cy="30%" r="60%">
                        <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                </defs>
            </svg>

            {/* Hat overlay */}
            {equippedHat && hatOverlays[equippedHat] && (
                <div
                    style={{
                        position: 'absolute',
                        top: -size * 0.05,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: size * 0.35,
                        lineHeight: 1,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        zIndex: 2,
                    }}
                >
                    {hatOverlays[equippedHat]}
                </div>
            )}

            {/* Accessory overlay */}
            {equippedAccessory && accessoryOverlays[equippedAccessory] && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: size * 0.1,
                        right: -size * 0.05,
                        fontSize: size * 0.25,
                        lineHeight: 1,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                        zIndex: 2,
                    }}
                >
                    {accessoryOverlays[equippedAccessory]}
                </div>
            )}
        </div>
    );
}

function darken(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount));
    const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

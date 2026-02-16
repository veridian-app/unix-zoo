'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const currentUserId = useStore((s) => s.currentUserId);
    const isHydrated = useStore((s) => s.isHydrated);
    const hydrate = useStore((s) => s.hydrate);
    const router = useRouter();

    React.useEffect(() => {
        if (!currentUserId) {
            router.push('/');
        }
    }, [currentUserId, router]);

    // Hydrate from Supabase on mount
    React.useEffect(() => {
        if (currentUserId && !isHydrated) {
            hydrate();
        }
    }, [currentUserId, isHydrated, hydrate]);

    if (!currentUserId) return null;

    if (!isHydrated) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                flexDirection: 'column',
                gap: 'var(--space-md)',
            }}>
                <span style={{ fontSize: '2rem' }}>🦁</span>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Cargando datos del equipo...
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{
                marginLeft: 'var(--sidebar-width)',
                flex: 1,
                padding: 'var(--space-xl)',
                maxWidth: '1200px',
                width: '100%',
            }}>
                {children}
            </main>
        </div>
    );
}

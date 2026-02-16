'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const currentUserId = useStore((s) => s.currentUserId);
    const router = useRouter();

    React.useEffect(() => {
        if (!currentUserId) {
            router.push('/');
        }
    }, [currentUserId, router]);

    if (!currentUserId) return null;

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

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { ANIMAL_EMOJIS, ANIMAL_COLORS } from '@/data/teamMembers';
import PetAvatar from '@/components/pets/PetAvatar';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const pathname = usePathname();
    const currentUserId = useStore((s) => s.currentUserId);
    const members = useStore((s) => s.members);
    const logout = useStore((s) => s.logout);
    const [mobileOpen, setMobileOpen] = useState(false);

    const currentMember = members.find((m) => m.id === currentUserId);
    if (!currentMember) return null;

    const colors = ANIMAL_COLORS[currentMember.animal];

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/tasks', label: 'Mis Tareas', icon: '✅' },
        { href: '/objectives', label: 'Objetivos', icon: '🎯' },
        { href: '/team', label: 'Equipo', icon: '👥' },
        { href: '/pet', label: 'Mi Mascota', icon: ANIMAL_EMOJIS[currentMember.animal] },
    ];

    return (
        <>
            {/* Mobile toggle */}
            <button
                className={styles.mobileToggle}
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? '✕' : '☰'}
            </button>

            <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ''}`}>
                {/* Logo */}
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>🦁</span>
                    <div>
                        <h1 className={styles.logoTitle}>Unix Zoo</h1>
                        <span className={styles.logoSubtitle}>Task Management</span>
                    </div>
                </div>

                {/* User Card */}
                <div className={styles.userCard} style={{ borderColor: colors.primary + '40' }}>
                    <div className={styles.petPreview}>
                        <PetAvatar
                            animal={currentMember.animal}
                            size={56}
                            hunger={currentMember.pet.hunger}
                            happiness={currentMember.pet.happiness}
                            equippedHat={currentMember.pet.equippedHat}
                            animate={false}
                        />
                    </div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{currentMember.name}</span>
                        <span className={styles.userCoins}>
                            💰 {currentMember.coins} monedas
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                            onClick={() => setMobileOpen(false)}
                            style={pathname === item.href ? { borderLeftColor: colors.primary, background: colors.primary + '10' } : {}}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Pet Status */}
                <div className={styles.petStatus}>
                    <div className={styles.statRow}>
                        <span>🍖 Hambre</span>
                        <div className={styles.miniBar}>
                            <div
                                className={styles.miniBarFill}
                                style={{
                                    width: `${currentMember.pet.hunger}%`,
                                    background: currentMember.pet.hunger > 50
                                        ? 'var(--accent-secondary)'
                                        : currentMember.pet.hunger > 25
                                            ? 'var(--accent-warning)'
                                            : 'var(--accent-danger)',
                                }}
                            />
                        </div>
                    </div>
                    <div className={styles.statRow}>
                        <span>😊 Felicidad</span>
                        <div className={styles.miniBar}>
                            <div
                                className={styles.miniBarFill}
                                style={{
                                    width: `${currentMember.pet.happiness}%`,
                                    background: currentMember.pet.happiness > 50
                                        ? 'var(--accent-primary)'
                                        : currentMember.pet.happiness > 25
                                            ? 'var(--accent-warning)'
                                            : 'var(--accent-danger)',
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Logout */}
                <button className={styles.logoutBtn} onClick={logout}>
                    🚪 Cambiar usuario
                </button>
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
            )}
        </>
    );
}

'use client';

import React, { useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useStore } from '@/store/useStore';
import PetAvatar from '@/components/pets/PetAvatar';
import { ANIMAL_EMOJIS, ANIMAL_COLORS } from '@/data/teamMembers';
import styles from './team.module.css';

function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

export default function TeamPage() {
    const members = useStore((s) => s.members);
    const tasks = useStore((s) => s.tasks);
    const objectives = useStore((s) => s.objectives);

    const now = new Date();
    const weekStart = getStartOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const leaderboard = useMemo(() => {
        return members
            .map((member) => {
                const memberTasks = tasks.filter((t) => t.assignedTo === member.id);
                const weekTasks = memberTasks.filter((t) => {
                    const d = new Date(t.deadline);
                    return d >= weekStart && d < weekEnd;
                });
                const weekCompleted = weekTasks.filter((t) => t.completed).length;
                const weekRate = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0;
                const totalCompleted = memberTasks.filter((t) => t.completed).length;
                const onTimeCount = memberTasks.filter(
                    (t) => t.completed && t.completedAt && new Date(t.completedAt) <= new Date(t.deadline)
                ).length;
                const memberObjectives = objectives.filter((o) => o.assignedTo === member.id);
                const completedObjectives = memberObjectives.filter((o) => o.completed).length;

                return {
                    member,
                    weekRate,
                    weekCompleted,
                    weekTotal: weekTasks.length,
                    totalCompleted,
                    totalTasks: memberTasks.length,
                    onTimeCount,
                    completedObjectives,
                    totalObjectives: memberObjectives.length,
                };
            })
            .sort((a, b) => b.weekRate - a.weekRate || b.totalCompleted - a.totalCompleted);
    }, [members, tasks, objectives, weekStart, weekEnd]);

    return (
        <AppLayout>
            <div className={styles.page}>
                <h1 className={styles.title}>👥 Equipo Unix Zoo</h1>
                <p className={styles.subtitle}>
                    Semana del {weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} al{' '}
                    {weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </p>

                <div className={styles.grid}>
                    {leaderboard.map((item, index) => {
                        const colors = ANIMAL_COLORS[item.member.animal];
                        return (
                            <div
                                key={item.member.id}
                                className={`card card-glow ${styles.memberCard}`}
                                style={{ '--member-color': colors.primary } as React.CSSProperties}
                            >
                                {index < 3 && (
                                    <div className={styles.rank}>
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                    </div>
                                )}

                                <div className={styles.petSection}>
                                    <PetAvatar
                                        animal={item.member.animal}
                                        size={80}
                                        hunger={item.member.pet.hunger}
                                        happiness={item.member.pet.happiness}
                                        equippedHat={item.member.pet.equippedHat}
                                        equippedAccessory={item.member.pet.equippedAccessory}
                                        animate
                                    />
                                </div>

                                <h3 className={styles.memberName}>
                                    {ANIMAL_EMOJIS[item.member.animal]} {item.member.name}
                                </h3>

                                <div className={styles.weekProgress}>
                                    <div className={styles.progressHeader}>
                                        <span>Semana</span>
                                        <span className={styles.progressValue} style={{
                                            color: item.weekRate >= 70 ? 'var(--accent-secondary)' :
                                                item.weekRate >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)'
                                        }}>
                                            {item.weekRate}%
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-bar-fill"
                                            style={{
                                                width: `${item.weekRate}%`,
                                                background: item.weekRate >= 70
                                                    ? 'var(--gradient-success)'
                                                    : item.weekRate >= 40
                                                        ? 'var(--gradient-gold)'
                                                        : 'var(--accent-danger)',
                                            }}
                                        />
                                    </div>
                                    <span className={styles.progressDetail}>
                                        {item.weekCompleted}/{item.weekTotal} tareas
                                    </span>
                                </div>

                                <div className={styles.statsRow}>
                                    <div className={styles.stat}>
                                        <span className={styles.statNum}>{item.totalCompleted}</span>
                                        <span className={styles.statLabel}>Completadas</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <span className={styles.statNum}>{item.onTimeCount}</span>
                                        <span className={styles.statLabel}>A tiempo</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <span className={styles.statNum}>{item.completedObjectives}</span>
                                        <span className={styles.statLabel}>Objetivos</span>
                                    </div>
                                </div>

                                <div className={styles.coinsDisplay}>
                                    💰 {item.member.coins} monedas
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}

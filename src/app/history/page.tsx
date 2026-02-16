'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useStore } from '@/store/useStore';
import { ANIMAL_EMOJIS } from '@/data/teamMembers';
import PetAvatar from '@/components/pets/PetAvatar';
import WeeklyRecap from '@/components/recap/WeeklyRecap';
import { WeeklyRecord } from '@/types';
import styles from './history.module.css';

function formatSeconds(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function HistoryPage() {
    const members = useStore((s) => s.members);
    const weeklyRecords = useStore((s) => s.weeklyRecords);
    const closeWeek = useStore((s) => s.closeWeek);
    const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
    const [recapRecord, setRecapRecord] = useState<WeeklyRecord | null>(null);

    const sortedRecords = useMemo(
        () => [...weeklyRecords].sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()),
        [weeklyRecords]
    );

    const selectedRecord = useMemo(
        () => sortedRecords.find((r) => r.id === selectedWeekId) || sortedRecords[0] || null,
        [sortedRecords, selectedWeekId]
    );

    // Find previous week for trend comparison
    const selectedIdx = sortedRecords.findIndex((r) => r.id === selectedRecord?.id);
    const previousRecord = selectedIdx >= 0 && selectedIdx < sortedRecords.length - 1
        ? sortedRecords[selectedIdx + 1]
        : null;

    const getMember = (id: string) => members.find((m) => m.id === id);

    const handleCloseWeek = () => {
        const record = closeWeek();
        setRecapRecord(record);
    };

    const formatWeekLabel = (ws: string, we: string) => {
        const s = new Date(ws);
        const e = new Date(we);
        return `${s.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    };

    const getTrend = (current: number, previous: number | undefined) => {
        if (previous === undefined) return null;
        if (current > previous) return { icon: '↑', color: 'var(--accent-secondary)' };
        if (current < previous) return { icon: '↓', color: 'var(--accent-danger)' };
        return { icon: '→', color: 'var(--text-muted)' };
    };

    return (
        <AppLayout>
            <div className={styles.page}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.title}>📊 Historial</h1>
                    <button className="btn btn-primary" onClick={handleCloseWeek}>
                        📋 Cerrar Semana
                    </button>
                </div>

                {sortedRecords.length === 0 ? (
                    <div className={`card ${styles.emptyCard}`}>
                        <span className={styles.emptyIcon}>📋</span>
                        <h3>No hay cierres semanales</h3>
                        <p className={styles.emptyText}>
                            Pulsa &quot;Cerrar Semana&quot; al final de cada semana para generar un recap con recompensas y guardar el progreso del equipo.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Week Selector */}
                        <div className={styles.weekSelector}>
                            <label className={styles.selectorLabel}>Semana:</label>
                            <select
                                className={styles.select}
                                value={selectedRecord?.id || ''}
                                onChange={(e) => setSelectedWeekId(e.target.value)}
                            >
                                {sortedRecords.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {formatWeekLabel(r.weekStart, r.weekEnd)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedRecord && (
                            <>
                                {/* Team Stats Grid */}
                                <div className={styles.statsGrid}>
                                    <div className={`card ${styles.statCard}`}>
                                        <span className={styles.statLabel}>COMPLETADO</span>
                                        <span className={styles.statValue}>
                                            {selectedRecord.teamCompletionRate}%
                                            {previousRecord && (() => {
                                                const trend = getTrend(selectedRecord.teamCompletionRate, previousRecord.teamCompletionRate);
                                                return trend ? <span style={{ color: trend.color, marginLeft: '6px', fontSize: '0.9rem' }}>{trend.icon}</span> : null;
                                            })()}
                                        </span>
                                    </div>
                                    <div className={`card ${styles.statCard}`}>
                                        <span className={styles.statLabel}>TAREAS TOTALES</span>
                                        <span className={styles.statValue}>
                                            {selectedRecord.memberStats.reduce((s, m) => s + m.tasksCompleted, 0)}/
                                            {selectedRecord.memberStats.reduce((s, m) => s + m.tasksTotal, 0)}
                                        </span>
                                    </div>
                                    <div className={`card ${styles.statCard}`}>
                                        <span className={styles.statLabel}>A TIEMPO</span>
                                        <span className={styles.statValue}>
                                            {selectedRecord.memberStats.reduce((s, m) => s + m.tasksOnTime, 0)}
                                        </span>
                                    </div>
                                    <div className={`card ${styles.statCard}`}>
                                        <span className={styles.statLabel}>🏆 TOP</span>
                                        <span className={styles.statValue} style={{ fontSize: '1rem' }}>
                                            {selectedRecord.topPerformer
                                                ? (() => {
                                                    const m = getMember(selectedRecord.topPerformer);
                                                    return m ? `${ANIMAL_EMOJIS[m.animal]} ${m.name}` : '—';
                                                })()
                                                : '—'}
                                        </span>
                                    </div>
                                </div>

                                {/* Member Breakdown */}
                                <div className={`card ${styles.breakdownCard}`}>
                                    <h3 className={styles.sectionTitle}>Desglose por miembro</h3>
                                    <div className={styles.memberList}>
                                        {selectedRecord.memberStats
                                            .sort((a, b) => b.completionRate - a.completionRate)
                                            .map((ms) => {
                                                const m = getMember(ms.memberId);
                                                if (!m) return null;
                                                const prevMemberStats = previousRecord?.memberStats.find(
                                                    (p) => p.memberId === ms.memberId
                                                );
                                                const trend = getTrend(ms.completionRate, prevMemberStats?.completionRate);

                                                return (
                                                    <div key={ms.memberId} className={styles.memberRow}>
                                                        <div className={styles.memberInfo}>
                                                            <PetAvatar animal={m.animal} size={36} hunger={m.pet.hunger} happiness={m.pet.happiness} />
                                                            <div>
                                                                <span className={styles.memberName}>{m.name}</span>
                                                                <span className={styles.memberMeta}>
                                                                    {ms.tasksCompleted}/{ms.tasksTotal} tareas · {formatSeconds(ms.validHoursSeconds)} válidas
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className={styles.memberStats}>
                                                            <div className={styles.rateWrap}>
                                                                <span className={styles.rateValue} style={{
                                                                    color: ms.completionRate >= 70 ? 'var(--accent-secondary)' :
                                                                        ms.completionRate >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                                                                }}>
                                                                    {ms.completionRate}%
                                                                </span>
                                                                {trend && (
                                                                    <span style={{ color: trend.color, fontSize: '0.8rem' }}>{trend.icon}</span>
                                                                )}
                                                            </div>
                                                            <div className={styles.barTrack}>
                                                                <div
                                                                    className={styles.barFill}
                                                                    style={{
                                                                        width: `${ms.completionRate}%`,
                                                                        background: ms.completionRate >= 70
                                                                            ? 'var(--gradient-success)'
                                                                            : ms.completionRate >= 40
                                                                                ? 'var(--gradient-gold)'
                                                                                : 'var(--accent-danger)',
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className={styles.coinBadge}>
                                                                💰 {ms.coinsEarned}
                                                                {ms.bonusCoins > 0 && (
                                                                    <span className={styles.bonus}>+{ms.bonusCoins}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* View Recap */}
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setRecapRecord(selectedRecord)}
                                    style={{ width: '100%' }}
                                >
                                    🏆 Ver Recap Completo
                                </button>
                            </>
                        )}
                    </>
                )}

                {/* Recap Modal */}
                {recapRecord && (
                    <WeeklyRecap record={recapRecord} onClose={() => setRecapRecord(null)} />
                )}
            </div>
        </AppLayout>
    );
}

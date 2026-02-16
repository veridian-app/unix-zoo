'use client';

import React from 'react';
import { WeeklyRecord } from '@/types';
import { useStore } from '@/store/useStore';
import PetAvatar from '@/components/pets/PetAvatar';
import { ANIMAL_EMOJIS } from '@/data/teamMembers';
import styles from './WeeklyRecap.module.css';

interface WeeklyRecapProps {
    record: WeeklyRecord;
    onClose: () => void;
}

function formatSeconds(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function WeeklyRecap({ record, onClose }: WeeklyRecapProps) {
    const members = useStore((s) => s.members);

    const weekStartDate = new Date(record.weekStart);
    const weekEndDate = new Date(record.weekEnd);
    const weekLabel = `${weekStartDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${weekEndDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

    // Sort by completion rate for podium
    const ranked = [...record.memberStats]
        .filter((ms) => ms.tasksTotal > 0)
        .sort((a, b) => b.completionRate - a.completionRate || b.tasksOnTime - a.tasksOnTime);

    const podium = ranked.slice(0, 3);

    const getMember = (id: string) => members.find((m) => m.id === id);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.trophy}>🏆</span>
                    <h2 className={styles.title}>Cierre Semanal</h2>
                    <p className={styles.weekLabel}>{weekLabel}</p>
                    <p className={styles.teamRate}>
                        Equipo: <strong>{record.teamCompletionRate}%</strong> completado
                    </p>
                </div>

                {/* Podium */}
                {podium.length > 0 && (
                    <div className={styles.podium}>
                        {podium.length >= 2 && (
                            <div className={`${styles.podiumSlot} ${styles.second}`}>
                                <span className={styles.medal}>🥈</span>
                                {(() => {
                                    const m = getMember(podium[1].memberId);
                                    return m ? (
                                        <>
                                            <PetAvatar animal={m.animal} size={50} hunger={m.pet.hunger} happiness={m.pet.happiness} animate />
                                            <span className={styles.podiumName}>{m.name}</span>
                                            <span className={styles.podiumRate}>{podium[1].completionRate}%</span>
                                            <span className={styles.podiumBonus}>+20 💰</span>
                                        </>
                                    ) : null;
                                })()}
                            </div>
                        )}
                        <div className={`${styles.podiumSlot} ${styles.first}`}>
                            <span className={styles.medal}>🥇</span>
                            {(() => {
                                const m = getMember(podium[0].memberId);
                                return m ? (
                                    <>
                                        <PetAvatar animal={m.animal} size={70} hunger={m.pet.hunger} happiness={m.pet.happiness} animate />
                                        <span className={styles.podiumName}>{m.name}</span>
                                        <span className={styles.podiumRate}>{podium[0].completionRate}%</span>
                                        <span className={styles.podiumBonus}>+30 💰</span>
                                    </>
                                ) : null;
                            })()}
                        </div>
                        {podium.length >= 3 && (
                            <div className={`${styles.podiumSlot} ${styles.third}`}>
                                <span className={styles.medal}>🥉</span>
                                {(() => {
                                    const m = getMember(podium[2].memberId);
                                    return m ? (
                                        <>
                                            <PetAvatar animal={m.animal} size={50} hunger={m.pet.hunger} happiness={m.pet.happiness} animate />
                                            <span className={styles.podiumName}>{m.name}</span>
                                            <span className={styles.podiumRate}>{podium[2].completionRate}%</span>
                                            <span className={styles.podiumBonus}>+10 💰</span>
                                        </>
                                    ) : null;
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {/* Full Stats Table */}
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Miembro</th>
                                <th>Tareas</th>
                                <th>A Tiempo</th>
                                <th>%</th>
                                <th>Horas</th>
                                <th>Monedas</th>
                                <th>Bonus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {record.memberStats
                                .filter((ms) => ms.tasksTotal > 0)
                                .sort((a, b) => b.completionRate - a.completionRate)
                                .map((ms) => {
                                    const m = getMember(ms.memberId);
                                    return (
                                        <tr key={ms.memberId}>
                                            <td>
                                                {m ? `${ANIMAL_EMOJIS[m.animal]} ${m.name}` : ms.memberId}
                                            </td>
                                            <td>{ms.tasksCompleted}/{ms.tasksTotal}</td>
                                            <td>{ms.tasksOnTime}</td>
                                            <td style={{
                                                color: ms.completionRate >= 70 ? 'var(--accent-secondary)' :
                                                    ms.completionRate >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                                                fontWeight: 700,
                                            }}>
                                                {ms.completionRate}%
                                            </td>
                                            <td>{formatSeconds(ms.validHoursSeconds)}</td>
                                            <td>💰 {ms.coinsEarned}</td>
                                            <td style={{ color: ms.bonusCoins > 0 ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
                                                {ms.bonusCoins > 0 ? `+${ms.bonusCoins}` : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {/* Members with no tasks */}
                {record.memberStats.filter((ms) => ms.tasksTotal === 0).length > 0 && (
                    <p className={styles.noTasks}>
                        Sin tareas esta semana:{' '}
                        {record.memberStats
                            .filter((ms) => ms.tasksTotal === 0)
                            .map((ms) => {
                                const m = getMember(ms.memberId);
                                return m ? `${ANIMAL_EMOJIS[m.animal]} ${m.name}` : '';
                            })
                            .join(', ')}
                    </p>
                )}

                <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', marginTop: 'var(--space-md)' }}>
                    ¡Vamos con la siguiente semana! 🚀
                </button>
            </div>
        </div>
    );
}

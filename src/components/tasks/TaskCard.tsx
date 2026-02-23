'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Task } from '@/types';
import { ANIMAL_EMOJIS, ANIMAL_COLORS } from '@/data/teamMembers';
import styles from './TaskCard.module.css';

interface TaskCardProps {
    task: Task;
    onEdit?: (taskId: string) => void;
    compact?: boolean;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function isOverdue(deadline: string): boolean {
    return new Date(deadline) < new Date();
}

function isToday(dateStr: string): boolean {
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
}

function canMoveDeadline(task: Task): boolean {
    if (task.locked || task.completed) return false;
    const hours = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);
    return hours <= 24;
}

export default function TaskCard({ task, onEdit, compact = false }: TaskCardProps) {
    const members = useStore((s) => s.members);
    const completeTask = useStore((s) => s.completeTask);
    const startTracking = useStore((s) => s.startTracking);
    const stopTracking = useStore((s) => s.stopTracking);
    const deleteTask = useStore((s) => s.deleteTask);

    const [elapsed, setElapsed] = useState(0);
    const assignee = members.find((m) => m.id === task.assignedTo);
    const assigner = members.find((m) => m.id === task.assignedBy);

    const isTracking = !!task.trackingStartedAt;

    // Live timer
    useEffect(() => {
        if (!isTracking || !task.trackingStartedAt) {
            setElapsed(0);
            return;
        }
        const interval = setInterval(() => {
            setElapsed(
                Math.floor((Date.now() - new Date(task.trackingStartedAt!).getTime()) / 1000)
            );
        }, 1000);
        return () => clearInterval(interval);
    }, [isTracking, task.trackingStartedAt]);

    const totalTime = task.trackedTimeSeconds + elapsed;
    const overdue = !task.completed && isOverdue(task.deadline);
    const doneOnTime = task.completed && task.completedAt && new Date(task.completedAt) <= new Date(task.deadline);
    const doneLate = task.completed && !doneOnTime;

    const deadlineDate = new Date(task.deadline);
    const deadlineStr = deadlineDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
    });

    const handleToggleTracking = useCallback(() => {
        if (isTracking) {
            stopTracking(task.id);
        } else {
            startTracking(task.id);
        }
    }, [isTracking, task.id, startTracking, stopTracking]);

    if (compact) {
        return (
            <div className={`${styles.cardCompact} ${task.completed ? styles.completed : ''} ${overdue ? styles.overdue : ''}`}>
                <button
                    className={`${styles.checkbox} ${task.completed ? styles.checked : ''}`}
                    onClick={() => !task.completed && completeTask(task.id)}
                    disabled={task.completed}
                >
                    {task.completed ? '✓' : ''}
                </button>
                <span className={styles.compactTitle}>{task.title}</span>
                {assignee && (
                    <span className={styles.compactAssignee}>{ANIMAL_EMOJIS[assignee.animal]}</span>
                )}
                <span className={`badge ${overdue ? 'badge-danger' : task.completed ? 'badge-success' : 'badge-info'}`}>
                    {deadlineStr}
                </span>
            </div>
        );
    }

    return (
        <div
            className={`${styles.card} ${task.completed ? styles.completed : ''} ${overdue ? styles.overdue : ''} ${isTracking ? styles.tracking : ''}`}
            style={isTracking ? { borderColor: ANIMAL_COLORS[assignee?.animal || 'dolphin'].primary + '60' } : {}}
        >
            {/* Header row */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button
                        className={`${styles.checkbox} ${task.completed ? styles.checked : ''}`}
                        onClick={() => !task.completed && completeTask(task.id)}
                        disabled={task.completed}
                    >
                        {task.completed ? '✓' : ''}
                    </button>
                    <h3 className={styles.title}>{task.title}</h3>
                </div>
                <div className={styles.headerRight}>
                    {task.locked && <span className={styles.lockIcon} title="Tarea bloqueada">🔒</span>}
                    {!canMoveDeadline(task) && !task.locked && !task.completed && (
                        <span className={styles.lockIcon} title="No se puede mover">🔒</span>
                    )}
                    {onEdit && !task.completed && (
                        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task.id)}>✏️</button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteTask(task.id)}>🗑️</button>
                </div>
            </div>

            {task.description && (
                <p className={styles.description}>{task.description}</p>
            )}

            {/* Meta row */}
            <div className={styles.meta}>
                {assignee && (
                    <div className={styles.assignee}>
                        <span className={styles.animalIcon}>{ANIMAL_EMOJIS[assignee.animal]}</span>
                        <span>{assignee.name}</span>
                        {assigner && assigner.id !== assignee.id && (
                            <span className={styles.assigner}>
                                (por {assigner.name})
                            </span>
                        )}
                    </div>
                )}

                <div className={styles.badges}>
                    {task.completed ? (
                        doneOnTime ? (
                            <span className="badge badge-success">✓ A tiempo</span>
                        ) : (
                            <span className="badge badge-warning">✓ Tarde</span>
                        )
                    ) : overdue ? (
                        <span className="badge badge-danger">⚠ Vencida</span>
                    ) : isToday(task.deadline) ? (
                        <span className="badge badge-warning">📅 Hoy</span>
                    ) : (
                        <span className="badge badge-info">📅 {deadlineStr}</span>
                    )}
                </div>
            </div>

            {/* Timer row */}
            <div className={styles.timerRow}>
                <div className={styles.timerDisplay}>
                    <span className={`${styles.timerValue} ${isTracking ? styles.timerActive : ''}`}>
                        ⏱ {formatTime(totalTime)}
                    </span>
                    {task.estimatedHours !== null && (
                        <span className={styles.estimated}>
                            / est. {Math.floor(task.estimatedHours)}h{Math.round((task.estimatedHours % 1) * 60) > 0 ? ` ${Math.round((task.estimatedHours % 1) * 60)}m` : ''}
                        </span>
                    )}
                </div>

                {!task.completed && (
                    <button
                        className={`btn ${isTracking ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                        onClick={handleToggleTracking}
                    >
                        {isTracking ? '⏸ Parar' : '▶ Iniciar'}
                    </button>
                )}
            </div>

            {/* Invalid hours indicator */}
            {task.completed && doneLate && totalTime > 0 && (
                <div className={styles.invalidHours}>
                    ⚠️ {formatTime(totalTime)} no válidas (entregada fuera de plazo)
                </div>
            )}
        </div>
    );
}

'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useStore } from '@/store/useStore';
import TaskCard from '@/components/tasks/TaskCard';
import TaskModal from '@/components/tasks/TaskModal';
import PetAvatar from '@/components/pets/PetAvatar';
import { ANIMAL_EMOJIS } from '@/data/teamMembers';
import { ViewMode } from '@/types';
import styles from './dashboard.module.css';

function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export default function DashboardPage() {
    const currentUserId = useStore((s) => s.currentUserId);
    const members = useStore((s) => s.members);
    const tasks = useStore((s) => s.tasks);
    const objectives = useStore((s) => s.objectives);
    const [viewMode, setViewMode] = useState<ViewMode>('today');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    const currentMember = members.find((m) => m.id === currentUserId);

    const myTasks = useMemo(
        () => tasks.filter((t) => t.assignedTo === currentUserId),
        [tasks, currentUserId]
    );

    const now = new Date();
    const today = now.toDateString();
    const weekStart = getStartOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const todayTasks = myTasks.filter(
        (t) => new Date(t.deadline).toDateString() === today
    );

    const weekTasks = myTasks.filter((t) => {
        const d = new Date(t.deadline);
        return d >= weekStart && d < weekEnd;
    });

    const filterByView = viewMode === 'today' ? todayTasks : viewMode === 'week' ? weekTasks : myTasks;

    const completedCount = filterByView.filter((t) => t.completed).length;
    const totalCount = filterByView.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const onTimeCount = filterByView.filter(
        (t) => t.completed && t.completedAt && new Date(t.completedAt) <= new Date(t.deadline)
    ).length;

    const totalTrackedTime = filterByView.reduce((acc, t) => acc + t.trackedTimeSeconds, 0);
    const validTime = filterByView
        .filter((t) => t.completed && t.completedAt && new Date(t.completedAt) <= new Date(t.deadline))
        .reduce((acc, t) => acc + t.trackedTimeSeconds, 0);
    const invalidTime = totalTrackedTime - validTime;

    const myObjectives = objectives.filter((o) => o.assignedTo === currentUserId);
    const completedObjectives = myObjectives.filter((o) => o.completed).length;

    const activeTasks = filterByView.filter((t) => !t.completed);
    const tracking = myTasks.find((t) => t.trackingStartedAt);

    if (!currentMember) return null;

    return (
        <AppLayout>
            <div className={styles.page}>
                {/* Header */}
                <div className={styles.headerSection}>
                    <div>
                        <h1 className={styles.greeting}>
                            ¡Hola, {currentMember.name}! {ANIMAL_EMOJIS[currentMember.animal]}
                        </h1>
                        <p className={styles.date}>
                            {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button className="btn btn-primary btn-lg" onClick={() => { setEditingTaskId(null); setShowTaskModal(true); }}>
                        ➕ Nueva Tarea
                    </button>
                </div>

                {/* View Tabs */}
                <div className={styles.viewTabs}>
                    {(['today', 'week', 'total'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            className={`${styles.tab} ${viewMode === mode ? styles.tabActive : ''}`}
                            onClick={() => setViewMode(mode)}
                        >
                            {mode === 'today' ? '📅 Hoy' : mode === 'week' ? '📊 Semana' : '📈 Total'}
                        </button>
                    ))}
                </div>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <div className={`card ${styles.statCard}`}>
                        <span className={styles.statLabel}>Tareas Completadas</span>
                        <span className={styles.statValue}>{completedCount}/{totalCount}</span>
                        <div className="progress-bar" style={{ marginTop: 8 }}>
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: `${completionRate}%`,
                                    background: completionRate >= 70
                                        ? 'var(--gradient-success)'
                                        : completionRate >= 40
                                            ? 'var(--gradient-gold)'
                                            : 'var(--accent-danger)',
                                }}
                            />
                        </div>
                        <span className={styles.statMeta}>{completionRate}% completado</span>
                    </div>

                    <div className={`card ${styles.statCard}`}>
                        <span className={styles.statLabel}>A Tiempo</span>
                        <span className={styles.statValue} style={{ color: 'var(--accent-secondary)' }}>
                            {onTimeCount}
                        </span>
                        <span className={styles.statMeta}>
                            {completedCount > 0 ? Math.round((onTimeCount / completedCount) * 100) : 0}% de las completadas
                        </span>
                    </div>

                    <div className={`card ${styles.statCard}`}>
                        <span className={styles.statLabel}>Tiempo Válido</span>
                        <span className={styles.statValue} style={{ color: 'var(--accent-primary)' }}>
                            {formatTime(validTime)}
                        </span>
                        {invalidTime > 0 && (
                            <span className={styles.statMeta} style={{ color: 'var(--accent-danger)' }}>
                                ⚠ {formatTime(invalidTime)} no válidas
                            </span>
                        )}
                    </div>

                    <div className={`card ${styles.statCard}`}>
                        <span className={styles.statLabel}>💰 Monedas</span>
                        <span className={styles.statValue} style={{ color: 'var(--accent-warning)' }}>
                            {currentMember.coins}
                        </span>
                        <span className={styles.statMeta}>
                            🎯 {completedObjectives}/{myObjectives.length} objetivos
                        </span>
                    </div>
                </div>

                {/* Active tracking banner */}
                {tracking && (
                    <div className={`card ${styles.trackingBanner}`}>
                        <span className={styles.trackingPulse} />
                        <span>⏱ Trackeando: <strong>{tracking.title}</strong></span>
                    </div>
                )}

                {/* Pet Preview */}
                <div className={`card ${styles.petBanner}`}>
                    <PetAvatar
                        animal={currentMember.animal}
                        size={64}
                        hunger={currentMember.pet.hunger}
                        happiness={currentMember.pet.happiness}
                        equippedHat={currentMember.pet.equippedHat}
                        equippedAccessory={currentMember.pet.equippedAccessory}
                        animate
                    />
                    <div className={styles.petBannerInfo}>
                        <span className={styles.petBannerName}>Tu mascota</span>
                        <div className={styles.petBannerBars}>
                            <span>🍖 {currentMember.pet.hunger}%</span>
                            <span>😊 {currentMember.pet.happiness}%</span>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div className={styles.tasksSection}>
                    <h2 className={styles.sectionTitle}>
                        {viewMode === 'today' ? 'Tareas de Hoy' : viewMode === 'week' ? 'Tareas de la Semana' : 'Todas las Tareas'}
                        <span className={styles.sectionCount}>{activeTasks.length} pendientes</span>
                    </h2>

                    {filterByView.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>🎉</span>
                            <p>No tienes tareas {viewMode === 'today' ? 'hoy' : viewMode === 'week' ? 'esta semana' : ''}.</p>
                            <button className="btn btn-primary" onClick={() => { setEditingTaskId(null); setShowTaskModal(true); }}>
                                Crear una tarea
                            </button>
                        </div>
                    ) : (
                        <div className={styles.tasksList}>
                            {filterByView
                                .sort((a, b) => {
                                    if (a.completed !== b.completed) return a.completed ? 1 : -1;
                                    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                                })
                                .map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onEdit={(id) => { setEditingTaskId(id); setShowTaskModal(true); }}
                                    />
                                ))}
                        </div>
                    )}
                </div>
            </div>

            <TaskModal
                isOpen={showTaskModal}
                onClose={() => { setShowTaskModal(false); setEditingTaskId(null); }}
                editingTaskId={editingTaskId}
            />
        </AppLayout>
    );
}

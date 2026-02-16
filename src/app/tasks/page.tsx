'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useStore } from '@/store/useStore';
import TaskCard from '@/components/tasks/TaskCard';
import TaskModal from '@/components/tasks/TaskModal';
import { TaskFilter } from '@/types';
import { ANIMAL_EMOJIS } from '@/data/teamMembers';
import styles from './tasks.module.css';

export default function TasksPage() {
    const currentUserId = useStore((s) => s.currentUserId);
    const tasks = useStore((s) => s.tasks);
    const members = useStore((s) => s.members);
    const [filter, setFilter] = useState<TaskFilter>('mine');
    const [showModal, setShowModal] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [showCompleted, setShowCompleted] = useState(false);
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

    const filteredTasks = useMemo(() => {
        let result = tasks;

        if (filter === 'mine') {
            result = result.filter((t) => t.assignedTo === currentUserId);
        } else if (filter === 'assigned-by-me') {
            result = result.filter((t) => t.assignedBy === currentUserId && t.assignedTo !== currentUserId);
        }

        if (assigneeFilter !== 'all') {
            result = result.filter((t) => t.assignedTo === assigneeFilter);
        }

        if (!showCompleted) {
            result = result.filter((t) => !t.completed);
        }

        return result.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
    }, [tasks, filter, currentUserId, showCompleted, assigneeFilter]);

    return (
        <AppLayout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1 className={styles.title}>✅ Gestión de Tareas</h1>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => { setEditingTaskId(null); setShowModal(true); }}
                    >
                        ➕ Nueva Tarea
                    </button>
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        {([
                            { key: 'mine', label: '🙋 Mis Tareas' },
                            { key: 'assigned-by-me', label: '📤 Asignadas por mí' },
                            { key: 'all', label: '👥 Todas' },
                        ] as { key: TaskFilter; label: string }[]).map((item) => (
                            <button
                                key={item.key}
                                className={`${styles.filterBtn} ${filter === item.key ? styles.filterActive : ''}`}
                                onClick={() => setFilter(item.key)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.filterGroup}>
                        {filter === 'all' && (
                            <select
                                className="select"
                                value={assigneeFilter}
                                onChange={(e) => setAssigneeFilter(e.target.value)}
                                style={{ width: 'auto' }}
                            >
                                <option value="all">Todos los miembros</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {ANIMAL_EMOJIS[m.animal]} {m.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                checked={showCompleted}
                                onChange={(e) => setShowCompleted(e.target.checked)}
                                className={styles.toggleCheck}
                            />
                            Mostrar completadas
                        </label>
                    </div>
                </div>

                {/* Task Count */}
                <div className={styles.countBar}>
                    <span>{filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Tasks List */}
                {filteredTasks.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📋</span>
                        <p>No hay tareas que mostrar.</p>
                        <button className="btn btn-primary" onClick={() => { setEditingTaskId(null); setShowModal(true); }}>
                            Crear una tarea
                        </button>
                    </div>
                ) : (
                    <div className={styles.tasksList}>
                        {filteredTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={(id) => { setEditingTaskId(id); setShowModal(true); }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <TaskModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingTaskId(null); }}
                editingTaskId={editingTaskId}
            />
        </AppLayout>
    );
}

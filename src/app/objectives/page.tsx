'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useStore } from '@/store/useStore';
import TaskCard from '@/components/tasks/TaskCard';
import { ANIMAL_EMOJIS } from '@/data/teamMembers';
import styles from './objectives.module.css';

export default function ObjectivesPage() {
    const currentUserId = useStore((s) => s.currentUserId);
    const members = useStore((s) => s.members);
    const tasks = useStore((s) => s.tasks);
    const objectives = useStore((s) => s.objectives);
    const addObjective = useStore((s) => s.addObjective);
    const deleteObjective = useStore((s) => s.deleteObjective);
    const addTask = useStore((s) => s.addTask);

    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [assignedTo, setAssignedTo] = useState(currentUserId || '');
    const [newTasks, setNewTasks] = useState<{ title: string; deadline: string }[]>([]);

    const myObjectives = useMemo(
        () => objectives.filter((o) => o.assignedTo === currentUserId),
        [objectives, currentUserId]
    );

    const handleAddSubTask = () => {
        setNewTasks([...newTasks, { title: '', deadline: deadline }]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !deadline) return;

        const taskPayloads = newTasks
            .filter((t) => t.title.trim())
            .map((t) => ({
                title: t.title.trim(),
                description: '',
                assignedTo: assignedTo || currentUserId || '',
                assignedBy: currentUserId || '',
                deadline: new Date(t.deadline || deadline).toISOString(),
                estimatedHours: null,
            }));

        addObjective(
            {
                title: title.trim(),
                description: description.trim(),
                deadline: new Date(deadline).toISOString(),
                createdBy: currentUserId || '',
                assignedTo: assignedTo || currentUserId || '',
            },
            taskPayloads
        );

        // Reset
        setTitle('');
        setDescription('');
        setDeadline('');
        setNewTasks([]);
        setShowModal(false);
    };

    const handleAddTaskToObjective = (objId: string) => {
        const name = prompt('Nombre de la nueva tarea:');
        if (!name?.trim()) return;
        const obj = objectives.find((o) => o.id === objId);
        if (!obj) return;

        const taskId = addTask({
            title: name.trim(),
            description: '',
            objectiveId: objId,
            assignedTo: obj.assignedTo,
            assignedBy: currentUserId || '',
            deadline: obj.deadline,
            estimatedHours: null,
        });

        // Update objective taskIds
        useStore.getState().updateObjective(objId, {
            taskIds: [...obj.taskIds, taskId],
        });
    };

    return (
        <AppLayout>
            <div className={styles.page}>
                <div className={styles.header}>
                    <h1 className={styles.title}>🎯 Objetivos</h1>
                    <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                        ➕ Nuevo Objetivo
                    </button>
                </div>

                {myObjectives.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🎯</span>
                        <p>No tienes objetivos aún. ¡Crea tu primer objetivo!</p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            Crear un objetivo
                        </button>
                    </div>
                ) : (
                    <div className={styles.objectivesList}>
                        {myObjectives
                            .sort((a, b) => {
                                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                            })
                            .map((obj) => {
                                const objTasks = tasks.filter((t) => t.objectiveId === obj.id);
                                const completedTasks = objTasks.filter((t) => t.completed).length;
                                const progress = objTasks.length > 0 ? Math.round((completedTasks / objTasks.length) * 100) : 0;
                                const overdue = !obj.completed && new Date(obj.deadline) < new Date();
                                const assignee = members.find((m) => m.id === obj.assignedTo);

                                return (
                                    <div key={obj.id} className={`card ${styles.objectiveCard} ${obj.completed ? styles.completed : ''} ${overdue ? styles.overdue : ''}`}>
                                        <div className={styles.objHeader}>
                                            <div className={styles.objHeaderLeft}>
                                                <h2 className={styles.objTitle}>
                                                    {obj.completed ? '✅' : '🎯'} {obj.title}
                                                </h2>
                                                {assignee && (
                                                    <span className={styles.objAssignee}>
                                                        {ANIMAL_EMOJIS[assignee.animal]} {assignee.name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.objHeaderRight}>
                                                <span className={`badge ${overdue ? 'badge-danger' : obj.completed ? 'badge-success' : 'badge-info'}`}>
                                                    {new Date(obj.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                </span>
                                                <button className="btn btn-ghost btn-sm" onClick={() => deleteObjective(obj.id)}>🗑️</button>
                                            </div>
                                        </div>

                                        {obj.description && <p className={styles.objDescription}>{obj.description}</p>}

                                        <div className={styles.progressSection}>
                                            <div className={styles.progressInfo}>
                                                <span>{completedTasks}/{objTasks.length} tareas</span>
                                                <span className={styles.progressPercent}>{progress}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{
                                                        width: `${progress}%`,
                                                        background: progress === 100
                                                            ? 'var(--gradient-success)'
                                                            : 'var(--gradient-primary)',
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Sub-tasks */}
                                        {objTasks.length > 0 && (
                                            <div className={styles.subTasks}>
                                                {objTasks.map((task) => (
                                                    <TaskCard key={task.id} task={task} compact />
                                                ))}
                                            </div>
                                        )}

                                        {!obj.completed && (
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleAddTaskToObjective(obj.id)}>
                                                ➕ Añadir tarea
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Create Objective Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>🎯 Nuevo Objetivo</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.field}>
                                <label className="label">Título *</label>
                                <input
                                    className="input"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="¿Qué quieres lograr?"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className={styles.field}>
                                <label className="label">Descripción</label>
                                <textarea
                                    className="textarea"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe el objetivo..."
                                    rows={2}
                                />
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label className="label">Asignar a</label>
                                    <select
                                        className="select"
                                        value={assignedTo}
                                        onChange={(e) => setAssignedTo(e.target.value)}
                                    >
                                        {members.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {ANIMAL_EMOJIS[m.animal]} {m.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.field}>
                                    <label className="label">Fecha límite *</label>
                                    <input
                                        className="input"
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Sub-tasks */}
                            <div className={styles.subTasksSection}>
                                <label className="label">Tareas del objetivo</label>
                                {newTasks.map((task, i) => (
                                    <div key={i} className={styles.subTaskRow}>
                                        <input
                                            className="input"
                                            value={task.title}
                                            onChange={(e) => {
                                                const updated = [...newTasks];
                                                updated[i].title = e.target.value;
                                                setNewTasks(updated);
                                            }}
                                            placeholder={`Tarea ${i + 1}`}
                                        />
                                        <input
                                            className="input"
                                            type="date"
                                            value={task.deadline}
                                            onChange={(e) => {
                                                const updated = [...newTasks];
                                                updated[i].deadline = e.target.value;
                                                setNewTasks(updated);
                                            }}
                                            style={{ width: '150px' }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setNewTasks(newTasks.filter((_, j) => j !== i))}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddSubTask}>
                                    ➕ Añadir tarea
                                </button>
                            </div>

                            <div className={styles.actions}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary btn-lg">
                                    🎯 Crear Objetivo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

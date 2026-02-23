'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import styles from './TaskModal.module.css';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    objectiveId?: string | null;
    editingTaskId?: string | null;
}

export default function TaskModal({ isOpen, onClose, objectiveId = null, editingTaskId = null }: TaskModalProps) {
    const members = useStore((s) => s.members);
    const currentUserId = useStore((s) => s.currentUserId);
    const addTask = useStore((s) => s.addTask);
    const updateTask = useStore((s) => s.updateTask);
    const tasks = useStore((s) => s.tasks);

    const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState(currentUserId || '');
    const [deadline, setDeadline] = useState('');
    const [estimatedH, setEstimatedH] = useState('');
    const [estimatedM, setEstimatedM] = useState('');

    useEffect(() => {
        if (editingTask) {
            setTitle(editingTask.title);
            setDescription(editingTask.description);
            setAssignedTo(editingTask.assignedTo);
            setDeadline(editingTask.deadline.split('T')[0]);
            if (editingTask.estimatedHours != null) {
                const totalMin = Math.round(editingTask.estimatedHours * 60);
                setEstimatedH(Math.floor(totalMin / 60).toString());
                setEstimatedM((totalMin % 60).toString());
            } else {
                setEstimatedH('');
                setEstimatedM('');
            }
        } else {
            setTitle('');
            setDescription('');
            setAssignedTo(currentUserId || '');
            setDeadline(new Date().toISOString().split('T')[0]);
            setEstimatedH('');
            setEstimatedM('');
        }
    }, [editingTask, currentUserId, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !assignedTo || !deadline) return;

        const deadlineISO = new Date(deadline + 'T23:59:59').toISOString();
        const h = parseInt(estimatedH) || 0;
        const m = parseInt(estimatedM) || 0;
        const totalEstimated = h > 0 || m > 0 ? h + m / 60 : null;

        if (editingTask) {
            updateTask(editingTask.id, {
                title: title.trim(),
                description: description.trim(),
                assignedTo,
                deadline: deadlineISO,
                estimatedHours: totalEstimated,
            });
        } else {
            addTask({
                title: title.trim(),
                description: description.trim(),
                objectiveId,
                assignedTo,
                assignedBy: currentUserId || '',
                deadline: deadlineISO,
                estimatedHours: totalEstimated,
            });
        }
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label className="label">Título *</label>
                        <input
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="¿Qué necesitas hacer?"
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
                            placeholder="Detalles adicionales..."
                            rows={3}
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className="label">Asignar a *</label>
                            <select
                                className="select"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
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

                    <div className={styles.field}>
                        <label className="label">Tiempo estimado</label>
                        <div className={styles.timeInputRow}>
                            <input
                                className="input"
                                type="number"
                                min="0"
                                value={estimatedH}
                                onChange={(e) => setEstimatedH(e.target.value)}
                                placeholder="0"
                            />
                            <span className={styles.timeUnit}>h</span>
                            <input
                                className="input"
                                type="number"
                                min="0"
                                max="59"
                                value={estimatedM}
                                onChange={(e) => setEstimatedM(e.target.value)}
                                placeholder="0"
                            />
                            <span className={styles.timeUnit}>min</span>
                        </div>
                        <span className={styles.hint}>
                            Solo para entrenar tu estimación — no penaliza
                        </span>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary btn-lg">
                            {editingTask ? '💾 Guardar Cambios' : '✅ Crear Tarea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

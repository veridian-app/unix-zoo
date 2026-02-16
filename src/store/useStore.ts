'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { TeamMember, Task, Objective, WeeklyRecord, MemberWeekStats } from '@/types';
import { TEAM_MEMBERS } from '@/data/teamMembers';
import { ALL_SHOP_ITEMS } from '@/data/shopItems';
import * as db from '@/lib/db';

// Coin rewards
const COINS_TASK_ON_TIME = 10;
const COINS_TASK_LATE = 3;
const COINS_OBJECTIVE_BONUS = 50;
const BONUS_1ST = 30;
const BONUS_2ND = 20;
const BONUS_3RD = 10;
const BONUS_HIGH_PERF = 15;

interface AppState {
    // Auth
    currentUserId: string | null;
    setCurrentUser: (userId: string) => void;
    logout: () => void;

    // Hydration
    isHydrated: boolean;
    hydrate: () => Promise<void>;

    // Team members
    members: TeamMember[];
    getMember: (id: string) => TeamMember | undefined;

    // Tasks
    tasks: Task[];
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'trackedTimeSeconds' | 'trackingStartedAt' | 'locked' | 'movedDeadline'>) => string;
    updateTask: (id: string, updates: Partial<Task>) => void;
    completeTask: (id: string) => void;
    deleteTask: (id: string) => void;
    moveTaskDeadline: (id: string, newDeadline: string) => void;
    startTracking: (id: string) => void;
    stopTracking: (id: string) => void;

    // Objectives
    objectives: Objective[];
    addObjective: (obj: Omit<Objective, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'taskIds'>, tasks?: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt' | 'trackedTimeSeconds' | 'trackingStartedAt' | 'locked' | 'movedDeadline' | 'objectiveId'>[]) => string;
    updateObjective: (id: string, updates: Partial<Objective>) => void;
    deleteObjective: (id: string) => void;
    checkObjectiveCompletion: (id: string) => void;

    // Pet & Shop
    buyItem: (memberId: string, itemId: string) => boolean;
    feedPet: (memberId: string, foodId: string) => void;
    equipHat: (memberId: string, hatId: string | null) => void;
    equipAccessory: (memberId: string, accId: string | null) => void;

    // Weekly Recap
    weeklyRecords: WeeklyRecord[];
    closeWeek: () => WeeklyRecord;

    // Utility
    lockExpiredTasks: () => void;
    decayPetStats: () => void;
}

export const useStore = create<AppState>()(
    (set, get) => ({
        // Auth
        currentUserId: typeof window !== 'undefined'
            ? localStorage.getItem('unix-zoo-current-user')
            : null,

        setCurrentUser: (userId) => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('unix-zoo-current-user', userId);
            }
            set({ currentUserId: userId });
        },

        logout: () => {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('unix-zoo-current-user');
            }
            set({ currentUserId: null });
        },

        // Hydration — fetch all data from Supabase
        isHydrated: false,
        hydrate: async () => {
            try {
                const [members, tasks, objectives, weeklyRecords] = await Promise.all([
                    db.fetchMembers(),
                    db.fetchTasks(),
                    db.fetchObjectives(),
                    db.fetchWeeklyRecords(),
                ]);
                set({
                    members: members.length > 0 ? members : TEAM_MEMBERS,
                    tasks,
                    objectives,
                    weeklyRecords,
                    isHydrated: true,
                });
            } catch (err) {
                console.error('Hydration error, falling back to defaults:', err);
                set({ members: TEAM_MEMBERS, isHydrated: true });
            }
        },

        // Team members
        members: TEAM_MEMBERS,
        getMember: (id) => get().members.find((m) => m.id === id),

        // Tasks
        tasks: [],

        addTask: (taskData) => {
            const id = uuidv4();
            const task: Task = {
                ...taskData,
                id,
                createdAt: new Date().toISOString(),
                completed: false,
                completedAt: null,
                trackedTimeSeconds: 0,
                trackingStartedAt: null,
                locked: false,
                movedDeadline: false,
            };
            set((state) => ({ tasks: [...state.tasks, task] }));
            db.insertTask(task);
            return id;
        },

        updateTask: (id, updates) => {
            set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === id ? { ...t, ...updates } : t
                ),
            }));
            db.updateTaskDb(id, updates);
        },

        completeTask: (id) => {
            const state = get();
            const task = state.tasks.find((t) => t.id === id);
            if (!task || task.completed) return;

            const now = new Date();
            const deadline = new Date(task.deadline);
            const onTime = now <= deadline;
            const coinsEarned = onTime ? COINS_TASK_ON_TIME : COINS_TASK_LATE;

            let finalTracked = task.trackedTimeSeconds;
            if (task.trackingStartedAt) {
                const elapsed = Math.floor(
                    (now.getTime() - new Date(task.trackingStartedAt).getTime()) / 1000
                );
                finalTracked += elapsed;
            }

            const taskUpdates = {
                completed: true,
                completedAt: now.toISOString(),
                trackedTimeSeconds: finalTracked,
                trackingStartedAt: null,
            };

            set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === id ? { ...t, ...taskUpdates } : t
                ),
                members: state.members.map((m) =>
                    m.id === task.assignedTo
                        ? { ...m, coins: m.coins + coinsEarned }
                        : m
                ),
            }));

            // Persist
            db.updateTaskDb(id, taskUpdates);
            const member = get().members.find((m) => m.id === task.assignedTo);
            if (member) db.saveMemberFull(member);

            if (task.objectiveId) {
                get().checkObjectiveCompletion(task.objectiveId);
            }
        },

        deleteTask: (id) => {
            set((state) => ({
                tasks: state.tasks.filter((t) => t.id !== id),
                objectives: state.objectives.map((o) => ({
                    ...o,
                    taskIds: o.taskIds.filter((tid) => tid !== id),
                })),
            }));
            db.deleteTaskDb(id);
            // Update objectives that referenced this task
            const state = get();
            state.objectives.forEach((o) => {
                if (o.taskIds.includes(id)) {
                    db.updateObjectiveDb(o.id, { taskIds: o.taskIds.filter((tid) => tid !== id) });
                }
            });
        },

        moveTaskDeadline: (id, newDeadline) => {
            const task = get().tasks.find((t) => t.id === id);
            if (!task) return;
            const hoursSinceCreation =
                (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceCreation > 24 || task.locked) return;

            set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === id
                        ? { ...t, deadline: newDeadline, movedDeadline: true }
                        : t
                ),
            }));
            db.updateTaskDb(id, { deadline: newDeadline, movedDeadline: true });
        },

        startTracking: (id) => {
            const started = new Date().toISOString();
            set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === id
                        ? { ...t, trackingStartedAt: started }
                        : t
                ),
            }));
            db.updateTaskDb(id, { trackingStartedAt: started });
        },

        stopTracking: (id) => {
            const task = get().tasks.find((t) => t.id === id);
            if (!task || !task.trackingStartedAt) return;
            const elapsed = Math.floor(
                (Date.now() - new Date(task.trackingStartedAt).getTime()) / 1000
            );
            const newTracked = task.trackedTimeSeconds + elapsed;
            set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === id
                        ? { ...t, trackedTimeSeconds: newTracked, trackingStartedAt: null }
                        : t
                ),
            }));
            db.updateTaskDb(id, { trackedTimeSeconds: newTracked, trackingStartedAt: null });
        },

        // Objectives
        objectives: [],

        addObjective: (objData, tasks) => {
            const objId = uuidv4();
            const taskIds: string[] = [];

            if (tasks && tasks.length > 0) {
                tasks.forEach((taskData) => {
                    const taskId = get().addTask({ ...taskData, objectiveId: objId });
                    taskIds.push(taskId);
                });
            }

            const objective: Objective = {
                ...objData,
                id: objId,
                createdAt: new Date().toISOString(),
                completed: false,
                completedAt: null,
                taskIds,
            };

            set((state) => ({ objectives: [...state.objectives, objective] }));
            db.insertObjective(objective);
            return objId;
        },

        updateObjective: (id, updates) => {
            set((state) => ({
                objectives: state.objectives.map((o) =>
                    o.id === id ? { ...o, ...updates } : o
                ),
            }));
            db.updateObjectiveDb(id, updates);
        },

        deleteObjective: (id) => {
            const state = get();
            const obj = state.objectives.find((o) => o.id === id);
            set((s) => ({
                objectives: s.objectives.filter((o) => o.id !== id),
                tasks: s.tasks.filter((t) => t.objectiveId !== id),
            }));
            db.deleteObjectiveDb(id);
            if (obj) {
                obj.taskIds.forEach((tid) => db.deleteTaskDb(tid));
            }
        },

        checkObjectiveCompletion: (id) => {
            const state = get();
            const obj = state.objectives.find((o) => o.id === id);
            if (!obj || obj.completed) return;

            const objTasks = state.tasks.filter((t) => t.objectiveId === id);
            const allDone = objTasks.length > 0 && objTasks.every((t) => t.completed);

            if (allDone) {
                const now = new Date();
                const deadline = new Date(obj.deadline);
                const onTime = now <= deadline;
                const objUpdates = { completed: true, completedAt: now.toISOString() };

                set((state) => ({
                    objectives: state.objectives.map((o) =>
                        o.id === id ? { ...o, ...objUpdates } : o
                    ),
                    members: onTime
                        ? state.members.map((m) =>
                            m.id === obj.assignedTo
                                ? { ...m, coins: m.coins + COINS_OBJECTIVE_BONUS }
                                : m
                        )
                        : state.members,
                }));

                db.updateObjectiveDb(id, objUpdates);
                if (onTime) {
                    const member = get().members.find((m) => m.id === obj.assignedTo);
                    if (member) db.saveMemberFull(member);
                }
            }
        },

        // Pet & Shop
        buyItem: (memberId, itemId) => {
            const member = get().members.find((m) => m.id === memberId);
            const item = ALL_SHOP_ITEMS.find((i) => i.id === itemId);
            if (!member || !item || member.coins < item.price) return false;

            if (item.type === 'hat' && member.pet.ownedAccessories.includes(itemId)) return false;
            if (item.type === 'accessory' && member.pet.ownedAccessories.includes(itemId)) return false;

            set((state) => ({
                members: state.members.map((m) => {
                    if (m.id !== memberId) return m;
                    const updatedPet = { ...m.pet };
                    if (item.type === 'food') {
                        updatedPet.ownedFood = [...updatedPet.ownedFood, itemId];
                    } else {
                        updatedPet.ownedAccessories = [...updatedPet.ownedAccessories, itemId];
                    }
                    return { ...m, coins: m.coins - item.price, pet: updatedPet };
                }),
            }));

            const updated = get().members.find((m) => m.id === memberId);
            if (updated) db.saveMemberFull(updated);
            return true;
        },

        feedPet: (memberId, foodId) => {
            const member = get().members.find((m) => m.id === memberId);
            if (!member) return;
            const foodIndex = member.pet.ownedFood.indexOf(foodId);
            if (foodIndex === -1) return;

            const item = ALL_SHOP_ITEMS.find((i) => i.id === foodId);
            if (!item) return;

            set((state) => ({
                members: state.members.map((m) => {
                    if (m.id !== memberId) return m;
                    const newFood = [...m.pet.ownedFood];
                    newFood.splice(foodIndex, 1);
                    return {
                        ...m,
                        pet: {
                            ...m.pet,
                            ownedFood: newFood,
                            hunger: Math.min(100, m.pet.hunger + (item.hungerRestore || 0)),
                            happiness: Math.min(100, m.pet.happiness + (item.happinessBoost || 0)),
                            lastFedAt: new Date().toISOString(),
                        },
                    };
                }),
            }));

            const updated = get().members.find((m) => m.id === memberId);
            if (updated) db.saveMemberFull(updated);
        },

        equipHat: (memberId, hatId) => {
            set((state) => ({
                members: state.members.map((m) =>
                    m.id === memberId
                        ? { ...m, pet: { ...m.pet, equippedHat: hatId } }
                        : m
                ),
            }));
            const updated = get().members.find((m) => m.id === memberId);
            if (updated) db.saveMemberFull(updated);
        },

        equipAccessory: (memberId, accId) => {
            set((state) => ({
                members: state.members.map((m) =>
                    m.id === memberId
                        ? { ...m, pet: { ...m.pet, equippedAccessory: accId } }
                        : m
                ),
            }));
            const updated = get().members.find((m) => m.id === memberId);
            if (updated) db.saveMemberFull(updated);
        },

        // Weekly Recap
        weeklyRecords: [],

        closeWeek: () => {
            const state = get();
            const now = new Date();
            const dayOfWeek = now.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() + diffToMonday);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            const weekStartISO = weekStart.toISOString();
            const alreadyClosed = state.weeklyRecords.find(
                (r) => r.weekStart === weekStartISO
            );
            if (alreadyClosed) return alreadyClosed;

            const memberStats: MemberWeekStats[] = state.members.map((member) => {
                const memberTasks = state.tasks.filter(
                    (t) => t.assignedTo === member.id
                );
                const weekTasks = memberTasks.filter((t) => {
                    const d = new Date(t.deadline);
                    return d >= weekStart && d <= weekEnd;
                });
                const completed = weekTasks.filter((t) => t.completed);
                const onTime = completed.filter(
                    (t) => t.completedAt && new Date(t.completedAt) <= new Date(t.deadline)
                );
                const validSeconds = onTime.reduce((s, t) => s + t.trackedTimeSeconds, 0);
                const invalidSeconds = completed
                    .filter((t) => t.completedAt && new Date(t.completedAt) > new Date(t.deadline))
                    .reduce((s, t) => s + t.trackedTimeSeconds, 0);

                const weekObjectives = state.objectives.filter(
                    (o) => o.assignedTo === member.id && o.completed &&
                        o.completedAt && new Date(o.completedAt) >= weekStart &&
                        new Date(o.completedAt) <= weekEnd
                );

                const rate = weekTasks.length > 0
                    ? Math.round((completed.length / weekTasks.length) * 100)
                    : 0;

                return {
                    memberId: member.id,
                    tasksTotal: weekTasks.length,
                    tasksCompleted: completed.length,
                    tasksOnTime: onTime.length,
                    completionRate: rate,
                    validHoursSeconds: validSeconds,
                    invalidHoursSeconds: invalidSeconds,
                    coinsEarned: onTime.length * COINS_TASK_ON_TIME +
                        (completed.length - onTime.length) * COINS_TASK_LATE +
                        weekObjectives.length * COINS_OBJECTIVE_BONUS,
                    bonusCoins: 0,
                    objectivesCompleted: weekObjectives.length,
                };
            });

            const ranked = [...memberStats]
                .filter((ms) => ms.tasksTotal > 0)
                .sort((a, b) => b.completionRate - a.completionRate || b.tasksOnTime - a.tasksOnTime);

            if (ranked.length >= 1) {
                const first = memberStats.find((m) => m.memberId === ranked[0].memberId)!;
                first.bonusCoins += BONUS_1ST;
            }
            if (ranked.length >= 2) {
                const second = memberStats.find((m) => m.memberId === ranked[1].memberId)!;
                second.bonusCoins += BONUS_2ND;
            }
            if (ranked.length >= 3) {
                const third = memberStats.find((m) => m.memberId === ranked[2].memberId)!;
                third.bonusCoins += BONUS_3RD;
            }

            memberStats.forEach((ms) => {
                if (ms.completionRate >= 90 && ms.tasksTotal > 0) {
                    ms.bonusCoins += BONUS_HIGH_PERF;
                }
            });

            const teamTotal = memberStats.reduce((s, m) => s + m.tasksTotal, 0);
            const teamCompleted = memberStats.reduce((s, m) => s + m.tasksCompleted, 0);

            const record: WeeklyRecord = {
                id: uuidv4(),
                weekStart: weekStartISO,
                weekEnd: weekEnd.toISOString(),
                closedAt: now.toISOString(),
                memberStats,
                topPerformer: ranked.length > 0 ? ranked[0].memberId : null,
                teamCompletionRate: teamTotal > 0
                    ? Math.round((teamCompleted / teamTotal) * 100)
                    : 0,
            };

            set((state) => ({
                weeklyRecords: [...state.weeklyRecords, record],
                members: state.members.map((m) => {
                    const stats = memberStats.find((ms) => ms.memberId === m.id);
                    const bonus = stats?.bonusCoins || 0;
                    return bonus > 0 ? { ...m, coins: m.coins + bonus } : m;
                }),
            }));

            // Persist
            db.insertWeeklyRecord(record);
            const updatedMembers = get().members;
            memberStats.forEach((ms) => {
                if (ms.bonusCoins > 0) {
                    const m = updatedMembers.find((mem) => mem.id === ms.memberId);
                    if (m) db.saveMemberFull(m);
                }
            });

            return record;
        },

        // Utilities
        lockExpiredTasks: () => {
            const now = Date.now();
            const tasksToLock: string[] = [];
            set((state) => ({
                tasks: state.tasks.map((t) => {
                    if (t.locked || t.completed) return t;
                    const hoursSinceCreation =
                        (now - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
                    if (hoursSinceCreation > 24) {
                        tasksToLock.push(t.id);
                        return { ...t, locked: true };
                    }
                    return t;
                }),
            }));
            tasksToLock.forEach((id) => db.updateTaskDb(id, { locked: true }));
        },

        decayPetStats: () => {
            set((state) => ({
                members: state.members.map((m) => ({
                    ...m,
                    pet: {
                        ...m.pet,
                        hunger: Math.max(0, m.pet.hunger - 2),
                        happiness: Math.max(0, m.pet.happiness - 1),
                    },
                })),
            }));
            // Persist decayed stats
            get().members.forEach((m) => db.saveMemberFull(m));
        },
    })
);

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { TeamMember, Task, Objective, PetState } from '@/types';
import { TEAM_MEMBERS } from '@/data/teamMembers';
import { ALL_SHOP_ITEMS } from '@/data/shopItems';

// Coin rewards
const COINS_TASK_ON_TIME = 10;
const COINS_TASK_LATE = 3;
const COINS_OBJECTIVE_BONUS = 50;

interface AppState {
    // Auth
    currentUserId: string | null;
    setCurrentUser: (userId: string) => void;
    logout: () => void;

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

    // Utility
    lockExpiredTasks: () => void;
    decayPetStats: () => void;
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Auth
            currentUserId: null,
            setCurrentUser: (userId) => set({ currentUserId: userId }),
            logout: () => set({ currentUserId: null }),

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
                return id;
            },

            updateTask: (id, updates) =>
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === id ? { ...t, ...updates } : t
                    ),
                })),

            completeTask: (id) => {
                const state = get();
                const task = state.tasks.find((t) => t.id === id);
                if (!task || task.completed) return;

                const now = new Date();
                const deadline = new Date(task.deadline);
                const onTime = now <= deadline;
                const coinsEarned = onTime ? COINS_TASK_ON_TIME : COINS_TASK_LATE;

                // Stop tracking if active
                let finalTracked = task.trackedTimeSeconds;
                if (task.trackingStartedAt) {
                    const elapsed = Math.floor(
                        (now.getTime() - new Date(task.trackingStartedAt).getTime()) / 1000
                    );
                    finalTracked += elapsed;
                }

                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === id
                            ? {
                                ...t,
                                completed: true,
                                completedAt: now.toISOString(),
                                trackedTimeSeconds: finalTracked,
                                trackingStartedAt: null,
                            }
                            : t
                    ),
                    members: state.members.map((m) =>
                        m.id === task.assignedTo
                            ? { ...m, coins: m.coins + coinsEarned }
                            : m
                    ),
                }));

                // Check objective completion
                if (task.objectiveId) {
                    get().checkObjectiveCompletion(task.objectiveId);
                }
            },

            deleteTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.filter((t) => t.id !== id),
                    objectives: state.objectives.map((o) => ({
                        ...o,
                        taskIds: o.taskIds.filter((tid) => tid !== id),
                    })),
                })),

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
            },

            startTracking: (id) =>
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === id
                            ? { ...t, trackingStartedAt: new Date().toISOString() }
                            : t
                    ),
                })),

            stopTracking: (id) => {
                const task = get().tasks.find((t) => t.id === id);
                if (!task || !task.trackingStartedAt) return;
                const elapsed = Math.floor(
                    (Date.now() - new Date(task.trackingStartedAt).getTime()) / 1000
                );
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === id
                            ? {
                                ...t,
                                trackedTimeSeconds: t.trackedTimeSeconds + elapsed,
                                trackingStartedAt: null,
                            }
                            : t
                    ),
                }));
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

                set((state) => ({
                    objectives: [...state.objectives, objective],
                }));
                return objId;
            },

            updateObjective: (id, updates) =>
                set((state) => ({
                    objectives: state.objectives.map((o) =>
                        o.id === id ? { ...o, ...updates } : o
                    ),
                })),

            deleteObjective: (id) =>
                set((state) => ({
                    objectives: state.objectives.filter((o) => o.id !== id),
                    tasks: state.tasks.filter((t) => t.objectiveId !== id),
                })),

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

                    set((state) => ({
                        objectives: state.objectives.map((o) =>
                            o.id === id
                                ? { ...o, completed: true, completedAt: now.toISOString() }
                                : o
                        ),
                        members: onTime
                            ? state.members.map((m) =>
                                m.id === obj.assignedTo
                                    ? { ...m, coins: m.coins + COINS_OBJECTIVE_BONUS }
                                    : m
                            )
                            : state.members,
                    }));
                }
            },

            // Pet & Shop
            buyItem: (memberId, itemId) => {
                const member = get().members.find((m) => m.id === memberId);
                const item = ALL_SHOP_ITEMS.find((i) => i.id === itemId);
                if (!member || !item || member.coins < item.price) return false;

                // Check if already owned (for accessories/hats)
                if (item.type === 'hat' && member.pet.ownedAccessories.includes(itemId)) return false;
                if (item.type === 'accessory' && member.pet.ownedAccessories.includes(itemId)) return false;

                set((state) => ({
                    members: state.members.map((m) => {
                        if (m.id !== memberId) return m;
                        const updatedPet = { ...m.pet };
                        if (item.type === 'food') {
                            updatedPet.ownedFood = [...updatedPet.ownedFood, itemId];
                        } else {
                            updatedPet.ownedAccessories = [
                                ...updatedPet.ownedAccessories,
                                itemId,
                            ];
                        }
                        return { ...m, coins: m.coins - item.price, pet: updatedPet };
                    }),
                }));
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
                                happiness: Math.min(
                                    100,
                                    m.pet.happiness + (item.happinessBoost || 0)
                                ),
                                lastFedAt: new Date().toISOString(),
                            },
                        };
                    }),
                }));
            },

            equipHat: (memberId, hatId) =>
                set((state) => ({
                    members: state.members.map((m) =>
                        m.id === memberId
                            ? { ...m, pet: { ...m.pet, equippedHat: hatId } }
                            : m
                    ),
                })),

            equipAccessory: (memberId, accId) =>
                set((state) => ({
                    members: state.members.map((m) =>
                        m.id === memberId
                            ? { ...m, pet: { ...m.pet, equippedAccessory: accId } }
                            : m
                    ),
                })),

            // Utilities
            lockExpiredTasks: () => {
                const now = Date.now();
                set((state) => ({
                    tasks: state.tasks.map((t) => {
                        if (t.locked || t.completed) return t;
                        const hoursSinceCreation =
                            (now - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
                        if (hoursSinceCreation > 24) {
                            return { ...t, locked: true };
                        }
                        return t;
                    }),
                }));
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
            },
        }),
        {
            name: 'unix-zoo-storage',
            version: 1,
        }
    )
);

import { supabase } from './supabase';
import { TeamMember, Task, Objective, WeeklyRecord, PetState, AnimalType } from '@/types';

// ============================================
// Mappers: DB row <-> app types
// ============================================

function rowToMember(row: Record<string, unknown>): TeamMember {
    return {
        id: row.id as string,
        name: row.name as string,
        animal: row.animal as AnimalType,
        coins: row.coins as number,
        pet: {
            hunger: row.pet_hunger as number,
            happiness: row.pet_happiness as number,
            ownedFood: (row.pet_owned_food as string[]) || [],
            ownedAccessories: (row.pet_owned_accessories as string[]) || [],
            equippedHat: (row.pet_equipped_hat as string) || null,
            equippedAccessory: (row.pet_equipped_accessory as string) || null,
            lastFedAt: (row.pet_last_fed_at as string) || null,
        },
    };
}

function memberToRow(m: TeamMember) {
    return {
        id: m.id,
        name: m.name,
        animal: m.animal,
        coins: m.coins,
        pet_hunger: m.pet.hunger,
        pet_happiness: m.pet.happiness,
        pet_owned_food: m.pet.ownedFood,
        pet_owned_accessories: m.pet.ownedAccessories,
        pet_equipped_hat: m.pet.equippedHat,
        pet_equipped_accessory: m.pet.equippedAccessory,
        pet_last_fed_at: m.pet.lastFedAt,
    };
}

function rowToTask(row: Record<string, unknown>): Task {
    return {
        id: row.id as string,
        title: row.title as string,
        description: (row.description as string) || '',
        objectiveId: (row.objective_id as string) || null,
        assignedTo: row.assigned_to as string,
        assignedBy: row.assigned_by as string,
        deadline: row.deadline as string,
        createdAt: row.created_at as string,
        completed: row.completed as boolean,
        completedAt: (row.completed_at as string) || null,
        estimatedHours: (row.estimated_hours as number) || null,
        trackedTimeSeconds: (row.tracked_time_seconds as number) || 0,
        trackingStartedAt: (row.tracking_started_at as string) || null,
        locked: row.locked as boolean,
        movedDeadline: row.moved_deadline as boolean,
    };
}

function taskToRow(t: Task) {
    return {
        id: t.id,
        title: t.title,
        description: t.description,
        objective_id: t.objectiveId,
        assigned_to: t.assignedTo,
        assigned_by: t.assignedBy,
        deadline: t.deadline,
        created_at: t.createdAt,
        completed: t.completed,
        completed_at: t.completedAt,
        estimated_hours: t.estimatedHours,
        tracked_time_seconds: t.trackedTimeSeconds,
        tracking_started_at: t.trackingStartedAt,
        locked: t.locked,
        moved_deadline: t.movedDeadline,
    };
}

function rowToObjective(row: Record<string, unknown>): Objective {
    return {
        id: row.id as string,
        title: row.title as string,
        description: (row.description as string) || '',
        deadline: row.deadline as string,
        createdAt: row.created_at as string,
        createdBy: row.created_by as string,
        assignedTo: row.assigned_to as string,
        taskIds: (row.task_ids as string[]) || [],
        completed: row.completed as boolean,
        completedAt: (row.completed_at as string) || null,
    };
}

function objectiveToRow(o: Objective) {
    return {
        id: o.id,
        title: o.title,
        description: o.description,
        deadline: o.deadline,
        created_at: o.createdAt,
        created_by: o.createdBy,
        assigned_to: o.assignedTo,
        task_ids: o.taskIds,
        completed: o.completed,
        completed_at: o.completedAt,
    };
}

function rowToWeeklyRecord(row: Record<string, unknown>): WeeklyRecord {
    return {
        id: row.id as string,
        weekStart: row.week_start as string,
        weekEnd: row.week_end as string,
        closedAt: row.closed_at as string,
        memberStats: row.member_stats as WeeklyRecord['memberStats'],
        topPerformer: (row.top_performer as string) || null,
        teamCompletionRate: row.team_completion_rate as number,
    };
}

// ============================================
// CRUD Operations
// ============================================

// Members
export async function fetchMembers(): Promise<TeamMember[]> {
    const { data, error } = await supabase.from('members').select('*');
    if (error) { console.error('fetchMembers error:', error); return []; }
    return (data || []).map(rowToMember);
}

export async function updateMember(id: string, updates: Partial<TeamMember>) {
    const row: Record<string, unknown> = {};
    if (updates.coins !== undefined) row.coins = updates.coins;
    if (updates.pet) {
        const p = updates.pet;
        if (p.hunger !== undefined) row.pet_hunger = p.hunger;
        if (p.happiness !== undefined) row.pet_happiness = p.happiness;
        if (p.ownedFood !== undefined) row.pet_owned_food = p.ownedFood;
        if (p.ownedAccessories !== undefined) row.pet_owned_accessories = p.ownedAccessories;
        if (p.equippedHat !== undefined) row.pet_equipped_hat = p.equippedHat;
        if (p.equippedAccessory !== undefined) row.pet_equipped_accessory = p.equippedAccessory;
        if (p.lastFedAt !== undefined) row.pet_last_fed_at = p.lastFedAt;
    }
    if (Object.keys(row).length === 0) return;
    const { error } = await supabase.from('members').update(row).eq('id', id);
    if (error) console.error('updateMember error:', error);
}

export async function saveMemberFull(m: TeamMember) {
    const { error } = await supabase.from('members').upsert(memberToRow(m));
    if (error) console.error('saveMemberFull error:', error);
}

// Tasks
export async function fetchTasks(): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) { console.error('fetchTasks error:', error); return []; }
    return (data || []).map(rowToTask);
}

export async function insertTask(task: Task) {
    const { error } = await supabase.from('tasks').insert(taskToRow(task));
    if (error) console.error('insertTask error:', error);
}

export async function updateTaskDb(id: string, updates: Partial<Task>) {
    const row: Record<string, unknown> = {};
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.objectiveId !== undefined) row.objective_id = updates.objectiveId;
    if (updates.assignedTo !== undefined) row.assigned_to = updates.assignedTo;
    if (updates.deadline !== undefined) row.deadline = updates.deadline;
    if (updates.completed !== undefined) row.completed = updates.completed;
    if (updates.completedAt !== undefined) row.completed_at = updates.completedAt;
    if (updates.estimatedHours !== undefined) row.estimated_hours = updates.estimatedHours;
    if (updates.trackedTimeSeconds !== undefined) row.tracked_time_seconds = updates.trackedTimeSeconds;
    if (updates.trackingStartedAt !== undefined) row.tracking_started_at = updates.trackingStartedAt;
    if (updates.locked !== undefined) row.locked = updates.locked;
    if (updates.movedDeadline !== undefined) row.moved_deadline = updates.movedDeadline;
    if (Object.keys(row).length === 0) return;
    const { error } = await supabase.from('tasks').update(row).eq('id', id);
    if (error) console.error('updateTaskDb error:', error);
}

export async function deleteTaskDb(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error('deleteTaskDb error:', error);
}

// Objectives
export async function fetchObjectives(): Promise<Objective[]> {
    const { data, error } = await supabase.from('objectives').select('*');
    if (error) { console.error('fetchObjectives error:', error); return []; }
    return (data || []).map(rowToObjective);
}

export async function insertObjective(obj: Objective) {
    const { error } = await supabase.from('objectives').insert(objectiveToRow(obj));
    if (error) console.error('insertObjective error:', error);
}

export async function updateObjectiveDb(id: string, updates: Partial<Objective>) {
    const row: Record<string, unknown> = {};
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.deadline !== undefined) row.deadline = updates.deadline;
    if (updates.taskIds !== undefined) row.task_ids = updates.taskIds;
    if (updates.completed !== undefined) row.completed = updates.completed;
    if (updates.completedAt !== undefined) row.completed_at = updates.completedAt;
    if (Object.keys(row).length === 0) return;
    const { error } = await supabase.from('objectives').update(row).eq('id', id);
    if (error) console.error('updateObjectiveDb error:', error);
}

export async function deleteObjectiveDb(id: string) {
    const { error } = await supabase.from('objectives').delete().eq('id', id);
    if (error) console.error('deleteObjectiveDb error:', error);
}

// Weekly Records
export async function fetchWeeklyRecords(): Promise<WeeklyRecord[]> {
    const { data, error } = await supabase.from('weekly_records').select('*').order('week_start', { ascending: false });
    if (error) { console.error('fetchWeeklyRecords error:', error); return []; }
    return (data || []).map(rowToWeeklyRecord);
}

export async function insertWeeklyRecord(record: WeeklyRecord) {
    const { error } = await supabase.from('weekly_records').insert({
        id: record.id,
        week_start: record.weekStart,
        week_end: record.weekEnd,
        closed_at: record.closedAt,
        member_stats: record.memberStats,
        top_performer: record.topPerformer,
        team_completion_rate: record.teamCompletionRate,
    });
    if (error) console.error('insertWeeklyRecord error:', error);
}

import { TeamMember } from '@/types';

const defaultPet = () => ({
    hunger: 80,
    happiness: 80,
    ownedFood: [],
    ownedAccessories: [],
    equippedHat: null,
    equippedAccessory: null,
    lastFedAt: null,
});

export const TEAM_MEMBERS: TeamMember[] = [
    { id: 'pedro', name: 'Pedro', animal: 'dolphin', coins: 50, pet: defaultPet() },
    { id: 'nahuel', name: 'Nahuel', animal: 'tiger', coins: 50, pet: defaultPet() },
    { id: 'firu', name: 'Firu', animal: 'monkey', coins: 50, pet: defaultPet() },
    { id: 'adri', name: 'Adri', animal: 'squirrel', coins: 50, pet: defaultPet() },
    { id: 'marta', name: 'Marta', animal: 'koala', coins: 50, pet: defaultPet() },
    { id: 'xuso', name: 'Xuso', animal: 'giraffe', coins: 50, pet: defaultPet() },
    { id: 'elena', name: 'Elena', animal: 'lioness', coins: 50, pet: defaultPet() },
    { id: 'lorena', name: 'Lorena', animal: 'leopard', coins: 50, pet: defaultPet() },
    { id: 'sara', name: 'Sara', animal: 'cat', coins: 50, pet: defaultPet() },
    { id: 'lucas', name: 'Lucas', animal: 'kangaroo', coins: 50, pet: defaultPet() },
];

export const ANIMAL_EMOJIS: Record<string, string> = {
    dolphin: '🐬',
    tiger: '🐯',
    monkey: '🐵',
    squirrel: '🐿️',
    koala: '🐨',
    giraffe: '🦒',
    lioness: '🦁',
    leopard: '🐆',
    cat: '🐱',
    kangaroo: '🦘',
};

export const ANIMAL_COLORS: Record<string, { primary: string; light: string; dark: string }> = {
    dolphin: { primary: '#4FC3F7', light: '#E1F5FE', dark: '#0277BD' },
    tiger: { primary: '#FF8A65', light: '#FBE9E7', dark: '#D84315' },
    monkey: { primary: '#A1887F', light: '#EFEBE9', dark: '#4E342E' },
    squirrel: { primary: '#FFB74D', light: '#FFF3E0', dark: '#E65100' },
    koala: { primary: '#90A4AE', light: '#ECEFF1', dark: '#37474F' },
    giraffe: { primary: '#FDD835', light: '#FFFDE7', dark: '#F57F17' },
    lioness: { primary: '#FFCA28', light: '#FFF8E1', dark: '#FF8F00' },
    leopard: { primary: '#FFAB40', light: '#FFF3E0', dark: '#E65100' },
    cat: { primary: '#CE93D8', light: '#F3E5F5', dark: '#6A1B9A' },
    kangaroo: { primary: '#8D6E63', light: '#EFEBE9', dark: '#3E2723' },
};

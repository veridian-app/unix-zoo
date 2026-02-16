import { ShopItem } from '@/types';

export const FOOD_ITEMS: ShopItem[] = [
    { id: 'apple', name: 'Manzana', emoji: '🍎', price: 5, type: 'food', hungerRestore: 15, happinessBoost: 5 },
    { id: 'fish', name: 'Pescado', emoji: '🐟', price: 8, type: 'food', hungerRestore: 25, happinessBoost: 10 },
    { id: 'cake', name: 'Tarta', emoji: '🎂', price: 12, type: 'food', hungerRestore: 20, happinessBoost: 25 },
    { id: 'steak', name: 'Filete Premium', emoji: '🥩', price: 15, type: 'food', hungerRestore: 35, happinessBoost: 15 },
    { id: 'sushi', name: 'Sushi Deluxe', emoji: '🍣', price: 20, type: 'food', hungerRestore: 30, happinessBoost: 30 },
];

export const ACCESSORY_ITEMS: ShopItem[] = [
    { id: 'hat-party', name: 'Gorro de Fiesta', emoji: '🎉', price: 20, type: 'hat' },
    { id: 'hat-cowboy', name: 'Sombrero Vaquero', emoji: '🤠', price: 25, type: 'hat' },
    { id: 'hat-crown', name: 'Corona Real', emoji: '👑', price: 40, type: 'hat' },
    { id: 'hat-wizard', name: 'Gorro de Mago', emoji: '🧙', price: 30, type: 'hat' },
    { id: 'hat-flower', name: 'Corona de Flores', emoji: '💐', price: 20, type: 'hat' },
    { id: 'acc-glasses', name: 'Gafas de Sol', emoji: '😎', price: 15, type: 'accessory' },
    { id: 'acc-bowtie', name: 'Pajarita', emoji: '🎀', price: 15, type: 'accessory' },
    { id: 'acc-scarf', name: 'Bufanda', emoji: '🧣', price: 20, type: 'accessory' },
    { id: 'acc-medal', name: 'Medalla de Oro', emoji: '🏅', price: 35, type: 'accessory' },
    { id: 'acc-cape', name: 'Capa de Héroe', emoji: '🦸', price: 50, type: 'accessory' },
];

export const ALL_SHOP_ITEMS = [...FOOD_ITEMS, ...ACCESSORY_ITEMS];

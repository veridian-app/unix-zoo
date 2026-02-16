'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useStore } from '@/store/useStore';
import PetAvatar from '@/components/pets/PetAvatar';
import { ANIMAL_COLORS } from '@/data/teamMembers';
import { FOOD_ITEMS, ACCESSORY_ITEMS } from '@/data/shopItems';
import styles from './pet.module.css';

type ShopTab = 'food' | 'hats' | 'accessories';

export default function PetPage() {
    const currentUserId = useStore((s) => s.currentUserId);
    const members = useStore((s) => s.members);
    const buyItem = useStore((s) => s.buyItem);
    const feedPet = useStore((s) => s.feedPet);
    const equipHat = useStore((s) => s.equipHat);
    const equipAccessory = useStore((s) => s.equipAccessory);

    const [shopTab, setShopTab] = useState<ShopTab>('food');
    const [feedAnim, setFeedAnim] = useState(false);
    const [buyAnim, setBuyAnim] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const currentMember = members.find((m) => m.id === currentUserId);
    if (!currentMember) return null;

    const colors = ANIMAL_COLORS[currentMember.animal];
    const pet = currentMember.pet;
    const hats = ACCESSORY_ITEMS.filter((i) => i.type === 'hat');
    const accessories = ACCESSORY_ITEMS.filter((i) => i.type === 'accessory');

    const showMessage = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 2000);
    };

    const handleBuy = (itemId: string) => {
        const success = buyItem(currentMember.id, itemId);
        if (success) {
            setBuyAnim(itemId);
            setTimeout(() => setBuyAnim(null), 500);
            showMessage('¡Comprado! 🎉');
        } else {
            showMessage('No tienes suficientes monedas 😢');
        }
    };

    const handleFeed = (foodId: string) => {
        feedPet(currentMember.id, foodId);
        setFeedAnim(true);
        setTimeout(() => setFeedAnim(false), 1000);
        showMessage('¡Ñam ñam! 😋');
    };

    const handleEquipHat = (hatId: string) => {
        if (pet.equippedHat === hatId) {
            equipHat(currentMember.id, null);
        } else {
            equipHat(currentMember.id, hatId);
        }
    };

    const handleEquipAccessory = (accId: string) => {
        if (pet.equippedAccessory === accId) {
            equipAccessory(currentMember.id, null);
        } else {
            equipAccessory(currentMember.id, accId);
        }
    };

    // Group owned food by id
    const ownedFoodCounts: Record<string, number> = {};
    pet.ownedFood.forEach((fid) => {
        ownedFoodCounts[fid] = (ownedFoodCounts[fid] || 0) + 1;
    });

    return (
        <AppLayout>
            <div className={styles.page}>
                {/* Message toast */}
                {message && (
                    <div className={styles.toast}>{message}</div>
                )}

                <h1 className={styles.title}>🐾 Mi Mascota</h1>

                <div className={styles.layout}>
                    {/* Left: Pet Display */}
                    <div className={styles.petSection}>
                        <div
                            className={`card ${styles.petCard}`}
                            style={{ borderColor: colors.primary + '30' }}
                        >
                            <div className={`${styles.petContainer} ${feedAnim ? styles.feedAnimation : ''}`}>
                                <PetAvatar
                                    animal={currentMember.animal}
                                    size={180}
                                    hunger={pet.hunger}
                                    happiness={pet.happiness}
                                    equippedHat={pet.equippedHat}
                                    equippedAccessory={pet.equippedAccessory}
                                    animate
                                />
                            </div>

                            <h2 className={styles.petName}>
                                {currentMember.name}
                            </h2>

                            {/* Status Bars */}
                            <div className={styles.statusBars}>
                                <div className={styles.barRow}>
                                    <span className={styles.barLabel}>🍖 Hambre</span>
                                    <div className={styles.barTrack}>
                                        <div
                                            className={styles.barFill}
                                            style={{
                                                width: `${pet.hunger}%`,
                                                background: pet.hunger > 50
                                                    ? 'var(--gradient-success)'
                                                    : pet.hunger > 25
                                                        ? 'var(--gradient-gold)'
                                                        : 'var(--accent-danger)',
                                            }}
                                        />
                                    </div>
                                    <span className={styles.barValue}>{pet.hunger}%</span>
                                </div>

                                <div className={styles.barRow}>
                                    <span className={styles.barLabel}>😊 Felicidad</span>
                                    <div className={styles.barTrack}>
                                        <div
                                            className={styles.barFill}
                                            style={{
                                                width: `${pet.happiness}%`,
                                                background: pet.happiness > 50
                                                    ? 'var(--gradient-primary)'
                                                    : pet.happiness > 25
                                                        ? 'var(--gradient-gold)'
                                                        : 'var(--accent-danger)',
                                            }}
                                        />
                                    </div>
                                    <span className={styles.barValue}>{pet.happiness}%</span>
                                </div>
                            </div>

                            {/* Owned Food for Feeding */}
                            {Object.keys(ownedFoodCounts).length > 0 && (
                                <div className={styles.feedSection}>
                                    <h3 className={styles.feedTitle}>Alimentar</h3>
                                    <div className={styles.feedItems}>
                                        {Object.entries(ownedFoodCounts).map(([foodId, count]) => {
                                            const food = FOOD_ITEMS.find((f) => f.id === foodId);
                                            if (!food) return null;
                                            return (
                                                <button
                                                    key={foodId}
                                                    className={styles.feedBtn}
                                                    onClick={() => handleFeed(foodId)}
                                                >
                                                    <span className={styles.feedEmoji}>{food.emoji}</span>
                                                    <span className={styles.feedCount}>×{count}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Equipped Items */}
                            <div className={styles.equippedSection}>
                                <h3 className={styles.feedTitle}>Equipamiento</h3>
                                <div className={styles.equippedItems}>
                                    <div className={styles.equippedSlot}>
                                        <span className={styles.slotLabel}>Gorro</span>
                                        {pet.equippedHat ? (
                                            <button
                                                className={styles.equippedItem}
                                                onClick={() => handleEquipHat(pet.equippedHat!)}
                                            >
                                                {ACCESSORY_ITEMS.find((i) => i.id === pet.equippedHat)?.emoji || '🎩'}
                                            </button>
                                        ) : (
                                            <span className={styles.emptySlot}>—</span>
                                        )}
                                    </div>
                                    <div className={styles.equippedSlot}>
                                        <span className={styles.slotLabel}>Accesorio</span>
                                        {pet.equippedAccessory ? (
                                            <button
                                                className={styles.equippedItem}
                                                onClick={() => handleEquipAccessory(pet.equippedAccessory!)}
                                            >
                                                {ACCESSORY_ITEMS.find((i) => i.id === pet.equippedAccessory)?.emoji || '✨'}
                                            </button>
                                        ) : (
                                            <span className={styles.emptySlot}>—</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Shop */}
                    <div className={styles.shopSection}>
                        <div className={`card ${styles.shopCard}`}>
                            <div className={styles.shopHeader}>
                                <h2 className={styles.shopTitle}>🏪 Tienda</h2>
                                <span className={styles.coinBalance}>💰 {currentMember.coins}</span>
                            </div>

                            {/* Shop Tabs */}
                            <div className={styles.shopTabs}>
                                {(['food', 'hats', 'accessories'] as ShopTab[]).map((tab) => (
                                    <button
                                        key={tab}
                                        className={`${styles.shopTab} ${shopTab === tab ? styles.shopTabActive : ''}`}
                                        onClick={() => setShopTab(tab)}
                                    >
                                        {tab === 'food' ? '🍖 Comida' : tab === 'hats' ? '🎩 Gorros' : '✨ Accesorios'}
                                    </button>
                                ))}
                            </div>

                            {/* Shop Items */}
                            <div className={styles.shopItems}>
                                {(shopTab === 'food' ? FOOD_ITEMS : shopTab === 'hats' ? hats : accessories).map((item) => {
                                    const owned =
                                        item.type === 'food'
                                            ? false
                                            : pet.ownedAccessories.includes(item.id);
                                    const equipped =
                                        pet.equippedHat === item.id || pet.equippedAccessory === item.id;
                                    const canAfford = currentMember.coins >= item.price;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`${styles.shopItem} ${buyAnim === item.id ? styles.buyAnimation : ''}`}
                                        >
                                            <span className={styles.itemEmoji}>{item.emoji}</span>
                                            <div className={styles.itemInfo}>
                                                <span className={styles.itemName}>{item.name}</span>
                                                {item.hungerRestore && (
                                                    <span className={styles.itemDetail}>
                                                        🍖+{item.hungerRestore} 😊+{item.happinessBoost}
                                                    </span>
                                                )}
                                                <span className={styles.itemPrice}>💰 {item.price}</span>
                                            </div>
                                            <div className={styles.itemActions}>
                                                {owned ? (
                                                    <button
                                                        className={`btn btn-sm ${equipped ? 'btn-primary' : 'btn-secondary'}`}
                                                        onClick={() =>
                                                            item.type === 'hat'
                                                                ? handleEquipHat(item.id)
                                                                : handleEquipAccessory(item.id)
                                                        }
                                                    >
                                                        {equipped ? '✓ Equipado' : 'Equipar'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        className={`btn btn-sm ${canAfford ? 'btn-success' : 'btn-secondary'}`}
                                                        onClick={() => handleBuy(item.id)}
                                                        disabled={!canAfford}
                                                    >
                                                        Comprar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

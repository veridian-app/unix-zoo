'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { ANIMAL_COLORS } from '@/data/teamMembers';
import PetAvatar from '@/components/pets/PetAvatar';
import styles from './page.module.css';

export default function LoginPage() {
  const currentUserId = useStore((s) => s.currentUserId);
  const members = useStore((s) => s.members);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const router = useRouter();

  // If already logged in, redirect
  React.useEffect(() => {
    if (currentUserId) {
      router.push('/dashboard');
    }
  }, [currentUserId, router]);

  const handleSelect = (userId: string) => {
    setCurrentUser(userId);
    router.push('/dashboard');
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.bgGlow} />
      <div className={styles.bgGlow2} />

      <div className={styles.loginContent}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🦁</span>
          <h1 className={styles.brandTitle}>Unix Zoo</h1>
          <p className={styles.brandSubtitle}>Gestión de Tareas & Mascotas</p>
        </div>

        <p className={styles.selectPrompt}>¿Quién eres?</p>

        <div className={styles.memberGrid}>
          {members.map((member) => {
            const colors = ANIMAL_COLORS[member.animal];
            return (
              <button
                key={member.id}
                className={styles.memberCard}
                onClick={() => handleSelect(member.id)}
                style={{
                  '--member-color': colors.primary,
                  '--member-light': colors.light,
                  '--member-dark': colors.dark,
                } as React.CSSProperties}
              >
                <div className={styles.memberPet}>
                  <PetAvatar
                    animal={member.animal}
                    size={80}
                    hunger={member.pet.hunger}
                    happiness={member.pet.happiness}
                    equippedHat={member.pet.equippedHat}
                    animate={true}
                  />
                </div>
                <span className={styles.memberName}>{member.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

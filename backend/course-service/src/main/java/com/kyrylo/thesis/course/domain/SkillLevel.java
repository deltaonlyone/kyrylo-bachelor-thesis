package com.kyrylo.thesis.course.domain;

/**
 * Рівень володіння навичкою.
 * Порядок елементів визначає ієрархію: TRAINEE < JUNIOR < MIDDLE < SENIOR.
 */
public enum SkillLevel {
    TRAINEE,
    JUNIOR,
    MIDDLE,
    SENIOR;

    /** Повертає {@code true}, якщо поточний рівень вищий за {@code other}. */
    public boolean isHigherThan(SkillLevel other) {
        return this.ordinal() > other.ordinal();
    }
}

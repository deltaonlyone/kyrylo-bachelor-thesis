package com.kyrylo.thesis.course.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Довідник навичок (технологій / компетенцій).
 * Наприклад: Java, React, AWS, System Design.
 */
@Entity
@Table(name = "skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Унікальна назва навички (напр. "Java", "React"). */
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    /** Категорія для групування (Backend, Frontend, Cloud тощо). */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SkillCategory category;
}

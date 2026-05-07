package com.kyrylo.thesis.course.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Зв'язок «курс → навичка + рівень».
 * Визначає, яку навичку і на якому рівні отримає працівник після успішного проходження курсу.
 */
@Entity
@Table(name = "course_skills", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"course_id", "skill_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    /** Рівень навички, який присвоюється після проходження курсу. */
    @Enumerated(EnumType.STRING)
    @Column(name = "skill_level", nullable = false, length = 32)
    private SkillLevel skillLevel;
}

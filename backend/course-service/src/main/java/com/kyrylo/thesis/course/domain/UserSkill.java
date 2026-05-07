package com.kyrylo.thesis.course.domain;

import java.time.Instant;

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
 * Набута навичка працівника.
 * Один працівник має один запис на навичку — рівень оновлюється тільки «вгору».
 */
@Entity
@Table(name = "user_skills", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "skill_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID працівника (з User Service). */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    /** Поточний рівень навички працівника. */
    @Enumerated(EnumType.STRING)
    @Column(name = "skill_level", nullable = false, length = 32)
    private SkillLevel skillLevel;

    /** Коли навичка була набута або оновлена. */
    @Column(name = "acquired_at", nullable = false)
    @Builder.Default
    private Instant acquiredAt = Instant.now();

    /** Курс, який присвоїв (або останнім оновив) цю навичку. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;
}

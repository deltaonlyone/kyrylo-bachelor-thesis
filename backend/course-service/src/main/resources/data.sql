-- ─────────────────────────────────────────────────────────────────
-- Тестові дані для course-service (H2 in-memory)
-- Виконується автоматично при старті через ddl-auto: update
-- ─────────────────────────────────────────────────────────────────

-- Курс 1: DevOps
INSERT INTO courses (id, organization_id, title, description, status)
VALUES (1, 1, 'DevOps для ІТ-команд', 'Практичний курс з CI/CD, Docker, Kubernetes та хмарних технологій для розробників і сисадмінів.', 'PUBLISHED');

-- Модуль 1
INSERT INTO course_modules (id, course_id, name, sort_order)
VALUES (1, 1, 'Вступ до DevOps', 1);

-- Уроки модуля 1
INSERT INTO lessons (id, module_id, title, content)
VALUES (1, 1, 'Що таке DevOps?',
'DevOps — це культура та набір практик, що об''єднують розробку (Dev) та операції (Ops) для скорочення циклу розробки.

Ключові принципи:
• Continuous Integration (CI) — автоматичне злиття коду
• Continuous Delivery (CD) — автоматичне розгортання
• Infrastructure as Code — конфігурація як код
• Моніторинг і зворотний зв''язок

Переваги DevOps: швидший вихід на ринок, менше багів, краща співпраця між командами.');

INSERT INTO lessons (id, module_id, title, content)
VALUES (2, 1, 'CI/CD пайплайни',
'CI/CD (Continuous Integration / Continuous Delivery) — ключова практика DevOps.

Типовий пайплайн:
1. Розробник пушить код у репозиторій
2. Тригер CI: автоматично запускаються тести
3. Build: збирається артефакт (JAR, Docker image)
4. Deploy: автоматичне розгортання на стейджинг
5. Після схвалення — продакшн

Популярні інструменти: GitHub Actions, GitLab CI, Jenkins, CircleCI.');

-- Модуль 2
INSERT INTO course_modules (id, course_id, name, sort_order)
VALUES (2, 1, 'Контейнеризація з Docker', 2);

INSERT INTO lessons (id, module_id, title, content)
VALUES (3, 2, 'Docker основи',
'Docker — платформа контейнеризації, що дозволяє пакувати застосунок разом із залежностями.

Основні концепції:
• Image — шаблон контейнера (read-only)
• Container — запущений екземпляр образу
• Dockerfile — інструкції для побудови образу
• Registry — сховище образів (Docker Hub, ECR)

Базові команди:
  docker build -t myapp:latest .
  docker run -p 8080:8080 myapp:latest
  docker-compose up -d');

INSERT INTO lessons (id, module_id, title, content)
VALUES (4, 2, 'Docker Compose та мережі',
'Docker Compose дозволяє описати мультиконтейнерні застосунки у YAML.

Приклад docker-compose.yml:
  services:
    backend:
      image: myapp:latest
      ports: ["8080:8080"]
      environment:
        - DB_URL=jdbc:postgresql://db:5432/mydb
    db:
      image: postgres:16
      environment:
        - POSTGRES_PASSWORD=secret

Мережі в Docker: bridge (за замовчуванням), host, overlay (для Swarm).');

-- ─── Квізи ──────────────────────────────────────────────────────

-- Квіз до уроку 1 (lesson_id=1)
INSERT INTO quizzes (id, lesson_id, title, passing_score)
VALUES (1, 1, 'Тест: Основи DevOps', 60);

-- Питання 1
INSERT INTO questions (id, quiz_id, text, sort_order, type)
VALUES (1, 1, 'Що означає абревіатура DevOps?', 1, 'SINGLE');

INSERT INTO answer_options (id, question_id, text, correct)
VALUES (1, 1, 'Development + Operations', true);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (2, 1, 'Design + Optimization', false);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (3, 1, 'Deployment + Orchestration', false);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (4, 1, 'Data + Operations', false);

-- Питання 2
INSERT INTO questions (id, quiz_id, text, sort_order, type)
VALUES (2, 1, 'Яка з практик відповідає за автоматичне розгортання коду?', 2, 'SINGLE');

INSERT INTO answer_options (id, question_id, text, correct)
VALUES (5, 2, 'Continuous Delivery (CD)', true);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (6, 2, 'Code Review', false);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (7, 2, 'Pair Programming', false);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (8, 2, 'Scrum Sprint', false);

-- Питання 3
INSERT INTO questions (id, quiz_id, text, sort_order, type)
VALUES (3, 1, 'Який інструмент НЕ є CI/CD платформою?', 3, 'SINGLE');

INSERT INTO answer_options (id, question_id, text, correct)
VALUES (9,  3, 'Figma', true);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (10, 3, 'GitHub Actions', false);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (11, 3, 'Jenkins', false);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (12, 3, 'GitLab CI', false);

-- Квіз до уроку 3 (lesson_id=3, Docker основи)
INSERT INTO quizzes (id, lesson_id, title, passing_score)
VALUES (2, 3, 'Тест: Docker основи', 70);

-- Питання 1
INSERT INTO questions (id, quiz_id, text, sort_order, type)
VALUES (4, 2, 'Що таке Docker Image?', 1, 'SINGLE');

INSERT INTO answer_options (id, question_id, text, correct)
VALUES (13, 4, 'Незмінний (read-only) шаблон для створення контейнерів', true);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (14, 4, 'Запущений екземпляр застосунку', false);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (15, 4, 'Файл конфігурації YAML', false);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (16, 4, 'Реєстр для зберігання логів', false);

-- Питання 2
INSERT INTO questions (id, quiz_id, text, sort_order, type)
VALUES (5, 2, 'Яка команда запустить контейнер і пробросить порт 8080?', 2, 'SINGLE');

INSERT INTO answer_options (id, question_id, text, correct)
VALUES (17, 5, 'docker run -p 8080:8080 myapp', true);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (18, 5, 'docker start --port 8080 myapp', false);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (19, 5, 'docker deploy -expose 8080 myapp', false);
INSERT INTO answer_options (id, question_id, text, correct)
VALUES (20, 5, 'docker exec -p 8080 myapp', false);

-- ─── Курс 2 ─────────────────────────────────────────────────────

INSERT INTO courses (id, organization_id, title, description, status)
VALUES (2, 1, 'Основи хмарних технологій (AWS/GCP)', 'Вступ до хмарних платформ: сервіси зберігання, обчислення та мережі для ІТ-спеціалістів.', 'PUBLISHED');

INSERT INTO course_modules (id, course_id, name, sort_order)
VALUES (3, 2, 'Хмарні провайдери', 1);

INSERT INTO lessons (id, module_id, title, content)
VALUES (5, 3, 'AWS vs GCP vs Azure',
'Три провідні хмарні платформи мають різні сильні сторони:

AWS (Amazon Web Services):
• Найбільший ринок (32%)
• Понад 200 сервісів
• EC2, S3, Lambda, RDS

GCP (Google Cloud Platform):
• Найсильніший у Big Data та ML
• BigQuery, Vertex AI, GKE
• Kubernetes-нативна платформа

Azure (Microsoft):
• Інтеграція з корпоративними продуктами Microsoft
• Active Directory, .NET ecosystem');

-- Курс 3 (DRAFT — не публікується)
INSERT INTO courses (id, organization_id, title, description, status)
VALUES (3, 1, 'Cybersecurity для розробників', 'Базові принципи безпеки: OWASP Top 10, аутентифікація, шифрування.', 'DRAFT');

-- Після явних id у INSERT лічильник IDENTITY в H2 лишається на 1 — наступні INSERT від Hibernate
-- отримують зіткнення PK. Синхронізуємо з max(id)+1 для кожної таблиці з сид-даними.
ALTER TABLE courses ALTER COLUMN id RESTART WITH 4;
ALTER TABLE course_modules ALTER COLUMN id RESTART WITH 4;
ALTER TABLE lessons ALTER COLUMN id RESTART WITH 6;
ALTER TABLE quizzes ALTER COLUMN id RESTART WITH 3;
ALTER TABLE questions ALTER COLUMN id RESTART WITH 6;
ALTER TABLE answer_options ALTER COLUMN id RESTART WITH 21;

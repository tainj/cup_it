-- Миграция: Создание схемы БД для MVP мобильного банковского приложения OTP Bank
-- Решение: Структура БД отражает концепцию "витрины по жизненным сценариям"
-- вместо стандартного каталога продуктов. Это позволяет персонализировать
-- отображение продуктов для каждого пользователя.

-- Пользователи банка
-- segment определяет тип клиента (mass, premium, vip) для таргетирования
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    segment    VARCHAR(50)  NOT NULL DEFAULT 'mass', -- mass | premium | vip
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Банковские продукты (кредиты, вклады, карты и т.д.)
CREATE TABLE IF NOT EXISTS products (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255)   NOT NULL,
    type          VARCHAR(100)   NOT NULL, -- credit | deposit | card | insurance | mortgage
    description   TEXT           NOT NULL DEFAULT '',
    interest_rate NUMERIC(5, 2)  NOT NULL DEFAULT 0.00, -- % годовых
    min_amount    NUMERIC(15, 2) NOT NULL DEFAULT 0.00  -- минимальная сумма в рублях
);

-- Жизненные сценарии — ключевая сущность новой витрины.
-- Вместо «Кредиты» / «Вклады» пользователь видит «Путешествия» / «Дом» / «Ежедневное».
-- Это снижает когнитивную нагрузку и упрощает навигацию.
CREATE TABLE IF NOT EXISTS scenarios (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL, -- "Путешествия", "Дом", "Ежедневное"
    description TEXT         NOT NULL DEFAULT '',
    icon        VARCHAR(50)  NOT NULL DEFAULT 'star' -- иконка для UI
);

-- Привязка сценариев к пользователю с приоритетом.
-- Ключевой механизм персонализации: у каждого пользователя свой порядок сценариев.
-- priority = 1 означает, что сценарий показывается первым на витрине.
CREATE TABLE IF NOT EXISTS user_scenarios (
    user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    scenario_id INTEGER NOT NULL REFERENCES scenarios (id) ON DELETE CASCADE,
    priority    INTEGER NOT NULL DEFAULT 100,
    PRIMARY KEY (user_id, scenario_id)
);

-- Маппинг: какие продукты входят в какой сценарий.
-- Один продукт может относиться к нескольким сценариям (например, кредитная карта — к «Путешествиям» и «Ежедневному»).
CREATE TABLE IF NOT EXISTS product_scenario_map (
    product_id  INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    scenario_id INTEGER NOT NULL REFERENCES scenarios (id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, scenario_id)
);

-- Таблица аналитических событий — основа для бизнес-метрик.
-- Трекинг кликов и конверсий позволяет измерить CTR (click-through rate)
-- и conversion rate для каждого продукта и сценария.
-- event_type: 'view' | 'click' | 'apply' | 'purchase'
CREATE TABLE IF NOT EXISTS analytics_events (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    product_id INTEGER REFERENCES products (id) ON DELETE SET NULL,
    timestamp  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Индексы для ускорения аналитических запросов
CREATE INDEX IF NOT EXISTS idx_analytics_user_id    ON analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp  ON analytics_events (timestamp);

-- ============================================================
-- SEED DATA — тестовые данные для демонстрации MVP
-- ============================================================

-- Жизненные сценарии
INSERT INTO scenarios (name, description, icon) VALUES
    ('Путешествия',  'Продукты для комфортных поездок и отдыха', 'plane'),
    ('Дом',          'Ипотека, ремонт и обустройство жилья',      'home'),
    ('Ежедневное',   'Карты и сервисы для повседневных трат',     'wallet'),
    ('Накопления',   'Вклады и инвестиции для будущего',          'piggy-bank'),
    ('Авто',         'Кредиты и страховки для автовладельцев',    'car')
ON CONFLICT DO NOTHING;

-- Банковские продукты
INSERT INTO products (name, type, description, interest_rate, min_amount) VALUES
    ('Карта Travel Black',     'card',      'Кешбэк 5% на авиабилеты и отели, бесплатный приоритетный доступ в залы ожидания', 0.00,    0.00),
    ('Страховка для путешествий', 'insurance', 'Полное покрытие медицинских расходов за рубежом до 1 000 000 руб.',              0.00,    0.00),
    ('Ипотека «Новостройка»',  'mortgage',  'Ставка от 8.5% на покупку квартиры в новостройке с господдержкой',                 8.50,   500000.00),
    ('Кредит на ремонт',       'credit',    'Кредит без залога на ремонт квартиры. Решение за 5 минут.',                        14.90,  100000.00),
    ('Дебетовая карта «Прайм»','card',      'Кешбэк 2% на всё, 5% на АЗС и кафе. Бесплатное обслуживание навсегда.',           0.00,    0.00),
    ('Карта рассрочки «0-0-24»','card',     'Покупки в рассрочку на 24 месяца без переплат в 1000+ магазинах-партнёрах',        0.00,    0.00),
    ('Вклад «Максимум»',       'deposit',   'Максимальная ставка 16% годовых при размещении на 12 месяцев',                     16.00,  50000.00),
    ('ИИС «Старт»',            'deposit',   'Индивидуальный инвестиционный счёт с налоговым вычетом до 52 000 руб./год',         0.00,   10000.00),
    ('Автокредит «Выгодный»',  'credit',    'Новый или подержанный автомобиль. Ставка от 10.9%, срок до 7 лет.',                10.90,  300000.00),
    ('КАСКО онлайн',           'insurance', 'Страховка КАСКО с оформлением за 10 минут и скидкой до 30%',                       0.00,    0.00)
ON CONFLICT DO NOTHING;

-- Маппинг продуктов по сценариям
INSERT INTO product_scenario_map (product_id, scenario_id)
SELECT p.id, s.id FROM products p, scenarios s WHERE
    (p.name = 'Карта Travel Black'        AND s.name = 'Путешествия') OR
    (p.name = 'Страховка для путешествий' AND s.name = 'Путешествия') OR
    (p.name = 'Ипотека «Новостройка»'     AND s.name = 'Дом')         OR
    (p.name = 'Кредит на ремонт'          AND s.name = 'Дом')         OR
    (p.name = 'Дебетовая карта «Прайм»'   AND s.name = 'Ежедневное')  OR
    (p.name = 'Карта рассрочки «0-0-24»'  AND s.name = 'Ежедневное')  OR
    (p.name = 'Вклад «Максимум»'          AND s.name = 'Накопления')   OR
    (p.name = 'ИИС «Старт»'              AND s.name = 'Накопления')   OR
    (p.name = 'Автокредит «Выгодный»'     AND s.name = 'Авто')         OR
    (p.name = 'КАСКО онлайн'              AND s.name = 'Авто')         OR
    -- Карта «Прайм» также полезна в путешествиях
    (p.name = 'Дебетовая карта «Прайм»'   AND s.name = 'Путешествия')
ON CONFLICT DO NOTHING;

-- Тестовые пользователи с разными сегментами
INSERT INTO users (name, segment) VALUES
    ('Алексей Смирнов', 'premium'),
    ('Мария Иванова',   'mass'),
    ('Дмитрий Козлов',  'vip')
ON CONFLICT DO NOTHING;

-- Персонализированные сценарии для пользователей
-- Алексей (premium) — любит путешествовать и копить
INSERT INTO user_scenarios (user_id, scenario_id, priority)
SELECT u.id, s.id,
    CASE s.name
        WHEN 'Путешествия' THEN 1
        WHEN 'Накопления'  THEN 2
        WHEN 'Ежедневное'  THEN 3
    END
FROM users u, scenarios s
WHERE u.name = 'Алексей Смирнов'
  AND s.name IN ('Путешествия', 'Накопления', 'Ежедневное')
ON CONFLICT DO NOTHING;

-- Мария (mass) — фокус на ежедневном и доме
INSERT INTO user_scenarios (user_id, scenario_id, priority)
SELECT u.id, s.id,
    CASE s.name
        WHEN 'Ежедневное'  THEN 1
        WHEN 'Дом'         THEN 2
        WHEN 'Накопления'  THEN 3
    END
FROM users u, scenarios s
WHERE u.name = 'Мария Иванова'
  AND s.name IN ('Ежедневное', 'Дом', 'Накопления')
ON CONFLICT DO NOTHING;

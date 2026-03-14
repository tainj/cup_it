// Пакет models содержит GORM-модели, отражающие схему БД.
// Модели спроектированы вокруг концепции "жизненных сценариев":
// пользователь видит продукты не в виде каталога, а сгруппированными
// по смысловым контекстам (Путешествия, Дом, Ежедневное и т.д.).
package models

import "time"

// User — клиент банка.
// Поле Segment используется для таргетирования рекомендаций:
// premium/vip клиенты получают специальные предложения.
type User struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"size:255;not null"        json:"name"`
	Segment   string    `gorm:"size:50;not null;default:'mass'" json:"segment"` // mass | premium | vip
	CreatedAt time.Time `gorm:"autoCreateTime"           json:"created_at"`
}

// Product — банковский продукт (кредит, вклад, карта).
// Продукты не имеют категорий сами по себе — они привязываются к сценариям
// через таблицу product_scenario_map. Один продукт может быть в нескольких сценариях.
type Product struct {
	ID           uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string  `gorm:"size:255;not null"        json:"name"`
	Type         string  `gorm:"size:100;not null"        json:"type"` // credit | deposit | card | insurance | mortgage
	Description  string  `gorm:"type:text"                json:"description"`
	InterestRate float64 `gorm:"type:numeric(5,2)"        json:"interest_rate"`
	MinAmount    float64 `gorm:"type:numeric(15,2)"       json:"min_amount"`
}

// Scenario — жизненный сценарий пользователя.
// Ключевая сущность новой витрины: вместо каталога продуктов ("Кредиты", "Вклады")
// пользователь видит сценарии ("Путешествия", "Дом"), что снижает когнитивную нагрузку
// и упрощает принятие решения о выборе продукта.
type Scenario struct {
	ID          uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string `gorm:"size:255;not null"        json:"name"`
	Description string `gorm:"type:text"                json:"description"`
	Icon        string `gorm:"size:50;default:'star'"   json:"icon"`
}

// UserScenario — привязка сценария к конкретному пользователю с приоритетом.
// Priority определяет порядок отображения сценариев на витрине.
// Это и есть механизм персонализации: у каждого клиента свой порядок блоков.
type UserScenario struct {
	UserID     uint `gorm:"primaryKey;not null" json:"user_id"`
	ScenarioID uint `gorm:"primaryKey;not null" json:"scenario_id"`
	Priority   int  `gorm:"not null;default:100" json:"priority"`
}

// ProductScenarioMap — связь многие-ко-многим между продуктами и сценариями.
// Позволяет одному продукту появляться в нескольких контекстах витрины.
type ProductScenarioMap struct {
	ProductID  uint `gorm:"primaryKey;not null" json:"product_id"`
	ScenarioID uint `gorm:"primaryKey;not null" json:"scenario_id"`
}

// AnalyticsEvent — событие взаимодействия пользователя с продуктом.
// Трекинг событий (просмотр, клик, заявка) позволяет вычислять
// бизнес-метрики: CTR = клики/показы, Conversion Rate = заявки/клики.
// Это делает витрину измеримой и позволяет A/B тестировать сценарии.
type AnalyticsEvent struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint      `gorm:"not null;index"           json:"user_id"`
	EventType string    `gorm:"size:50;not null;index"   json:"event_type"` // view | click | apply | purchase
	ProductID *uint     `gorm:"index"                    json:"product_id,omitempty"`
	Timestamp time.Time `gorm:"autoCreateTime;index"     json:"timestamp"`
}

// TableName задаёт имя таблицы в БД (snake_case, множественное число)
func (UserScenario) TableName() string     { return "user_scenarios" }
func (ProductScenarioMap) TableName() string { return "product_scenario_map" }
func (AnalyticsEvent) TableName() string   { return "analytics_events" }

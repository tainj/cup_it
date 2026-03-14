// Пакет repository реализует слой доступа к данным (Data Access Layer).
// Изолирует SQL-запросы от бизнес-логики, что соответствует принципу
// Clean Architecture: usecase-слой не зависит от конкретной СУБД.
package repository

import (
	"cup_it/backend/internal/models"

	"gorm.io/gorm"
)

// ShowcaseRepository — интерфейс для работы с витриной продуктов.
type ShowcaseRepository interface {
	GetUserByID(userID uint) (*models.User, error)
	GetUserScenarios(userID uint) ([]models.UserScenario, error)
	GetScenarioByID(scenarioID uint) (*models.Scenario, error)
	GetDefaultScenarios() ([]models.Scenario, error)
	GetProductsByScenario(scenarioID uint) ([]models.Product, error)
	SaveAnalyticsEvent(event *models.AnalyticsEvent) error
	GetAnalyticsMetrics() (*MetricsSummary, error)
}

// MetricsSummary — агрегированные метрики для бизнес-дашборда.
// CTR = clicks / views, ConversionRate = applies / clicks
type MetricsSummary struct {
	TotalViews       int64              `json:"total_views"`
	TotalClicks      int64              `json:"total_clicks"`
	TotalApplies     int64              `json:"total_applies"`
	CTR              float64            `json:"ctr"`
	ConversionRate   float64            `json:"conversion_rate"`
	TopProducts      []ProductClickStat `json:"top_products"`
}

// ProductClickStat — статистика кликов по конкретному продукту.
type ProductClickStat struct {
	ProductID   uint   `json:"product_id"`
	ProductName string `json:"product_name"`
	Clicks      int64  `json:"clicks"`
}

// postgresRepository — конкретная реализация для PostgreSQL через GORM.
type postgresRepository struct {
	db *gorm.DB
}

// NewRepository создаёт новый экземпляр репозитория.
func NewRepository(db *gorm.DB) ShowcaseRepository {
	return &postgresRepository{db: db}
}

// GetUserByID возвращает пользователя по ID.
func (r *postgresRepository) GetUserByID(userID uint) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserScenarios возвращает сценарии пользователя, отсортированные по приоритету.
// Именно здесь реализуется персонализация витрины: каждый пользователь
// видит блоки в своём индивидуальном порядке.
func (r *postgresRepository) GetUserScenarios(userID uint) ([]models.UserScenario, error) {
	var userScenarios []models.UserScenario
	if err := r.db.Where("user_id = ?", userID).
		Order("priority ASC").
		Find(&userScenarios).Error; err != nil {
		return nil, err
	}
	return userScenarios, nil
}

// GetScenarioByID возвращает сценарий по ID.
func (r *postgresRepository) GetScenarioByID(scenarioID uint) (*models.Scenario, error) {
	var scenario models.Scenario
	if err := r.db.First(&scenario, scenarioID).Error; err != nil {
		return nil, err
	}
	return &scenario, nil
}

// GetDefaultScenarios возвращает базовый набор сценариев для новых пользователей.
// Если у пользователя нет персонализированных сценариев, показываем первые 3 —
// это «Популярное» по умолчанию. Предотвращает пустую витрину при первом входе.
func (r *postgresRepository) GetDefaultScenarios() ([]models.Scenario, error) {
	var scenarios []models.Scenario
	if err := r.db.Limit(3).Find(&scenarios).Error; err != nil {
		return nil, err
	}
	return scenarios, nil
}

// GetProductsByScenario возвращает продукты, привязанные к сценарию.
// JOIN через product_scenario_map позволяет одному продукту входить в несколько сценариев.
func (r *postgresRepository) GetProductsByScenario(scenarioID uint) ([]models.Product, error) {
	var products []models.Product
	if err := r.db.
		Joins("JOIN product_scenario_map psm ON psm.product_id = products.id").
		Where("psm.scenario_id = ?", scenarioID).
		Find(&products).Error; err != nil {
		return nil, err
	}
	return products, nil
}

// SaveAnalyticsEvent сохраняет событие аналитики в БД.
func (r *postgresRepository) SaveAnalyticsEvent(event *models.AnalyticsEvent) error {
	return r.db.Create(event).Error
}

// GetAnalyticsMetrics вычисляет агрегированные метрики из таблицы analytics_events.
// Эти данные используются бизнес-командой для оценки эффективности витрины:
// какие продукты и сценарии работают лучше всего.
func (r *postgresRepository) GetAnalyticsMetrics() (*MetricsSummary, error) {
	var views, clicks, applies int64

	r.db.Model(&models.AnalyticsEvent{}).Where("event_type = 'view'").Count(&views)
	r.db.Model(&models.AnalyticsEvent{}).Where("event_type = 'click'").Count(&clicks)
	r.db.Model(&models.AnalyticsEvent{}).Where("event_type = 'apply'").Count(&applies)

	// Вычисляем CTR и Conversion Rate
	ctr := 0.0
	if views > 0 {
		ctr = float64(clicks) / float64(views) * 100
	}
	convRate := 0.0
	if clicks > 0 {
		convRate = float64(applies) / float64(clicks) * 100
	}

	// Топ продуктов по кликам (для приоритизации на витрине)
	type result struct {
		ProductID   uint
		ProductName string
		Clicks      int64
	}
	var topResults []result
	r.db.Table("analytics_events ae").
		Select("ae.product_id, p.name as product_name, COUNT(*) as clicks").
		Joins("JOIN products p ON p.id = ae.product_id").
		Where("ae.event_type = 'click' AND ae.product_id IS NOT NULL").
		Group("ae.product_id, p.name").
		Order("clicks DESC").
		Limit(5).
		Scan(&topResults)

	topProducts := make([]ProductClickStat, 0, len(topResults))
	for _, r := range topResults {
		topProducts = append(topProducts, ProductClickStat{
			ProductID:   r.ProductID,
			ProductName: r.ProductName,
			Clicks:      r.Clicks,
		})
	}

	return &MetricsSummary{
		TotalViews:     views,
		TotalClicks:    clicks,
		TotalApplies:   applies,
		CTR:            ctr,
		ConversionRate: convRate,
		TopProducts:    topProducts,
	}, nil
}

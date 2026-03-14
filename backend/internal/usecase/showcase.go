// Пакет usecase реализует бизнес-логику витрины продуктов.
// Этот слой оркестрирует репозитории и формирует финальный ответ для клиента.
// Разделение на usecase и repository позволяет тестировать бизнес-логику
// без реального подключения к БД (через mock-объекты).
package usecase

import (
	"cup_it/backend/internal/models"
	"cup_it/backend/internal/repository"
)

// ShowcaseBlock — блок витрины: сценарий + список продуктов.
// Структура ответа API спроектирована под компонентный рендеринг на фронтенде:
// каждый блок = одна горизонтальная секция в интерфейсе.
type ShowcaseBlock struct {
	ScenarioID   uint             `json:"scenario_id"`
	ScenarioName string           `json:"scenario_name"`
	Description  string           `json:"description"`
	Icon         string           `json:"icon"`
	Products     []models.Product `json:"products"`
}

// ShowcaseResponse — полный ответ витрины для конкретного пользователя.
type ShowcaseResponse struct {
	UserID    uint            `json:"user_id"`
	UserName  string          `json:"user_name"`
	Segment   string          `json:"segment"`
	Blocks    []ShowcaseBlock `json:"blocks"`
	IsDefault bool            `json:"is_default"` // true = показываем дефолтные сценарии
}

// ShowcaseUseCase — интерфейс бизнес-логики витрины.
type ShowcaseUseCase interface {
	GetShowcase(userID uint) (*ShowcaseResponse, error)
}

// showcaseUseCase — конкретная реализация бизнес-логики.
type showcaseUseCase struct {
	repo repository.ShowcaseRepository
}

// NewShowcaseUseCase создаёт новый экземпляр usecase.
func NewShowcaseUseCase(repo repository.ShowcaseRepository) ShowcaseUseCase {
	return &showcaseUseCase{repo: repo}
}

// GetShowcase — главная бизнес-логика витрины.
// Алгоритм персонализации:
// 1. Получаем пользователя и его сегмент.
// 2. Ищем персонализированные сценарии (по приоритету).
// 3. Если сценариев нет — возвращаем дефолтные (Популярное).
// 4. Для каждого сценария загружаем привязанные продукты.
// Результат: витрина, сгруппированная по жизненным ситуациям пользователя.
func (u *showcaseUseCase) GetShowcase(userID uint) (*ShowcaseResponse, error) {
	// Шаг 1: Загружаем данные пользователя
	user, err := u.repo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	// Шаг 2: Пытаемся получить персонализированные сценарии
	userScenarios, err := u.repo.GetUserScenarios(userID)
	if err != nil {
		return nil, err
	}

	isDefault := false
	var blocks []ShowcaseBlock

	if len(userScenarios) == 0 {
		// Шаг 3: Пользователь новый — показываем дефолтные сценарии
		// Бизнес-логика: новый клиент не должен видеть пустую витрину.
		// Показываем «Популярное» как стартовую точку.
		isDefault = true
		defaultScenarios, err := u.repo.GetDefaultScenarios()
		if err != nil {
			return nil, err
		}
		for _, scenario := range defaultScenarios {
			block, err := u.buildBlock(scenario)
			if err != nil {
				continue
			}
			blocks = append(blocks, block)
		}
	} else {
		// Шаг 4: Строим блоки по персонализированным сценариям
		for _, us := range userScenarios {
			scenario, err := u.repo.GetScenarioByID(us.ScenarioID)
			if err != nil {
				continue
			}
			block, err := u.buildBlock(*scenario)
			if err != nil {
				continue
			}
			blocks = append(blocks, block)
		}
	}

	return &ShowcaseResponse{
		UserID:    user.ID,
		UserName:  user.Name,
		Segment:   user.Segment,
		Blocks:    blocks,
		IsDefault: isDefault,
	}, nil
}

// buildBlock формирует один блок витрины: сценарий + продукты.
func (u *showcaseUseCase) buildBlock(scenario models.Scenario) (ShowcaseBlock, error) {
	products, err := u.repo.GetProductsByScenario(scenario.ID)
	if err != nil {
		return ShowcaseBlock{}, err
	}

	return ShowcaseBlock{
		ScenarioID:   scenario.ID,
		ScenarioName: scenario.Name,
		Description:  scenario.Description,
		Icon:         scenario.Icon,
		Products:     products,
	}, nil
}

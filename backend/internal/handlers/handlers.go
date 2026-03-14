// Пакет handlers содержит HTTP-обработчики (контроллеры) для всех эндпоинтов.
// Handlers отвечают только за разбор HTTP-запроса и формирование ответа.
// Бизнес-логика вынесена в usecase-слой согласно Clean Architecture.
package handlers

import (
	"net/http"
	"time"

	"cup_it/backend/internal/middleware"
	"cup_it/backend/internal/models"
	"cup_it/backend/internal/repository"
	"cup_it/backend/internal/usecase"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Handler — главная структура, содержащая все зависимости для обработчиков.
type Handler struct {
	showcaseUC usecase.ShowcaseUseCase
	repo       repository.ShowcaseRepository
	jwtSecret  string
}

// NewHandler создаёт новый Handler с внедрёнными зависимостями.
func NewHandler(uc usecase.ShowcaseUseCase, repo repository.ShowcaseRepository, jwtSecret string) *Handler {
	return &Handler{
		showcaseUC: uc,
		repo:       repo,
		jwtSecret:  jwtSecret,
	}
}

// loginRequest — тело запроса для авторизации.
type loginRequest struct {
	UserID uint `json:"user_id" binding:"required"`
}

// Login обрабатывает POST /api/auth/login.
// Mock-авторизация: принимает user_id и возвращает JWT.
// В реальном банковском приложении здесь был бы OAuth2 / биометрия,
// но для MVP достаточно простой демонстрации потока авторизации.
func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "укажите user_id в теле запроса"})
		return
	}

	// Проверяем, что пользователь существует в БД
	user, err := h.repo.GetUserByID(req.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "пользователь не найден"})
		return
	}

	// Создаём JWT-токен с данными пользователя
	claims := &middleware.JWTClaims{
		UserID:  user.ID,
		Segment: user.Segment,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка генерации токена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":   tokenString,
		"user_id": user.ID,
		"name":    user.Name,
		"segment": user.Segment,
	})
}

// GetShowcase обрабатывает GET /api/v1/showcase.
// Возвращает персонализированную витрину продуктов для текущего пользователя.
// Это главный эндпоинт приложения — он реализует концепцию "витрины по сценариям".
func (h *Handler) GetShowcase(c *gin.Context) {
	// Получаем ID пользователя из JWT (установлен middleware)
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "не авторизован"})
		return
	}
	userID, ok := userIDRaw.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "некорректный user_id в токене"})
		return
	}

	// Вызываем usecase для формирования витрины
	showcase, err := h.showcaseUC.GetShowcase(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка загрузки витрины"})
		return
	}

	c.JSON(http.StatusOK, showcase)
}

// analyticsEventRequest — тело запроса для трекинга события.
type analyticsEventRequest struct {
	EventType string `json:"event_type" binding:"required"` // view | click | apply | purchase
	ProductID *uint  `json:"product_id"`
}

// PostAnalyticsEvent обрабатывает POST /api/v1/analytics/event.
// Сохраняет событие пользователя для последующего анализа.
// Именно через эти события бизнес-команда измеряет:
// - какие продукты чаще просматривают (CTR)
// - какие продукты чаще оформляют (Conversion Rate)
func (h *Handler) PostAnalyticsEvent(c *gin.Context) {
	userIDRaw, _ := c.Get("user_id")
	userID, ok := userIDRaw.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "не авторизован"})
		return
	}

	var req analyticsEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "некорректные данные события"})
		return
	}

	// Валидация типа события
	validTypes := map[string]bool{"view": true, "click": true, "apply": true, "purchase": true}
	if !validTypes[req.EventType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "недопустимый тип события. Используйте: view, click, apply, purchase"})
		return
	}

	event := &models.AnalyticsEvent{
		UserID:    userID,
		EventType: req.EventType,
		ProductID: req.ProductID,
		Timestamp: time.Now(),
	}

	if err := h.repo.SaveAnalyticsEvent(event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка сохранения события"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "ok", "event_id": event.ID})
}

// GetAdminMetrics обрабатывает GET /api/v1/admin/metrics.
// Возвращает агрегированные бизнес-метрики для дашборда аналитики.
// Это ключевой инструмент для измерения эффективности витрины:
// CTR показывает привлекательность продуктов, CR — их конвертируемость.
func (h *Handler) GetAdminMetrics(c *gin.Context) {
	metrics, err := h.repo.GetAnalyticsMetrics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка загрузки метрик"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"metrics":      metrics,
		"generated_at": time.Now(),
		"description": gin.H{
			"ctr":             "Click-Through Rate: процент пользователей, кликнувших на продукт",
			"conversion_rate": "Conversion Rate: процент пользователей, подавших заявку после клика",
		},
	})
}

// GetUsers обрабатывает GET /api/v1/users — вспомогательный эндпоинт для демо.
func (h *Handler) GetUsers(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"users": []gin.H{
			{"id": 1, "name": "Алексей Смирнов", "segment": "premium"},
			{"id": 2, "name": "Мария Иванова", "segment": "mass"},
			{"id": 3, "name": "Дмитрий Козлов", "segment": "vip"},
		},
	})
}

// Главный файл приложения — точка входа сервера.
// Инициализирует все зависимости согласно принципу Dependency Injection:
// конфиг → БД → репозиторий → usecase → handler → роутер.
package main

import (
	"fmt"
	"log"
	"os"

	"cup_it/backend/internal/config"
	"cup_it/backend/internal/handlers"
	"cup_it/backend/internal/middleware"
	"cup_it/backend/internal/models"
	"cup_it/backend/internal/repository"
	"cup_it/backend/internal/usecase"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	// Загружаем конфигурацию из .env / переменных окружения
	cfg := config.Load()

	// Подключаемся к PostgreSQL через GORM
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Europe/Moscow",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Ошибка подключения к БД: %v", err)
	}

	// AutoMigrate создаёт/обновляет таблицы на основе моделей.
	// В продакшн-среде следует использовать явные SQL-миграции (migrations/).
	if err := db.AutoMigrate(
		&models.User{},
		&models.Product{},
		&models.Scenario{},
		&models.UserScenario{},
		&models.ProductScenarioMap{},
		&models.AnalyticsEvent{},
	); err != nil {
		log.Fatalf("Ошибка миграции: %v", err)
	}

	log.Println("БД успешно инициализирована")

	// Инициализируем слои архитектуры (Dependency Injection)
	repo := repository.NewRepository(db)
	showcaseUC := usecase.NewShowcaseUseCase(repo)
	h := handlers.NewHandler(showcaseUC, repo, cfg.JWTSecret)

	// Настраиваем роутер Gin
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// CORS — разрешаем запросы с фронтенд-приложения
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// ─── Публичные маршруты (без авторизации) ───────────────────────
	api := router.Group("/api")
	{
		// Mock-авторизация: принимает user_id, возвращает JWT
		api.POST("/auth/login", h.Login)

		// Список тестовых пользователей для демо
		api.GET("/users", h.GetUsers)
	}

	// ─── Защищённые маршруты (требуют JWT) ──────────────────────────
	v1 := router.Group("/api/v1")
	v1.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		// Главный эндпоинт: персонализированная витрина продуктов
		v1.GET("/showcase", h.GetShowcase)

		// Трекинг событий для аналитики (CTR, Conversion Rate)
		v1.POST("/analytics/event", h.PostAnalyticsEvent)

		// Административные метрики (в продакшн — дополнительная роль admin)
		v1.GET("/admin/metrics", h.GetAdminMetrics)
	}

	// Запускаем сервер
	addr := ":" + cfg.ServerPort
	log.Printf("Сервер запущен на %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}

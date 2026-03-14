// Пакет config отвечает за загрузку конфигурации приложения из переменных окружения.
// Использование .env файла позволяет безопасно хранить секреты (пароли БД, JWT-ключ)
// вне кодовой базы — важное требование безопасности для банковского ПО.
package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config хранит все параметры конфигурации приложения.
type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
	ServerPort string
}

// Load загружает конфигурацию из .env файла и переменных окружения.
// Переменные окружения имеют приоритет над .env (стандартная практика для Docker/Kubernetes).
func Load() *Config {
	// Пробуем загрузить .env файл (если не в продакшн-окружении)
	if err := godotenv.Load(); err != nil {
		log.Println("Файл .env не найден, используем переменные окружения")
	}

	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "cup_it"),
		JWTSecret:  getEnv("JWT_SECRET", "change-me-in-production"),
		ServerPort: getEnv("SERVER_PORT", "8080"),
	}
}

// getEnv возвращает значение переменной окружения или дефолтное значение.
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

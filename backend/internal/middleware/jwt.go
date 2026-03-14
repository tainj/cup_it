// Пакет middleware реализует промежуточные обработчики HTTP.
// JWT-аутентификация — стандарт для банковских API: токен содержит
// идентификатор пользователя и не требует хранения состояния на сервере.
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims — структура данных внутри JWT-токена.
type JWTClaims struct {
	UserID  uint   `json:"user_id"`
	Segment string `json:"segment"`
	jwt.RegisteredClaims
}

// AuthMiddleware проверяет JWT-токен в заголовке Authorization.
// Токен передаётся в формате: Authorization: Bearer <token>
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "отсутствует токен авторизации"})
			c.Abort()
			return
		}

		// Извлекаем токен из заголовка "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "неверный формат токена"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims := &JWTClaims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			// Проверяем алгоритм подписи — защита от алгоритмической атаки
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "недействительный токен"})
			c.Abort()
			return
		}

		// Передаём данные пользователя в контекст запроса
		c.Set("user_id", claims.UserID)
		c.Set("segment", claims.Segment)
		c.Next()
	}
}

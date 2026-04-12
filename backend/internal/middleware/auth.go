package middleware

import (
	"context"
	"net/http"
	"strings"
	"zomato-assignment/internal/auth"
	"zomato-assignment/internal/response"

	"github.com/google/uuid"
)

type contextKey string

const (
	UserIDKey contextKey = "user_id"
	EmailKey  contextKey = "email"
)

// AuthMiddleware verifies the JWT token and adds the user ID to the context.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			response.ErrorJSON(w, http.StatusUnauthorized, "authorization header is required", nil)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.ErrorJSON(w, http.StatusUnauthorized, "invalid authorization header format", nil)
			return
		}

		tokenString := parts[1]
		// Robustness: Strip accidental brackets or whitespace often added in Postman/docs
		tokenString = strings.Trim(tokenString, "<> ")

		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			response.ErrorJSON(w, http.StatusUnauthorized, "invalid or expired token", nil)
			return
		}

		// Add UserID and Email to context
		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, EmailKey, claims.Email)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserIDFromContext retrieves the user ID from the request context.
func GetUserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	userID, ok := ctx.Value(UserIDKey).(uuid.UUID)
	return userID, ok
}

// GetEmailFromContext retrieves the email from the request context.
func GetEmailFromContext(ctx context.Context) (string, bool) {
	email, ok := ctx.Value(EmailKey).(string)
	return email, ok
}

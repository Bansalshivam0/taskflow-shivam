package handlers

import (
	"encoding/json"
	"net/http"
	"zomato-assignment/internal/middleware"
	"zomato-assignment/internal/response"
	"zomato-assignment/internal/services"
)

type AuthHandler struct {
	service *services.AuthService
}

func NewAuthHandler(service *services.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	User    interface{} `json:"user"`
	Token   string      `json:"token"`
	Message string      `json:"message"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	fields := make(map[string]string)
	if req.Name == "" {
		fields["name"] = "is required"
	}
	if req.Email == "" {
		fields["email"] = "is required"
	}
	if req.Password == "" {
		fields["password"] = "is required"
	}

	if len(fields) > 0 {
		response.ErrorJSON(w, http.StatusBadRequest, "validation failed", fields)
		return
	}

	user, token, err := h.service.Register(req.Name, req.Email, req.Password)
	if err != nil {
		response.ErrorJSON(w, http.StatusConflict, err.Error(), nil)
		return
	}

	response.JSONResponse(w, http.StatusCreated, AuthResponse{
		Message: "User registered successfully",
		User:    user,
		Token:   token,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	fields := make(map[string]string)
	if req.Email == "" {
		fields["email"] = "is required"
	}
	if req.Password == "" {
		fields["password"] = "is required"
	}

	if len(fields) > 0 {
		response.ErrorJSON(w, http.StatusBadRequest, "validation failed", fields)
		return
	}

	user, token, err := h.service.Login(req.Email, req.Password)
	if err != nil {
		response.ErrorJSON(w, http.StatusUnauthorized, "invalid credentials", nil)
		return
	}

	response.JSONResponse(w, http.StatusOK, AuthResponse{
		Message: "User logged in successfully",
		User:    user,
		Token:   token,
	})
}

func (h *AuthHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.service.GetAllUsers()
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSONResponse(w, http.StatusOK, users)
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

func (h *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.ErrorJSON(w, http.StatusUnauthorized, "unauthorized", nil)
		return
	}

	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "Invalid request payload", nil)
		return
	}

	fields := make(map[string]string)
	if req.CurrentPassword == "" {
		fields["currentPassword"] = "is required"
	}
	if req.NewPassword == "" {
		fields["newPassword"] = "is required"
	}

	if len(fields) > 0 {
		response.ErrorJSON(w, http.StatusBadRequest, "validation failed", fields)
		return
	}

	err := h.service.ChangePassword(userID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		if err.Error() == "incorrect current password" {
			response.ErrorJSON(w, http.StatusUnauthorized, err.Error(), nil)
		} else {
			response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		}
		return
	}

	response.JSONResponse(w, http.StatusOK, map[string]string{
		"message": "Password changed successfully",
	})
}

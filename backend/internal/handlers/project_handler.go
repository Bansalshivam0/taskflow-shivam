package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"zomato-assignment/internal/middleware"
	"zomato-assignment/internal/request"
	"zomato-assignment/internal/response"
	"zomato-assignment/internal/services"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProjectHandler struct {
	service services.ProjectService
}

func NewProjectHandler(service services.ProjectService) *ProjectHandler {
	return &ProjectHandler{service: service}
}

type CreateUpdateProjectRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *ProjectHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateUpdateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid request body", nil)
		return
	}

	if req.Name == "" {
		response.ErrorJSON(w, http.StatusBadRequest, "validation failed", map[string]string{"name": "is required"})
		return
	}

	userEmail, ok := middleware.GetEmailFromContext(r.Context())
	if !ok {
		response.ErrorJSON(w, http.StatusUnauthorized, "unauthenticated", nil)
		return
	}

	project, err := h.service.CreateProject(req.Name, req.Description, userEmail)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSONResponse(w, http.StatusCreated, project)
}

func (h *ProjectHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	userEmail, ok2 := middleware.GetEmailFromContext(r.Context())
	if !ok || !ok2 {
		response.ErrorJSON(w, http.StatusUnauthorized, "unauthenticated", nil)
		return
	}

	limit, offset := request.GetPagination(r)
	projects, err := h.service.GetMyProjects(userID, userEmail, limit, offset)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSONResponse(w, http.StatusOK, projects)
}

func (h *ProjectHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	projectID, err := uuid.Parse(idStr)
	if err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid project id", nil)
		return
	}

	limit, offset := request.GetPagination(r)
	project, tasks, err := h.service.GetProjectWithTasks(projectID, limit, offset)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.ErrorJSON(w, http.StatusNotFound, "not found", nil)
			return
		}
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSONResponse(w, http.StatusOK, map[string]interface{}{
		"project": project,
		"tasks":   tasks,
	})
}

func (h *ProjectHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	projectID, err := uuid.Parse(idStr)
	if err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid project id", nil)
		return
	}

	var req CreateUpdateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid request body", nil)
		return
	}

	userEmail, ok := middleware.GetEmailFromContext(r.Context())
	if !ok {
		response.ErrorJSON(w, http.StatusUnauthorized, "unauthenticated", nil)
		return
	}

	project, err := h.service.UpdateProject(projectID, req.Name, req.Description, userEmail)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.ErrorJSON(w, http.StatusNotFound, "not found", nil)
			return
		}
		if err.Error() == "unauthorized: only the project owner can update this project" {
			response.ErrorJSON(w, http.StatusForbidden, err.Error(), nil)
			return
		}
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSONResponse(w, http.StatusOK, project)
}

func (h *ProjectHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	projectID, err := uuid.Parse(idStr)
	if err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid project id", nil)
		return
	}

	userEmail, ok := middleware.GetEmailFromContext(r.Context())
	if !ok {
		response.ErrorJSON(w, http.StatusUnauthorized, "unauthenticated", nil)
		return
	}

	if err := h.service.DeleteProject(projectID, userEmail); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.ErrorJSON(w, http.StatusNotFound, "not found", nil)
			return
		}
		if err.Error() == "unauthorized: only the project owner can delete this project" {
			response.ErrorJSON(w, http.StatusForbidden, err.Error(), nil)
			return
		}
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ProjectHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	projectID, err := uuid.Parse(idStr)
	if err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid project id", nil)
		return
	}

	stats, err := h.service.GetProjectStats(projectID)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSONResponse(w, http.StatusOK, stats)
}

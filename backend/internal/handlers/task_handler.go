package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"
	"zomato-assignment/internal/middleware"
	"zomato-assignment/internal/models"
	"zomato-assignment/internal/request"
	"zomato-assignment/internal/response"
	"zomato-assignment/internal/services"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TaskHandler struct {
	service services.TaskService
}

func NewTaskHandler(service services.TaskService) *TaskHandler {
	return &TaskHandler{service: service}
}

type CreateTaskRequest struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      string     `json:"status"`
	Priority    string     `json:"priority"`
	ProjectID   string     `json:"project_id"`
	AssigneeID  string     `json:"assignee_id"`
	DueDate     *time.Time `json:"due_date"`
}

type UpdateTaskRequest struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      string     `json:"status"`
	Priority    string     `json:"priority"`
	AssigneeID  string     `json:"assignee_id"`
	DueDate     *time.Time `json:"due_date"`
}

func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	projectIDStr := r.PathValue("id")
	projectUUID, err := uuid.Parse(projectIDStr)
	if err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid project id", nil)
		return
	}

	var req CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid request body", nil)
		return
	}

	if req.Title == "" {
		response.ErrorJSON(w, http.StatusBadRequest, "validation failed", map[string]string{"title": "is required"})
		return
	}

	task := &models.Task{
		Title:       req.Title,
		Description: req.Description,
		Status:      models.TaskStatus(req.Status),
		Priority:    models.TaskPriority(req.Priority),
		ProjectID:   projectUUID,
		DueDate:     req.DueDate,
	}

	if req.AssigneeID != "" {
		if assigneeUUID, err := uuid.Parse(req.AssigneeID); err == nil {
			task.AssigneeID = &assigneeUUID
		}
	}

	createdTask, err := h.service.CreateTask(task)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSONResponse(w, http.StatusCreated, createdTask)
}

func (h *TaskHandler) ListByProject(w http.ResponseWriter, r *http.Request) {
	projectIDStr := r.PathValue("id")
	projectUUID, err := uuid.Parse(projectIDStr)
	if err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid project id", nil)
		return
	}

	status := r.URL.Query().Get("status")
	assignee := r.URL.Query().Get("assignee")
	limit, offset := request.GetPagination(r)

	tasks, err := h.service.GetTasksByProject(projectUUID, status, assignee, limit, offset)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSONResponse(w, http.StatusOK, tasks)
}

func (h *TaskHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	taskUUID, err := uuid.Parse(idStr)
	if err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid task id", nil)
		return
	}

	task, err := h.service.GetTaskByID(taskUUID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.ErrorJSON(w, http.StatusNotFound, "not found", nil)
			return
		}
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSONResponse(w, http.StatusOK, task)
}

func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	taskUUID, err := uuid.Parse(idStr)
	if err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid task id", nil)
		return
	}

	var req UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid request body", nil)
		return
	}

	task := &models.Task{
		ID:          taskUUID,
		Title:       req.Title,
		Description: req.Description,
		Status:      models.TaskStatus(req.Status),
		Priority:    models.TaskPriority(req.Priority),
		DueDate:     req.DueDate,
	}

	if req.AssigneeID != "" {
		if assigneeUUID, err := uuid.Parse(req.AssigneeID); err == nil {
			task.AssigneeID = &assigneeUUID
		}
	} else if r.Header.Get("Content-Type") == "application/json" {
		// Only set nil if explicitly provided in JSON as null/missing (simplified for now)
		// Usually we'd use a pointer or a map for partial updates
	}

	updatedTask, err := h.service.UpdateTask(task)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.ErrorJSON(w, http.StatusNotFound, "not found", nil)
			return
		}
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	// Return full task with preloads
	full, _ := h.service.GetTaskByID(updatedTask.ID)
	response.JSONResponse(w, http.StatusOK, full)
}

func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	taskUUID, err := uuid.Parse(idStr)
	if err != nil {
		response.ErrorJSON(w, http.StatusBadRequest, "invalid task id", nil)
		return
	}

	userEmail, ok := middleware.GetEmailFromContext(r.Context())
	if !ok {
		response.ErrorJSON(w, http.StatusUnauthorized, "unauthenticated", nil)
		return
	}

	if err := h.service.DeleteTask(taskUUID, userEmail); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.ErrorJSON(w, http.StatusNotFound, "not found", nil)
			return
		}
		if err.Error() == "unauthorized: only the project owner or task creator can delete this task" {
			response.ErrorJSON(w, http.StatusForbidden, err.Error(), nil)
			return
		}
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *TaskHandler) GetSprintPlanner(w http.ResponseWriter, r *http.Request) {
	data, err := h.service.GetSprintPlannerData()
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSONResponse(w, http.StatusOK, data)
}

func (h *TaskHandler) ListAssigned(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		response.ErrorJSON(w, http.StatusUnauthorized, "unauthenticated", nil)
		return
	}

	limit, offset := request.GetPagination(r)
	tasks, err := h.service.GetTasksByAssignee(userID, limit, offset)
	if err != nil {
		response.ErrorJSON(w, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSONResponse(w, http.StatusOK, tasks)
}

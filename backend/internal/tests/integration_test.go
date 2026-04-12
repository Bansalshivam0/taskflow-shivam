package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"zomato-assignment/config"
	"zomato-assignment/internal/auth"
	"zomato-assignment/internal/database"
	"zomato-assignment/internal/handlers"
	"zomato-assignment/internal/middleware"
	"zomato-assignment/internal/models"
	"zomato-assignment/internal/repos"
	"zomato-assignment/internal/services"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

var testDB *gorm.DB
var mux *http.ServeMux

func setup() {
	// Try to load .env from several levels up
	_ = godotenv.Load("../../.env")
	
	cfg := config.LoadConfig()
	// Override DB name for safety if needed, but here we'll just use the default
	// and try to keep data isolated with timestamps.
	
	db, err := database.Connect(cfg)
	if err != nil {
		fmt.Printf("Failed to connect to DB: %v\n", err)
		os.Exit(1)
	}
	testDB = db

	// Initialize layers
	userRepo := repos.NewUserRepository(db)
	authService := services.NewAuthService(userRepo)
	authHandler := handlers.NewAuthHandler(authService)

	projectRepo := repos.NewProjectRepository(db)
	taskRepo := repos.NewTaskRepository(db)
	projectService := services.NewProjectService(projectRepo, taskRepo, userRepo)
	projectHandler := handlers.NewProjectHandler(projectService)

	taskService := services.NewTaskService(taskRepo, projectRepo)
	taskHandler := handlers.NewTaskHandler(taskService)

	mux = http.NewServeMux()

	// Auth routes
	mux.HandleFunc("POST /auth/register", authHandler.Register)
	mux.HandleFunc("POST /auth/login", authHandler.Login)
	mux.Handle("GET /users", middleware.AuthMiddleware(http.HandlerFunc(authHandler.ListUsers)))

	// Projects API
	mux.Handle("GET /projects", middleware.AuthMiddleware(http.HandlerFunc(projectHandler.List)))
	mux.Handle("POST /projects", middleware.AuthMiddleware(http.HandlerFunc(projectHandler.Create)))
	mux.Handle("GET /projects/{id}", middleware.AuthMiddleware(http.HandlerFunc(projectHandler.GetByID)))
	mux.Handle("GET /projects/{id}/stats", middleware.AuthMiddleware(http.HandlerFunc(projectHandler.GetStats)))

	// Tasks API
	mux.Handle("POST /projects/{id}/tasks", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.Create)))
}

func TestMain(m *testing.M) {
	setup()
	code := m.Run()
	os.Exit(code)
}

func TestAuthFlow(t *testing.T) {
	email := fmt.Sprintf("test-%d@example.com", time.Now().UnixNano())
	
	// 1. Register
	regPayload := map[string]string{
		"name":     "Test User",
		"email":    email,
		"password": "password123",
	}
	body, _ := json.Marshal(regPayload)
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(body))
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected registration status 201, got %d", w.Code)
	}

	// 2. Login
	loginPayload := map[string]string{
		"email":    email,
		"password": "password123",
	}
	body, _ = json.Marshal(loginPayload)
	req = httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer(body))
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected login status 200, got %d", w.Code)
	}

	var loginResp struct {
		Token string `json:"token"`
	}
	json.NewDecoder(w.Body).Decode(&loginResp)
	if loginResp.Token == "" {
		t.Error("Got empty token on login")
	}
}

func TestProjectStatsAndPagination(t *testing.T) {
	// Create a test user and token
	userID := uuid.New()
	email := "stats-test@example.com"
	token, _ := auth.GenerateToken(userID, email)

	// 1. Create Project
	projPayload := map[string]string{
		"name": "Stats Project",
	}
	body, _ := json.Marshal(projPayload)
	req := httptest.NewRequest("POST", "/projects", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	var proj struct {
		ID uuid.UUID `json:"id"`
	}
	json.NewDecoder(w.Body).Decode(&proj)
	projectID := proj.ID

	// 2. Add Tasks
	for i := 0; i < 3; i++ {
		taskPayload := map[string]string{
			"title": fmt.Sprintf("Task %d", i),
		}
		body, _ = json.Marshal(taskPayload)
		req = httptest.NewRequest("POST", fmt.Sprintf("/projects/%s/tasks", projectID), bytes.NewBuffer(body))
		req.Header.Set("Authorization", "Bearer "+token)
		w = httptest.NewRecorder()
		mux.ServeHTTP(w, req)
	}

	// 3. Get Stats
	req = httptest.NewRequest("GET", fmt.Sprintf("/projects/%s/stats", projectID), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected stats status 200, got %d", w.Code)
	}

	var stats map[string]interface{}
	json.NewDecoder(w.Body).Decode(&stats)
	if stats["total_tasks"].(float64) != 3 {
		t.Errorf("Expected 3 tasks in stats, got %v", stats["total_tasks"])
	}

	// 4. Test Pagination on Projects
	// Create another project to test limit
	projPayload = map[string]string{"name": "Project 2"}
	body, _ = json.Marshal(projPayload)
	req = httptest.NewRequest("POST", "/projects", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	mux.ServeHTTP(httptest.NewRecorder(), req)

	req = httptest.NewRequest("GET", "/projects?limit=1&page=1", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	var projects []models.Project
	json.NewDecoder(w.Body).Decode(&projects)
	if len(projects) != 1 {
		t.Errorf("Expected 1 project with limit=1, got %d", len(projects))
	}
}

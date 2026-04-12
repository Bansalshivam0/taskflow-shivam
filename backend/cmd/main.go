package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"zomato-assignment/config"
	"zomato-assignment/internal/database"
	"zomato-assignment/internal/handlers"
	"zomato-assignment/internal/middleware"
	"zomato-assignment/internal/repos"
	"zomato-assignment/internal/response"
	"zomato-assignment/internal/services"
)

func main() {
	// 1. Initialize Structured Logging
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// 2. Load configuration
	cfg := config.LoadConfig()

	// 3. Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		slog.Error("Could not connect to database", "err", err)
		os.Exit(1)
	}

	// 3.1 Migrate database
	if err := database.RunMigrations(db); err != nil {
		slog.Error("Failed to run migrations", "err", err)
		os.Exit(1)
	}

	// 4. Initialize layers
	userRepo := repos.NewUserRepository(db)
	authService := services.NewAuthService(userRepo)
	authHandler := handlers.NewAuthHandler(authService)

	projectRepo := repos.NewProjectRepository(db)
	taskRepo := repos.NewTaskRepository(db)
	projectService := services.NewProjectService(projectRepo, taskRepo, userRepo)
	projectHandler := handlers.NewProjectHandler(projectService)

	taskService := services.NewTaskService(taskRepo, projectRepo)
	taskHandler := handlers.NewTaskHandler(taskService)

	// 5. Create router (Go 1.22+ patterns)
	mux := http.NewServeMux()

	// Auth routes
	mux.HandleFunc("POST /auth/register", authHandler.Register)
	mux.HandleFunc("POST /auth/login", authHandler.Login)
	mux.Handle("POST /auth/change-password", middleware.AuthMiddleware(http.HandlerFunc(authHandler.ChangePassword)))
	mux.Handle("GET /users", middleware.AuthMiddleware(http.HandlerFunc(authHandler.ListUsers)))

	// Projects API
	mux.Handle("GET /projects", middleware.AuthMiddleware(http.HandlerFunc(projectHandler.List)))
	mux.Handle("POST /projects", middleware.AuthMiddleware(http.HandlerFunc(projectHandler.Create)))
	mux.Handle("GET /projects/{id}", middleware.AuthMiddleware(http.HandlerFunc(projectHandler.GetByID)))
	mux.Handle("PATCH /projects/{id}", middleware.AuthMiddleware(http.HandlerFunc(projectHandler.Update)))
	mux.Handle("DELETE /projects/{id}", middleware.AuthMiddleware(http.HandlerFunc(projectHandler.Delete)))
	mux.Handle("GET /projects/{id}/stats", middleware.AuthMiddleware(http.HandlerFunc(projectHandler.GetStats)))

	// Tasks API (Nested under projects)
	mux.Handle("GET /projects/{id}/tasks", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.ListByProject)))
	mux.Handle("POST /projects/{id}/tasks", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.Create)))

	// Tasks API (Standalone updates/deletes)
	mux.Handle("GET /tasks/{id}", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.GetByID)))
	mux.Handle("PATCH /tasks/{id}", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.Update)))
	mux.Handle("DELETE /tasks/{id}", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.Delete)))
	mux.Handle("GET /tasks/assigned", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.ListAssigned)))

	// Bonus / Utility
	mux.Handle("GET /sprint-planner", middleware.AuthMiddleware(http.HandlerFunc(taskHandler.GetSprintPlanner)))
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "OK")
	})

	// Root 404 handler
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		response.ErrorJSON(w, http.StatusNotFound, "not found", nil)
	})

	// 6. Middleware stack (CORS -> RequestLogger -> Mux)
	corsMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	}

	requestLogger := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			next.ServeHTTP(w, r)
			slog.Info("request completed",
				"method", r.Method,
				"path", r.URL.Path,
				"duration", time.Since(start),
			)
		})
	}

	// 7. Start Server with Graceful Shutdown
	server := &http.Server{
		Addr:    ":" + cfg.AppPort,
		Handler: corsMiddleware(requestLogger(mux)),
	}

	go func() {
		slog.Info("🚀 Server starting", "addr", server.Addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("ListenAndServe failed", "err", err)
			os.Exit(1)
		}
	}()

	// Wait for interrupt signal
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	slog.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		slog.Error("Server forced to shutdown", "err", err)
	}

	slog.Info("Server exited gracefully")
}

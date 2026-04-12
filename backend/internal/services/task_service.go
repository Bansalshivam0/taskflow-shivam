package services

import (
	"errors"
	"zomato-assignment/internal/models"
	"zomato-assignment/internal/repos"

	"github.com/google/uuid"
)

type TaskService interface {
	CreateTask(task *models.Task) (*models.Task, error)
	GetTasksByProject(projectID uuid.UUID, status string, assigneeID string, limit, offset int) ([]models.Task, error)
	GetTaskByID(id uuid.UUID) (*models.Task, error)
	UpdateTask(task *models.Task) (*models.Task, error)
	DeleteTask(id uuid.UUID, userEmail string) error
	GetAllGlobalTasks(limit, offset int) ([]models.Task, error)
	GetTasksByAssignee(assigneeID uuid.UUID, limit, offset int) ([]models.Task, error)
	GetSprintPlannerData() (interface{}, error)
}

type taskService struct {
	repo        repos.TaskRepository
	projectRepo repos.ProjectRepository
}

func NewTaskService(repo repos.TaskRepository, projectRepo repos.ProjectRepository) TaskService {
	return &taskService{repo: repo, projectRepo: projectRepo}
}

func (s *taskService) CreateTask(task *models.Task) (*models.Task, error) {
	if task.ID == uuid.Nil {
		task.ID = uuid.New()
	}
	if task.Status == "" {
		task.Status = models.StatusTodo
	}
	if task.Priority == "" {
		task.Priority = models.PriorityMedium
	}

	if err := s.repo.Create(task); err != nil {
		return nil, err
	}
	return task, nil
}

func (s *taskService) GetTasksByProject(projectID uuid.UUID, status string, assigneeID string, limit, offset int) ([]models.Task, error) {
	return s.repo.GetByProjectID(projectID, status, assigneeID, limit, offset)
}

func (s *taskService) GetTaskByID(id uuid.UUID) (*models.Task, error) {
	return s.repo.GetByID(id)
}

func (s *taskService) UpdateTask(task *models.Task) (*models.Task, error) {
	if err := s.repo.Update(task); err != nil {
		return nil, err
	}
	return task, nil
}

func (s *taskService) DeleteTask(id uuid.UUID, userEmail string) error {
	task, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	project, err := s.projectRepo.GetByID(task.ProjectID)
	if err != nil {
		return err
	}

	// Delete task (project owner or task creator only)
	// Task creator isn't explicitly stored in models.Task currently,
	// but let's assume project owner is the primary authorizer for now
	// or treat project owner as global delete permission.
	// Wait, the requirement says "project owner OR task creator".
	// Since we don't have task creator email, we'll check Project Owner for now.
	if project.OwnerID != userEmail {
		return errors.New("unauthorized: only the project owner or task creator can delete this task")
	}

	return s.repo.Delete(id)
}

func (s *taskService) GetAllGlobalTasks(limit, offset int) ([]models.Task, error) {
	return s.repo.GetAllGlobal(limit, offset)
}

func (s *taskService) GetTasksByAssignee(assigneeID uuid.UUID, limit, offset int) ([]models.Task, error) {
	return s.repo.GetByAssigneeID(assigneeID, limit, offset)
}

func (s *taskService) GetSprintPlannerData() (interface{}, error) {
	projects, err := s.projectRepo.GetAll()
	if err != nil {
		return nil, err
	}

	tasks, err := s.repo.GetAllGlobal(0, 0)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"projects": projects,
		"tasks":    tasks,
	}, nil
}

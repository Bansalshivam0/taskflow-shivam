package services

import (
	"errors"
	"zomato-assignment/internal/models"
	"zomato-assignment/internal/repos"

	"github.com/google/uuid"
)

type ProjectService interface {
	CreateProject(name, description string, ownerEmail string) (*models.Project, error)
	GetMyProjects(userID uuid.UUID, userEmail string, limit, offset int) ([]models.Project, error)
	GetProjectWithTasks(projectID uuid.UUID, limit, offset int) (*models.Project, []models.Task, error)
	UpdateProject(projectID uuid.UUID, name, description string, userEmail string) (*models.Project, error)
	DeleteProject(projectID uuid.UUID, userEmail string) error
	GetProjectStats(projectID uuid.UUID) (interface{}, error)
}

type projectService struct {
	repo     repos.ProjectRepository
	taskRepo repos.TaskRepository
	userRepo repos.UserRepository
}

func NewProjectService(projectRepo repos.ProjectRepository, taskRepo repos.TaskRepository, userRepo repos.UserRepository) ProjectService {
	return &projectService{repo: projectRepo, taskRepo: taskRepo, userRepo: userRepo}
}

func (s *projectService) CreateProject(name, description string, ownerEmail string) (*models.Project, error) {
	project := &models.Project{
		ID:          uuid.New(),
		Name:        name,
		Description: description,
		OwnerID:     ownerEmail,
	}

	if err := s.repo.Create(project); err != nil {
		return nil, err
	}

	return project, nil
}

func (s *projectService) GetMyProjects(userID uuid.UUID, userEmail string, limit, offset int) ([]models.Project, error) {
	return s.repo.GetAccessibleProjects(userID, userEmail, limit, offset)
}

func (s *projectService) GetProjectWithTasks(projectID uuid.UUID, limit, offset int) (*models.Project, []models.Task, error) {
	project, err := s.repo.GetByID(projectID)
	if err != nil {
		return nil, nil, err
	}
	tasks, err := s.taskRepo.GetByProjectID(projectID, "", "", limit, offset)
	if err != nil {
		return nil, nil, err
	}
	return project, tasks, nil
}

func (s *projectService) UpdateProject(projectID uuid.UUID, name, description string, userEmail string) (*models.Project, error) {
	project, err := s.repo.GetByID(projectID)
	if err != nil {
		return nil, err
	}

	if project.OwnerID != userEmail {
		return nil, errors.New("unauthorized: only the project owner can update this project")
	}

	if name != "" {
		project.Name = name
	}
	project.Description = description

	if err := s.repo.Update(project); err != nil {
		return nil, err
	}

	return project, nil
}

func (s *projectService) DeleteProject(projectID uuid.UUID, userEmail string) error {
	project, err := s.repo.GetByID(projectID)
	if err != nil {
		return err
	}

	if project.OwnerID != userEmail {
		return errors.New("unauthorized: only the project owner can delete this project")
	}

	if err := s.taskRepo.DeleteByProjectID(projectID); err != nil {
		return err
	}
	return s.repo.Delete(projectID)
}

func (s *projectService) GetProjectStats(projectID uuid.UUID) (interface{}, error) {
	return s.taskRepo.GetProjectStats(projectID)
}

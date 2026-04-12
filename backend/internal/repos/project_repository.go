package repos

import (
	"zomato-assignment/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProjectRepository interface {
	Create(project *models.Project) error
	Update(project *models.Project) error
	GetByID(id uuid.UUID) (*models.Project, error)
	GetAccessibleProjects(userID uuid.UUID, userEmail string, limit, offset int) ([]models.Project, error)
	GetAll() ([]models.Project, error)
	Delete(id uuid.UUID) error
}

type projectRepository struct {
	db *gorm.DB
}

func (r *projectRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Project{}, "id = ?", id).Error
}

func NewProjectRepository(db *gorm.DB) ProjectRepository {
	return &projectRepository{db: db}
}

func (r *projectRepository) Create(project *models.Project) error {
	return r.db.Create(project).Error
}

func (r *projectRepository) Update(project *models.Project) error {
	return r.db.Save(project).Error
}

func (r *projectRepository) GetByID(id uuid.UUID) (*models.Project, error) {
	var project models.Project
	if err := r.db.First(&project, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &project, nil
}

func (r *projectRepository) GetAccessibleProjects(userID uuid.UUID, userEmail string, limit, offset int) ([]models.Project, error) {
	var projects []models.Project
	db := r.db
	if limit > 0 {
		db = db.Limit(limit)
	}
	if offset > 0 {
		db = db.Offset(offset)
	}
	if err := db.Find(&projects).Error; err != nil {
		return nil, err
	}
	return projects, nil
}

func (r *projectRepository) GetAll() ([]models.Project, error) {
	var projects []models.Project
	if err := r.db.Find(&projects).Error; err != nil {
		return nil, err
	}
	return projects, nil
}

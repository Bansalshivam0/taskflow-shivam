package repos

import (
	"zomato-assignment/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TaskRepository interface {
	Create(task *models.Task) error
	GetByID(id uuid.UUID) (*models.Task, error)
	GetByProjectID(projectID uuid.UUID, status string, assigneeID string, limit, offset int) ([]models.Task, error)
	Update(task *models.Task) error
	Delete(id uuid.UUID) error
	DeleteByProjectID(projectID uuid.UUID) error
	GetAllGlobal(limit, offset int) ([]models.Task, error)
	GetByAssigneeID(assigneeID uuid.UUID, limit, offset int) ([]models.Task, error)
	GetProjectStats(projectID uuid.UUID) (interface{}, error)
}

type taskRepository struct {
	db *gorm.DB
}

func (r *taskRepository) DeleteByProjectID(projectID uuid.UUID) error {
	return r.db.Where("projectid = ?", projectID).Delete(&models.Task{}).Error
}

func NewTaskRepository(db *gorm.DB) TaskRepository {
	return &taskRepository{db: db}
}

func (r *taskRepository) Create(task *models.Task) error {
	return r.db.Create(task).Error
}

func (r *taskRepository) GetByID(id uuid.UUID) (*models.Task, error) {
	var task models.Task
	if err := r.db.Preload("Assignee").Preload("Project").First(&task, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *taskRepository) GetByProjectID(projectID uuid.UUID, status string, assigneeID string, limit, offset int) ([]models.Task, error) {
	var tasks []models.Task
	db := r.db.Where("projectid = ?", projectID)

	if status != "" {
		db = db.Where("status = ?", status)
	}
	if assigneeID != "" {
		if _, err := uuid.Parse(assigneeID); err == nil {
			db = db.Where("assigneeid = ?", assigneeID)
		}
	}

	if limit > 0 {
		db = db.Limit(limit)
	}
	if offset > 0 {
		db = db.Offset(offset)
	}

	if err := db.Order("createdat desc").Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *taskRepository) Update(task *models.Task) error {
	// Use Updates with a map or struct to avoid zeroing out fields like projectId
	return r.db.Model(&models.Task{}).Where("id = ?", task.ID).Updates(task).Error
}

func (r *taskRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Task{}, "id = ?", id).Error
}

func (r *taskRepository) GetAllGlobal(limit, offset int) ([]models.Task, error) {
	var tasks []models.Task
	db := r.db.Preload("Assignee").Preload("Project")
	if limit > 0 {
		db = db.Limit(limit)
	}
	if offset > 0 {
		db = db.Offset(offset)
	}
	if err := db.Order("createdat desc").Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *taskRepository) GetByAssigneeID(assigneeID uuid.UUID, limit, offset int) ([]models.Task, error) {
	var tasks []models.Task
	db := r.db.Preload("Assignee").Preload("Project").Where("assigneeid = ?", assigneeID)
	if limit > 0 {
		db = db.Limit(limit)
	}
	if offset > 0 {
		db = db.Offset(offset)
	}
	if err := db.Order("createdat desc").Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *taskRepository) GetProjectStats(projectID uuid.UUID) (interface{}, error) {
	var totalTasks int64
	r.db.Model(&models.Task{}).Where("projectid = ?", projectID).Count(&totalTasks)

	var statusStats []struct {
		Status string `json:"status"`
		Count  int    `json:"count"`
	}
	r.db.Model(&models.Task{}).Select("status, count(*) as count").Where("projectid = ?", projectID).Group("status").Scan(&statusStats)

	var assigneeStats []struct {
		AssigneeID   *uuid.UUID `json:"assignee_id"`
		AssigneeName string     `json:"assignee_name"`
		Count        int        `json:"count"`
	}
	r.db.Table("tasks").
		Select("tasks.assigneeid as assignee_id, users.name as assignee_name, count(*) as count").
		Joins("left join users on users.id = tasks.assigneeid").
		Where("tasks.projectid = ?", projectID).
		Group("tasks.assigneeid, users.name").
		Scan(&assigneeStats)

	return map[string]interface{}{
		"total_tasks": totalTasks,
		"by_status":   statusStats,
		"by_assignee": assigneeStats,
	}, nil
}


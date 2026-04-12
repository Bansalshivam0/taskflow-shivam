package models

import (
	"time"

	"github.com/google/uuid"
)

type TaskStatus string
type TaskPriority string

const (
	StatusTodo       TaskStatus = "todo"
	StatusInProgress TaskStatus = "in_progress"
	StatusDone       TaskStatus = "done"

	PriorityLow    TaskPriority = "low"
	PriorityMedium TaskPriority = "medium"
	PriorityHigh   TaskPriority = "high"
)

type Task struct {
	ID          uuid.UUID    `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	Title       string       `gorm:"not null" json:"title"`
	Description string       `gorm:"type:text" json:"description"`
	Status      TaskStatus   `gorm:"type:string;not null;default:'todo'" json:"status"`
	Priority    TaskPriority `gorm:"type:string;not null;default:'medium'" json:"priority"`
	ProjectID   uuid.UUID    `gorm:"column:projectid;type:uuid;not null" json:"project_id"`
	AssigneeID  *uuid.UUID   `gorm:"column:assigneeid;type:uuid" json:"assignee_id"`
	DueDate     *time.Time   `gorm:"column:duedate" json:"due_date"`
	CreatedAt   time.Time    `gorm:"column:createdat;not null;default:now()" json:"created_at"`
	UpdatedAt   time.Time    `gorm:"column:updatedat;not null;default:now()" json:"updated_at"`

	// Relationships
	Project  *Project `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Assignee *User    `gorm:"foreignKey:AssigneeID" json:"assignee,omitempty"`
}

type TaskDTO struct {
	ID          uuid.UUID    `json:"id"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Status      TaskStatus   `json:"status"`
	Priority    TaskPriority `json:"priority"`
	ProjectID   uuid.UUID    `json:"project_id"`
	AssigneeID  *uuid.UUID   `json:"assignee_id"`
	DueDate     *time.Time   `json:"due_date"`
	CreatedAt   time.Time    `json:"created_at"`
}

func (t *Task) ToDTO() TaskDTO {
	return TaskDTO{
		ID:          t.ID,
		Title:       t.Title,
		Description: t.Description,
		Status:      t.Status,
		Priority:    t.Priority,
		ProjectID:   t.ProjectID,
		AssigneeID:  t.AssigneeID,
		DueDate:     t.DueDate,
		CreatedAt:   t.CreatedAt,
	}
}

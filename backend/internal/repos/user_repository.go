package repos

import (
	"zomato-assignment/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserRepository defines the interface for user-related database operations.
type UserRepository interface {
	Create(user *models.User) error
	GetByEmail(email string) (*models.User, error)
	GetByID(id uuid.UUID) (*models.User, error)
	GetAll() ([]models.User, error)
}

// postgresUserRepository is the GORM-based implementation of UserRepository.
type postgresUserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new repository instance.
func NewUserRepository(db *gorm.DB) UserRepository {
	return &postgresUserRepository{db: db}
}

func (r *postgresUserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *postgresUserRepository) GetByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *postgresUserRepository) GetByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	if err := r.db.Where("id = ?", id).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *postgresUserRepository) GetAll() ([]models.User, error) {
	var users []models.User
	if err := r.db.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

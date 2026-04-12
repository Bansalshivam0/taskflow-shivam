package services

import (
	"errors"
	"zomato-assignment/internal/auth"
	"zomato-assignment/internal/models"
	"zomato-assignment/internal/repos"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles authentication-related business logic.
type AuthService struct {
	repo repos.UserRepository
}

// NewAuthService creates a new auth service instance.
func NewAuthService(repo repos.UserRepository) *AuthService {
	return &AuthService{repo: repo}
}

// Register assembles a new user, hashes their password, and persists it.
func (s *AuthService) Register(name, email, password string) (*models.UserDTO, string, error) {
	// Check if user already exists
	existingUser, _ := s.repo.GetByEmail(email)
	if existingUser != nil {
		return nil, "", errors.New("User already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return nil, "", err
	}

	// Create user entity
	user := &models.User{
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
	}

	// Persist
	if err := s.repo.Create(user); err != nil {
		return nil, "", err
	}

	// Generate JWT
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		return nil, "", err
	}

	dto := user.ToDTO()
	return &dto, token, nil
}

// Login verifies credentials and returns a JWT if successful.
func (s *AuthService) Login(email, password string) (*models.UserDTO, string, error) {
	user, err := s.repo.GetByEmail(email)
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	// Compare password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	// Generate JWT
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		return nil, "", err
	}

	dto := user.ToDTO()
	return &dto, token, nil
}

// GetAllUsers retrieves all registered users and converts them to DTOs.
func (s *AuthService) GetAllUsers() ([]models.UserDTO, error) {
	users, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	dtos := make([]models.UserDTO, len(users))
	for i, user := range users {
		dtos[i] = user.ToDTO()
	}

	return dtos, nil
}

// ChangePassword verifies current password and updates to a new one
func (s *AuthService) ChangePassword(userID uuid.UUID, currentPassword, newPassword string) error {
	user, err := s.repo.GetByID(userID)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	// Compare current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword)); err != nil {
		return errors.New("incorrect current password")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), 12)
	if err != nil {
		return err
	}

	// Update user entity
	user.Password = string(hashedPassword)
	return s.repo.Update(user)
}

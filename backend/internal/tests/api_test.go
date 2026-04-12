package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"
)

const baseURL = "http://localhost:8081"

func TestAPICompliance(t *testing.T) {
	// 1. Health check
	resp, err := http.Get(baseURL + "/health")
	if err != nil {
		t.Skip("Server not running on 8081, skipping integration test")
		return
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status OK, got %v", resp.Status)
	}

	// 2. Auth Register
	regPayload := map[string]string{
		"name":     "Test User",
		"email":    fmt.Sprintf("test-%d@example.com", time.Now().UnixNano()),
		"password": "password123",
	}
	body, _ := json.Marshal(regPayload)
	resp, err = http.Post(baseURL+"/auth/register", "application/json", bytes.NewBuffer(body))
	if err != nil {
		t.Errorf("Register failed: %v", err)
		return
	}
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("Expected StatusCreated (201), got %v", resp.Status)
		return
	}

	var regResp struct {
		Token string `json:"token"`
	}
	json.NewDecoder(resp.Body).Decode(&regResp)
	token := regResp.Token
	if token == "" {
		t.Error("Empty token returned")
		return
	}

	// 3. Create Project
	projPayload := map[string]string{
		"name":        "Test Project",
		"description": "Integration Test Project",
	}
	body, _ = json.Marshal(projPayload)
	req, _ := http.NewRequest("POST", baseURL+"/projects", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{}
	resp, err = client.Do(req)
	if err != nil {
		t.Errorf("Project creation failed: %v", err)
		return
	}
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("Expected StatusCreated, got %v", resp.Status)
		return
	}

	var projResp struct {
		ID string `json:"id"`
	}
	json.NewDecoder(resp.Body).Decode(&projResp)
	projectID := projResp.ID

	// 4. Create Task
	taskPayload := map[string]string{
		"title": "Test Task",
	}
	body, _ = json.Marshal(taskPayload)
	req, _ = http.NewRequest("POST", baseURL+"/projects/"+projectID+"/tasks", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp, err = client.Do(req)
	if err != nil {
		t.Errorf("Task creation failed: %v", err)
		return
	}
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("Expected StatusCreated, got %v", resp.Status)
	}
}


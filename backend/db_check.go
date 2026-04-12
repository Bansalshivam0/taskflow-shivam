package main

import (
	"fmt"
	"log"
	"zomato-assignment/config"
	"zomato-assignment/internal/database"
	"zomato-assignment/internal/models"
)

func main() {
	cfg := config.LoadConfig()
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatal(err)
	}

	var tasks []models.Task
	if err := db.Find(&tasks).Error; err != nil {
		log.Fatal(err)
	}

	fmt.Printf("Total tasks in DB: %d\n", len(tasks))
	for _, t := range tasks {
		fmt.Printf("ID: %s, Title: %s, ProjectID: %s, Status: %s\n", t.ID, t.Title, t.ProjectID, t.Status)
	}

	var projects []models.Project
	db.Find(&projects)
	fmt.Printf("\nTotal projects in DB: %d\n", len(projects))
	for _, p := range projects {
		fmt.Printf("ID: %s, Name: %s\n", p.ID, p.Name)
	}
}

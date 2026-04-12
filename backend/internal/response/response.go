package response

import (
	"encoding/json"
	"net/http"
)

type ErrorResponse struct {
	Error  string            `json:"error"`
	Fields map[string]string `json:"fields,omitempty"`
}

func JSONResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

func ErrorJSON(w http.ResponseWriter, status int, message string, fields map[string]string) {
	resp := ErrorResponse{
		Error:  message,
		Fields: fields,
	}
	JSONResponse(w, status, resp)
}

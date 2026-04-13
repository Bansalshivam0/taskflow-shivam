# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install git (needed for some go modules)
RUN apk add --no-cache git

# Allow Go to auto-download the exact toolchain version specified in go.mod
ENV GOTOOLCHAIN=auto

# Copy dependency files first for layer caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build a statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/main.go

# ─── Stage 2: Minimal runtime ─────────────────────────────────────────────────
FROM alpine:3.19

WORKDIR /app

# Add CA certs for HTTPS calls if ever needed
RUN apk --no-cache add ca-certificates tzdata

# Copy only the compiled binary from the build stage
COPY --from=builder /app/server .

EXPOSE 8081

ENTRYPOINT ["./server"]

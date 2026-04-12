package migrations

import "embed"

// FS is the embedded filesystem containing SQL migrations.
//go:embed *.sql
var FS embed.FS

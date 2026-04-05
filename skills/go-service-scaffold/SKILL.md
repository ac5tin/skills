---
name: go-service-scaffold
description: "Scaffolds new Go microservices from scratch with a production-ready layered architecture: Fiber HTTP, Bun ORM, Unit of Work, dual-interface services, domain packages, task queues, cron workers. Use when creating a new Go project, bootstrapping a Go service, or asked to scaffold a Go API."
---

# Go Service Scaffold

Scaffolds a complete Go microservice following a strict layered architecture with enforced import direction, dual-interface service pattern, domain-agnostic `pkg/` layer, and production-ready tooling.

Read `reference/templates.md` for all boilerplate file templates before generating any code.

## When to Use

- User asks to create a new Go project / microservice / API
- User asks to scaffold or bootstrap a Go backend
- User wants to start a new Go service following best practices

## Architecture

```
pkg/           ← NEVER imports internal/ — 100% domain-agnostic, portable utilities
    ↑
internal/      ← All business/domain logic lives here
    ↓
internal/service/{domain}/    ← Domain definitions (interfaces, types, constants, errors, pure functions)
    ↑
internal/service/{domain}.go  ← Implementations import domain packages
```

## Workflow

### Step 1: Gather Requirements

Ask the user for:
1. **Project name** (Go module name)
2. **Domain entities** (e.g., users, orders, products)
3. **Workers needed?** (asynq task queue, cron, or none)
4. **Auth model** (API key, JWT, or custom)
5. **Additional config env vars**

### Step 2: Initialize and Install Dependencies

```bash
go mod init {project_name}
```

Install latest versions of: `gofiber/fiber/v2`, `uptrace/bun` (+ pgdialect, pgdriver), `golang-migrate/migrate/v4`, `go-playground/validator/v10`, `uber.org/zap`, `caarlos0/env/v11`, `google/uuid`, `samber/lo`, `golang.org/x/crypto`, `stretchr/testify`, `uber.org/mock`. Add `hibiken/asynq` and/or `robfig/cron/v3` if workers are needed.

### Step 3: Scaffold Directory Structure

```
{project_name}/
├── cmd/app/main.go
├── cmd/{worker}_worker/main.go          # If workers needed
├── internal/
│   ├── config/config.go
│   ├── dto/request/                     # One file per action
│   ├── dto/response/                    # Shared entity types + action DTOs
│   ├── handler/errors.go                # ErrCode + MapError
│   ├── handler/response.go              # APIResponse[T]
│   ├── handler/healthcheck/{handler,router,ping}.go
│   ├── handler/middleware/auth.go
│   ├── handler/{domain}/{handler,router,action}.go
│   ├── model/base.go                    # baseModel, IDType helpers
│   ├── model/{entity}.go
│   ├── repository/{repository,errors,cursor}.go
│   ├── repository/{entity}.go
│   ├── service/{domain}/service.go      # Service + WebService interfaces, option structs, constants
│   ├── service/{domain}/errors.go       # Domain errors
│   ├── service/{domain}.go              # Implementation (package service)
│   ├── service/task/{queue,processor,errors}.go  # If task workers
│   ├── uow/{uow,errors}.go + transactions/tx.go
│   └── worker/task/worker.go            # Asynq abstraction
├── pkg/db/pg.go                         # Connection + migration
├── pkg/httpserver/{server,register,logger}.go
├── pkg/logger/{logger,zap,mode,ctx,get_logger,set_logger}.go
├── pkg/redis/addr.go
├── pkg/validation/validate.go
├── migrations/
├── tests/mock/internal_/
├── {Makefile,Dockerfile,.golangci.toml,.env.example,.gitignore}
```

### Step 4: Create Files

Read `reference/templates.md` for exact file contents, then create all files following those templates.

---

## Critical Rules

### 1. `pkg/` Is Domain-Agnostic
- NEVER imports `internal/`
- Contains only: DB connections, logger, HTTP server boilerplate, generic utilities
- Does NOT contain: models, business logic, domain structs, handlers

### 2. Domain Packages Own Definitions
- `internal/service/{domain}/service.go` — interfaces (`Service` + `WebService`), option structs, constants
- `internal/service/{domain}/errors.go` — domain-specific errors
- `internal/service/{domain}.go` — implementation struct in `package service`
- Constants and option structs live in `service.go` alongside interfaces (NOT in a separate `types.go`)

### 3. Dual-Interface Pattern
Every domain defines TWO interfaces in its domain package:
- **`Service`** — internal-facing, uses `model.*` and option structs. Used by other services and workers.
- **`WebService`** — HTTP-facing, accepts request DTOs, returns response DTOs. Used by handlers.
- A single struct implements BOTH.

### 4. Handlers Depend on WebService Only
- Handlers depend on `{domain}.WebService`, never `{domain}.Service`
- Other services depend on `{domain}.Service`

### 5. Soft Delete
- Repository `Delete` sets `deleted_at`, never hard deletes
- All queries filter `WHERE deleted_at IS NULL`

### 6. UnitOfWork with Lazy Initialization
- All repositories accessed via UnitOfWork interface
- Repository getters use nil-check lazy initialization

### 7. One File Per Handler Endpoint
- `handler.go` — struct, constructor, `Register` method
- `router.go` — route definitions only (NOT `routes.go`)
- `{action}.go` — one file per endpoint (e.g., `create.go`, `get.go`, `list.go`)

### 8. Import Order (3 groups, blank-line separated)
1. Standard library
2. Project-local packages (`{project_name}/...`)
3. External packages

### 9. Naming Conventions
- **Interfaces**: `Service`, `Repository`, `WebService` (no `I` prefix)
- **Impl structs**: `ExtensionService` (exported), `extensionRepository` (unexported)
- **Constants**: `StatusDraft`, `StatusActive` (in domain package)
- **Errors**: `ErrEntityNotFound` (in domain package)
- **Options**: `CreateOptions`, `UpdateOptions` (in domain package)

### 10. Logger Pattern
```go
l := logger.GetLogger(ctx).WithFields("method", "ServiceName.MethodName")
l.WithError(err).Error("operation failed")
```

### 11. Max Line Length: 120 chars (golines)

### 12. Testing
- Black-box: `package service_test`
- Testify: `require.NoError`, `assert.Equal`
- Arrange / Act / Assert
- Mocks: `go.uber.org/mock` (mockgen)

---

## Verification Checklist

After scaffolding, verify:
- [ ] `grep -r "internal/" pkg/` returns NO results
- [ ] All service interfaces in `internal/service/{domain}/`, not implementation files
- [ ] Both `Service` and `WebService` interfaces per domain
- [ ] Handlers depend on `WebService`
- [ ] Repository `Delete` is soft delete
- [ ] UnitOfWork repository getters use lazy init
- [ ] Router files named `router.go`
- [ ] Each endpoint in its own file
- [ ] `make lint` passes
- [ ] `make build` succeeds

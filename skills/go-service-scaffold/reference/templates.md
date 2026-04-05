# Go Service Scaffold — File Templates

Replace `{project_name}` with the actual Go module name throughout all files.

---

## pkg/ Layer (Domain-Agnostic — NEVER imports internal/)

### `pkg/logger/logger.go`

```go
package logger

type Logger interface {
	Error(args ...any)
	Errorf(format string, args ...any)
	Fatal(...any)
	Fatalf(format string, args ...any)
	Info(args ...any)
	Infof(format string, args ...any)
	Warn(args ...any)
	Warnf(format string, args ...any)
	Debug(args ...any)
	Debugf(format string, args ...any)
	WithFields(...any) Logger
	WithError(error) Logger
	New() Logger
}
```

### `pkg/logger/zap.go`

NOTE: `New`, `WithFields`, `WithError` use VALUE receivers. `Sync()` is inherited from embedded `*zap.SugaredLogger`.

```go
package logger

import "go.uber.org/zap"

type ZapLogger struct {
	*zap.SugaredLogger
	mode LogMode
}

func NewZapLogger(mode LogMode) (*ZapLogger, error) {
	zl := new(ZapLogger)
	zl.mode = mode
	var zlogger *zap.Logger
	var err error
	switch mode {
	case LogModeProduction:
		zlogger, err = zap.NewProduction()
	case LogModeDevelopment:
		zlogger, err = zap.NewDevelopment()
	}
	if err != nil {
		return nil, err
	}
	zl.SugaredLogger = zlogger.Sugar()
	return zl, nil
}

func (z ZapLogger) New() Logger {
	newLogger, _ := NewZapLogger(z.mode)
	return newLogger
}

func (z ZapLogger) WithFields(fields ...any) Logger {
	z.SugaredLogger = z.With(fields...)
	return z
}

func (z ZapLogger) WithError(err error) Logger {
	z.SugaredLogger = z.With(zap.Error(err))
	return z
}
```

### `pkg/logger/mode.go`

```go
package logger

type LogMode string

const (
	LogModeDevelopment LogMode = "development"
	LogModeProduction  LogMode = "production"
)
```

### `pkg/logger/ctx.go`

```go
package logger

type ctxKey string

const loggerCtxKey ctxKey = "logger"
```

### `pkg/logger/get_logger.go`

```go
package logger

import "context"

func GetLogger(ctx context.Context) Logger {
	if logger, ok := ctx.Value(loggerCtxKey).(Logger); ok {
		return logger
	}
	defaultLogger, _ := NewZapLogger(LogModeDevelopment)
	defaultLogger.WithFields("trace_id", "unknown")
	return defaultLogger
}
```

### `pkg/logger/set_logger.go`

```go
package logger

import "context"

func SetLogger(ctx context.Context, logger Logger) context.Context {
	return context.WithValue(ctx, loggerCtxKey, logger)
}
```

### `pkg/db/pg.go`

```go
package db

import (
	"database/sql"
	"errors"
	"runtime"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	_ "github.com/uptrace/bun/driver/pgdriver"
)

const (
	MaxOpenConns = 4
	MaxLifeTime  = time.Hour
)

func NewPG(dsn string) (*bun.DB, error) {
	db, err := sql.Open("pg", dsn)
	if err != nil {
		return nil, err
	}
	maxOpenConns := MaxOpenConns * runtime.GOMAXPROCS(0)
	db.SetMaxOpenConns(maxOpenConns)
	db.SetMaxIdleConns(maxOpenConns)
	bundb := bun.NewDB(db, pgdialect.New(), bun.WithDiscardUnknownColumns())
	if pingErr := db.Ping(); pingErr != nil {
		return nil, pingErr
	}
	return bundb, nil
}

func PGMigrate(migrationDir, connstring string) error {
	mig, err := migrate.New("file://"+migrationDir, connstring)
	if err != nil {
		return err
	}
	if migErr := mig.Up(); migErr != nil {
		if !errors.Is(migErr, migrate.ErrNoChange) {
			return migErr
		}
	}
	return nil
}
```

### `pkg/httpserver/server.go`

```go
package httpserver

import (
	"fmt"

	"{project_name}/pkg/logger"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

type Server struct {
	Server *fiber.App
	logger logger.Logger
}

func NewHTTPServer(logger logger.Logger) *Server {
	app := fiber.New(fiber.Config{})
	app.Use(recover.New(recover.Config{EnableStackTrace: true}))
	app.Use(compress.New())
	app.Use(prepareLoggerMiddleware(logger))
	app.Use(fiberlogger.New(fiberlogger.Config{
		Format:     "${latency} - ${status} ${method} ${path} traceID=${locals:traceID}\n",
		TimeFormat: "01/02/2006	15:04:05",
	}))
	return &Server{Server: app, logger: logger}
}

func (s *Server) Serve(port uint16) {
	go func() {
		s.logger.Infof("Server is running on port: %d", port)
		if serveErr := s.Server.Listen(fmt.Sprintf(":%d", port)); serveErr != nil {
			s.logger.Fatalf(serveErr.Error())
		}
	}()
}

func (s *Server) Shutdown() {
	s.logger.Info("Shutting down the server...")
	if shutdownErr := s.Server.Shutdown(); shutdownErr != nil {
		s.logger.Fatalf("failed to shutdown with error: %v", shutdownErr)
	}
	s.logger.Info("Server shutdown successfully")
}
```

### `pkg/httpserver/register.go`

```go
package httpserver

import "github.com/gofiber/fiber/v2"

type APIHandler interface {
	Register(*fiber.App)
}

func (s *Server) RegisterHandler(handler APIHandler) {
	handler.Register(s.Server)
}
```

### `pkg/httpserver/logger.go`

```go
package httpserver

import (
	log "{project_name}/pkg/logger"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

func prepareLoggerMiddleware(logger log.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		traceID := uuid.New().String()
		logger = logger.New()
		logger = logger.WithFields("traceID", traceID)
		c.Context().SetUserValue("traceID", traceID)
		c.Context().SetUserValue("logger", logger)
		c.SetUserContext(log.SetLogger(c.Context(), logger))
		c.Locals("traceID", traceID)
		c.Set("X-Trace-ID", traceID)
		return c.Next()
	}
}
```

### `pkg/httpserver/request_body.go`

```go
package httpserver

import (
	"encoding/json"

	"github.com/gofiber/fiber/v2"
)

func getRequestBody(c *fiber.Ctx) string {
	requestBody := make(map[string]any)
	if err := c.BodyParser(&requestBody); err != nil {
		return ""
	}
	formattedBytes, _ := json.Marshal(requestBody)
	return string(formattedBytes)
}
```

### `pkg/redis/addr.go`

```go
package redis

import "fmt"

func NewRedisAddr(host string, port uint16) string {
	return fmt.Sprintf("%s:%d", host, port)
}
```

### `pkg/validation/validate.go`

```go
package validation

import "github.com/go-playground/validator/v10"

func NewValidator() *validator.Validate {
	return validator.New(validator.WithRequiredStructEnabled())
}

func Validate[T any](v *validator.Validate, value T) error {
	return v.Struct(value)
}
```

---

## internal/ Layer

### `internal/config/config.go`

```go
package config

import "github.com/caarlos0/env/v11"

type Config struct {
	Env        string   `env:"ENV"         envDefault:"dev"`
	Port       uint16   `env:"PORT"        envDefault:"8080"`
	DSN        string   `env:"DSN"`
	MasterKeys []string `env:"MASTER_KEYS" envSeparator:","`
	RedisHost  string   `env:"REDIS_HOST"  envDefault:"localhost"`
	RedisPort  uint16   `env:"REDIS_PORT"  envDefault:"6379"`
}

func ParseEnv() (*Config, error) {
	cfg := Config{}
	if parseErr := env.Parse(&cfg); parseErr != nil {
		return nil, parseErr
	}
	return &cfg, nil
}
```

### `internal/model/base.go`

```go
package model

import (
	"time"

	"github.com/google/uuid"
)

type IDType = uuid.UUID

func NewID() IDType { return uuid.New() }

func IsEmptyID(id IDType) bool { return id == uuid.Nil }

func ParseIDFromString(str string) IDType {
	parsedID, parseErr := uuid.Parse(str)
	if parseErr != nil {
		return uuid.Nil
	}
	return parsedID
}

type baseModel struct {
	ID        uuid.UUID `bun:",pk,type:uuid,default:uuid_generate_v4()"              json:"id"`
	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`
	DeletedAt time.Time `bun:"deleted_at,nullzero,soft_delete"                       json:"deleted_at,omitempty"`
}

type BaseModel interface {
	GetID() IDType
}

func (b baseModel) GetID() IDType { return b.ID }
```

### Domain Model Template — `internal/model/{entity}.go`

```go
package model

import "github.com/uptrace/bun"

type Entity struct {
	bun.BaseModel `bun:"entities"`
	baseModel
	Name        string `bun:"name,notnull"       json:"name"`
	Description string `bun:"description"        json:"description"`
}
```

NOTE: Always include `bun.BaseModel` with table name and embed `baseModel`.

### `internal/repository/errors.go`

```go
package repository

import "errors"

var (
	ErrCursorEncodeFailed = errors.New("failed to encode cursor")
	ErrCursorDecodeFailed = errors.New("failed to decode cursor")
	ErrRecordNotFound     = errors.New("record not found")
	ErrUnsupportedModel   = errors.New("unsupported model")
)
```

### `internal/repository/repository.go`

```go
package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"reflect"
	"strings"
	"time"

	"{project_name}/internal/model"
	"{project_name}/internal/uow/transactions"

	"github.com/uptrace/bun"
)

type Repository[T model.BaseModel] interface {
	GetOneByID(context.Context, model.IDType) (T, error)
	GetManyByIDs(context.Context, []model.IDType) ([]T, error)
	Insert(context.Context, T) (T, error)
	InsertMany(context.Context, []T) ([]T, error)
	Update(context.Context, T) (T, error)
	Delete(context.Context, T) (T, error)
}

type Pagination struct {
	Limit  uint32
	Offset uint32
}

type repository[T model.BaseModel] struct {
	db bun.IDB
}

func NewRepository[T model.BaseModel](db bun.IDB) Repository[T] {
	return &repository[T]{db}
}

func (r *repository[T]) GetOneByID(ctx context.Context, id model.IDType) (T, error) {
	var m T
	qry := r.db.NewSelect().Model(&m).
		Where("?TableAlias.id = ?", id).
		Where("?TableAlias.deleted_at IS NULL")
	if injectErr := injectRelations(m, qry); injectErr != nil {
		return m, injectErr
	}
	if scanErr := qry.Scan(ctx); scanErr != nil {
		if errors.Is(scanErr, sql.ErrNoRows) {
			return m, ErrRecordNotFound
		}
		return m, scanErr
	}
	return m, nil
}

func (r *repository[T]) GetManyByIDs(ctx context.Context, ids []model.IDType) ([]T, error) {
	var m []T
	qry := r.db.NewSelect().Model(&m).
		Where("?TableAlias.id IN (?)", bun.In(ids)).
		Where("?TableAlias.deleted_at IS NULL")
	if scanErr := qry.Scan(ctx); scanErr != nil {
		if errors.Is(scanErr, sql.ErrNoRows) {
			return m, ErrRecordNotFound
		}
		return m, scanErr
	}
	return m, nil
}

func (r *repository[T]) Insert(ctx context.Context, data T) (T, error) {
	_, insertErr := transactions.GetTx(ctx, r.db).NewInsert().Model(&data).Exec(ctx)
	if insertErr != nil {
		return data, insertErr
	}
	return data, nil
}

func (r *repository[T]) InsertMany(ctx context.Context, data []T) ([]T, error) {
	_, insertErr := transactions.GetTx(ctx, r.db).NewInsert().Model(&data).Returning("id").Exec(ctx)
	if insertErr != nil {
		return data, insertErr
	}
	return data, nil
}

func (r *repository[T]) Update(ctx context.Context, data T) (T, error) {
	_, updateErr := transactions.GetTx(ctx, r.db).NewUpdate().Model(&data).
		WherePK().
		ExcludeColumn("created_at").
		Exec(ctx)
	if updateErr != nil {
		return data, updateErr
	}
	return data, nil
}

func (r *repository[T]) Delete(ctx context.Context, data T) (T, error) {
	_, updateErr := transactions.GetTx(ctx, r.db).NewUpdate().Model(&data).
		Set("deleted_at = ?", time.Now()).
		Where("id = ?", data.GetID()).
		Exec(ctx)
	if updateErr != nil {
		return data, updateErr
	}
	return data, nil
}

func injectRelations[T model.BaseModel](model T, qry *bun.SelectQuery) error {
	relations, getRelErr := getRelations(reflect.TypeOf(model))
	if getRelErr != nil {
		return getRelErr
	}
	for _, rel := range relations {
		qry = qry.Relation(rel)
	}
	return nil
}

func getRelations(t reflect.Type) ([]string, error) {
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}
	if t.Kind() != reflect.Struct {
		return nil, fmt.Errorf("%w : model must be a struct ", ErrUnsupportedModel)
	}
	var relations []string
	for i := range t.NumField() {
		field := t.Field(i)
		bunTag := field.Tag.Get("bun")
		if bunTag == "" || strings.Contains(bunTag, "inherit") {
			continue
		}
		if strings.Contains(bunTag, "rel:") {
			relations = append(relations, field.Name)
		}
	}
	return relations, nil
}
```

### `internal/repository/cursor.go`

```go
package repository

import (
	"encoding/base64"
	"encoding/json"
)

type Cursor struct {
	Timestamp int64 `json:"timestamp"`
}

func encodeCursor(c Cursor) (string, error) {
	b, marshalErr := json.Marshal(c)
	if marshalErr != nil {
		return "", ErrCursorEncodeFailed
	}
	encodedCursor := base64.RawStdEncoding.EncodeToString(b)
	return encodedCursor, nil
}

func decodeCursor(s string) (*Cursor, error) {
	b, decodeErr := base64.RawStdEncoding.DecodeString(s)
	if decodeErr != nil {
		return nil, decodeErr
	}
	var c Cursor
	if unmarshalErr := json.Unmarshal(b, &c); unmarshalErr != nil {
		return nil, ErrCursorDecodeFailed
	}
	return &c, nil
}
```

### Domain Repository Template — `internal/repository/{entity}.go`

```go
package repository

import (
	"context"

	"{project_name}/internal/model"

	"github.com/uptrace/bun"
)

type EntityRepository interface {
	Repository[model.Entity]
	GetByName(context.Context, string) (model.Entity, error)
}

type entityRepository struct {
	Repository[model.Entity]
	db bun.IDB
}

func NewEntityRepository(db bun.IDB) EntityRepository {
	return &entityRepository{
		Repository: NewRepository[model.Entity](db),
		db:         db,
	}
}

func (r *entityRepository) GetByName(ctx context.Context, name string) (model.Entity, error) {
	var entity model.Entity
	err := r.db.NewSelect().Model(&entity).
		Where("name = ?", name).
		Where("deleted_at IS NULL").
		Scan(ctx)
	if err != nil {
		return entity, err
	}
	return entity, nil
}
```

### `internal/uow/uow.go`

```go
package uow

import (
	"context"
	"database/sql"

	"{project_name}/internal/repository"
	"{project_name}/internal/uow/transactions"

	"github.com/uptrace/bun"
)

type UnitOfWork interface {
	Begin(context.Context) (UnitOfWork, error)
	Commit(context.Context) error
	Rollback(context.Context) error
	WithTransaction(context.Context, func(context.Context, UnitOfWork) error) error

	// Add repository getters per domain:
	// EntityRepository() repository.EntityRepository
}

type unitOfWork struct {
	db bun.IDB
	// entityRepository repository.EntityRepository
}

func NewUnitOfWork(db bun.IDB) UnitOfWork {
	return &unitOfWork{db: db}
}

func (u *unitOfWork) Begin(ctx context.Context) (UnitOfWork, error) {
	tx, beginErr := u.db.BeginTx(ctx, &sql.TxOptions{})
	if beginErr != nil {
		return nil, beginErr
	}
	return NewUnitOfWork(tx), nil
}

func (u *unitOfWork) Commit(_ context.Context) error {
	tx, ok := u.db.(*bun.Tx)
	if !ok {
		return ErrTransactionNotFound
	}
	return tx.Commit()
}

func (u *unitOfWork) Rollback(_ context.Context) error {
	tx, ok := u.db.(*bun.Tx)
	if !ok {
		return ErrTransactionNotFound
	}
	return tx.Rollback()
}

func (u *unitOfWork) WithTransaction(
	ctx context.Context,
	cb func(ctx context.Context, uow UnitOfWork) error,
) error {
	return u.db.RunInTx(ctx, &sql.TxOptions{}, func(txCtx context.Context, tx bun.Tx) error {
		return cb(transactions.SetTx(txCtx, tx), NewUnitOfWork(tx))
	})
}

// Lazy-initialized repository getter template:
// func (u *unitOfWork) EntityRepository() repository.EntityRepository {
// 	if u.entityRepository == nil {
// 		u.entityRepository = repository.NewEntityRepository(u.db)
// 	}
// 	return u.entityRepository
// }
```

### `internal/uow/errors.go`

```go
package uow

import "errors"

var ErrTransactionNotFound = errors.New("transaction not found")
```

### `internal/uow/transactions/tx.go`

```go
package transactions

import (
	"context"

	"github.com/uptrace/bun"
)

type txKey string

const txKeyDefault txKey = "tx"

func SetTx(ctx context.Context, tx bun.IDB) context.Context {
	return context.WithValue(ctx, txKeyDefault, tx)
}

func GetTx(ctx context.Context, db bun.IDB) bun.IDB {
	tx, ok := ctx.Value(txKeyDefault).(bun.IDB)
	if !ok {
		return db
	}
	return tx
}
```

### `internal/handler/errors.go`

```go
package handler

type ErrCode string

const (
	ErrCodeInvalidRequest ErrCode = "invalid_request"
	ErrCodeInternalServer ErrCode = "internal_server_error"
	ErrCodeNotFound       ErrCode = "data_not_found"
	ErrCodeUnauthorised   ErrCode = "unauthorised"
	ErrCodeForbidden      ErrCode = "forbidden"
	ErrCodeConflict       ErrCode = "conflict"
)

// MapError maps domain errors to API error responses.
// Import domain error packages and add error checks here:
//
// func MapError(c *fiber.Ctx, err error) error {
// 	if errors.Is(err, {domain}.ErrEntityNotFound) {
// 		return NewErrorAPIResponse(c, APIError{
// 			ErrorCode: ErrCodeNotFound,
// 			Message:   "entity not found",
// 		})
// 	}
// 	return NewErrorAPIResponse(c, APIError{
// 		ErrorCode: ErrCodeInternalServer,
// 		Message:   "internal server error",
// 	})
// }
```

### `internal/handler/response.go`

```go
package handler

import "github.com/gofiber/fiber/v2"

type APIResponse[T any] struct {
	Data    T         `json:"data,omitempty"`
	Success bool      `json:"success"`
	Error   *APIError `json:"error,omitempty"`
}

type APIError struct {
	ErrorCode ErrCode            `json:"code"`
	Message   string             `json:"message"`
	Details   []ValidationDetail `json:"details,omitempty"`
}

type ValidationDetail struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func NewSuccessAPIResponse[T any](data T) APIResponse[T] {
	return APIResponse[T]{Data: data, Success: true}
}

func NewErrorAPIResponse(c *fiber.Ctx, err APIError) error {
	errCode := fiber.ErrInternalServerError
	switch err.ErrorCode {
	case ErrCodeInvalidRequest:
		errCode = fiber.ErrBadRequest
	case ErrCodeUnauthorised:
		errCode = fiber.ErrUnauthorized
	case ErrCodeNotFound:
		errCode = fiber.ErrNotFound
	case ErrCodeForbidden:
		errCode = fiber.ErrForbidden
	case ErrCodeConflict:
		errCode = fiber.ErrConflict
	case ErrCodeInternalServer:
		errCode = fiber.ErrInternalServerError
	}
	return c.Status(errCode.Code).JSON(APIResponse[any]{Success: false, Error: &err})
}

type Pagination struct {
	NextCursor *string `json:"next_cursor,omitempty"`
	HasMore    bool    `json:"has_more"`
}

type PaginatedAPIResponse[T any] struct {
	Data       T          `json:"data"`
	Pagination Pagination `json:"pagination"`
}

func NewPaginatedAPIResponse[T any](
	data T,
	nextCursor *string,
	hasMore bool,
) PaginatedAPIResponse[T] {
	return PaginatedAPIResponse[T]{
		Data: data,
		Pagination: Pagination{
			NextCursor: nextCursor,
			HasMore:    hasMore,
		},
	}
}
```

### `internal/handler/healthcheck/handler.go`

```go
package healthcheck

import (
	"{project_name}/pkg/httpserver"

	"github.com/gofiber/fiber/v2"
)

type healthCheckHandler struct{}

func NewHealthCheckHandler() httpserver.APIHandler {
	return &healthCheckHandler{}
}

func (h *healthCheckHandler) Register(app *fiber.App) {
	group := app.Group("/")
	h.router(group)
}
```

### `internal/handler/healthcheck/router.go`

```go
package healthcheck

import "github.com/gofiber/fiber/v2"

func (h *healthCheckHandler) router(r fiber.Router) {
	r.Get("/ping", h.ping)
}
```

### `internal/handler/healthcheck/ping.go`

```go
package healthcheck

import "github.com/gofiber/fiber/v2"

func (h *healthCheckHandler) ping(c *fiber.Ctx) error {
	return c.SendString("pong")
}
```

---

## Domain Service Pattern

### `internal/service/{domain}/service.go`

```go
package {domain}

import (
	"context"

	"{project_name}/internal/dto/request"
	"{project_name}/internal/dto/response"
	"{project_name}/internal/model"
)

const (
	StatusDraft  = "draft"
	StatusActive = "active"
)

type CreateOptions struct {
	Name string
}

type UpdateOptions struct {
	ID   model.IDType
	Name *string
}

type ListOptions struct {
	Cursor *string
	Limit  uint8
}

// Service — internal-facing (used by other services and workers)
type Service interface {
	Create(ctx context.Context, opts CreateOptions) (*model.Entity, error)
	GetByID(ctx context.Context, id model.IDType) (*model.Entity, error)
}

// WebService — HTTP-facing (used by handlers, accepts/returns DTOs)
type WebService interface {
	CreateEntity(ctx context.Context, req request.CreateEntityRequest) (*response.CreateEntityResponse, error)
	GetEntity(ctx context.Context, req request.GetEntityRequest) (*response.GetEntityResponse, error)
}
```

### `internal/service/{domain}/errors.go`

```go
package {domain}

import "errors"

var (
	ErrEntityNotFound = errors.New("entity not found")
	ErrInvalidRequest = errors.New("invalid request")
)
```

### `internal/service/{domain}.go`

```go
package service

import (
	"context"
	"errors"

	"{project_name}/internal/dto/request"
	"{project_name}/internal/dto/response"
	"{project_name}/internal/model"
	"{project_name}/internal/repository"
	"{project_name}/internal/service/{domain}"
	"{project_name}/internal/uow"
	"{project_name}/pkg/logger"
)

type EntityService struct {
	uow uow.UnitOfWork
}

func NewEntityService(uow uow.UnitOfWork) {domain}.Service {
	return &EntityService{uow: uow}
}

// Service interface

func (s *EntityService) Create(ctx context.Context, opts {domain}.CreateOptions) (*model.Entity, error) {
	l := logger.GetLogger(ctx).WithFields("method", "EntityService.Create")
	entity := model.Entity{Name: opts.Name}
	inserted, insertErr := s.uow.EntityRepository().Insert(ctx, entity)
	if insertErr != nil {
		l.WithError(insertErr).Error("failed to create entity")
		return nil, insertErr
	}
	l.Info("entity created successfully")
	return &inserted, nil
}

func (s *EntityService) GetByID(ctx context.Context, id model.IDType) (*model.Entity, error) {
	l := logger.GetLogger(ctx).WithFields("method", "EntityService.GetByID")
	entity, getErr := s.uow.EntityRepository().GetOneByID(ctx, id)
	if getErr != nil {
		if errors.Is(getErr, repository.ErrRecordNotFound) {
			return nil, {domain}.ErrEntityNotFound
		}
		l.WithError(getErr).Error("failed to get entity")
		return nil, getErr
	}
	return &entity, nil
}

// WebService interface

func (s *EntityService) CreateEntity(
	ctx context.Context,
	req request.CreateEntityRequest,
) (*response.CreateEntityResponse, error) {
	entity, createErr := s.Create(ctx, {domain}.CreateOptions{Name: req.Name})
	if createErr != nil {
		return nil, createErr
	}
	resp := response.CreateEntityResponse{
		EntityResponse: response.FromEntityModel(entity),
	}
	return &resp, nil
}

func (s *EntityService) GetEntity(
	ctx context.Context,
	req request.GetEntityRequest,
) (*response.GetEntityResponse, error) {
	id := model.ParseIDFromString(req.ID)
	entity, getErr := s.GetByID(ctx, id)
	if getErr != nil {
		return nil, getErr
	}
	resp := response.GetEntityResponse{
		EntityResponse: response.FromEntityModel(entity),
	}
	return &resp, nil
}
```

---

## Handler Pattern

### `internal/handler/{domain}/handler.go`

```go
package {domain}

import (
	"{project_name}/internal/service/{domain}"
	"{project_name}/pkg/httpserver"

	"github.com/gofiber/fiber/v2"
)

type entityHandler struct {
	webService {domain}.WebService
}

func NewHandler(webService {domain}.WebService) httpserver.APIHandler {
	return &entityHandler{webService: webService}
}

func (h *entityHandler) Register(app *fiber.App) {
	group := app.Group("/api/v1/entities")
	h.router(group)
}
```

### `internal/handler/{domain}/router.go`

```go
package {domain}

import "github.com/gofiber/fiber/v2"

func (h *entityHandler) router(r fiber.Router) {
	r.Post("/", h.create)
	r.Get("/:id", h.get)
}
```

### `internal/handler/{domain}/create.go`

```go
package {domain}

import (
	"{project_name}/internal/dto/request"
	"{project_name}/internal/handler"
	"{project_name}/pkg/logger"

	"github.com/gofiber/fiber/v2"
)

func (h *entityHandler) create(c *fiber.Ctx) error {
	l := logger.GetLogger(c.UserContext()).WithFields("method", "EntityHandler.create")

	var req request.CreateEntityRequest
	if parseErr := c.BodyParser(&req); parseErr != nil {
		l.WithError(parseErr).Error("failed to parse request body")
		return handler.NewErrorAPIResponse(c, handler.APIError{
			ErrorCode: handler.ErrCodeInvalidRequest,
			Message:   "invalid request body",
		})
	}

	resp, createErr := h.webService.CreateEntity(c.UserContext(), req)
	if createErr != nil {
		l.WithError(createErr).Error("failed to create entity")
		return handler.MapError(c, createErr)
	}

	return c.Status(fiber.StatusCreated).JSON(handler.NewSuccessAPIResponse(resp))
}
```

---

## DTO Pattern

### `internal/dto/request/create_entity.go`

```go
package request

type CreateEntityRequest struct {
	Name        string `json:"name"        validate:"required,max=255"`
	Description string `json:"description"`
}
```

### `internal/dto/response/entity.go` (shared type)

```go
package response

import (
	"time"

	"{project_name}/internal/model"
)

type EntityResponse struct {
	ID          model.IDType `json:"id"`
	Name        string       `json:"name"`
	Description string       `json:"description"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

func FromEntityModel(e *model.Entity) EntityResponse {
	return EntityResponse{
		ID:          e.GetID(),
		Name:        e.Name,
		Description: e.Description,
		CreatedAt:   e.CreatedAt,
		UpdatedAt:   e.UpdatedAt,
	}
}
```

### `internal/dto/response/create_entity.go` (action-specific, embeds shared type)

```go
package response

type CreateEntityResponse struct {
	EntityResponse
}
```

---

## Task Queue (if asynq workers needed)

### `internal/service/task/queue.go`

```go
package task

import (
	"context"

	"{project_name}/pkg/logger"

	"github.com/hibiken/asynq"
)

type Key string

type Task interface {
	Key() Key
	Payload() []byte
}

type Queue interface {
	Enqueue(ctx context.Context, task Task) error
}

type queue struct {
	asynqClient *asynq.Client
}

func NewQueue(redisAddr string) Queue {
	c := asynq.NewClient(asynq.RedisClientOpt{Addr: redisAddr})
	return &queue{asynqClient: c}
}

func (q *queue) Enqueue(ctx context.Context, task Task) error {
	l := logger.GetLogger(ctx).WithFields("method", "task.Queue.Enqueue").
		WithFields("task_key", task.Key())
	t := asynq.NewTask(string(task.Key()), task.Payload())
	_, enqueueErr := q.asynqClient.Enqueue(t)
	if enqueueErr != nil {
		l.WithError(enqueueErr).Error("Failed to enqueue task")
		return enqueueErr
	}
	l.Info("successfully enqueued task")
	return nil
}
```

### `internal/service/task/processor.go`

```go
package task

import "context"

type Processor interface {
	Process(ctx context.Context, payload []byte) error
	Key() Key
}
```

### `internal/worker/task/worker.go`

```go
package taskworker

import (
	"context"

	"{project_name}/internal/service/task"
	log "{project_name}/pkg/logger"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"
)

const (
	DefaultConcurrency = 0
	DisableConcurrency = 1
)

type Worker struct {
	asynqServer *asynq.Server
	mux         *asynq.ServeMux
	logger      log.Logger
}

func NewWorker(redisAddr string, logger log.Logger, concurrency int) *Worker {
	srv := asynq.NewServer(asynq.RedisClientOpt{Addr: redisAddr}, asynq.Config{
		Concurrency: concurrency,
	})
	return &Worker{asynqServer: srv, mux: asynq.NewServeMux(), logger: logger}
}

func (w *Worker) RegisterTaskHandler(t task.Processor) {
	w.logger.Infof("Registering task %v", t.Key())
	w.mux.HandleFunc(string(t.Key()), func(ctx context.Context, asynqTask *asynq.Task) error {
		logger := w.logger.WithFields("traceID", uuid.NewString())
		ctx = log.SetLogger(ctx, logger)
		logger.Info("Processing task")
		return t.Process(ctx, asynqTask.Payload())
	})
}

func (w *Worker) Run() error {
	w.logger.Info("Starting worker")
	if runErr := w.asynqServer.Run(w.mux); runErr != nil {
		w.logger.WithError(runErr).Error("Error running worker")
		return runErr
	}
	return nil
}
```

---

## Cron Worker Pattern

### `internal/worker/{name}/worker.go`

```go
package {name}worker

import (
	"{project_name}/internal/service/{domain}"
	"{project_name}/internal/uow"
	log "{project_name}/pkg/logger"
)

type ExampleWorker struct {
	uow     uow.UnitOfWork
	service {domain}.Service
	logger  log.Logger
}

func NewExampleWorker(
	uow uow.UnitOfWork,
	logger log.Logger,
	service {domain}.Service,
) *ExampleWorker {
	return &ExampleWorker{uow: uow, service: service, logger: logger}
}
```

### `internal/worker/{name}/{job}.go`

```go
package {name}worker

import (
	"context"

	"{project_name}/pkg/logger"

	"github.com/google/uuid"
)

func (w *ExampleWorker) ProcessJob() {
	sessionID, sessErr := uuid.NewRandom()
	if sessErr != nil {
		w.logger.Error("Failed to generate session ID", sessErr)
	}
	log := w.logger.WithFields("sessionId", sessionID)
	ctx := logger.SetLogger(context.Background(), log)
	_ = ctx
	log.Info("Successfully processed job")
}
```

---

## Entrypoint — `cmd/app/main.go`

```go
package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"{project_name}/internal/config"
	"{project_name}/internal/handler/healthcheck"
	"{project_name}/internal/uow"
	"{project_name}/pkg/db"
	"{project_name}/pkg/httpserver"
	"{project_name}/pkg/logger"
)

func main() {
	cfg, cfgErr := config.ParseEnv()
	if cfgErr != nil {
		panic(cfgErr)
	}
	logMode := logger.LogModeDevelopment
	if cfg.Env == "prod" {
		logMode = logger.LogModeProduction
	}
	newLogger, loggerErr := logger.NewZapLogger(logMode)
	if loggerErr != nil {
		panic(loggerErr)
	}
	newLogger.Infof("Running in %s mode", logMode)
	defer func() {
		if syncErr := newLogger.Sync(); syncErr != nil {
			log.Fatal("Failed to sync logger", syncErr)
		}
	}()

	pg, pgErr := db.NewPG(cfg.DSN)
	if pgErr != nil {
		newLogger.Fatal(pgErr)
	}
	newLogger.Info("Database connection established")
	if migrateErr := db.PGMigrate("./migrations", cfg.DSN); migrateErr != nil {
		newLogger.Fatal(migrateErr)
	}
	newLogger.Info("Database migration completed")

	uow := uow.NewUnitOfWork(pg)
	srv := httpserver.NewHTTPServer(newLogger)

	registerHandlers(srv, uow, cfg)

	newLogger.Info("Starting HTTP Server")
	srv.Serve(cfg.Port)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	srv.Shutdown()
}

func registerHandlers(srv *httpserver.Server, uow uow.UnitOfWork, cfg *config.Config) {
	hc := healthcheck.NewHealthCheckHandler()
	srv.RegisterHandler(hc)
}
```

---

## Config Files

### `.env.example`

```
ENV=dev
PORT=8080
DSN=postgres://user:password@localhost:5432/dbname?sslmode=disable
MASTER_KEYS=key1,key2
REDIS_HOST=localhost
REDIS_PORT=6379
```

### `.gitignore`

```
.env
bin
```

### `.golangci.toml`

Use version 2 config format with these linters enabled: `asasalint`, `asciicheck`, `bidichk`, `bodyclose`, `canonicalheader`, `copyloopvar`, `cyclop`, `depguard`, `dupl`, `durationcheck`, `errcheck`, `errname`, `errorlint`, `exhaustive`, `exptostd`, `fatcontext`, `forbidigo`, `funlen`, `gocheckcompilerdirectives`, `gochecknoglobals`, `gochecknoinits`, `gochecksumtype`, `gocognit`, `goconst`, `gocritic`, `gocyclo`, `godot`, `gomoddirectives`, `goprintffuncname`, `gosec`, `govet`, `iface`, `ineffassign`, `intrange`, `loggercheck`, `makezero`, `mirror`, `mnd`, `musttag`, `nakedret`, `nestif`, `nilerr`, `nilnesserr`, `nilnil`, `noctx`, `nolintlint`, `nonamedreturns`, `nosprintfhostport`, `perfsprint`, `predeclared`, `promlinter`, `protogetter`, `reassign`, `recvcheck`, `revive`, `rowserrcheck`, `sloglint`, `spancheck`, `sqlclosecheck`, `staticcheck`, `testableexamples`, `testifylint`, `testpackage`, `tparallel`, `unconvert`, `unparam`, `unused`, `usestdlibvars`, `usetesting`, `wastedassign`, `whitespace`.

Key settings:
- `cyclop.max-complexity = 30`
- `funlen.lines = 100`, `funlen.statements = 50`
- `gocognit.min-complexity = 20`
- `govet.enable-all = true`, `disable = ["fieldalignment"]`
- `golines.max-len = 120`
- `goimports.local-prefixes = ["{project_name}"]`
- Exclude comment lints from revive/staticcheck
- Relax test file linting (bodyclose, dupl, errcheck, funlen, goconst, gosec, noctx, wrapcheck)

### Migration Template

`migrations/000001_{entity}.up.sql`:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_entities_name ON entities(name) WHERE deleted_at IS NULL;
```

`migrations/000001_{entity}.down.sql`:
```sql
DROP TABLE IF EXISTS entities;
```

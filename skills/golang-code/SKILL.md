---
name: golang-code
description: Enforce good Go (Golang) code styles and best practices. Use when writing and reviewing Go code
---

## Lint

- avoid the usage of  `nolint` unless absolutely necessary. If you must use it, provide a clear justification for why the linting rule is being ignored.

## Errors

- Never use `panic` in production code. Instead, return errors and handle them gracefully.
- Never use `err` as a variable name. Always use descriptive names for error variables to improve readability and maintainability.

#### Core Principles

- Errors as Values: Treat errors as data to be inspected, not just strings to be logged.
- Don't Just Check, Handle: If you can't fix the error, wrap it with context and return it.
- Log or Return, Never Both: Avoid duplicate logs by handling an error exactly once in the call stack.

#### Sentinel Errors

Sentinel errors are package-level variables used for stable, predictable error categories (e.g., sql.ErrNoRows).

- Definition: Use errors.New for static error values that don't need dynamic data.
- Naming: Prefix with Err (e.g., ErrNotFound, ErrUnauthorized).
- Modern Comparison: Always use errors.Is(err, target) instead of ==. This ensures the check works even if the error has been wrapped.

#### Error Wrapping

Wrapping adds context to an error as it moves up the stack without losing the original error's identity.

- Syntax: Use fmt.Errorf("doing something: %w", err) with the %w verb.
- When to Wrap: Wrap when you can add useful context, like loop indices or parameter values.
- Avoid Over-wrapping: Don't wrap if you aren't adding new, actionable information; it clutters the error chain.

#### Implementation Template

```go
var ErrResourceNotFound = errors.New("resource not found") // Sentinel

func FetchData(id string) (*Data, error) {
    res, err := db.Get(id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, fmt.Errorf("id %s: %w", id, ErrResourceNotFound) // Wrap with sentinel
        }
        return nil, fmt.Errorf("failed to fetch data for %s: %w", id, err) // Wrap with context
    }
    return res, nil
}

// Caller Side
data, err := FetchData("123")
if errors.Is(err, ErrResourceNotFound) {
    // Return 404
} else if err != nil {
    // Handle generic error
}
```

## Naming Conventions

#### Identifiers

- Use `camelCase` for unexported identifiers, `PascalCase` for exported identifiers. Never use `snake_case`, `SCREAMING_SNAKE_CASE`, or `ALLUPPERCASE`.
- Acronyms/initialisms (API, URL, HTTP, ID) must use consistent case: `apiKey` or `APIKey`, never `ApiKey`. Write `userID` not `userId`.
- Stick to ASCII letters. Use `pi` not `π`, `naiveBayes` not `naïveBayes`.
- Don't shadow builtin types (`int`, `bool`, `any`) or builtin functions (`min`, `max`, `len`, `clear`).
- Don't include the type in the name: use `count` not `intCount`, `results` not `resultSlice`. Exception: type-conversion disambiguation like `userIDStr := strconv.Itoa(userID)`.
- Avoid clashing with stdlib package names you're importing (e.g., don't name a variable `url` if importing `net/url`).

#### Identifier Length

- Scope drives length: short-lived, narrow-scope variables (loop iterators, short functions) can use short/single-letter names (`p`, `i`). Wider scope or farther usage demands more descriptive names (`count`, `sum`, `peopleCount`).

#### Packages

- Use lowercase ASCII letters and numbers only. No `camelCase`, no underscores: `ordermanager` not `order_manager`.
- Keep names short, ideally one word nouns (`orders`, `customer`, `slug`). Abbreviations are OK for long names (`strconv`, `expvar`).
- Avoid catch-all names like `common`, `util`, `helpers`, `types`, `interfaces` — they encourage large blast-radius packages. Break them into focused packages with clear names.
- Don't reuse stdlib package names or Go special directory names (`internal`, `vendor`, `testdata`).

#### Files

- Filenames should be lowercase, ideally one word (`cookie.go`, `server.go`). For multi-word names, either concatenate (`routingindex.go`) or use underscores (`routing_index.go`) — pick one and stay consistent. Reserve underscores for special suffixes (`_test.go`, `_linux.go`).

#### Avoiding Chatter

- Don't repeat the package name in exported identifiers: `customer.New()` not `customer.NewCustomer()`, `customer.Address` not `customer.CustomerAddress`.
- Same for methods: on a `Token` type, use `Validate()` not `ValidateToken()`, `IsExpired()` not `IsTokenExpired()`.
- Exception: it's acceptable when the exported type shares the package name (e.g., `time.Time`, `context.Context`).

#### Method Receivers

- Use short names (1–3 chars), typically an abbreviation of the type: `o` for `Order`, `hs` for `HighScore`.
- Never use `self`, `this`, or `me`.
- Be consistent: all methods on the same type must use the same receiver name.

#### Getters and Setters

- Avoid getters/setters unless exposing unexported fields. Prefix setters with `Set` but do NOT prefix getters with `Get`:

```go
func (c *Customer) Address() string       { return c.address }
func (c *Customer) SetAddress(addr string) { c.address = addr }
```

#### Interfaces

- Single-method interfaces should be named with the method name plus `-er` suffix: `Reader`, `Writer`, `Authorizer`, `Authenticator`.
- Don't suffix interface names with `Interface`: use `Authorizer` not `AuthorizerInterface`.

#### Export Discipline

- Default to unexported identifiers. Only export when code outside the package needs access.
- In `main` packages, nearly everything should be unexported (exception: struct fields needed by reflection-based packages like `encoding/json`).

## Anti-Patterns

- global variables are anti-patterns and should be avoided. They can lead to unexpected side effects and make code harder to test and maintain. Instead, use dependency injection or other design patterns to manage state and dependencies in a more controlled manner.
- init() functions are anti-patterns and should be avoided. They can make code harder to understand and maintain, as they can execute code before the main function runs. Instead, use explicit initialization functions or constructors to set up your application state in a more controlled and predictable manner.

## Pointers

- favour value semantics by default and use pointers when a specific need arises
- only use when need to modify the original data or want to avoid copying large data structures
- always check if pointer is nil before dereferencing
- Slices, maps, and channels are already reference types internally, meaning they share the same underlying data. Passing a pointer to a slice (*[]int) is rarely necessary and considered less idiomatic, except in rare cases where you need to change the slice's header (e.g., re-slicing with append and reassigning the variable in the caller).

## Function Signature

#### Parameter order

- The general order is to place standard, required parameters first, followed by optional parameters, with specific conventions for a few key types.

Recommended Parameter Order

- context.Context: The context.Context should always be the first parameter in functions that require it for cancellation or propagating request-scoped values.
- Input/Output (I/O) Writers/Readers: When a function writes to an io.Writer or reads from an io.Reader, these types are typically placed early in the signature, often right after the context (if present). The destination usually comes before the input data to follow the traditional computer science pattern of destination before source (e.g., io.Copy(dst, src)).
- Core, Required Parameters: The most significant or frequently used required parameters should follow the I/O types. A good rule of thumb is to place the "object being operated on" or the primary data structure being modified as one of the first parameters (if not using a method receiver).
- Optional Parameters/Functional Options: Optional configurations are typically handled using a functional options pattern, where a ...Option variadic parameter or a dedicated options struct is placed as the last parameter.
- Variadic Parameters: Any variadic parameters (...T) must be the final incoming parameter in the function signature according to the Go specification.

General Guidance

- Limit Parameters: Aim for functions with a small number of parameters (ideally two or three). If a function requires many parameters, consider refactoring your API to use a struct or the functional options pattern to group related arguments logically.
- Consistency: Be consistent within your project and team. Following a predictable order makes code easier to read, especially in languages without named parameters.
- Return Order: For return values, the error type (error) is almost universally returned as the last value in a multiple-return signature (e.g., (value, error)).

## Lint

- if there exists a `.golangci.yml` or `.golangci.toml` file, this means the project has golangci-lint setup. In this case you must run the linter (for example check Makefile or  "golangci-lint run") and fix any linting issues before submitting a PR. If there is no such file, you can ignore this rule.

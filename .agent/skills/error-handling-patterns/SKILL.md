---
name: error-handling-patterns
description: Master error handling patterns across languages including exceptions, Result types, error propagation, and graceful degradation to build resilient applications. Use when implementing error handling, designing APIs, or improving application reliability.
---

# Error Handling Patterns

## When to use this skill
- Implementing error handling in new features
- Designing error-resilient APIs
- Debugging production issues
- Improving application reliability
- Creating better error messages for users and developers
- Implementing retry and circuit breaker patterns
- Handling async/concurrent errors
- Building fault-tolerant distributed systems

## Core Concepts

### 1. error Handling Philosophies
- **Exceptions** (Python, JS, Java): Traditional try-catch. Good for unexpected errors. Disrupts control flow.
- **Result Types** (Rust, Elm, modern TS): Explicit success/failure. Functional approach. Good for expected errors/validation.
- **Error Codes** (Go, C): Requires discipline. Explicit checks.
- **Option/Maybe** (Rust, Haskell): For nullable values.

### 2. Error Categories
- **Recoverable**: Network timeouts, missing files, invalid input. *Action: Retry, prompt user, fallback.*
- **Unrecoverable**: OOM, Stack overflow, programming bugs. *Action: Crash safely, log, alert.*

## Universal Patterns

### 1. Circuit Breaker
Prevent cascading failures in distributed systems.

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout_seconds=60):
        self.state = "closed" # closed, open, half_open
        self.failure_count = 0
        self.threshold = failure_threshold
        # ... implementation details
    
    def call(self, func):
        if self.state == "open": raise Exception("Circuit Open")
        try:
            return func()
        except:
            self.failure_count += 1
            if self.failure_count >= self.threshold: self.state = "open"
            raise
```

### 2. Error Aggregation
Collect multiple errors instead of failing on the first (e.g., form validation).

```typescript
class ErrorCollector {
  private errors: Error[] = [];
  add(error: Error) { this.errors.push(error); }
  throw() { if (this.errors.length) throw new AggregateError(this.errors); }
}
```

### 3. Graceful Degradation
Provide fallback functionality when errors occur.

```python
def get_user_profile(user_id):
    try:
        return fetch_from_database(user_id)
    except DbError:
        return fetch_from_cache(user_id) # Fallback
```

## Language-Specific Starters

### Python
Use a custom exception hierarchy and context managers.

```python
class ApplicationError(Exception):
    """Base exception for all application errors."""
    def __init__(self, message: str, code: str = None, details: dict = None):
        super().__init__(message)
        self.code = code
        self.details = details or {}

class NotFoundError(ApplicationError):
    pass
    
# Usage with Context Manager
@contextmanager
def transaction(session):
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
```

### TypeScript/JavaScript
Use custom error classes or Result types for functional code.

```typescript
// Custom Error
class AppError extends Error {
  constructor(message: string, public code: string, public statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Result Pattern
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
const Ok = <T>(v: T): Result<T, never> => ({ ok: true, value: v });
const Err = <E>(e: E): Result<never, E> => ({ ok: false, error: e });
```

### Go
Explicit error returns and sentinel errors.

```go
var ErrNotFound = errors.New("not found")

func getUser(id string) (*User, error) {
    if user == nil {
        return nil, fmt.Errorf("query fail: %w", ErrNotFound)
    }
    return user, nil
}
```

## Best Practices Checklist

- [ ] **Fail Fast**: Validate input early.
- [ ] **Preserve Context**: Include stack traces (`from e` in Python, `cause` in JS) and metadata.
- [ ] **Meaningful Messages**: Explain *why* it failed and how to fix it.
- [ ] **Log appropriately**: Don't log expected validation errors as ERROR.
- [ ] **Clean Resources**: Use `finally`, `defer`, or context managers.
- [ ] **Type Safety**: Use typed errors where possible.
- [ ] **Don't Swallow**: Never use empty `except`/`catch` blocks.

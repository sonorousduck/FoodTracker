# FoodTracker Backend Guidelines

## Project Overview
NestJS REST API built with TypeScript. Provides food tracking, nutrition data, and user management endpoints. Uses class-validator for validation and exposes DTOs that sync to the frontend.

## Project Structure
```
foodtracker-backend/
├── src/
│   ├── [feature]/       # Feature modules (food, auth, user, etc.)
│   │   ├── dto/         # Data Transfer Objects (validated with class-validator)
│   │   ├── entities/    # Database entities
│   │   ├── *.controller.ts  # HTTP route handlers
│   │   ├── *.service.ts     # Business logic
│   │   ├── *.module.ts      # NestJS module definition
│   │   └── *.spec.ts        # Unit tests
│   └── main.ts          # Application entry point
├── test/                # E2E tests
└── dist/                # Build output
```

## Critical Workflows

### After Adding/Modifying DTOs
**IMPORTANT**: When you create or modify DTOs in `src/*/dto/`, you MUST regenerate frontend types:
```bash
bash ../generate-dtos.sh
```
Run this from the project root. This syncs TypeScript types to the frontend automatically.

### Before Completing Any Task
1. Run `yarn lint` to check for linting errors
2. Run `yarn test` to ensure all unit tests pass
3. Run `yarn test:e2e` if you modified API endpoints
4. Fix any failures before marking the task complete

## Development Commands
- **Install dependencies**: `yarn install`
- **Start dev server**: `yarn start:dev` (with hot reload)
- **Build**: `yarn build`
- **Lint**: `yarn lint`
- **Format**: `yarn format`
- **Unit tests**: `yarn test`
- **E2E tests**: `yarn test:e2e`
- **Coverage**: `yarn test:cov`

## Code Standards

### Type Safety
- **Never use `any`** - Use explicit types, generics, or proper type narrowing
- DTOs must use class-validator decorators (`@IsString()`, `@IsNumber()`, etc.)
- Entities should have proper TypeORM decorators
- Services should have proper dependency injection types

### File Naming
- All filenames are **lowercase** (e.g., `goal.service.ts`, `auth.controller.ts`)
- Controllers: `feature.controller.ts`
- Services: `feature.service.ts`
- DTOs: `descriptive-name.dto.ts`
- Entities: `feature.entity.ts`
- Modules: `feature.module.ts`
- Tests: `feature.service.spec.ts` or `feature.controller.spec.ts`

### NestJS Best Practices
- **Module organization**: Each feature gets its own module with related controllers/services
- **Thin controllers**: Route handlers should delegate to services, not contain business logic
- **Dependency injection**: Never instantiate services directly - inject via constructor
- **DTOs everywhere**: Use DTOs for request/response validation
- **Validation at entry**: Use `ValidationPipe` in controllers, not in services
- **Single responsibility**: Keep services focused on one domain concept

### Testing
- **Unit tests**: Place `*.spec.ts` files alongside source files
- **E2E tests**: Place in `test/` directory, name `*.e2e-spec.ts`
- Use Jest for all testing
- Mock external dependencies in unit tests
- **Always run tests after code changes**

### Formatting
- Follow Prettier config: `semi: true`, `singleQuote: true`, `trailingComma: all`
- Run `yarn format` to auto-format code
- ESLint enforces additional rules via `eslint.config.mjs`

## Architecture Patterns
- **Controllers**: Handle HTTP concerns (routing, request/response transformation)
- **Services**: Contain business logic and data operations
- **DTOs**: Define request/response shapes with validation
- **Entities**: Map to database tables (TypeORM)
- **Modules**: Wire together providers and controllers for a feature
- **Guards**: Handle authentication/authorization
- **Interceptors**: Transform responses or handle cross-cutting concerns
- **Pipes**: Validate and transform input data

## DTO Best Practices
- Use class-validator decorators for all validation
- Export DTOs so frontend can import them
- Use descriptive names (e.g., `CreateFoodDto`, `UpdateMeasurementDto`)
- Include JSDoc comments for complex fields
- After changes, ALWAYS run `bash ../generate-dtos.sh`

## Common Pitfalls
- Don't put business logic in controllers
- Don't forget to register providers in module files
- Don't skip DTO validation - always use ValidationPipe
- Don't forget to regenerate frontend types after DTO changes
- Don't instantiate services manually - use dependency injection
- Don't skip running tests before completing tasks
- Don't commit with linting errors

## Database Operations
- Use repository pattern (TypeORM)
- Inject repositories via `@InjectRepository(Entity)`
- Use query builders for complex queries
- Handle database errors appropriately
- Consider transactions for multi-step operations

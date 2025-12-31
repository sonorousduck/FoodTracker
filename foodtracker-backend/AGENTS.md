# Repository Guidelines

## Scope
This guide applies to `foodtracker-backend/` (NestJS + TypeScript).

## Project Structure & Modules
- Source: `foodtracker-backend/src` (Nest modules, controllers, services, DTOs).
- Tests: `foodtracker-backend/test` (E2E) and `foodtracker-backend/src/**/*.spec.ts` (unit).
- Config: `foodtracker-backend/tsconfig*.json`, `foodtracker-backend/eslint.config.mjs`, `foodtracker-backend/.prettierrc`.

## Build, Test, and Development Commands
- Install: `yarn install`
- Dev server: `yarn start:dev`
- Build: `yarn build`
- Lint/format: `yarn lint`, `yarn format`
- Tests: `yarn test`, `yarn test:e2e`, `yarn test:cov`

## NestJS Best Practices
- Keep each feature in its own module; wire providers/controllers in the module file.
- Use DTOs with `class-validator`/`class-transformer` and keep validation in controllers.
- Prefer dependency injection over direct instantiation; keep services small and focused.
- Avoid `any` casts; use explicit types, generics, and proper narrowing.
- Create shared DTOs in the backend and run `bash ../generate-dtos.sh` after adding or changing them to sync types for the frontend.

## Testing Guidelines
- Unit tests: `*.spec.ts` alongside sources; use Jest.
- E2E tests: `foodtracker-backend/test` with `jest-e2e`.
- After any code or test change, run `yarn test` and fix failures before handoff.

## Naming & Formatting
- File names are all lowercase (e.g., `goal.service.ts`, `auth.controller.ts`).
- Follow Prettier config (`semi: true`, `singleQuote: true`, `trailingComma: all`).
- Keep route handlers thin; move logic to services.

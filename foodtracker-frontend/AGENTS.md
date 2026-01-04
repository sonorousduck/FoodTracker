# Repository Guidelines

## Scope
This guide applies to `foodtracker-frontend/` (Expo + React Native + TypeScript).

## Project Structure & Modules
- Routes: `foodtracker-frontend/app` (Expo Router file-based routing).
- UI: `foodtracker-frontend/components`, shared logic in `foodtracker-frontend/hooks` and `foodtracker-frontend/lib`.
- Assets: `foodtracker-frontend/assets`; types: `foodtracker-frontend/types` (generated).
- DTOs are generated from the backend; after backend DTO changes, run `bash ../generate-dtos.sh`.
- When sending data to the backend, always use the generated types from `foodtracker-frontend/types`.

## Build, Test, and Development Commands
- Install: `yarn install`
- Dev server: `yarn start`
- Platform runs: `yarn android`, `yarn ios`, `yarn web`
- Lint: `yarn lint`
- Tests: `yarn test` (watch: `yarn test:watch`)

## Expo/React Native Best Practices
- Keep screens lean; move logic into hooks and shared modules.
- Use `Platform.OS` for platform checks; avoid relying on env vars at runtime.
- Avoid `any` casts; prefer precise types, generics, and `unknown` with narrowing.
- Respect Expo Router conventions for route naming and layout files.

## Testing Guidelines
- Tests use `jest-expo` with `@testing-library/react-native`.
- Place tests in `**/__tests__` and name them `*.test.tsx`.
- After any code or test change, run `yarn test` and fix failures before handoff.

## Naming & Formatting
- File names are all lowercase (e.g., `haptictab.test.tsx`, `addfood.tsx`).
- Follow the ESLint Expo config via `yarn lint`.

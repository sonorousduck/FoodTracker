# FoodTracker Frontend Guidelines

## Project Overview
React Native mobile app built with Expo and TypeScript. Uses file-based routing (Expo Router) and consumes the NestJS backend API.

## Project Structure
```
foodtracker-frontend/
├── app/              # Routes (Expo Router file-based routing)
├── components/       # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Shared utilities and business logic
├── types/            # Generated TypeScript types from backend DTOs
├── assets/           # Images, fonts, and static files
└── constants/        # App-wide constants
```

## Critical Workflows

### After Backend DTO Changes
**IMPORTANT**: When backend DTOs are modified, you MUST regenerate frontend types:
```bash
bash ../generate-dtos.sh
```
Run this from the project root. Always check if DTO changes affect the frontend before completing a task.

### Before Completing Any Task
1. Run `yarn lint` to check for linting errors
2. Run `yarn test` to ensure all tests pass
3. Fix any failures before marking the task complete

## Development Commands
- **Install dependencies**: `yarn install`
- **Start dev server**: `yarn start`
- **Run on platform**: `yarn android` | `yarn ios` | `yarn web`
- **Lint**: `yarn lint`
- **Test**: `yarn test`
- **Test (watch mode)**: `yarn test:watch`

## Code Standards

### Type Safety
- **Never use `any`** - Use precise types, generics, or `unknown` with type narrowing
- Always use generated types from `types/` when communicating with backend
- Prefer interfaces for component props, types for unions/primitives

### File Naming
- All filenames are **lowercase** (e.g., `addfood.tsx`, `haptictab.test.tsx`)
- Component files: `componentname.tsx`
- Test files: `componentname.test.tsx` in `__tests__/` directories

### React Native Best Practices
- Keep screens lean - move business logic to custom hooks (`hooks/`)
- Extract reusable UI into components (`components/`)
- Use `Platform.OS` for platform-specific code (not environment variables)
- Follow Expo Router conventions for route naming and layout files
- Avoid inline styles - use StyleSheet.create()

### Testing
- Tests use `jest-expo` + `@testing-library/react-native`
- Place tests in `**/__tests__/` directories
- Name tests `*.test.tsx`
- Test user interactions, not implementation details
- **Always run tests after code changes**

## Architecture Patterns
- **Hooks for logic**: Extract stateful logic and side effects into custom hooks
- **Components for UI**: Keep components focused on rendering and user interaction
- **Lib for utilities**: Pure functions and shared business logic go in `lib/`
- **Type-first**: Define types before implementing features

## Common Pitfalls
- Don't forget to regenerate types after backend changes
- Don't use runtime environment variables for platform checks (use Platform.OS)
- Don't mix business logic in screen components
- Don't skip running tests before completing tasks
- Don't commit with linting errors

## Expo Router Specifics
- File system defines routes (app/ directory)
- Use `(tabs)` for tab layouts, `_layout.tsx` for layout files
- Navigation via `router.push()`, `router.replace()`, etc.
- Dynamic routes: `[id].tsx` syntax

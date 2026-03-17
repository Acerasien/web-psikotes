# Test Routing Refactor Plan

## Current Issues

1. **TestRoutes.jsx** - Imports unused components (should only contain route config)
2. **TestTypeRouter.jsx** - Makes unnecessary API call to get test_code
3. **Inconsistent navigation** - Mix of `navigate()`, `window.location.href`, `onFinish` props
4. **StandardTest missing prop** - Doesn't receive `assignmentId` in default case
5. **Duplicated imports** - Both files import same test components

## Proposed Solution

### Option A: Backend-driven routing (Recommended) ✅

Since `/start` endpoint now returns `test_code`, we can simplify:

**TestTypeRouter.jsx:**
- Remove API call
- Get test_code from a context or pass via route state
- Or: Single `TestContainer` component that fetches data and renders appropriate component

### Option B: URL-based routing

Change URL structure to include test type:
- `/test/:testCode/:assignmentId` 
- Example: `/test/LEAD/123`, `/test/SPEED/456`

### Option C: Keep current but fix issues

- Fix StandardTest missing assignmentId
- Standardize navigation (all use `navigate()`)
- Clean up unused imports

## Recommended Implementation (Option A - Simplified)

Create a single `TestSession` component that:
1. Fetches test data from `/start` endpoint
2. Renders appropriate test component based on `testData.test_code`
3. All tests use `useNavigate()` internally (no `onFinish` props needed)

## Files to Update

1. `client/src/routes/TestRoutes.jsx` - Simplify to single route
2. `client/src/routes/TestTypeRouter.jsx` - Rename to `TestSession.jsx`
3. Remove `onFinish` props from all test components
4. Standardize all tests to use `useNavigate()`

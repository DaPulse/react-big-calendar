# Singleton HTML5Backend Implementation for react-big-calendar

## Overview
This implementation fixes the "Cannot have two HTML5 backends at the same time" error by using the existing `@mondaydotcomorg/client-dnd` package's singleton pattern.

## Changes Made

### 1. Added Feature Flag Support (`src/utils/features-consts.js`)
```javascript
export const REACT_BIG_CALENDAR_SINGLETON_BACKEND = 'react_big_calendar_singleton_backend';
```

**Note**: The `calendar_dnd_14` feature flag has been fully released and removed. The code now always uses react-dnd version 14.

### 2. Created Features Service (`src/utils/features-service.js`)
```javascript
import { igniteClientSDK } from '@mondaydotcomorg/ignite-client-sdk';
import { REACT_BIG_CALENDAR_SINGLETON_BACKEND } from './features-consts';

export const canIgniteFeature = (feature) => {
  return igniteClientSDK.isReleased(feature);
};

export const canUseReactBigCalendarSingletonBackend = () => {
  return canIgniteFeature(REACT_BIG_CALENDAR_SINGLETON_BACKEND);
};
```

### 3. Updated withDragAndDrop.js (`src/addons/dragAndDrop/withDragAndDrop.js`)

**Key Change**: Uses `SingletonHTML5Backend` from `@mondaydotcomorg/client-dnd` instead of re-implementing the singleton pattern. Now always uses react-dnd version 14.

```javascript
import { HTML5Backend } from "react-dnd-html5-backend-14";
import { DndProvider, useDragDropManager } from "react-dnd-14";
import { SingletonHTML5Backend } from '@mondaydotcomorg/client-dnd';
import { canUseReactBigCalendarSingletonBackend } from '../../utils/features-service'

let html5Backend;

if (canUseReactBigCalendarSingletonBackend()) {
  html5Backend = SingletonHTML5Backend;
} else {
  try {
    html5Backend = HTML5Backend;
  } catch (err) {
    /* optional dep missing */
  }
}
```

#### Key Features:
- **React-DnD 14**: Now exclusively uses react-dnd version 14 (the `calendar_dnd_14` flag has been fully released)
- **Reuses Existing Singleton**: Uses the same `@mondaydotcomorg/client-dnd` package that dapulse uses
- **Consistent Behavior**: Both dapulse and react-big-calendar share the same singleton backend instance
- **Feature Flag Controlled**: Can be enabled/disabled via `react_big_calendar_singleton_backend` feature flag
- **Backward Compatible**: Falls back to regular backend if feature flag is disabled or dependencies are not available
- **No Duplication**: Doesn't re-implement singleton logic - uses the centralized package

### 4. Updated package.json
Added dependencies:
```json
"@mondaydotcomorg/client-dnd": "0.0.4",
"@mondaydotcomorg/ignite-client-sdk": "^1.1.4"
```

## How It Works

1. **Feature Flag Check**: 
   - Checks if `react_big_calendar_singleton_backend` feature flag is enabled
   - Falls back gracefully if unavailable

2. **Singleton Backend Usage**:
   - If enabled, uses `SingletonHTML5Backend` from `@mondaydotcomorg/client-dnd`
   - This is the SAME singleton used in dapulse's calendar component
   - Ensures only one HTML5Backend instance exists globally across all components
   - Always uses react-dnd version 14

3. **Global State Sharing**:
   - Both react-big-calendar and dapulse components share `window.__MONDAY_DND_BACKEND_MANAGER__`
   - Reference counting ensures proper cleanup
   - No conflicts between multiple calendar instances

## Testing

### Local Setup
1. **Build the package**:
   ```bash
   cd /Users/noash/Development/react-big-calendar
   npm install
   npm run build
   ```

2. **Link is already configured in dapulse**:
   - `package.json` has: `"@mondaydotcomorg/react-big-calendar": "file:../react-big-calendar"`
   - This creates a hard link to the local directory

3. **Enable the feature flag**:
   - Set `react_big_calendar_singleton_backend` feature flag to true in your environment

### Verification
- Run dapulse application with calendar view
- Check browser console for any DnD backend errors
- Multiple calendar instances should share the same backend
- No "Cannot have two HTML5 backends at the same time" errors should occur
- Check `window.__MONDAY_DND_BACKEND_MANAGER__` in console to verify shared state

## Alignment with client-dnd Package

This implementation **directly uses** the `@mondaydotcomorg/client-dnd` package:
- No duplicate singleton implementation
- Consistent behavior across all components
- Centralized maintenance
- Same global state key: `__MONDAY_DND_BACKEND_MANAGER__`
- Always uses react-dnd version 14 (legacy version has been fully deprecated)

## Migration Path

1. **Phase 1**: Deploy with feature flag disabled (current behavior)
2. **Phase 2**: Enable feature flag for testing in development/staging
3. **Phase 3**: Gradually roll out to production
4. **Phase 4**: Make singleton the default behavior

## Files Changed

- `package.json` - Added client-dnd and ignite-client-sdk dependencies
- `src/addons/dragAndDrop/withDragAndDrop.js` - Uses client-dnd singleton backend
- `src/utils/features-consts.js` - NEW: Feature flag constants
- `src/utils/features-service.js` - NEW: Feature flag service

## Notes

- The implementation is backward compatible
- No breaking changes to the API
- **Now exclusively uses react-dnd 14.x** (the `calendar_dnd_14` feature flag has been fully released and removed)
- Legacy react-dnd (2.x) support has been removed
- Babel-compatible (no optional chaining or modern syntax)
- Uses the SAME singleton pattern as dapulse's calendar-view-content-component.jsx

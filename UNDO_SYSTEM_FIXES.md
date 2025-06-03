# Undo System Fixes

## Issues Resolved

### Issue 1: Double Notifications from Manual UI Updates

**Problem**: When manually updating stock counts from the UI, users received two notifications:

1. One with undo option (from InputCountDrawer)
2. One without undo option (from WebsocketListener)

**Root Cause**: Multiple components were listening to inventory updates and creating notifications:

- `InputCountDrawer` - Created undoable notification for manual updates
- `WebsocketListener` - Created basic notification for ALL updates
- `ChangeLog` page - Created info notification for ALL updates

**Solution**:

- Enhanced `WebsocketListener` to detect manual UI updates and skip creating notifications for them
- Added logic: `method === "ui" && userId === currentUserId` to identify manual updates
- Removed notification creation from `ChangeLog` page (keeps table updates only)

### Issue 2: Voice Commands Missing Undo Functionality

**Problem**: Voice command updates showed notifications without undo buttons.

**Root Cause**: Voice commands were processed through `WebsocketListener` but only created basic notifications without undo functionality.

**Solution**:

- Enhanced `WebsocketListener` to detect voice updates (`method === "voice"`)
- Created undoable notifications for voice commands with proper undo functionality
- Added "Voice:" prefix to distinguish voice command notifications

## Implementation Details

### Enhanced WebsocketListener Logic

```typescript
// Only show notifications for updates that didn't originate from manual UI actions
const currentUserId = session?.user?.id;
const isManualUIUpdate = method === "ui" && userId === currentUserId;

if (!isManualUIUpdate) {
  const itemName = name || item || `Item ${id}`;

  // For voice/API updates, create undoable notifications
  if (method === "voice" && previousQuantity !== undefined) {
    // Creates undoable notification with undo functionality
    addUndoableNotification(
      "success",
      `Voice: ${itemName} updated from ${previousQuantity} to ${quantity} ${unit}`,
      {
        label: "Undo",
        action: createUndoFunction(),
        actionId: undoableAction.id,
      },
      8000
    );
  } else {
    // For other non-manual updates (API, system), show regular notifications
    addNotification("success", `${itemName} updated to ${quantity} ${unit}`);
  }
}
```

### Updated Notification Flow

| Update Source                | Notification Source | Type    | Has Undo | Notes                  |
| ---------------------------- | ------------------- | ------- | -------- | ---------------------- |
| Manual UI (InputCountDrawer) | InputCountDrawer    | Success | ✅ Yes   | User-initiated via UI  |
| Voice Commands               | WebsocketListener   | Success | ✅ Yes   | Prefixed with "Voice:" |
| API/System Updates           | WebsocketListener   | Success | ❌ No    | External/automated     |
| Bulk Operations              | WebsocketListener   | Success | ❌ No    | Multiple items         |

### Eliminated Duplicate Sources

- ✅ **WebsocketListener**: Now smart about when to show notifications
- ✅ **ChangeLog Page**: No longer creates notifications (table-only updates)
- ✅ **InputCountDrawer**: Continues creating undoable notifications for manual updates

## Testing Results

### Manual UI Updates

- ✅ Single notification with undo button
- ✅ No duplicate notifications
- ✅ Proper undo functionality

### Voice Commands

- ✅ Single notification with undo button
- ✅ "Voice:" prefix for clarity
- ✅ Proper undo functionality
- ✅ Undo reverts to previous quantity

### Other Updates (API/System)

- ✅ Single notification without undo
- ✅ No unnecessary undo options for automated updates

## Benefits

1. **Clean User Experience**: No more confusing duplicate notifications
2. **Consistent Undo Support**: Both manual and voice updates now have undo
3. **Clear Source Identification**: Voice commands are clearly labeled
4. **Appropriate Undo Scope**: Only user-initiated actions have undo options
5. **Maintainable Code**: Centralized notification logic in WebsocketListener

## Future Enhancements

1. **Bulk Voice Commands**: Add undo support for multi-item voice operations
2. **Collaborative Undo**: Handle undo when multiple users are active
3. **Smart Grouping**: Group related voice commands for batch undo
4. **Undo Timeouts**: Different undo timeouts based on update magnitude

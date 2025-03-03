# Command Recognition Implementation

## Architecture Overview

### 1. Streaming Audio Processing
- Use smaller, frequent audio chunks (2-4KB) 
- Better pipeline management with fewer options
- Improved error handling and rate limiting
- Fix MIME type issues ('audio/webm' instead of 'webm')

### 2. Two-Stage Recognition
- Fast path: Local keyword detection for interruptions
- Deep path: Full ASR + NLP for complete commands
- Progressive UI feedback on recognition status

### 3. Error Recovery
- Add exponential backoff for failed connections
- Implement automatic connection recovery
- Enhanced debugging with proper parameter formats

### 4. Command Handling
- Buffer for command context history
- Support for command correction/confirmation
- Interruption handling with state management

## Implementation Path
1. ✅ Fix empty transcripts with proper format settings
2. ✅ Improve WebSocket connectivity reliability
3. ✓ Add proper error handling and rate limiting
4. ○ Implement local keyword detection for speed
5. ○ Add command context management
6. ○ Implement UI for command confirmation


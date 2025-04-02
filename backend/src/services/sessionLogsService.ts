// backend/src/services/sessionLogsService.ts
import { v4 as uuidv4 } from 'uuid';
import { 
  createTranscriptLog, 
  createSystemActionLog, 
  getSessionLogs, 
  getUserSessions,
} from '../models/SessionLog';

// Cache the current session ID
let currentSessionId: string | null = null;

/**
 * Get or create a new session ID
 */
export const getSessionId = () => {
  if (!currentSessionId) {
    currentSessionId = uuidv4();
  }
  return currentSessionId;
};

/**
 * Reset the current session ID
 */
export const resetSessionId = () => {
  currentSessionId = uuidv4();
  return currentSessionId;
};

/**
 * Validates if a string is a valid UUID
 */
const isValidUUID = (uuid: string): boolean => {
  try {
    // Split string into sections
    const sections = uuid.split('-');
    
    // Check if we have 5 sections
    if (sections.length !== 5) return false;
    
    // Check lengths of each section
    const [s1, s2, s3, s4, s5] = sections;
    if (s1.length !== 8 || s2.length !== 4 || s3.length !== 4 || s4.length !== 4 || s5.length !== 12) {
      return false;
    }
    
    // Check if all characters are valid hex
    const validHex = /^[0-9a-f]+$/i;
    if (!sections.every(section => validHex.test(section))) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Log a transcript entry to the database
 */
export const logTranscript = async (
  text: string, 
  isFinal: boolean, 
  confidence: number,
  userId?: string
) => {
  const sessionId = getSessionId();
  
  // Ensure we have a valid session ID
  if (!sessionId) {
    console.error('Failed to generate session ID');
    return { success: false, error: 'Failed to generate session ID' };
  }
  
  console.log(`Logging transcript to database: sessionId=${sessionId}, userId=${userId || 'anonymous'}, text="${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
  
  try {
    // Only include userId if it's a valid UUID
    const logData = {
      text,
      isFinal,
      confidence,
      timestamp: Date.now(),
      sessionId,
      ...(userId && isValidUUID(userId) ? { userId } : {})
    };

    await createTranscriptLog(logData);
    console.log(`📝 Logged transcript to database: "${text}"`);
    return { success: true };
  } catch (error) {
    console.error('Error logging transcript:', error);
    return { success: false, error };
  }
};

/**
 * Log a system action to the database
 */
export const logSystemAction = async (
  action: string, 
  details: string, 
  status: 'success' | 'error' | 'pending' | 'info' = 'info',
  userId?: string
) => {
  const sessionId = getSessionId();
  
  // Ensure we have a valid session ID
  if (!sessionId) {
    console.error('Failed to generate session ID');
    return { success: false, error: 'Failed to generate session ID' };
  }
  
  console.log(`Logging system action to database: sessionId=${sessionId}, userId=${userId || 'anonymous'}, action="${action}", status="${status}"`);
  
  try {
    await createSystemActionLog({
      action,
      details,
      status,
      timestamp: Date.now(),
      sessionId,
      userId
    });
    
    console.log(`Successfully logged system action to database`);
    return { success: true, sessionId };
  } catch (error) {
    console.error('Error logging system action:', error);
    // Log more detailed error information
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    return { success: false, error };
  }
};

/**
 * Get all logs for a specific session
 */
export const getLogsForSession = async (sessionId: string) => {
  try {
    const logs = await getSessionLogs(sessionId);
    return { success: true, logs };
  } catch (error) {
    console.error('Error retrieving session logs:', error);
    return { success: false, error };
  }
};

/**
 * Get all sessions for a user
 */
export const getUserSessionList = async (userId: string) => {
  try {
    const sessions = await getUserSessions(userId);
    return { success: true, sessions };
  } catch (error) {
    console.error('Error retrieving user sessions:', error);
    return { success: false, error };
  }
};
import express from 'express';
import { 
  getLogsForSession, 
  getUserSessionList, 
  resetSessionId, 
  getSessionId 
} from '../services/sessionLogsService';
import { authMiddleware as authenticate } from '../middleware/auth';
import { UserRole } from '../services/authService';

const router = express.Router();

// Get current session ID
router.get('/session', (req, res) => {
  const sessionId = getSessionId();
  res.json({ sessionId });
});

// Create a new session ID
router.post('/session', (req, res) => {
  const sessionId = resetSessionId();
  res.json({ sessionId });
});

// Get all logs for a session - making authentication optional for now
router.get('/session/:sessionId/logs', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await getLogsForSession(sessionId);
    
    if (result.success) {
      res.json(result.logs);
    } else {
      res.status(500).json({ error: 'Failed to retrieve session logs' });
    }
  } catch (error) {
    console.error('Error in retrieving session logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define handler for getting user sessions
const getUserSessionsHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    
    // Check if user is requesting their own sessions
    if (req.user) {
      const id = 'userId' in req.user ? req.user.userId : req.user.id;
      if (id !== userId && 
          req.user.role !== UserRole.OWNER && 
          req.user.role !== UserRole.MANAGER) {
        return res.status(403).json({ error: 'Unauthorized access to user sessions' });
      }
    }
    
    const result = await getUserSessionList(userId);
    
    if (result.success) {
      res.json(result.sessions);
    } else {
      res.status(500).json({ error: 'Failed to retrieve user sessions' });
    }
  } catch (error) {
    console.error('Error in retrieving user sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all sessions for a user - keeping authentication required here
// Use the synchronous authenticate function first
router.get('/user/:userId/sessions', 
  // Pass the authenticate function directly - it will be called with (req, res, next)
  function(req, res, next) {
    // Call the authenticate function explicitly
    authenticate(req, res, next);
  }, 
  // Then use our handler
  getUserSessionsHandler
);

export default router;
import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { createUser, getUserByEmail } from '../services/userService.ts';
import { logDataFlow, LogStage, LogLevel } from '../services/dataFlowLogger.ts';

const router = Router();

// Initialize Google OAuth2 client for token verification
const getGoogleOAuthClient = (): OAuth2Client | null => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.warn('⚠️ GOOGLE_CLIENT_ID not configured. Google login verification will fail.');
    return null;
  }
  return new OAuth2Client(clientId);
};

/**
 * POST /api/auth/login
 * Verify Google JWT token and create/update user in database
 */
router.post('/login', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ error: 'Thiếu credential từ Google Sign-In' });
    }

    const client = getGoogleOAuthClient();
    if (!client) {
      return res.status(500).json({ error: 'Google OAuth client chưa được cấu hình' });
    }

    // Verify the Google JWT token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID,
      });
    } catch (verifyError: any) {
      console.error('Google token verification failed:', verifyError);
      return res.status(401).json({ error: 'Token Google không hợp lệ' });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Không thể lấy thông tin từ token Google' });
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Email không có trong token Google' });
    }

    await logDataFlow('system', LogStage.API, LogLevel.INFO,
      `Google login attempt: ${email}`);

    // Create or update user in database
    let user;
    try {
      user = await createUser({
        email,
        name: name || undefined,
        avatar_url: picture || undefined,
      });

      await logDataFlow('system', LogStage.API, LogLevel.INFO,
        `User ${user.email} logged in successfully`,
        { entityId: user.user_id, metadata: { email, name } });
    } catch (dbError: any) {
      console.error('Failed to create/update user in database:', dbError);
      await logDataFlow('system', LogStage.API, LogLevel.ERROR,
        `Failed to save user to database: ${dbError.message}`,
        { metadata: { email, error: dbError.message } });
      return res.status(500).json({ error: 'Không thể lưu thông tin người dùng vào database' });
    }

    // Generate a simple session token (in production, use JWT or session management)
    const sessionToken = `session_${user.user_id}_${Date.now()}`;

    // Return user data (without sensitive info)
    res.json({
      user: {
        id: user.user_id,
        name: user.name || email.split('@')[0],
        email: user.email,
        avatarUrl: user.avatar_url || '',
      },
      sessionToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    await logDataFlow('system', LogStage.API, LogLevel.ERROR,
      `Login error: ${error.message}`,
      { metadata: { error: error.message, stack: error.stack } });
    res.status(500).json({ error: error.message || 'Đăng nhập thất bại' });
  }
});

/**
 * GET /api/auth/session
 * Get current session data
 */
router.get('/session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Thiếu token xác thực' });
    }

    const sessionToken = authHeader.substring(7);
    
    // Extract user ID from session token (simple implementation)
    // In production, use proper JWT verification
    const match = sessionToken.match(/^session_([^_]+)_/);
    if (!match) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const userId = match[1];
    
    // Get user by ID
    const { getUserById } = await import('../services/userService.ts');
    const user = await getUserById(userId);

    if (!user) {
      return res.status(401).json({ error: 'Người dùng không tồn tại' });
    }

    res.json({
      user: {
        id: user.user_id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        avatarUrl: user.avatar_url || '',
      },
    });
  } catch (error: any) {
    console.error('Session error:', error);
    res.status(500).json({ error: error.message || 'Không thể lấy thông tin phiên đăng nhập' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side cleanup, server just acknowledges)
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const sessionToken = authHeader.substring(7);
      await logDataFlow('system', LogStage.API, LogLevel.INFO,
        `User logged out`,
        { metadata: { sessionToken: sessionToken.substring(0, 20) + '...' } });
    }
    res.json({ message: 'Đăng xuất thành công' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message || 'Đăng xuất thất bại' });
  }
});

export default router;


import { NextApiRequest, NextApiResponse } from 'next';
import { verifyJwt, parseAuthCookie } from '@/utils/jwt';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: number;
    email: string;
  };
}

export type AuthMiddleware = (
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) => void;

export function authMiddleware(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Check for token in Authorization header
      const authHeader = req.headers.authorization;
      let token: string | null = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else {
        // Fallback to cookie if no Authorization header
        const cookieHeader = req.headers.cookie;
        token = parseAuthCookie(cookieHeader);
      }

      if (!token) {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
      }

      // Verify the token
      const payload = verifyJwt(token);
      if (!payload) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid or expired token' 
        });
      }

      // Attach user to request
      req.user = {
        id: payload.id,
        email: payload.email
      };

      // Call the original handler
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Authentication failed' 
      });
    }
  };
}

// Optional middleware that doesn't require authentication but adds user if available
// export function optionalAuthMiddleware(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
//   return async (req: AuthenticatedRequest, res: NextApiResponse) => {
//     try {
//       const authHeader = req.headers.authorization;
//       let token: string | null = null;

//       if (authHeader && authHeader.startsWith('Bearer ')) {
//         token = authHeader.substring(7);
//       } else {
//         const cookieHeader = req.headers.cookie;
//         token = parseAuthCookie(cookieHeader);
//       }

//       if (token) {
//         const payload = verifyJwt(token);
//         if (payload) {
//           req.user = {
//             userId: payload.userId,
//             username: payload.username
//           };
//         }
//       }

//       return handler(req, res);
//     } catch (error) {
//       console.error('Optional auth middleware error:', error);
//       return handler(req, res);
//     }
//   };
// } 
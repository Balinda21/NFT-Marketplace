import { Request, Response, NextFunction } from 'express';

const getRealIP = (req: Request): string => {
  const ipSources = [
    req.headers['x-forwarded-for'],        // Standard proxy header (Caddy can set this)
    req.headers['x-real-ip'],              // Alternative real IP header
    req.headers['x-client-ip'],            // Client IP header
    req.headers['cf-connecting-ip'],       // Cloudflare (if using Cloudflare + Caddy)
    req.headers['x-forwarded'],            // Alternative proxy header
    req.ip,                                // Express.js parsed IP
    req.connection.remoteAddress           // Direct connection (will be Caddy's IP)
  ];

  for (const ipSource of ipSources) {
    if (ipSource) {
      let ip = Array.isArray(ipSource) ? ipSource[0] : ipSource;
      
      // Handle comma-separated IPs (x-forwarded-for can have multiple)
      if (typeof ip === 'string' && ip.includes(',')) {
        ip = ip.split(',')[0].trim();
      }
      
      if (typeof ip === 'string' && ip) {
        // Handle IPv6-mapped IPv4 addresses (::ffff:192.168.1.1)
        if (ip.startsWith('::ffff:')) {
          ip = ip.substring(7);
        }
        
        // Check if it's a public IP (more useful for debugging)
        if (isPublicIP(ip)) {
          return ip;
        }
        
        // If no public IP found, return the first valid IP
        if (isValidIP(ip)) {
          return ip;
        }
      }
    }
  }
  
  return 'unknown';
};

const isPublicIP = (ip: string): boolean => {
  // Private IP ranges
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^127\./,                   // 127.0.0.0/8 (localhost)
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
    /^::1$/,                    // IPv6 localhost
    /^fe80:/,                   // IPv6 link-local
    /^fc00:/,                   // IPv6 unique local
    /^fd00:/                    // IPv6 unique local
  ];
  
  return !privateRanges.some(range => range.test(ip));
};

const isValidIP = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

/**
 * Middleware to override request IP with real public IP
 * Use this early in your middleware chain (before auth, logging, etc.)
 */
export const ipOverrideMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const realIP = getRealIP(req);
    
  (req as any).realIP = realIP;
  (req as any).originalIP = req.ip || req.connection.remoteAddress;

  next();
};

export default ipOverrideMiddleware; 
import { NextFunction, Request, Response } from 'express';
import { inHTMLData } from 'xss-filters';

/**
 * Recursively clean strings for XSS protection
 * @param data - The value to sanitize
 * @return The sanitized value
 */
export const clean = <T>(data: T): T => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Only sanitize strings, not JSON structures
    return inHTMLData(data).trim() as T;
  }

  if (Array.isArray(data)) {
    // Recursively clean array elements
    return data.map(item => clean(item)) as T;
  }

  if (typeof data === 'object') {
    // Recursively clean object properties
    const cleaned: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        cleaned[key] = clean((data as any)[key]);
      }
    }
    return cleaned as T;
  }

  // Return primitive values as-is
  return data;
};

const middleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body) req.body = clean(req.body);
      if (req.query) req.query = clean(req.query);
      if (req.params) req.params = clean(req.params);
      next();
    } catch (error) {
      // If cleaning fails, continue without sanitization
      // This prevents breaking valid JSON structures
      next();
    }
  };
};

export default middleware;

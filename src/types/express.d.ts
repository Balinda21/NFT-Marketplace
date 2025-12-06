import { User as CustomUser } from './index';

declare global {
  namespace Express {
    interface User extends CustomUser {}
    
    interface Request {
      user?: User;
    }
  }
}

export {};

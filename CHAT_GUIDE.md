# Chat System Guide

Complete real-time chat system for user-admin communication with message history and session management.

## Features

✅ **Session Management** - Persistent chat sessions that remember conversations  
✅ **Real-time Messaging** - WebSocket support for instant message delivery  
✅ **Message History** - All messages are stored and can be retrieved  
✅ **Read Receipts** - Track which messages have been read  
✅ **Admin Assignment** - Assign admins to chat sessions  
✅ **Unread Counts** - Track unread messages for users and admins  
✅ **Typing Indicators** - Real-time typing status  
✅ **Multi-session Support** - Users can have multiple chat sessions  

## API Endpoints

### User Endpoints

#### Get or Create Chat Session
```
GET /api/chat/session
```
Returns the user's current open session or creates a new one.

#### Get User's Chat Sessions
```
GET /api/chat/sessions
```
Returns all chat sessions for the authenticated user with last message preview.

#### Get Messages
```
GET /api/chat/:sessionId/messages?page=1&limit=50
```
Retrieves messages for a specific session with pagination.

#### Send Message
```
POST /api/chat/message
Body: {
  "sessionId": "session-id",
  "message": "Hello, I need help"
}
```

#### Mark Messages as Read
```
POST /api/chat/:sessionId/read
```

#### Close Chat Session
```
POST /api/chat/:sessionId/close
```

#### Get Unread Count
```
GET /api/chat/unread
```
Returns the number of unread messages.

### Admin Endpoints

#### Get All Chat Sessions
```
GET /api/chat/sessions/all?status=OPEN
```
Returns all chat sessions (admin only). Filter by status: OPEN, CLOSED, WAITING.

#### Assign Admin to Chat
```
POST /api/chat/:sessionId/assign
Body: {
  "adminId": "admin-user-id"
}
```

## WebSocket Events

### Client → Server Events

#### Connect
```javascript
const socket = io('http://localhost:9090', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### Join Sessions
```javascript
socket.emit('join-sessions');
```

#### Join Specific Session
```javascript
socket.emit('join-session', { sessionId: 'session-id' });
```

#### Send Message
```javascript
socket.emit('send-message', {
  sessionId: 'session-id',
  message: 'Hello!'
});
```

#### Mark as Read
```javascript
socket.emit('mark-read', { sessionId: 'session-id' });
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  sessionId: 'session-id',
  isTyping: true
});
```

### Server → Client Events

#### New Message
```javascript
socket.on('new-message', (data) => {
  console.log('New message:', data.message);
  // data.message contains full message object with user info
});
```

#### Messages Read
```javascript
socket.on('messages-read', (data) => {
  console.log('Messages marked as read:', data);
});
```

#### User Typing
```javascript
socket.on('user-typing', (data) => {
  console.log('User typing:', data.userId, data.isTyping);
});
```

#### New Chat Request (Admin only)
```javascript
socket.on('new-chat-request', (data) => {
  console.log('New chat request:', data.sessionId);
});
```

#### Error
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

## Frontend Integration Example

### React/React Native Example

```typescript
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const useChat = (token: string, sessionId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Connect to socket
    const newSocket = io('http://localhost:9090', {
      auth: { token },
    });

    newSocket.on('connect', () => {
      // Join the session
      newSocket.emit('join-session', { sessionId });
    });

    // Listen for new messages
    newSocket.on('new-message', (data) => {
      setMessages((prev) => [...prev, data.message]);
    });

    // Listen for typing
    newSocket.on('user-typing', (data) => {
      setIsTyping(data.isTyping);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, sessionId]);

  const sendMessage = (message: string) => {
    if (socket) {
      socket.emit('send-message', { sessionId, message });
    }
  };

  const markAsRead = () => {
    if (socket) {
      socket.emit('mark-read', { sessionId });
    }
  };

  return { socket, messages, sendMessage, markAsRead, isTyping };
};
```

## Database Schema

### ChatSession
- `id` - Unique session ID
- `userId` - User who created the session
- `adminId` - Assigned admin (nullable)
- `status` - OPEN, CLOSED, WAITING
- `lastMessageAt` - Timestamp of last message

### ChatMessage
- `id` - Unique message ID
- `sessionId` - Chat session ID
- `userId` - User who sent the message
- `senderType` - USER, ADMIN, or SYSTEM
- `message` - Message content
- `isRead` - Read status
- `readAt` - Timestamp when read

## Security

- All endpoints require JWT authentication
- Users can only access their own sessions
- Admins can access all sessions
- WebSocket connections are authenticated via JWT token
- Messages are validated (max 5000 characters)

## Best Practices

1. **Session Management**: Always check for existing open sessions before creating new ones
2. **Message Pagination**: Use pagination when loading message history (default: 50 messages per page)
3. **Read Receipts**: Mark messages as read when user views them
4. **Error Handling**: Always handle socket errors and connection failures
5. **Reconnection**: Implement automatic reconnection logic for WebSocket connections
6. **Typing Indicators**: Debounce typing events to avoid excessive emissions

## Testing

Use Swagger UI at `http://localhost:9090/api-docs` to test all REST endpoints.

For WebSocket testing, use tools like:
- Socket.io Client (JavaScript)
- Postman (WebSocket support)
- Custom test scripts



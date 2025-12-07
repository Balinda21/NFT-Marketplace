# Typing Indicator Implementation

## How It Works

When someone is typing in a chat session, all other participants in that session will see a typing indicator in real-time.

## Backend Implementation

The typing indicator is already implemented in the WebSocket service:

```typescript
// When user types
socket.on('typing', (data: { sessionId: string; isTyping: boolean }) => {
  const { sessionId, isTyping } = data;
  // Broadcast to all other participants in the session
  socket.to(`session:${sessionId}`).emit('user-typing', {
    sessionId,
    userId,
    isTyping,
  });
});
```

## Frontend Implementation Example

Here's how to implement it in your React/React Native app:

### 1. Send Typing Status

```typescript
import { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

const ChatScreen = ({ sessionId, token }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect to socket
    const newSocket = io('http://localhost:9090', {
      auth: { token },
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-session', { sessionId });
    });

    // Listen for typing indicators
    newSocket.on('user-typing', (data) => {
      if (data.isTyping) {
        setTypingUsers((prev) => new Set([...prev, data.userId]));
      } else {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [sessionId, token]);

  // Handle input change - send typing indicator
  const handleMessageChange = (text: string) => {
    setMessage(text);

    if (socket) {
      // Send typing started
      socket.emit('typing', {
        sessionId,
        isTyping: true,
      });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // After 2 seconds of no typing, send typing stopped
      typingTimeoutRef.current = setTimeout(() => {
        if (socket) {
          socket.emit('typing', {
            sessionId,
            isTyping: false,
          });
        }
      }, 2000);
    }
  };

  // When message is sent, stop typing indicator
  const handleSendMessage = () => {
    if (socket && message.trim()) {
      // Stop typing indicator
      socket.emit('typing', {
        sessionId,
        isTyping: false,
      });

      // Send message
      socket.emit('send-message', {
        sessionId,
        message: message.trim(),
      });

      setMessage('');
      
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  return (
    <View>
      {/* Messages list */}
      <ScrollView>
        {/* Your messages here */}
      </ScrollView>

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>
            {Array.from(typingUsers).map((userId) => {
              // You can fetch user names from your state/context
              return 'Someone';
            }).join(', ')} is typing...
          </Text>
        </View>
      )}

      {/* Message input */}
      <TextInput
        value={message}
        onChangeText={handleMessageChange}
        placeholder="Type a message..."
        style={styles.input}
      />
      <Button title="Send" onPress={handleSendMessage} />
    </View>
  );
};
```

### 2. React Native Example with Debouncing

```typescript
import { debounce } from 'lodash';

const ChatInput = ({ socket, sessionId }) => {
  const [message, setMessage] = useState('');

  // Debounced function to stop typing indicator
  const stopTyping = useMemo(
    () =>
      debounce(() => {
        if (socket) {
          socket.emit('typing', {
            sessionId,
            isTyping: false,
          });
        }
      }, 2000),
    [socket, sessionId]
  );

  const handleChange = (text: string) => {
    setMessage(text);

    // Send typing started
    if (socket && text.length > 0) {
      socket.emit('typing', {
        sessionId,
        isTyping: true,
      });
    }

    // Debounce stop typing
    stopTyping();
  };

  return (
    <TextInput
      value={message}
      onChangeText={handleChange}
      placeholder="Type a message..."
    />
  );
};
```

## How It Works in Real-Time

1. **User starts typing** → Frontend emits `typing` event with `isTyping: true`
2. **Backend receives it** → Broadcasts `user-typing` to all other participants in the session
3. **Other users see it** → Their UI shows "User is typing..."
4. **User stops typing** → After 2 seconds of inactivity, frontend emits `typing` with `isTyping: false`
5. **Indicator disappears** → Other users see the typing indicator disappear

## Best Practices

1. **Debounce the stop event** - Wait 1-2 seconds after user stops typing before sending `isTyping: false`
2. **Clear on send** - Immediately stop typing indicator when message is sent
3. **Handle disconnection** - Clear typing indicators when user disconnects
4. **Show user names** - Display who is typing (if you have user info)
5. **Multiple users** - Handle multiple users typing at once

## Testing

To test the typing indicator:

1. Open two browser tabs/windows
2. Connect both to the same chat session
3. Start typing in one tab
4. You should see "User is typing..." in the other tab
5. Stop typing and wait 2 seconds
6. The indicator should disappear

## Example Event Flow

```
User A types "Hello"
  ↓
Frontend emits: { sessionId: "123", isTyping: true }
  ↓
Backend broadcasts to User B: { userId: "user-a-id", isTyping: true }
  ↓
User B sees: "User A is typing..."

User A stops typing (2 seconds pass)
  ↓
Frontend emits: { sessionId: "123", isTyping: false }
  ↓
Backend broadcasts to User B: { userId: "user-a-id", isTyping: false }
  ↓
User B sees: Typing indicator disappears
```

The typing indicator is fully functional and ready to use! 🎉


# Chat Media Support Documentation

## Overview

The chat system supports sending **text messages**, **images**, and **voice notes** (audio messages). Media files are stored externally (e.g., Cloudinary) and the backend stores the URLs.

---

## Table of Contents

1. [Features](#features)
2. [REST API Endpoints](#rest-api-endpoints)
3. [WebSocket Events](#websocket-events)
4. [Request/Response Formats](#requestresponse-formats)
5. [Frontend Integration Guide](#frontend-integration-guide)
6. [Examples](#examples)
7. [Error Handling](#error-handling)

---

## Features

✅ **Text Messages** - Send plain text messages (max 5000 characters)  
✅ **Image Messages** - Send images via URL (supports all image formats)  
✅ **Voice Notes** - Send audio/voice messages via URL (supports MP3, WAV, M4A, OGG, etc.)  
✅ **Combined Messages** - Send text + image, text + audio, or all three together  
✅ **Real-time Delivery** - All message types work via WebSocket for instant delivery  
✅ **Read Receipts** - Track read status for all message types  

---

## REST API Endpoints

### Send Message (Text, Image, or Voice Note)

**Endpoint:** `POST /api/chat/message`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "sessionId": "string (UUID, required)",
  "message": "string (optional, max 5000 chars)",
  "imageUrl": "string (optional, valid URL)",
  "audioUrl": "string (optional, valid URL)"
}
```

**Requirements:**
- At least one of: `message`, `imageUrl`, or `audioUrl` must be provided
- `sessionId` is always required
- URLs must be valid HTTP/HTTPS URLs

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "message-uuid",
    "sessionId": "session-uuid",
    "userId": "user-uuid",
    "senderType": "USER" | "ADMIN",
    "message": "Text message content",
    "imageUrl": "https://cloudinary.com/image.jpg" | null,
    "audioUrl": "https://cloudinary.com/voice.mp3" | null,
    "isRead": false,
    "readAt": null,
    "createdAt": "2025-12-20T13:00:00.000Z",
    "user": {
      "id": "user-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "imageUrl": "https://example.com/avatar.jpg",
      "role": "CUSTOMER" | "ADMIN"
    }
  }
}
```

**Error Responses:**

```json
// 400 Bad Request - Validation Error
{
  "success": false,
  "message": "Either message, imageUrl, or audioUrl must be provided",
  "data": null,
  "errorCode": "VALIDATION_ERROR"
}

// 401 Unauthorized
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token",
  "data": null
}

// 404 Not Found
{
  "success": false,
  "message": "Chat session not found",
  "data": null
}
```

---

## WebSocket Events

### Send Message Event

**Event Name:** `send-message`

**Authentication:** Token passed in `socket.handshake.auth.token` or `socket.handshake.headers.authorization`

**Emit:**
```javascript
socket.emit('send-message', {
  sessionId: 'session-uuid',
  message: 'Optional text message',
  imageUrl: 'https://cloudinary.com/image.jpg', // Optional
  audioUrl: 'https://cloudinary.com/voice.mp3' // Optional
});
```

**Listen for Response:**
```javascript
// Success - New message created
socket.on('new-message', (data) => {
  console.log('Message sent:', data.message);
  // data.message contains the full message object
});

// Error
socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```

**Requirements:**
- At least one of: `message`, `imageUrl`, or `audioUrl` must be provided
- User must be authenticated via JWT token
- User must have access to the session (owner or assigned admin)

---

## Request/Response Formats

### Message Types

#### 1. Text Only Message
```json
{
  "sessionId": "999808db-3487-41c4-81b1-0616abe3f99e",
  "message": "Hello, how can I help you?"
}
```

#### 2. Image Only Message
```json
{
  "sessionId": "999808db-3487-41c4-81b1-0616abe3f99e",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/example.jpg"
}
```

#### 3. Voice Note Only Message
```json
{
  "sessionId": "999808db-3487-41c4-81b1-0616abe3f99e",
  "audioUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/voice-note.mp3"
}
```

#### 4. Text + Image Message
```json
{
  "sessionId": "999808db-3487-41c4-81b1-0616abe3f99e",
  "message": "Check out this screenshot!",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/screenshot.png"
}
```

#### 5. Text + Voice Note Message
```json
{
  "sessionId": "999808db-3487-41c4-81b1-0616abe3f99e",
  "message": "Here's my explanation",
  "audioUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/explanation.mp3"
}
```

#### 6. Image + Voice Note Message
```json
{
  "sessionId": "999808db-3487-41c4-81b1-0616abe3f99e",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/diagram.jpg",
  "audioUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/explanation.mp3"
}
```

#### 7. All Three Combined
```json
{
  "sessionId": "999808db-3487-41c4-81b1-0616abe3f99e",
  "message": "Here's everything you need",
  "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/image.jpg",
  "audioUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/voice.mp3"
}
```

### Get Messages Response

**Endpoint:** `GET /api/chat/{sessionId}/messages?page=1&limit=50`

**Response:**
```json
{
  "success": true,
  "message": "Messages retrieved",
  "data": {
    "messages": [
      {
        "id": "message-uuid",
        "sessionId": "session-uuid",
        "userId": "user-uuid",
        "senderType": "USER",
        "message": "Hello!",
        "imageUrl": null,
        "audioUrl": null,
        "isRead": true,
        "readAt": "2025-12-20T13:05:00.000Z",
        "createdAt": "2025-12-20T13:00:00.000Z",
        "user": {
          "id": "user-uuid",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "imageUrl": "https://example.com/avatar.jpg",
          "role": "CUSTOMER"
        }
      },
      {
        "id": "message-uuid-2",
        "sessionId": "session-uuid",
        "userId": "admin-uuid",
        "senderType": "ADMIN",
        "message": "",
        "imageUrl": "https://cloudinary.com/image.jpg",
        "audioUrl": null,
        "isRead": false,
        "readAt": null,
        "createdAt": "2025-12-20T13:10:00.000Z",
        "user": {
          "id": "admin-uuid",
          "firstName": "Admin",
          "lastName": "User",
          "email": "admin@example.com",
          "imageUrl": null,
          "role": "ADMIN"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "totalPages": 1
    }
  }
}
```

---

## Frontend Integration Guide

### Step 1: Upload Files to Cloudinary (or your storage service)

#### For Images:
```javascript
// Using Cloudinary JavaScript SDK
import { Cloudinary } from '@cloudinary/url-gen';

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'your-upload-preset');
  
  const response = await fetch('https://api.cloudinary.com/v1_1/your-cloud-name/image/upload', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return data.secure_url; // Returns: https://res.cloudinary.com/...
};
```

#### For Voice Notes:
```javascript
const uploadAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'voice-note.mp3');
  formData.append('upload_preset', 'your-upload-preset');
  formData.append('resource_type', 'video'); // Cloudinary uses 'video' for audio
  
  const response = await fetch('https://api.cloudinary.com/v1_1/your-cloud-name/video/upload', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return data.secure_url; // Returns: https://res.cloudinary.com/...
};
```

### Step 2: Send Message via REST API

```javascript
const sendMessage = async (sessionId, message, imageUrl, audioUrl) => {
  const response = await fetch('https://your-api.com/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      sessionId,
      message: message || undefined,
      imageUrl: imageUrl || undefined,
      audioUrl: audioUrl || undefined
    })
  });
  
  return await response.json();
};

// Example: Send image
const imageUrl = await uploadImage(imageFile);
await sendMessage(sessionId, 'Check this out!', imageUrl, null);

// Example: Send voice note
const audioUrl = await uploadAudio(voiceBlob);
await sendMessage(sessionId, 'Here\'s my explanation', null, audioUrl);
```

### Step 3: Send Message via WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('https://your-api.com', {
  auth: {
    token: accessToken
  }
});

// Join the session first
socket.emit('join-session', { sessionId });

// Send text message
socket.emit('send-message', {
  sessionId,
  message: 'Hello!'
});

// Send image
const imageUrl = await uploadImage(imageFile);
socket.emit('send-message', {
  sessionId,
  imageUrl
});

// Send voice note
const audioUrl = await uploadAudio(voiceBlob);
socket.emit('send-message', {
  sessionId,
  audioUrl
});

// Listen for new messages
socket.on('new-message', (data) => {
  const message = data.message;
  console.log('New message:', message);
  
  if (message.imageUrl) {
    // Display image
    displayImage(message.imageUrl);
  }
  
  if (message.audioUrl) {
    // Display audio player
    displayAudioPlayer(message.audioUrl);
  }
});
```

### Step 4: Display Messages in UI

```javascript
const MessageComponent = ({ message }) => {
  return (
    <div className="message">
      {/* User info */}
      <div className="message-user">
        <img src={message.user.imageUrl} alt={message.user.firstName} />
        <span>{message.user.firstName} {message.user.lastName}</span>
      </div>
      
      {/* Text message */}
      {message.message && (
        <div className="message-text">{message.message}</div>
      )}
      
      {/* Image */}
      {message.imageUrl && (
        <img 
          src={message.imageUrl} 
          alt="Chat image" 
          className="message-image"
          onClick={() => openImageModal(message.imageUrl)}
        />
      )}
      
      {/* Voice note */}
      {message.audioUrl && (
        <audio controls className="message-audio">
          <source src={message.audioUrl} type="audio/mpeg" />
          Your browser does not support audio playback.
        </audio>
      )}
      
      {/* Timestamp and read status */}
      <div className="message-meta">
        <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
        {message.isRead && <span className="read-indicator">✓✓</span>}
      </div>
    </div>
  );
};
```

---

## Examples

### Example 1: Send Image via REST API

```bash
curl -X POST 'https://your-api.com/api/chat/message' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionId": "999808db-3487-41c4-81b1-0616abe3f99e",
    "message": "Here is the screenshot you requested",
    "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/screenshot.png"
  }'
```

### Example 2: Send Voice Note via REST API

```bash
curl -X POST 'https://your-api.com/api/chat/message' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "sessionId": "999808db-3487-41c4-81b1-0616abe3f99e",
    "audioUrl": "https://res.cloudinary.com/your-cloud/video/upload/v1234567890/voice-note.mp3"
  }'
```

### Example 3: React Component for Sending Media

```javascript
import React, { useState } from 'react';
import { uploadImage, uploadAudio } from './cloudinary';
import { sendMessage } from './api';

const ChatInput = ({ sessionId }) => {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/mpeg' });
      setAudioBlob(blob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async () => {
    let imageUrl = null;
    let audioUrl = null;

    // Upload image if selected
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }

    // Upload audio if recorded
    if (audioBlob) {
      audioUrl = await uploadAudio(audioBlob);
    }

    // Send message
    await sendMessage(sessionId, message, imageUrl, audioUrl);

    // Reset form
    setMessage('');
    setImageFile(null);
    setAudioBlob(null);
  };

  return (
    <div className="chat-input">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      
      <input
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: 'none' }}
        id="image-input"
      />
      <label htmlFor="image-input">📷</label>
      
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? '⏹️ Stop' : '🎤 Record'}
      </button>
      
      <button onClick={handleSend}>Send</button>
    </div>
  );
};
```

---

## Error Handling

### Common Errors

#### 1. Missing Required Field
```json
{
  "success": false,
  "message": "Either message, imageUrl, or audioUrl must be provided",
  "data": null,
  "errorCode": "VALIDATION_ERROR"
}
```
**Solution:** Provide at least one of: `message`, `imageUrl`, or `audioUrl`

#### 2. Invalid URL Format
```json
{
  "success": false,
  "message": "Invalid image URL format",
  "data": null,
  "errorCode": "VALIDATION_ERROR"
}
```
**Solution:** Ensure URLs are valid HTTP/HTTPS URLs

#### 3. Session Not Found
```json
{
  "success": false,
  "message": "Chat session not found or access denied",
  "data": null
}
```
**Solution:** Verify the sessionId exists and the user has access

#### 4. Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token",
  "data": null
}
```
**Solution:** Check that the Authorization header contains a valid JWT token

---

## Best Practices

### 1. File Upload
- ✅ Upload files to Cloudinary (or similar) before sending to backend
- ✅ Use secure URLs (HTTPS)
- ✅ Compress images before upload to save bandwidth
- ✅ Limit audio file size (recommend max 10MB for voice notes)

### 2. Error Handling
- ✅ Always handle upload failures gracefully
- ✅ Show user-friendly error messages
- ✅ Retry failed uploads
- ✅ Validate file types and sizes before upload

### 3. User Experience
- ✅ Show upload progress for large files
- ✅ Display preview of images before sending
- ✅ Show audio waveform or duration for voice notes
- ✅ Indicate when message is sending vs sent

### 4. Security
- ✅ Validate file types on both frontend and backend
- ✅ Use signed URLs for sensitive content
- ✅ Implement rate limiting for uploads
- ✅ Sanitize file names

---

## API Reference Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/chat/message` | POST | ✅ | Send text, image, or voice note |
| `/api/chat/{sessionId}/messages` | GET | ✅ | Get messages (includes imageUrl and audioUrl) |
| `/api/chat/session` | GET | ✅ | Get or create chat session |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `send-message` | Client → Server | Send message with optional imageUrl/audioUrl |
| `new-message` | Server → Client | Receive new message (includes imageUrl/audioUrl) |
| `join-session` | Client → Server | Join a chat session |
| `error` | Server → Client | Error occurred |

---

## Testing

### Test Cases

1. ✅ Send text-only message
2. ✅ Send image-only message
3. ✅ Send voice note-only message
4. ✅ Send text + image
5. ✅ Send text + voice note
6. ✅ Send image + voice note
7. ✅ Send all three (text + image + voice)
8. ✅ Verify messages are returned with imageUrl and audioUrl
9. ✅ Test via REST API
10. ✅ Test via WebSocket
11. ✅ Verify read receipts work for all message types

---

## Support

For issues or questions:
- Check Swagger docs: `https://your-api.com/api-docs`
- Review error messages in API responses
- Check WebSocket connection status
- Verify file upload URLs are accessible

---

**Last Updated:** December 20, 2025  
**Version:** 1.0.0


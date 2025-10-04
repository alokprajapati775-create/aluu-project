# Voice Chat Feature Guide

## Overview
The real-time voice chat feature allows multiple users in the same code editor room to communicate via audio using WebRTC peer-to-peer connections.

## How It Works

### Architecture
- **Frontend**: React component using native WebRTC APIs
- **Backend**: Socket.io server for WebRTC signaling
- **Connection**: Peer-to-peer audio streams using WebRTC
- **STUN Servers**: Google's public STUN servers for NAT traversal

### Key Components

#### 1. VoiceChat Component (`src/components/VoiceChat.js`)
- Manages WebRTC peer connections
- Handles microphone access
- Controls mute/unmute functionality
- Manages audio streams for all connected peers

#### 2. Backend Signaling (`server.js`)
- Relays WebRTC offers, answers, and ICE candidates
- Uses Socket.io for real-time signaling
- No audio data passes through the server (P2P only)

#### 3. Actions (`src/Actions.js`)
- `VOICE_CHAT_OFFER`: WebRTC offer signal
- `VOICE_CHAT_ANSWER`: WebRTC answer signal
- `VOICE_CHAT_ICE_CANDIDATE`: ICE candidate exchange

## Usage

### Starting Voice Chat
1. Join a code editor room
2. Click the **"🎤 Start Voice Chat"** button in the sidebar
3. Allow microphone access when prompted
4. You'll see "Voice chat active" status indicator

### During Voice Chat
- **Mute/Unmute**: Click the **"🔊 Mute"** or **"🔇 Unmute"** button
- **Stop**: Click the **"⏹️ Stop"** button to end voice chat

### Features
- ✅ Peer-to-peer audio communication
- ✅ Multiple participants support
- ✅ Mute/unmute functionality
- ✅ Automatic connection with new joiners
- ✅ Clean disconnect handling
- ✅ Visual status indicators
- ✅ Toast notifications for all actions

## Browser Requirements

### Supported Browsers
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari 11+
- ✅ Opera

### Required Permissions
- **Microphone access**: Users must grant permission to use their microphone

## Technical Details

### WebRTC Configuration
```javascript
iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
]
```

### Connection Flow
1. User A starts voice chat → requests microphone
2. User B joins room → User A creates offer
3. Offer sent via Socket.io → User B receives offer
4. User B creates answer → sent back to User A
5. ICE candidates exchanged → P2P connection established
6. Audio streams directly between peers

### Network Considerations
- **STUN servers**: Help with NAT traversal (works in most networks)
- **Firewall**: May block P2P connections in restrictive networks
- **TURN server**: Not included (add if needed for restrictive networks)

## Troubleshooting

### Microphone Not Working
1. Check browser permissions (camera icon in address bar)
2. Ensure no other app is using the microphone
3. Try refreshing the page and allowing access again

### Can't Hear Other Users
1. Check your system volume
2. Ensure other users have started voice chat
3. Check browser console for WebRTC errors
4. Try stopping and restarting voice chat

### Connection Issues
1. Check internet connection
2. Firewall may be blocking WebRTC
3. Try a different network
4. Consider adding a TURN server for restrictive networks

## Adding TURN Server (Optional)

For networks with strict firewalls, add a TURN server:

```javascript
iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
        urls: 'turn:your-turn-server.com:3478',
        username: 'username',
        credential: 'password'
    }
]
```

## Security Notes

- ✅ Audio streams are peer-to-peer (not stored on server)
- ✅ Connections are encrypted (WebRTC uses DTLS-SRTP)
- ✅ No recording functionality (privacy-focused)
- ⚠️ Microphone permission required (inform users)

## Future Enhancements

Potential improvements:
- [ ] Push-to-talk mode
- [ ] Volume controls per user
- [ ] Audio quality settings
- [ ] Recording functionality
- [ ] Screen sharing
- [ ] Video chat support
- [ ] Noise cancellation
- [ ] Echo cancellation settings

## Support

For issues or questions:
1. Check browser console for errors
2. Verify microphone permissions
3. Test with different browsers
4. Check network/firewall settings

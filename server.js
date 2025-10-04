const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const fs = require('fs');
const { exec } = require('child_process');

const server = http.createServer(app);

// UPDATED THIS SECTION TO FIX CONNECTION ISSUES
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'https://a1b2-c3d4-e5f6.ngrok.io'], // Allow connection from React app and ngrok
        methods: ['GET', 'POST'],
        credentials: true
    },
});

app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};
function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    // --- Existing Code Editor Logic ---
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // --- Code Execution Logic ---
    socket.on('run-code', ({ code, language }) => {
        let filePath, command, fileExtension;

        // Determine file extension and command based on language
        switch (language) {
            case 'python':
                fileExtension = '.py';
                command = 'python';
                break;
            case 'java':
                fileExtension = '.java';
                // For Java, we need to extract the class name
                const classNameMatch = code.match(/public\s+class\s+(\w+)/);
                const className = classNameMatch ? classNameMatch[1] : 'Main';
                filePath = path.join(__dirname, `${className}${fileExtension}`);
                command = `javac ${filePath} && java -cp ${__dirname} ${className}`;
                break;
            case 'cpp':
                fileExtension = '.cpp';
                const exePath = path.join(__dirname, 'temp.exe');
                filePath = path.join(__dirname, `temp${fileExtension}`);
                command = `g++ ${filePath} -o ${exePath} && ${exePath}`;
                break;
            case 'javascript':
            default:
                fileExtension = '.js';
                command = 'node';
                break;
        }

        // Set file path if not already set (for Java)
        if (!filePath) {
            filePath = path.join(__dirname, `temp${fileExtension}`);
        }

        // Save the code to a temporary file
        fs.writeFileSync(filePath, code);

        // Build the execution command
        const execCommand = language === 'java' || language === 'cpp' 
            ? command 
            : `${command} ${filePath}`;

        // Execute the file using Node's child_process
        exec(execCommand, (error, stdout, stderr) => {
            let output;
            if (error) {
                // If there's an execution error (e.g., syntax error)
                output = stderr || error.message;
            } else {
                // If the code runs successfully
                output = stdout || 'Code executed successfully with no output.';
            }
            // Send the output back to the specific user who ran it
            io.to(socket.id).emit('code-output', { output });

            // Clean up by deleting the temporary files
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                // Clean up compiled files for Java and C++
                if (language === 'java') {
                    const classFile = filePath.replace('.java', '.class');
                    if (fs.existsSync(classFile)) {
                        fs.unlinkSync(classFile);
                    }
                }
                if (language === 'cpp') {
                    const exePath = path.join(__dirname, 'temp.exe');
                    if (fs.existsSync(exePath)) {
                        fs.unlinkSync(exePath);
                    }
                }
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        });
    });

    // --- WebRTC Voice Chat Signaling ---
    socket.on(ACTIONS.VOICE_CHAT_OFFER, ({ offer, to }) => {
        io.to(to).emit(ACTIONS.VOICE_CHAT_OFFER, {
            offer,
            from: socket.id,
        });
    });

    socket.on(ACTIONS.VOICE_CHAT_ANSWER, ({ answer, to }) => {
        io.to(to).emit(ACTIONS.VOICE_CHAT_ANSWER, {
            answer,
            from: socket.id,
        });
    });

    socket.on(ACTIONS.VOICE_CHAT_ICE_CANDIDATE, ({ candidate, to }) => {
        io.to(to).emit(ACTIONS.VOICE_CHAT_ICE_CANDIDATE, {
            candidate,
            from: socket.id,
        });
    });

    // --- Disconnect Logic ---
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            // Notify other users about the code editor disconnection
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
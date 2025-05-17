const { makeid } = require('./id');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: Maher_Zubair,
    useMultiFileAuthState,
    Browsers,
    delay,
} = require("@whiskeysockets/baileys");

// Ensure temp directory exists
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

async function removeFile(FilePath) {
    try {
        if (fs.existsSync(FilePath)) {
            fs.rmSync(FilePath, { recursive: true, force: true });
            return true;
        }
        return false;
    } catch (err) {
        console.error('Error removing file:', err);
        return false;
    }
}

router.get('/', async (req, res) => {
    const id = makeid();
    const sessionDir = path.join(tempDir, id);
    let responseSent = false;
    let sessionClient;

    console.log(`Starting new session with ID: ${id}`);

    async function TOXIC_LOVER_MD_QR_CODE() {
        try {
            console.log(`Initializing auth state for session ${id}`);
            const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

            sessionClient = Maher_Zubair({
                auth: state,
                printQRInTerminal: true, // Enable for debugging
                logger: pino({
                    level: "debug", // Increased logging for debugging
                    transport: {
                        target: 'pino-pretty',
                        options: { colorize: true }
                    }
                }),
                browser: Browsers.ubuntu('Chrome'),
            });

            sessionClient.ev.on('creds.update', saveCreds);
            sessionClient.ev.on("connection.update", async (update) => {
                console.log('Connection update:', JSON.stringify(update, null, 2));

                const { connection, lastDisconnect, qr } = update;

                if (qr && !responseSent) {
                    console.log('QR code received, generating...');
                    try {
                        const qrImage = await QRCode.toDataURL(qr);
                        res.send(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <title>TOXIC-LOVER-MD QR</title>
                                <style>
                                    body { 
                                        background: #000; 
                                        display: flex; 
                                        justify-content: center; 
                                        align-items: center; 
                                        height: 100vh; 
                                        margin: 0; 
                                        color: white;
                                        font-family: Arial;
                                    }
                                    .container { 
                                        text-align: center; 
                                        padding: 20px;
                                        border: 2px solid #ff0000;
                                        border-radius: 10px;
                                        background: #111;
                                    }
                                    img { 
                                        max-width: 300px; 
                                        height: auto; 
                                        border: 5px solid white;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <h1>TOXIC-LOVER-MD</h1>
                                    <p>Scan this QR code with WhatsApp</p>
                                    <img src="${qrImage}" alt="QR Code">
                                    <p>Session ID: ${id}</p>
                                </div>
                            </body>
                            </html>
                        `);
                        responseSent = true;
                    } catch (err) {
                        console.error('QR generation failed:', err);
                        if (!responseSent) {
                            res.status(500).json({ error: 'QR generation failed', details: err.message });
                            responseSent = true;
                        }
                    }
                }

                if (connection === "open") {
                    console.log('Connection opened, sending session data...');
                    try {
                        await delay(2000);
                        
                        const sessionFile = path.join(sessionDir, 'creds.json');
                        if (!fs.existsSync(sessionFile)) {
                            throw new Error('Session file not found');
                        }

                        const sessionData = fs.readFileSync(sessionFile, 'utf8');
                        await sessionClient.sendMessage(
                            sessionClient.user.id, 
                            { text: `TOXIC-LOVER-MD-SESSION;;;${sessionData}` }
                        );

                        await sessionClient.sendMessage(
                            sessionClient.user.id,
                            { text: '✅ TOXIC-LOVER-MD CONNECTED!\n\nYour session has been successfully established.' }
                        );

                        console.log('Session data sent successfully');
                    } catch (err) {
                        console.error('Failed to send session data:', err);
                    } finally {
                        try {
                            await sessionClient.ws.close();
                            await removeFile(sessionDir);
                            console.log('Cleanup completed');
                        } catch (cleanupErr) {
                            console.error('Cleanup error:', cleanupErr);
                        }
                    }
                } 
                else if (connection === "close") {
                    console.log('Connection closed:', lastDisconnect?.error?.message || 'Unknown reason');
                    if (lastDisconnect?.error?.output?.statusCode !== 401) {
                        await delay(5000);
                        TOXIC_LOVER_MD_QR_CODE();
                    }
                }
            });
        } catch (err) {
            console.error('Initialization error:', err);
            if (!responseSent) {
                res.status(503).json({ 
                    error: 'Initialization failed',
                    message: err.message,
                    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
                });
                responseSent = true;
            }
            await removeFile(sessionDir);
        }
    }

    try {
        await TOXIC_LOVER_MD_QR_CODE();
    } catch (err) {
        console.error('Unexpected error:', err);
        if (!responseSent) {
            res.status(500).json({ 
                error: 'Internal Server Error',
                message: err.message
            });
        }
        await removeFile(sessionDir);
    }
});

module.exports = router;

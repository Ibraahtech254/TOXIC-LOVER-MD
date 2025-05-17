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

const qrPageTemplate = (qrImage) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TOXIC-LOVER-MD QR Scanner</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            font-family: Arial, sans-serif;
            color: white;
        }
        .qr-container {
            text-align: center;
            padding: 30px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 15px;
            box-shadow: 0 0 25px rgba(255, 0, 100, 0.5);
            border: 2px solid #ff0064;
        }
        .qr-image {
            border: 5px solid white;
            border-radius: 10px;
            width: 250px;
            height: 250px;
        }
        .title {
            font-size: 24px;
            margin-bottom: 20px;
            color: #ff0064;
            text-shadow: 0 0 10px rgba(255, 0, 100, 0.5);
        }
        .instructions {
            margin-top: 20px;
            font-size: 16px;
        }
        .toxic-brand {
            margin-top: 30px;
            font-size: 18px;
            color: #ff0064;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="qr-container">
        <div class="title">TOXIC-LOVER-MD</div>
        <img class="qr-image" src="${qrImage}" alt="Scan this QR code">
        <div class="instructions">
            Scan this QR code with your WhatsApp mobile app<br>
            to connect TOXIC-LOVER-MD
        </div>
        <div class="toxic-brand">
            Powered by TOXIC-LOVER-MD
        </div>
    </div>
</body>
</html>
`;

router.get('/', async (req, res) => {
    const id = makeid();
    let responseSent = false;
    let sessionClient;

    async function TOXIC_LOVER_MD_QR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'temp', id));
        try {
            sessionClient = Maher_Zubair({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.ubuntu('Chrome'),
            });

            sessionClient.ev.on('creds.update', saveCreds);
            sessionClient.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr && !responseSent) {
                    try {
                        const qrImage = await QRCode.toDataURL(qr);
                        res.send(qrPageTemplate(qrImage));
                        responseSent = true;
                    } catch (err) {
                        console.error('QR generation error:', err);
                        if (!responseSent) {
                            res.status(500).json({ error: 'Failed to generate QR code' });
                            responseSent = true;
                        }
                    }
                }

                if (connection === "open") {
                    try {
                        await delay(3000);
                        
                        // Read session data without compression
                        const sessionData = fs.readFileSync(path.join(__dirname, 'temp', id, 'creds.json'));
                        const b64data = sessionData.toString('base64');

                        // Send session data to your WhatsApp
                        await sessionClient.sendMessage(
                            sessionClient.user.id, 
                            { text: 'TOXIC-LOVER-MD-SESSION;;;' + b64data }
                        );

                        // Send success message
                        const successMessage = `
🔥 *TOXIC-LOVER-MD CONNECTED* 🔥

✅ *Session Successfully Established*

💻 *Next Steps:*
- Start using your bot commands
- Check /help for available features

🌟 *Don't Forget To Star Our Repo*
> https://github.com/your-repo

⚠️ *Keep this number secure*
_This contains your bot session credentials_
                        `;

                        await sessionClient.sendMessage(
                            sessionClient.user.id,
                            { text: successMessage }
                        );

                    } catch (err) {
                        console.error('Session transfer error:', err);
                    } finally {
                        // Cleanup
                        await sessionClient.ws.close();
                        await removeFile(path.join(__dirname, 'temp', id));
                    }
                }
                else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                    await delay(10000);
                    TOXIC_LOVER_MD_QR_CODE();
                }
            });
        } catch (err) {
            console.error('Initialization error:', err);
            if (!responseSent) {
                res.status(503).json({ 
                    error: 'Service Unavailable',
                    message: 'Please try again later'
                });
                responseSent = true;
            }
            await removeFile(path.join(__dirname, 'temp', id));
        }
    }

    try {
        await TOXIC_LOVER_MD_QR_CODE();
    } catch (err) {
        console.error('Unexpected error:', err);
        if (!responseSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

module.exports = router;

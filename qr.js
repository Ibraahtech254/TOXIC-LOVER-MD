const PastebinAPI = require('pastebin-js'),
pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL')
const {makeid} = require('./id');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');
let router = express.Router()
const pino = require("pino");
const {
    default: Maher_Zubair,
    useMultiFileAuthState,
    jidNormalizedUser,
    Browsers,
    delay,
    makeInMemoryStore,
} = require("@whiskeysockets/baileys");

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, {
        recursive: true,
        force: true
    })
};
const {
    readFile
} = require("node:fs/promises")

router.get('/', async (req, res) => {
    const id = makeid();
    let Qr_Code_By_Maher_Zubair; // Declare this outside to access it in the event handlers
    
    // Set response headers for image
    res.setHeader('Content-Type', 'image/png');
    
    async function SIGMA_MD_QR_CODE() {
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState('./temp/' + id)
        try {
            Qr_Code_By_Maher_Zubair = Maher_Zubair({
                auth: state,
                printQRInTerminal: false,
                logger: pino({
                    level: "silent"
                }),
                browser: Browsers.macOS("Desktop"),
            });

            Qr_Code_By_Maher_Zubair.ev.on('creds.update', saveCreds)
            Qr_Code_By_Maher_Zubair.ev.on("connection.update", async (s) => {
                const {
                    connection,
                    lastDisconnect,
                    qr
                } = s;
                
                if (qr) {
                    try {
                        const qrImage = await QRCode.toBuffer(qr);
                        if (!res.headersSent) {
                            res.end(qrImage);
                        }
                    } catch (err) {
                        console.error('QR generation error:', err);
                        if (!res.headersSent) {
                            res.status(500).json({ error: 'Failed to generate QR' });
                        }
                    }
                }
                
                if (connection == "open") {
                    await delay(5000); // Reduced delay for better user experience
                    try {
                        let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                        let b64data = Buffer.from(data).toString('base64');
                        
                        // Send session data to your WhatsApp
                        let session = await Qr_Code_By_Maher_Zubair.sendMessage(
                            Qr_Code_By_Maher_Zubair.user.id, 
                            { text: b64data }
                        );
    
                        let SIGMA_MD_TEXT = `
TOXIC-LOVER-MD CONNECTED 

Don't Forget To Give Star🌟 To My Repo`;
                        
                        await Qr_Code_By_Maher_Zubair.sendMessage(
                            Qr_Code_By_Maher_Zubair.user.id,
                            {text: SIGMA_MD_TEXT},
                            {quoted: session}
                        );

                        await delay(100);
                        await Qr_Code_By_Maher_Zubair.ws.close();
                    } catch (err) {
                        console.error('Session sending error:', err);
                    } finally {
                        await removeFile("temp/" + id);
                    }
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    SIGMA_MD_QR_CODE();
                }
            });
        } catch (err) {
            console.error('Initialization error:', err);
            if (!res.headersSent) {
                res.status(503).json({
                    code: "Service Unavailable",
                    error: err.message
                });
            }
            await removeFile("temp/" + id);
        }
    }
    
    try {
        await SIGMA_MD_QR_CODE();
    } catch (err) {
        console.error('Outer error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

module.exports = router

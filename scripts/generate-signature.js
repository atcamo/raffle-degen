import crypto from 'crypto';
import { Buffer } from 'buffer';
import fs from 'fs';

function generateKeyPair() {
    // Generar un nuevo par de claves Ed25519
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
        publicKeyEncoding: {
            type: 'spki',
            format: 'der'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'der'
        }
    });
    
    // Convertir a formato hexadecimal
    const privateKeyHex = '0x' + privateKey.toString('hex');
    const publicKeyHex = '0x' + publicKey.toString('hex');
    
    console.log('Clave privada de la Mini App (guárdala de forma segura):', privateKeyHex);
    console.log('Clave pública de la Mini App:', publicKeyHex);
    
    // Crear el payload para el manifiesto
    const domain = 'raffle-degen.netlify.app';
    const payload = {
        domain: domain
    };
    
    // Firmar el payload
    const sign = crypto.createSign('sha256');
    sign.update(JSON.stringify(payload));
    const signature = sign.sign(privateKey);
    const signatureHex = '0x' + signature.toString('hex');
    
    // Construir el manifiesto
    const manifest = {
        accountAssociation: {
            header: Buffer.from(JSON.stringify({
                fid: "432789",
                type: "custody",
                key: publicKeyHex
            })).toString('base64'),
            payload: Buffer.from(JSON.stringify({ domain })).toString('base64'),
            signature: signatureHex
        },
        frame: {
            version: "1",
            name: "Raffle DEGEN",
            iconUrl: "https://raffle-degen.netlify.app/og-image.svg",
            homeUrl: "https://raffle-degen.netlify.app",
            imageUrl: "https://raffle-degen.netlify.app/og-image.svg",
            buttonTitle: "🎫 Comprar Boletos",
            splashImageUrl: "https://raffle-degen.netlify.app/og-image.svg",
            splashBackgroundColor: "#6B21A8",
            webhookUrl: "https://raffle-degen.netlify.app/api/webhook"
        }
    };

    // Guardar el manifiesto en un archivo
    fs.writeFileSync('.well-known/farcaster.json', JSON.stringify(manifest, null, 2));
    console.log('\nManifiesto guardado en .well-known/farcaster.json');
    
    // Guardar la clave privada en un archivo .env
    fs.writeFileSync('.env', `MINI_APP_PRIVATE_KEY=${privateKeyHex}\n`);
    console.log('Clave privada guardada en .env');
}

generateKeyPair(); 
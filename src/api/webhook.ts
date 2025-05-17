import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { untrustedData, trustedData } = req.body;
        
        // Verificar que la solicitud viene de Farcaster
        if (!trustedData?.messageBytes) {
            return res.status(400).json({ error: 'Solicitud inválida' });
        }

        // Obtener la cantidad de boletos del input
        const cantidad = untrustedData?.input?.text ? parseInt(untrustedData.input.text) : 1;
        
        // Validar la cantidad
        if (isNaN(cantidad) || cantidad < 1 || cantidad > 10) {
            return res.status(400).json({ 
                error: 'Cantidad inválida',
                message: 'Por favor, ingresa una cantidad entre 1 y 10 boletos'
            });
        }

        // Aquí puedes procesar la compra de boletos
        console.log('Compra de boletos:', {
            cantidad,
            fid: trustedData.messageBytes.fid,
            timestamp: new Date().toISOString()
        });

        // Responder con éxito
        return res.status(200).json({
            success: true,
            message: `Compra de ${cantidad} boletos procesada correctamente`
        });
    } catch (error) {
        console.error('Error en webhook:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
} 
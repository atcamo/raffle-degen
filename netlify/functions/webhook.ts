import { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { input } = body;
        
        // Obtener la cantidad de boletos del input
        const cantidad = input?.text ? parseInt(input.text) : 1;
        
        // Validar la cantidad
        if (isNaN(cantidad) || cantidad < 1 || cantidad > 10) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: 'Cantidad inválida',
                    message: 'Por favor, ingresa una cantidad entre 1 y 10 boletos'
                })
            };
        }

        // Aquí puedes procesar la compra de boletos
        console.log('Compra de boletos:', {
            cantidad,
            timestamp: new Date().toISOString()
        });

        // Responder con éxito
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Compra de ${cantidad} boletos procesada correctamente`
            })
        };
    } catch (error) {
        console.error('Error en webhook:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error interno del servidor' })
        };
    }
};

export { handler }; 
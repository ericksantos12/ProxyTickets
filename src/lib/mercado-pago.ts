import { MercadoPagoConfig, Payment } from "mercadopago";
import { env } from "#env";

const client = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
const paymentApi = new Payment(client);

export async function createPixPayment(amount: number, description: string, payerEmail: string) {
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 30);

    const response = await paymentApi.create({
        body: {
            transaction_amount: amount,
            description,
            payment_method_id: "pix",
            date_of_expiration: expirationDate.toISOString(),
            payer: {
                email: payerEmail,
            },
        },
    });

    const transactionData = response.point_of_interaction?.transaction_data;

    return {
        paymentId: String(response.id),
        status: response.status,
        qrCodeBase64: transactionData?.qr_code_base64 ?? null,
        copyPaste: transactionData?.qr_code ?? null,
        expiresAt: expirationDate,
    };
}

export async function getPayment(paymentId: string) {
    return paymentApi.get({ id: paymentId });
}

export async function cancelPayment(paymentId: string) {
    return paymentApi.cancel({ id: paymentId });
}

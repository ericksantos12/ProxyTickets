import { MercadoPagoConfig, Order } from "mercadopago";
import { env } from "#env";
import { randomUUID } from "node:crypto";

const client = new MercadoPagoConfig({
    accessToken: env.MP_ACCESS_TOKEN,
    options: { testToken: env.MP_SANDBOX },
});
const orderApi = new Order(client);

export async function createPixPayment(amount: number, description: string, payerEmail: string) {
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 30);
    const payer = getOrderPayer(payerEmail);

    const response = await orderApi.create({
        body: {
            type: "online",
            description,
            external_reference: randomUUID(),
            total_amount: formatMercadoPagoAmount(amount),
            processing_mode: "automatic",
            payer,
            transactions: {
                payments: [
                    {
                        amount: formatMercadoPagoAmount(amount),
                        expiration_time: "PT30M",
                        payment_method: {
                            id: "pix",
                            type: "bank_transfer",
                        },
                    },
                ],
            },
        },
        requestOptions: { idempotencyKey: randomUUID() },
    });

    const payment = getOrderPayment(response);
    const paymentMethod = payment?.payment_method;
    if (!response.id) {
        throw new Error("Mercado Pago did not return an order ID.");
    }
    if (!paymentMethod?.qr_code || !paymentMethod.qr_code_base64) {
        throw new Error("Mercado Pago did not return PIX QR code data.");
    }

    return {
        paymentId: String(response.id),
        status: getOrderStatus(response),
        qrCodeBase64: paymentMethod.qr_code_base64,
        copyPaste: paymentMethod.qr_code,
        expiresAt: expirationDate,
    };
}

export async function getPayment(paymentId: string) {
    const response = await orderApi.get({ id: paymentId });

    return {
        id: response.id,
        status: getOrderStatus(response),
    };
}

export async function cancelPayment(paymentId: string) {
    return orderApi.cancel({ id: paymentId });
}

type MercadoPagoOrder = Awaited<ReturnType<Order["get"]>>;

function getOrderPayment(order: MercadoPagoOrder) {
    return order.transactions?.payments?.[0];
}

function getOrderStatus(order: MercadoPagoOrder) {
    const payment = getOrderPayment(order);
    return payment?.status ?? order.status;
}

function getOrderPayer(payerEmail: string) {
    if (env.MP_SANDBOX) {
        return {
            email: env.MP_TEST_PAYER_EMAIL,
            first_name: "APRO",
        };
    }

    return { email: payerEmail };
}

function formatMercadoPagoAmount(amount: number) {
    return amount.toFixed(2);
}

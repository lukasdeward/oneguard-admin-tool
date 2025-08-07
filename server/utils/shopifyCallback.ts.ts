import type { merchant } from "@prisma/client";

export const sendShopifyCallback = async (type: 'completed' | 'expired', merchant: merchant, orderIds: string[], userData?: { birthday: Date, cardType: string }) => {

    const shopifyUrl = merchant.shopify_url;

    const shopifyAppUrl = process.env.SHOPIFY_APP_URL;
    const oneguardAuth = process.env.SYSTEM_API_KEY;

    if (!oneguardAuth || !shopifyAppUrl) {
        console.error('SYSTEM_API_KEY or SHOPIFY_APP_URL is not set in environment variables');
        return false;
    }

    if (type === 'completed' && !userData) {
        console.error('User data is required for completed type');
        return false;
    }

    for (const orderId of orderIds) {
        const requestBody = JSON.stringify({
                    sessionId: shopifyUrl,
                    orderId,
                    verificationState: type,
                    cancelReason: type === 'expired' ? 'Verification expired' : undefined,
                    userData: type === 'completed' ? {  
                        birthday: userData?.birthday.toISOString(),
                        cardType: userData?.cardType || 'unknown',
                    } : undefined,
            });

            console.log(requestBody);
            console.log('url: ', `${shopifyAppUrl}/external/verified`);
            console.log('oneguardAuth: ', oneguardAuth);
            const response = await fetch(`${shopifyAppUrl}/external/verified`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-ONEGUARD-AUTH': oneguardAuth,
                },
                body: requestBody,
            });

        if (!response.ok) {
            console.error(`Failed to send Shopify callback: ${response.statusText}`);
            return false;
        } else {
            console.log(`Shopify callback sent successfully for order ${orderId} with status ${type}`);
        }
    }
    return true;
}

const GRAPH_VERSION = "v20.0";

type SendMessageInput = {
  recipientId: string;
  text: string;
  accessToken: string;
};

type SendWhatsAppMessageInput = SendMessageInput & {
  phoneNumberId: string;
};

async function parseGraphResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export async function sendInstagramMessage({ recipientId, text, accessToken }: SendMessageInput) {
  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/me/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      recipient: {
        id: recipientId
      },
      message: {
        text
      }
    })
  });
  const payload = await parseGraphResponse(response);

  if (!response.ok) {
    throw new Error(`Instagram send failed with ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

export async function sendWhatsAppMessage({ phoneNumberId, recipientId, text, accessToken }: SendWhatsAppMessageInput) {
  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipientId,
      type: "text",
      text: {
        body: text
      }
    })
  });
  const payload = await parseGraphResponse(response);

  if (!response.ok) {
    throw new Error(`WhatsApp send failed with ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

export async function testMetaConnection({ externalAccountId, accessToken }: { externalAccountId: string; accessToken: string }) {
  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${externalAccountId}?fields=id`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });
  const payload = await parseGraphResponse(response);

  if (!response.ok) {
    throw new Error(`Meta connection test failed with ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

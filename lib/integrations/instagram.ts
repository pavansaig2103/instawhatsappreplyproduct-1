const INSTAGRAM_SEND_ENDPOINT = "https://graph.facebook.com/v18.0/me/messages";

type SendInstagramMessageInput = {
  recipientId: string;
  text: string;
  accessToken: string;
};

export async function sendInstagramMessage({ recipientId, text, accessToken }: SendInstagramMessageInput) {
  const response = await fetch(INSTAGRAM_SEND_ENDPOINT, {
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Instagram send failed with ${response.status}: ${errorText}`);
  }

  return response.json();
}

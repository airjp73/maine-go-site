import type { APIRoute } from "astro";
import { z } from "zod";
import { zfd } from "zod-form-data";
import * as postmark from "postmark";
import { isHoneypotValid } from "../../lib/honeypot";

export const prerender = false;

const dataSchema = zfd.formData({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  formName: z.enum(["tournament", "contact"]),
});

const spamResponseSchema = z.object({ status: z.string() });
const checkSpam = async (emailContent: string) => {
  try {
    const response = await fetch(
      "https://spam.pinestatepixels.com/api/contact-form",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.PETTDEV_API_KEY}`,
        },
        body: JSON.stringify({
          emailContent,
          project: "maine-go-site",
          websiteName: "Maine Go",
          relevantTopics: [
            "The board game of Go, also known as Weiqi or Baduk",
            "A local Go club in Maine",
            "Questions about upcoming events like tournaments or meetings",
            "Questions about the Maine chapter of the American Go Association",
            "Questions about how to play Go or about finding people to play with",
          ],
        }),
      }
    );
    const data = await response.json();
    const result = spamResponseSchema.parse(data);
    return result.status === "accept";
  } catch (error) {
    // Don't currently have proper error tracking, so err on the side of allowing the email through.
    console.error(error);
    return "accept";
  }
};

const tournamentMessage =
  "A new tournament registration has been submitted for the Maine Go state championship:\n\nAGA id or rank: ";

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  if (!isHoneypotValid(formData))
    return new Response("Try again later", { status: 400 });

  const data = dataSchema.parse(formData);
  const message =
    data.formName === "tournament"
      ? tournamentMessage + data.message
      : data.message;

  const apiKey = import.meta.env.POSTMARK_API_KEY;
  const recipient = import.meta.env.CONTACT_FORM_RECIPIENT_EMAIL;
  if (!apiKey || !recipient)
    throw new Error("Postmark isn't enabled in this environment.");

  const client = new postmark.ServerClient(apiKey);

  const spamCheck = await checkSpam(message);

  if (!spamCheck) {
    // Don't tell spammers that they were detected as spam.
    return redirect("/contact-thanks");
  }

  await client.sendEmail({
    From: "contact@mainego.org",
    To: recipient,
    Subject: "Maine Go - Contact form submission",
    TextBody: [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      "",
      `Message:\n${message}`,
    ].join("\n"),
    MessageStream: "outbound",
    ReplyTo: data.email,
  });

  return redirect("/contact-thanks");
};

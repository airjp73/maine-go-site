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
});

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  if (!isHoneypotValid(formData))
    return new Response("Try again later", { status: 400 });

  const data = dataSchema.parse(formData);

  const apiKey = import.meta.env.POSTMARK_API_KEY;
  const recipient = import.meta.env.CONTACT_FORM_RECIPIENT_EMAIL;
  if (!apiKey || !recipient)
    throw new Error("Postmark isn't enabled in this environment.");

  const client = new postmark.ServerClient(apiKey);

  await client.sendEmail({
    From: "contact@mainego.org",
    To: recipient,
    Subject: "Maine Go - Contact form submission",
    TextBody: [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      "",
      `Message:\n${data.message}`,
    ].join("\n"),
    MessageStream: "outbound",
    ReplyTo: data.email,
  });

  return redirect("/contact-thanks");
};

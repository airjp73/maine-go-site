import type { APIRoute } from "astro";
import { z } from "zod";
import { zfd } from "zod-form-data";

export const prerender = false;

const dataSchema = zfd.formData({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = dataSchema.parse(await request.formData());
  return redirect("/contact-thanks");
};

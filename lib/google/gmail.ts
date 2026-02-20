import { google } from "googleapis";
import { getAuthedClient } from "./oauth";

export async function sendEmail(data: {
  to: string;
  subject: string;
  body: string;
}) {
  const auth = await getAuthedClient();
  if (!auth) throw new Error("Google not connected");

  const gmail = google.gmail({ version: "v1", auth });

  const message = [
    `To: ${data.to}`,
    `Subject: ${data.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    data.body,
  ].join("\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });

  return res.data;
}

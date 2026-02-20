import { google } from "googleapis";
import { getAuthedClient } from "./oauth";

export async function searchDriveFiles(query: string) {
  const auth = await getAuthedClient();
  if (!auth) throw new Error("Google not connected");

  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: `name contains '${query.replace(/'/g, "\\'")}'`,
    fields: "files(id, name, mimeType, webViewLink, iconLink, modifiedTime)",
    pageSize: 10,
    orderBy: "modifiedTime desc",
  });

  return res.data.files ?? [];
}

export async function getDriveFile(fileId: string) {
  const auth = await getAuthedClient();
  if (!auth) throw new Error("Google not connected");

  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, webViewLink, iconLink, modifiedTime, size",
  });

  return res.data;
}

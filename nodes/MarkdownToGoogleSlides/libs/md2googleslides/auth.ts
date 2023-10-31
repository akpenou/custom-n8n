import { OAuth2Client } from "google-auth-library";

export const SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/tasks",
  "https://www.googleapis.com/auth/tasks.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/presentations",
  "https://www.googleapis.com/auth/drive",
];

export const creds = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUrl: `${process.env.GOOGLE_REDIRECT_URI}`, // /gslides/code`,
};

export const oauth2Client = new OAuth2Client(
  creds.clientId,
  creds.clientSecret,
  creds.redirectUrl
);

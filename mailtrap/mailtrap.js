
// This domain can only be used to send emails to yourself.______________________________

// To send emails to others, add and verify your own domain.

import { MailtrapClient } from 'mailtrap'
import dotenv from 'dotenv';
dotenv.config();
const TOKEN = process.env.MAILTRAP_TOKEN;
const ENDPOINT = process.env.MAILTRAP_ENDPOINT;

export const mailtrapClient = new MailtrapClient({ endpoint: ENDPOINT, token: TOKEN });

export const sender = {
    // If we have own domain then we can add them
  email: "mailtrap@demomailtrap.com",
  name: "Md Nazim",
};


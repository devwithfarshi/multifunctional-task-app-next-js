import nodemailer from 'nodemailer';
const emailConfig = {
  service: process.env.EMAIL_SERVICE,
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT!),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: process.env.EMAIL_POOL === 'true',
  maxConnections: parseInt(process.env.EMAIL_MAX_CONNECTIONS!, 10),
  maxMessages: parseInt(process.env.EMAIL_MAX_MESSAGES!, 10),
};

const transporter = nodemailer.createTransport(emailConfig);

export default transporter;

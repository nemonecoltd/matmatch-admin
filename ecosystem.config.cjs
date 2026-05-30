require('dotenv').config({ path: '/home/nemonecoltd/nemone-network/admin/.env.local' });

module.exports = {
  apps : [{
    name   : "admin",
    script : "npm",
    args   : "start",
    cwd    : "/home/nemonecoltd/nemone-network/admin",
    env: {
      NODE_ENV: "production",
      NEXTAUTH_URL: "https://admin.nemoneai.com",
      ADMIN_EMAIL: "nemonecoltd@gmail.com",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_DEBUG: "false",
      ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY,
      BACKEND_URL: process.env.BACKEND_URL || "http://34.64.98.113:8080"
    }
  }]
};
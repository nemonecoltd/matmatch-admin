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
      NEXTAUTH_DEBUG: "false"
    }
  }]
};
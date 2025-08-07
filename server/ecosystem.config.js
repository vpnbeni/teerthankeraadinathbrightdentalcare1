module.exports = {
  apps: [
    {
      name: "teerthanker-dental-api",
      script: "server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      // Logging
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Process management
      max_memory_restart: "1G",
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: "10s",

      // Monitoring
      watch: false,
      ignore_watch: ["node_modules", "logs", "uploads"],

      // Advanced features
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Environment specific settings
      node_args: "--max-old-space-size=1024",
    },
  ],

  deploy: {
    production: {
      user: "root",
      host: ["api.teerthankerdentalcare.com"],
      ref: "origin/main",
      repo: "git@github.com:your-username/teerthanker-dental-care.git",
      path: "/var/www/teerthanker-dental-api",
      "post-deploy":
        "cd server && npm install && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "mkdir -p /var/www/teerthanker-dental-api/logs",
    },
  },
};

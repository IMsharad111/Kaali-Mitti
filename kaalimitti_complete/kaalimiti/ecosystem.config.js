module.exports = {
  apps: [
    {
      name: 'kaalimitti-backend',
      script: 'server.js',
      cwd: '/var/www/kaalimitti/kaalimitti_complete/kaalimiti/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/www/kaalimitti/kaalimitti_complete/kaalimiti/logs/err.log',
      out_file: '/var/www/kaalimitti/kaalimitti_complete/kaalimiti/logs/out.log',
      time: true,
    },
  ],
};

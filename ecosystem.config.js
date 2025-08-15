module.exports = {
  apps: [{
    name: 'stable-crm',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/stable-crm-error.log',
    out_file: '/var/log/pm2/stable-crm-out.log',
    log_file: '/var/log/pm2/stable-crm.log',
    time: true,
    watch: false,
    max_memory_restart: '300M'
  }]
}
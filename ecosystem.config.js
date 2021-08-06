const REPO = 'git@gitlab.com:codosaholding/stht-server.git';
const { version } = require('./package.json');
module.exports = {
  apps: [
    {
      name: 'sumviet-api',
      script: './dist/bin/index.js'
    },
    {
      name: 'sumviet-api-staging',
      script: './dist/bin/index.js'
    }
  ],
  deploy: {
    production: {
      user: 'sumviet',
      host: 'api.sumviet.com',
      ref: 'origin/master',
      repo: REPO,
      ssh_options: 'StrictHostKeyChecking=no',
      path: `/home/sumviet/stht-server`,
      'post-deploy':
        'npm install && npm run build' +
        ' && pm2 startOrRestart ecosystem.config.js --only sumviet-api' +
        ' && pm2 save'
    },
    staging: {
      user: 'sumviet',
      host: 'api.sumviet.com',
      ref: `origin/release/${version}`,
      repo: REPO,
      ssh_options: 'StrictHostKeyChecking=no',
      path: `/home/sumviet/stht-server-staging`,
      'post-deploy':
        'npm install && npm run build' +
        ' && pm2 startOrRestart ecosystem.config.js --only sumviet-api-staging' +
        ' && pm2 save'
    },
    development: {
      user: 'ubuntu',
      host: 'api.sumviet.xyz',
      ref: 'origin/develop',
      repo: REPO,
      ssh_options: 'StrictHostKeyChecking=no',
      path: `/home/ubuntu/server/stht-server`,
      'post-deploy':
        'npm install && npm run build' +
        ' && pm2 startOrRestart ecosystem.config.js --only sumviet-api' +
        ' && pm2 save'
    }
  }
};

import packageInfo from '../../package.json';

export const environment = {
    appVersion: packageInfo.version,
    production: true,
    apiUrl: 'https://localhost:3000',
    baseDomain: 'funeral.com',
    hostSubdomain: 'host'
};

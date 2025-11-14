import packageInfo from '../../package.json';

export const environment = {
    appVersion: packageInfo.version,
    production: true,
    apiUrl: 'https://mizo.co.za',
    baseDomain: 'mizo.co.za',
    hostSubdomain: 'host'
};

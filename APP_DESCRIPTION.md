# Application Description

## Project: Funeral-angular-ui

### Purpose
This is a multi-tenant funeral management application. It provides tenant-specific configuration, branding, and features for funeral service providers and their clients.

### Key Features
- Multi-tenant support: Each tenant has unique settings, branding, and data isolation.
- Tenant settings: Store logos, widget settings, styling, premium value settings, and more.
- Secure authentication and authorization for users.
- Public and private routes, with tenant context provided via token or X-Tenant-ID header.
- API endpoints are always tenant-aware.
- Frontend services are generated using Orval for API sync.
- Database scripts must be updated with model changes.
- UI is being migrated from PrimeNG to Bootstrap.

### Architecture
- Angular frontend (separate .ts and .html files for components)
- Backend API with tenant-aware endpoints
- Database scripts for setup and sync

### Multi-Tenant Architecture
The application supports a host tenant, accessible via domains like `dev.co.za` or `host.dev.co.za`, where tenants can be managed and created. Tenants can also self-register, which creates a unique domain for them (e.g., `mydomain.dev.co.za`).

- Tenant creation and management is only possible from the host tenant site.
- Each tenant has isolated configuration, data, and branding.
- Tenant registration automatically provisions a unique subdomain and initializes tenant-specific settings.
- Members are associated with tenants and have roles and permissions that control access to features and data.
- Beneficiaries and dependents are linked to members but do not have user accounts or login access.
- Policy cover registration is managed per tenant, and members can add beneficiaries/dependents to their policies.
- All user dashboards are context-aware, showing only options relevant to the tenant, role, and permission level.
- Admins can customize the tenant landing page from the dashboard.
- Security: All API requests must be tenant-aware, using tokens for authenticated users and X-Tenant-ID headers for public routes.
- Automation: When adding API endpoints, Orval is used to generate frontend services, and DB scripts are updated with model changes.
- Migration: Missing business logic in Node.js should be checked and ported from the legacy C# API.
- Member registration can optionally require policy selection, controlled by a toggle in tenant settings. If disabled, members can register without selecting a policy, and the API will not require a policy ID.

From a tenant site, only tenant-specific data is accessible. Tenants have members who can register and are associated with a user account, role, and permissions, allowing them to log in. Tenants register for policy cover, which is provided by the tenant. Members can add beneficiaries and dependents, who are not associated with a user account and cannot log in.

All users have a dashboard showing options relevant to their tenant, role, and permission level. Admins can build and customize the landing page from the dashboard.

### Development Guidelines

### Migration Note
The API is being migrated from C# to Node.js. If business logic is missing from the Node.js API, check the C# API implementation and reuse or adapt it if it exists.

### Deployment Instructions
#### UI Deployment
To deploy the UI, use the following SCP command:

```
scp -r "C:\Projects\Funeral\Frontend\dist\sakai-ng\browser\*" root@102.211.206.197:/var/www/mizo-frontend/browser/
```

#### API Deployment
For the API, push your changes to git, then on the server:

1. Pull the latest code:
	```
	git pull
	```
2. Restart the API using pm2:
	```
	pm2 restart <api-process-name>
	```

### Contact
For more information, see project documentation or contact the project owner.

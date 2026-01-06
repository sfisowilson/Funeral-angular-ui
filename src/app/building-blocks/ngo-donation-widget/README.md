# NGO Donation Widget

A premium donation widget designed specifically for NGO tenants that integrates directly with the tenant's configured payment gateway settings.

## Features

- **Automatic Payment Gateway Integration**: Automatically loads and uses payment gateways configured in `/admin/payment-config`
- **Multiple Payment Providers**: Supports PayPal, Stripe, PayFast, PayGate, Square, and Paystack
- **Preset & Custom Amounts**: Quick-select donation amounts or enter custom amount
- **One-time or Recurring**: Donors can choose between one-time or monthly recurring donations
- **Impact Messaging**: Dynamic messages that scale with donation amount
- **Real-time Gateway Status**: Shows only active payment gateways
- **Impact Statistics**: Optional display of total donations, donor count, and projects supported
- **Professional Design**: Modern card-based design with smooth transitions and responsive layout

## Premium Feature

This widget is marked as a **premium feature** and is **only available for NGO tenants**. It will automatically appear in the widget selector for NGO tenant types.

## Payment Gateway Configuration

### Prerequisites

**Important**: Before using this widget, the tenant admin must configure at least one payment gateway:

1. Navigate to `/admin/payment-config`
2. Add a payment gateway (PayFast, PayPal, Stripe, etc.)
3. Configure the gateway credentials:
   - Merchant ID
   - Site Code
   - API Keys
   - Secret Keys
   - Webhook URLs
4. Set the gateway to **Active**

### Supported Gateways

The widget automatically detects and displays:
- **PayFal**: Requires PayPal Business account
- **Stripe**: Requires Stripe API keys
- **PayFast**: South African payment gateway
- **Square**: Requires Square account
- **Paystack**: African payment gateway
- **PayGate**: South African payment gateway

## Widget Configuration

### Default Configuration

```typescript
{
    title: 'Make a Donation',
    subtitle: 'Support our mission and create lasting change',
    backgroundColor: '#f9fafb',
    padding: 40,
    cardBackgroundColor: '#ffffff',
    titleColor: '#111827',
    titleSize: 32,
    subtitleColor: '#6b7280',
    accentColor: '#059669',
    donateButtonColor: '#059669',
    donateButtonTextColor: '#ffffff',
    missionStatement: 'Your generous donation directly supports our mission...',
    showImpactStats: true,
    totalDonations: 'R245,000',
    donorCount: '1,234',
    projectsSupported: '42'
}
```

### Customizable Properties

#### Content
- `title`: Main widget heading
- `subtitle`: Subheading text
- `missionStatement`: Mission statement displayed above donation form

#### Colors
- `backgroundColor`: Widget background color
- `cardBackgroundColor`: Donation card background
- `titleColor`: Main title color
- `subtitleColor`: Subtitle color
- `accentColor`: Accent/highlight color (selected buttons)
- `donateButtonColor`: Main donate button background
- `donateButtonTextColor`: Donate button text color
- `labelColor`: Form label text color
- `amountButtonColor`: Preset amount button background
- `amountButtonTextColor`: Preset amount button text
- `gatewayButtonColor`: Payment gateway button background
- `gatewayButtonTextColor`: Payment gateway button text

#### Layout
- `padding`: Overall widget padding in pixels
- `titleSize`: Title font size in pixels
- `subtitleSize`: Subtitle font size in pixels

#### Impact Stats
- `showImpactStats`: Boolean to show/hide impact statistics section
- `totalDonations`: Display text for total raised (e.g., "R245,000")
- `donorCount`: Display text for number of donors (e.g., "1,234")
- `projectsSupported`: Display text for projects count (e.g., "42")

## Usage Example

### Adding to a Page

1. Open the Custom Page Builder
2. Click "Add Widget"
3. Select "NGO Donation" from the widget list
4. Configure the widget settings in the editor
5. Save your changes

### Customizing Preset Amounts

The preset donation amounts are defined in the component:
```typescript
presetAmounts = [100, 250, 500, 1000, 2500, 5000];
```

To customize these, edit the component file or create a configuration option.

## How It Works

### Payment Flow

1. **Widget Loads**: On initialization, the widget fetches active payment gateways from `/api/payment-config/gateway-list`
2. **Gateway Selection**: Donor sees only active, configured gateways
3. **Amount Selection**: Donor chooses preset amount or enters custom amount
4. **Frequency Selection**: One-time or monthly recurring
5. **Donation Processing**:
   - Creates a payment session via `/api/Payment/Payment_CreateSession`
   - Receives redirect URL to payment gateway
   - Redirects donor to secure payment gateway
6. **Completion**: After payment, gateway redirects back to configured return URL

### Backend Integration

The widget integrates with:
- **Payment Config API** (`/api/payment-config/gateway-list`): Fetches configured gateways
- **Payment Service API** (`/api/Payment/Payment_CreateSession`): Creates payment session

### Request Format

```json
{
    "amount": 500,
    "provider": "PayFast",
    "isRecurring": false,
    "currency": "ZAR",
    "description": "Donation to Organization Name",
    "metadata": {
        "widgetConfig": "Make a Donation"
    }
}
```

## Impact Messaging

The widget provides context-aware impact messages based on donation amount:

- **< R250**: Essential services support message
- **R250-R999**: Multiple projects support message
- **R1000-R4999**: Lasting impact message
- **≥ R5000**: Transformative donation message

## Error Handling

The widget handles several error scenarios:

1. **No Gateways Configured**: Shows message to contact administrator
2. **Gateway Loading Failed**: Shows warning and retry option
3. **Invalid Amount**: Validates donation amount before processing
4. **Payment Session Failed**: Shows error with details from backend
5. **No Gateway Selected**: Prompts user to select payment method

## Responsive Design

- **Desktop (≥1025px)**: Full layout with all elements visible
- **Tablet (769px-1024px)**: Adjusted spacing and button sizes
- **Mobile (<768px)**: Stacked layout, touch-optimized buttons

## Styling

The widget uses:
- Card-based design with shadow effects
- Smooth hover transitions on buttons
- Color-coded frequency buttons
- Icon-enhanced payment gateway buttons
- Professional input fields with placeholder styling

## Security Considerations

- **No Sensitive Data Storage**: Widget never stores payment credentials
- **Gateway API Integration**: All payment processing happens on secure gateway servers
- **HTTPS Required**: Payment session creation requires secure connection
- **Token-based Auth**: Uses JWT authentication for API calls

## Testing

### Test Mode

If a payment gateway is configured with `isTestMode: true`, donations will use the gateway's test environment:
- No real money is processed
- Use test card numbers provided by the gateway
- Test transactions appear in the gateway's test dashboard

### Production Mode

When `isTestMode: false`:
- Real transactions are processed
- Actual funds are transferred
- Donors are charged
- Receipts and confirmations are sent

## Troubleshooting

### Widget Shows "No Payment Methods Configured"

**Solution**: Admin needs to configure at least one payment gateway:
1. Go to `/admin/payment-config`
2. Add and activate a gateway

### Payment Gateway Not Appearing

**Possible Causes**:
- Gateway is set to inactive
- Gateway configuration is incomplete
- API permissions not granted

**Solution**: Check gateway configuration in admin panel

### Donation Button Not Working

**Check**:
1. Amount selected (> 0)
2. Gateway selected
3. Browser console for errors
4. Backend API connectivity

### Payment Session Creation Fails

**Common Issues**:
- Invalid gateway configuration
- Missing API credentials
- Backend service unavailable
- Network connectivity issues

## Best Practices

1. **Configure Multiple Gateways**: Offer donors payment choice
2. **Test Before Launch**: Use test mode to verify integration
3. **Update Impact Stats**: Keep donation statistics current
4. **Clear Mission Statement**: Help donors understand impact
5. **Mobile Optimization**: Test on mobile devices
6. **Error Monitoring**: Monitor payment failures and gateway errors

## Future Enhancements

Potential improvements:
- Custom preset amounts via editor
- Donor information collection
- Email receipt generation
- Donation certificates
- Campaign-specific donations
- Donor recognition wall integration
- Recurring donation management dashboard

## Related Components

- [Payment Config Admin](../../pages/admin/payment-config/)
- [Payment Service Proxy](../../core/services/service-proxies.ts)
- [NGO Events Widget](../ngo-events-widget/)
- [NGO Impact Reports Widget](../ngo-impact-reports-widget/)

## API Dependencies

This widget requires:
- Backend Payment Config Controller
- Backend Payment Service
- Configured payment gateway (PayFast, PayPal, Stripe, etc.)
- Active tenant with NGO type
- Premium subscription (if subscription system is enabled)

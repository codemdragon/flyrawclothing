// --- SITE DATA LAYER ---
// Fetches db.json at runtime and exposes siteData globally.

let siteData = null;
let products = [];

// Currency list for the admin panel and display
const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
    { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
];

function formatPrice(amount) {
    if (!siteData) return '$' + amount.toFixed(2);
    const sym = siteData.settings.currency.symbol;
    return sym + amount.toFixed(2);
}

async function loadSiteData() {
    try {
        const resp = await fetch('db.json?t=' + Date.now());
        siteData = await resp.json();
        products = siteData.products;
    } catch (e) {
        console.warn('Failed to fetch db.json, using fallback data.');
        // Fallback: if db.json isn't available yet, use empty defaults
        siteData = {
            settings: {
                currency: { code: 'USD', symbol: '$' },
                cartMode: 'social',
                socialPlatform: 'instagram',
                marqueeTexts: ['NEW DROPS FRIDAY', 'FREE SHIPPING OVER $150', 'WORLDWIDE SHIPPING'],
                heroTagline: 'Define Your Raw',
                heroSubtext: 'Streetwear reimagined for the generation that never sleeps.'
            },
            contacts: { instagram: '', whatsapp: '', facebook: '', email: '' },
            products: []
        };
        products = siteData.products;
    }
}

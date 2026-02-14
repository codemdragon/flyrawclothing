let cart = JSON.parse(localStorage.getItem('flyraw_cart')) || [];

// --- PRELOADER ---

function showPreloader() {
    const el = document.getElementById('preloader');
    if (el) el.style.display = 'flex';
}

function hidePreloader() {
    const el = document.getElementById('preloader');
    if (!el) return;
    el.classList.add('preloader-fade-out');
    setTimeout(() => { el.style.display = 'none'; }, 500);
}

// --- DYNAMIC CONTACTS ---

function populateContacts() {
    if (!siteData) return;
    const c = siteData.contacts;
    // Instagram links
    document.querySelectorAll('[data-contact="instagram"]').forEach(el => {
        if (c.instagram) {
            el.href = `https://instagram.com/${c.instagram.replace('@', '')}`;
            el.style.display = '';
        }
    });
    // WhatsApp links
    document.querySelectorAll('[data-contact="whatsapp"]').forEach(el => {
        if (c.whatsapp) {
            el.href = `https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`;
            el.style.display = '';
        }
    });
    // Facebook links
    document.querySelectorAll('[data-contact="facebook"]').forEach(el => {
        if (c.facebook) {
            el.href = c.facebook.startsWith('http') ? c.facebook : `https://facebook.com/${c.facebook}`;
            el.style.display = '';
        }
    });
    // Email links
    document.querySelectorAll('[data-contact="email"]').forEach(el => {
        if (c.email) {
            el.href = `mailto:${c.email}`;
            el.style.display = '';
        }
    });
}

// --- MARQUEE ---

function populateMarquee() {
    if (!siteData) return;
    const container = document.getElementById('marquee-track');
    if (!container) return;

    const texts = siteData.settings.marqueeTexts || [];
    // Build two copies for seamless looping
    let html = '';
    for (let i = 0; i < 2; i++) {
        texts.forEach(t => {
            html += `<span class="font-heading font-bold text-2xl uppercase mx-8">${t}</span>`;
        });
    }
    container.innerHTML = html;
}

// --- SITE IMAGES ---

function populateSiteImages() {
    if (!siteData || !siteData.images) return;
    const imgs = siteData.images;
    document.querySelectorAll('[data-site-img]').forEach(el => {
        const key = el.getAttribute('data-site-img');
        if (imgs[key]) el.src = imgs[key];
    });
}

// --- UI FUNCTIONS ---

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const isOpen = !sidebar.classList.contains('-translate-x-full');

    if (isOpen) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.remove('opacity-100', 'visible');
        overlay.classList.add('opacity-0', 'invisible');
    } else {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('opacity-0', 'invisible');
        overlay.classList.add('opacity-100', 'visible');
        const cartDrawer = document.getElementById('cart-drawer');
        if (cartDrawer) cartDrawer.classList.add('translate-x-full');
    }
}

function toggleCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('overlay');

    if (!cartDrawer) return;

    const isOpen = !cartDrawer.classList.contains('translate-x-full');

    if (isOpen) {
        cartDrawer.classList.add('translate-x-full');
        overlay.classList.remove('opacity-100', 'visible');
        overlay.classList.add('opacity-0', 'invisible');
    } else {
        cartDrawer.classList.remove('translate-x-full');
        overlay.classList.remove('opacity-0', 'invisible');
        overlay.classList.add('opacity-100', 'visible');
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('-translate-x-full');
    }
    renderCart();
}

function closeDrawers() {
    const sidebar = document.getElementById('sidebar');
    const cartDrawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('overlay');

    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (cartDrawer) cartDrawer.classList.add('translate-x-full');

    overlay.classList.remove('opacity-100', 'visible');
    overlay.classList.add('opacity-0', 'invisible');
}

// --- CART LOGIC ---

function addToCart(productId, size = 'L') {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existingItem = cart.find(item => item.id === productId && item.size === size);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1, size });
    }

    saveCart();
    updateCartCount();
    toggleCart();
}

function updateQuantity(productId, size, change) {
    const item = cart.find(i => i.id === productId && i.size === size);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i !== item);
        }
    }
    saveCart();
    renderCart();
    updateCartCount();
}

function saveCart() {
    localStorage.setItem('flyraw_cart', JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    if (!badge) return;

    badge.innerText = count;
    if (count > 0) {
        badge.classList.remove('opacity-0');
    } else {
        badge.classList.add('opacity-0');
    }
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const footer = document.getElementById('cart-footer');
    const subtotalEl = document.getElementById('cart-subtotal');

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-center text-brand-grey space-y-4">
                <i data-lucide="shopping-cart" class="w-16 h-16 opacity-20"></i>
                <p>Your bag is empty.</p>
                <a href="shop.html" class="mt-4 px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-heading uppercase tracking-widest text-sm transition-colors block text-center">Start Shopping</a>
            </div>
        `;
        if (footer) footer.classList.add('hidden');
    } else {
        if (footer) footer.classList.remove('hidden');
        let html = '';
        let total = 0;

        cart.forEach(item => {
            total += item.price * item.quantity;
            html += `
                <div class="flex space-x-4 animate-fade-in">
                    <div class="w-20 h-24 bg-brand-dark flex-shrink-0">
                        <img src="${item.image}" class="w-full h-full object-cover" alt="${item.name}">
                    </div>
                    <div class="flex-1 flex flex-col justify-between">
                        <div>
                            <h3 class="font-heading font-bold text-sm uppercase leading-tight">${item.name}</h3>
                            <p class="text-xs text-brand-grey mt-1">Size: ${item.size}</p>
                        </div>
                        <div class="flex justify-between items-end">
                            <div class="flex items-center border border-white/20">
                                <button onclick="updateQuantity(${item.id}, '${item.size}', -1)" class="px-2 py-1 hover:bg-white/10">-</button>
                                <span class="px-2 text-sm">${item.quantity}</span>
                                <button onclick="updateQuantity(${item.id}, '${item.size}', 1)" class="px-2 py-1 hover:bg-white/10">+</button>
                            </div>
                            <span class="font-bold text-brand-lime">${formatPrice(item.price * item.quantity)}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        if (subtotalEl) subtotalEl.innerText = formatPrice(total);
    }
    if (window.lucide) lucide.createIcons();
}

// --- CHECKOUT LOGIC ---

function handleCheckout() {
    if (!siteData || cart.length === 0) return;
    const mode = siteData.settings.cartMode;

    if (mode === 'social') {
        // Build order summary
        let summary = '🛍️ *FLYRAW ORDER*\n\n';
        let total = 0;
        cart.forEach(item => {
            const lineTotal = item.price * item.quantity;
            total += lineTotal;
            summary += `▪ ${item.name} (${item.size}) x${item.quantity} — ${formatPrice(lineTotal)}\n`;
        });
        summary += `\n💰 *Total: ${formatPrice(total)}*`;

        // Copy to clipboard
        navigator.clipboard.writeText(summary).catch(() => { });

        const platform = siteData.settings.socialPlatform || 'instagram';
        if (platform === 'whatsapp' && siteData.contacts.whatsapp) {
            const phone = siteData.contacts.whatsapp.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(summary)}`, '_blank');
        } else if (siteData.contacts.instagram) {
            const handle = siteData.contacts.instagram.replace('@', '');
            window.open(`https://ig.me/m/${handle}`, '_blank');
        }

        // Show toast
        showToast('Order copied to clipboard! Redirecting...');
    } else if (mode === 'gateway') {
        showToast('Payment gateway integration coming soon!');
    } else {
        // coming_soon
        showToast('Checkout is coming soon! Stay tuned.');
    }
}

// --- TOAST ---

function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-6 right-6 z-[100] flex flex-col gap-2';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'bg-brand-lime text-brand-black px-6 py-3 rounded-lg font-heading font-bold text-sm shadow-lg animate-fade-in';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('preloader-fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- INIT ---

document.addEventListener('DOMContentLoaded', async () => {
    showPreloader();
    await loadSiteData();
    updateCartCount();
    populateContacts();
    populateMarquee();
    populateSiteImages();
    hidePreloader();
    if (window.lucide) lucide.createIcons();

    // Wire up checkout buttons
    document.querySelectorAll('[data-checkout]').forEach(btn => {
        btn.addEventListener('click', handleCheckout);
    });
});

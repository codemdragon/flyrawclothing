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
    if (texts.length === 0) return;

    // Build a single set of items
    const items = texts.map(t =>
        `<span class="font-heading font-bold text-2xl uppercase mx-8">${t}</span>`
    ).join('');

    // Two identical .marquee-set blocks → each fills viewport, scroll -50% loops perfectly
    container.innerHTML =
        `<div class="marquee-set">${items}</div>` +
        `<div class="marquee-set">${items}</div>`;
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

// --- SIDEBAR SHOP MENU ---

function populateSidebarShop() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || !siteData) return;

    // Find the Shop link in the nav
    const shopLink = Array.from(sidebar.querySelectorAll('a')).find(a => a.getAttribute('href') === 'shop.html');
    if (!shopLink) return;

    // Check if we already injected the menu
    if (shopLink.nextElementSibling && shopLink.nextElementSibling.classList.contains('sidebar-submenu')) return;

    const cats = siteData.settings.productCategories || ['hoodie', 't-shirt', 'bottoms', 'accessories'];

    // Create submenu container
    const submenu = document.createElement('div');
    submenu.className = 'sidebar-submenu flex flex-col space-y-4 pl-4 mt-4 border-l-2 border-white/10 ml-2 hidden'; // Hidden by default

    submenu.innerHTML = cats.map(c => `
        <a href="shop.html?category=${c}" class="font-heading text-xl font-bold text-brand-grey hover:text-brand-lime transition-colors uppercase">
            ${c}
        </a>
    `).join('');

    // Add toggle button to Shop link
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '<i data-lucide="chevron-down" class="w-6 h-6"></i>';
    toggleBtn.className = 'absolute right-0 top-1/2 -translate-y-1/2 p-2 text-brand-lime hover:text-white transition-colors';
    toggleBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        submenu.classList.toggle('hidden');
        toggleBtn.querySelector('i').style.transform = submenu.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    };

    // Wrap shop link in relative container to position toggle
    const wrapper = document.createElement('div');
    wrapper.className = 'relative';
    shopLink.parentNode.insertBefore(wrapper, shopLink);
    wrapper.appendChild(shopLink);
    wrapper.appendChild(toggleBtn);
    wrapper.appendChild(submenu);

    // Open submenu if on shop page or if a category is selected? 
    // Maybe keep closed by default for cleanliness unless user clicks toggle.
}

// --- GLOBAL SEARCH ---

function injectSearchOverlay() {
    if (document.getElementById('search-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'search-overlay';
    // Increased opacity (bg-black/95) and kept blur (handled in CSS or here)
    overlay.className = 'fixed inset-0 z-[60] bg-black/95 opacity-0 invisible flex flex-col items-center justify-start pt-12 md:pt-32 px-6 transition-all duration-300 backdrop-blur-xl';
    overlay.innerHTML = `
        <div class="w-full max-w-4xl relative">
            <div class="absolute right-0 -top-12 md:hidden">
                 <button onclick="toggleSearch()" class="text-brand-grey hover:text-white transition-colors p-2">
                    <span class="uppercase text-xs font-bold tracking-widest">Close</span>
                </button>
            </div>
            
            <div class="relative flex items-center border-b-2 border-white/10 focus-within:border-brand-lime transition-colors">
                <i data-lucide="search" class="text-brand-grey w-6 h-6 md:w-8 md:h-8 mr-4"></i>
                <input type="text" id="search-input" placeholder="SEARCH..." 
                    class="w-full bg-transparent text-3xl md:text-6xl font-heading font-bold uppercase py-4 text-white focus:outline-none placeholder:text-white/10"
                    oninput="handleGlobalSearch(this.value)" onkeydown="if(event.key === 'Enter') window.location.href='shop.html?search='+this.value">
                <button onclick="toggleSearch()" class="hidden md:block ml-4 text-brand-grey hover:text-brand-lime transition-colors">
                    <i data-lucide="x" class="w-8 h-8 md:w-10 md:h-10"></i>
                </button>
                <button onclick="toggleSearch()" class="md:hidden ml-2 text-brand-lime">
                    <i data-lucide="arrow-right" class="w-6 h-6"></i>
                </button>
            </div>
            
            <p class="text-brand-grey text-xs uppercase tracking-widest mt-4">Type to search products</p>
        </div>
        <div id="search-results" class="w-full max-w-4xl mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 overflow-y-auto max-h-[60vh] pb-10 no-scrollbar">
            <!-- Results injected here -->
        </div>
        <div id="search-empty" class="hidden text-brand-grey font-heading text-xl uppercase mt-8 tracking-widest text-center w-full">
            No results found.
        </div>
    `;
    document.body.appendChild(overlay);
    if (window.lucide) lucide.createIcons();
}

function toggleSearch() {
    const overlay = document.getElementById('search-overlay');
    if (!overlay) return;
    const isVisible = !overlay.classList.contains('invisible');

    if (isVisible) {
        overlay.classList.add('opacity-0', 'invisible');
        overlay.classList.remove('opacity-100', 'visible');
        document.body.style.overflow = '';
    } else {
        overlay.classList.remove('opacity-0', 'invisible');
        overlay.classList.add('opacity-100', 'visible');
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('search-input').focus(), 100);
        handleGlobalSearch(''); // Clear or reset
    }
}

function handleGlobalSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    const emptyMsg = document.getElementById('search-empty');
    if (!query) {
        resultsContainer.innerHTML = '';
        emptyMsg.classList.add('hidden');
        return;
    }

    const term = query.toLowerCase();
    const matches = products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    ).slice(0, 4); // Limit to 4 results

    if (matches.length === 0) {
        resultsContainer.innerHTML = '';
        emptyMsg.classList.remove('hidden');
    } else {
        emptyMsg.classList.add('hidden');
        resultsContainer.innerHTML = matches.map(p => `
            <div onclick="window.location.href='product.html?id=${p.id}'" class="search-result-item group">
                <div class="aspect-[3/4] bg-brand-dark mb-2 overflow-hidden relative">
                    <img src="${p.image}" class="search-result-img w-full h-full object-cover transition-transform duration-500">
                </div>
                <h4 class="search-result-title font-heading font-bold uppercase text-sm group-hover:text-brand-lime transition-colors">${p.name}</h4>
                <p class="text-xs text-brand-grey shadow-black">${formatPrice(p.price)}</p>
            </div>
        `).join('');
    }
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
    injectSearchOverlay();
    populateSidebarShop();
    hidePreloader();
    if (window.lucide) lucide.createIcons();

    // Wire up checkout buttons
    document.querySelectorAll('[data-checkout]').forEach(btn => {
        btn.addEventListener('click', handleCheckout);
    });
});

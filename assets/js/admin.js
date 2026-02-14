// --- ADMIN PANEL JS ---
// GitHub API integration + CRUD + Image Upload for Flyraw CMS

const REPO_OWNER = 'codemdragon';
const REPO_NAME = 'flyrawclothing';
const DB_PATH = 'db.json';
const UPLOAD_DIR = 'uploads';

let ghToken = localStorage.getItem('flyraw_admin_token') || '';
let dbData = null;
let dbSha = '';

// --- AUTH ---

function initAuth() {
    const stored = localStorage.getItem('flyraw_admin_token');
    if (stored) {
        ghToken = stored;
        document.getElementById('token-input').value = stored;
        loginWithToken();
    } else {
        showScreen('auth-screen');
    }
}

async function loginWithToken() {
    const tokenInput = document.getElementById('token-input');
    ghToken = tokenInput.value.trim();
    if (!ghToken) { showAdminToast('Please enter a token', 'error'); return; }

    showAdminToast('Verifying token...', 'info');

    try {
        const resp = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
            headers: { 'Authorization': `Bearer ${ghToken}` }
        });
        if (!resp.ok) throw new Error('Invalid token or repo not found');

        localStorage.setItem('flyraw_admin_token', ghToken);
        await loadDbFromGitHub();
        showScreen('dashboard-screen');
        showAdminToast('Connected successfully!', 'success');
        renderDashboard();
    } catch (e) {
        showAdminToast(e.message, 'error');
    }
}

function logout() {
    localStorage.removeItem('flyraw_admin_token');
    ghToken = '';
    dbData = null;
    showScreen('auth-screen');
}

// --- GITHUB API ---

async function loadDbFromGitHub() {
    const resp = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DB_PATH}`, {
        headers: { 'Authorization': `Bearer ${ghToken}` }
    });
    if (!resp.ok) throw new Error('Could not load db.json');
    const data = await resp.json();
    dbSha = data.sha;
    dbData = JSON.parse(atob(data.content));

    // Ensure images section exists for backward compat
    if (!dbData.images) {
        dbData.images = { hero: '', brandStory: '', lookbook1: '', lookbook2: '' };
    }
}

async function saveDbToGitHub() {
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(dbData, null, 2))));
    const resp = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DB_PATH}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${ghToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `CMS update via admin panel - ${new Date().toISOString()}`,
            content: content,
            sha: dbSha
        })
    });
    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.message || 'Failed to save');
    }
    const result = await resp.json();
    dbSha = result.content.sha;
}

// --- IMAGE UPLOAD ---

async function uploadImageToGitHub(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64 = reader.result.split(',')[1];
                const timestamp = Date.now();
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const filePath = `${UPLOAD_DIR}/${timestamp}_${safeName}`;

                // Check if file exists (to get sha for overwrite)
                let sha = undefined;
                try {
                    const check = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, {
                        headers: { 'Authorization': `Bearer ${ghToken}` }
                    });
                    if (check.ok) {
                        const existing = await check.json();
                        sha = existing.sha;
                    }
                } catch (e) { /* file doesn't exist, that's fine */ }

                const body = {
                    message: `Upload image: ${safeName}`,
                    content: base64
                };
                if (sha) body.sha = sha;

                const resp = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${ghToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                if (!resp.ok) {
                    const err = await resp.json();
                    throw new Error(err.message || 'Upload failed');
                }

                const result = await resp.json();
                // Use raw.githubusercontent URL for the image
                const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${filePath}`;
                resolve(rawUrl);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Reusable: creates upload zone HTML for any image field
function createImageUploadHtml(inputId, label, currentUrl, recommendedSize) {
    const previewSrc = currentUrl || '';
    const hasPreview = previewSrc ? '' : 'hidden';
    return `
        <div class="space-y-2">
            <label class="admin-label">${label}</label>
            <div class="flex gap-3 items-start">
                <div class="flex-1 space-y-2">
                    <input id="${inputId}" class="admin-input" placeholder="Paste image URL or upload below" value="${previewSrc}">
                    <div id="${inputId}-dropzone" class="upload-dropzone border-2 border-dashed border-white/15 rounded-lg p-4 text-center cursor-pointer hover:border-brand-lime/50 transition-colors relative"
                         ondragover="event.preventDefault(); this.classList.add('border-brand-lime')"
                         ondragleave="this.classList.remove('border-brand-lime')"
                         ondrop="handleDrop(event, '${inputId}')"
                         onclick="document.getElementById('${inputId}-file').click()">
                        <input type="file" id="${inputId}-file" accept="image/*" class="hidden" onchange="handleFileSelect(this, '${inputId}')">
                        <div id="${inputId}-upload-content">
                            <svg class="w-6 h-6 mx-auto mb-2 text-brand-grey opacity-50" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            <p class="text-xs text-brand-grey">Drag & drop or <span class="text-brand-lime">click to upload</span></p>
                        </div>
                        <div id="${inputId}-uploading" class="hidden">
                            <div class="preloader-bar mx-auto" style="width:80px"><div class="preloader-bar-fill"></div></div>
                            <p class="text-xs text-brand-lime mt-2">Uploading...</p>
                        </div>
                    </div>
                    <p class="text-[10px] text-brand-grey/60 flex items-center gap-1">
                        <svg class="w-3 h-3 inline flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                        Recommended: <strong class="text-brand-grey/80">${recommendedSize}</strong> — images auto-resize, but this size gives best results
                    </p>
                </div>
                <div id="${inputId}-preview-wrap" class="w-16 h-20 rounded bg-brand-black border border-white/10 overflow-hidden flex-shrink-0 ${hasPreview}">
                    <img id="${inputId}-preview" src="${previewSrc}" class="w-full h-full object-cover" onerror="this.parentElement.classList.add('hidden')">
                </div>
            </div>
        </div>
    `;
}

async function handleDrop(event, inputId) {
    event.preventDefault();
    event.currentTarget.classList.remove('border-brand-lime');
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        await uploadFileForInput(file, inputId);
    }
}

async function handleFileSelect(input, inputId) {
    const file = input.files[0];
    if (file) {
        await uploadFileForInput(file, inputId);
    }
}

async function uploadFileForInput(file, inputId) {
    const dropzone = document.getElementById(`${inputId}-dropzone`);
    const uploadContent = document.getElementById(`${inputId}-upload-content`);
    const uploading = document.getElementById(`${inputId}-uploading`);

    uploadContent.classList.add('hidden');
    uploading.classList.remove('hidden');

    try {
        const url = await uploadImageToGitHub(file);
        document.getElementById(inputId).value = url;

        // Update preview
        const preview = document.getElementById(`${inputId}-preview`);
        const previewWrap = document.getElementById(`${inputId}-preview-wrap`);
        if (preview && previewWrap) {
            preview.src = url;
            previewWrap.classList.remove('hidden');
        }

        showAdminToast('Image uploaded!', 'success');
    } catch (e) {
        showAdminToast('Upload failed: ' + e.message, 'error');
    } finally {
        uploadContent.classList.remove('hidden');
        uploading.classList.add('hidden');
    }
}

// URL input change → update preview
function setupPreviewWatcher(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', () => {
        const preview = document.getElementById(`${inputId}-preview`);
        const previewWrap = document.getElementById(`${inputId}-preview-wrap`);
        if (preview && previewWrap) {
            if (input.value.trim()) {
                preview.src = input.value.trim();
                previewWrap.classList.remove('hidden');
            } else {
                previewWrap.classList.add('hidden');
            }
        }
    });
}

// --- SCREEN MANAGEMENT ---

function showScreen(id) {
    document.querySelectorAll('.admin-screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// --- TAB NAVIGATION ---

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-brand-lime', 'text-black');
        b.classList.add('text-brand-grey', 'hover:text-white');
    });
    const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (activeBtn) {
        activeBtn.classList.add('bg-brand-lime', 'text-black');
        activeBtn.classList.remove('text-brand-grey', 'hover:text-white');
    }
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    const panel = document.getElementById(`tab-${tab}`);
    if (panel) panel.classList.remove('hidden');

    if (tab === 'dashboard') renderDashboard();
    if (tab === 'products') renderProductList();
    if (tab === 'settings') renderSettings();
    if (tab === 'contacts') renderContacts();
    if (tab === 'content') renderContent();
}

// --- SEARCH ---

let dashboardSearchTerm = '';

function handleSearch(e) {
    dashboardSearchTerm = e.target.value.toLowerCase().trim();

    // If on products tab, re-render list
    if (!document.getElementById('tab-products').classList.contains('hidden')) {
        renderProductList();
    }

    // If on settings/contacts/content, maybe highlight? (For now just products)
    // Future: implement global search results overlay
}

// --- DASHBOARD ---

function renderDashboard() {
    if (!dbData) return;
    document.getElementById('stat-products').textContent = dbData.products.length;
    document.getElementById('stat-currency').textContent = dbData.settings.currency.code + ' (' + dbData.settings.currency.symbol + ')';
    document.getElementById('stat-cartmode').textContent = dbData.settings.cartMode === 'social' ? '📱 Social (DM)' : dbData.settings.cartMode === 'gateway' ? '💳 Payment Gateway' : '🚧 Coming Soon';
    document.getElementById('stat-platform').textContent = dbData.settings.socialPlatform === 'whatsapp' ? 'WhatsApp' : 'Instagram';
}

// --- PRODUCTS ---

function renderProductList() {
    const container = document.getElementById('product-list');
    if (!dbData) return;

    const term = dashboardSearchTerm;
    const products = dbData.products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.id && p.id.toString().includes(term))
    );

    if (products.length === 0) {
        container.innerHTML = '<p class="text-brand-grey text-center py-8">No products found.</p>';
        return;
    }

    container.innerHTML = products.map((p, i) => `
        <div class="bg-brand-dark border border-white/10 rounded-lg p-4 flex gap-4 items-center hover:border-brand-lime/50 transition-colors">
            <img src="${p.image}" class="w-16 h-20 object-cover rounded flex-shrink-0 bg-brand-black">
            <div class="flex-1 min-w-0">
                <h4 class="font-heading font-bold uppercase text-sm truncate">${p.name}</h4>
                <p class="text-brand-grey text-xs capitalize">${p.category} · ${p.sizes ? p.sizes.join(', ') : 'S, M, L, XL'}</p>
                <p class="text-brand-lime font-bold text-sm mt-1">${dbData.settings.currency.symbol}${p.price.toFixed(2)}</p>
            </div>
            <div class="flex gap-2 flex-shrink-0">
                <button onclick="editProduct(${i})" class="p-2 rounded bg-white/5 hover:bg-white/10 transition-colors" title="Edit">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onclick="deleteProduct(${i})" class="p-2 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors" title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

let editingProductIndex = -1;

function openProductModal(index = -1) {
    editingProductIndex = index;
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');
    const imageFields = document.getElementById('product-image-fields');

    let pImage = '', pBackImage = '';

    if (index >= 0) {
        const p = dbData.products[index];
        title.textContent = 'Edit Product';
        document.getElementById('p-name').value = p.name;
        document.getElementById('p-price').value = p.price;
        document.getElementById('p-category').value = p.category;
        document.getElementById('p-description').value = p.description;
        document.getElementById('p-materials').value = p.materials || '';
        document.getElementById('p-sizes').value = (p.sizes || ['S', 'M', 'L', 'XL']).join(', ');
        pImage = p.image;
        pBackImage = p.backImage;
    } else {
        title.textContent = 'Add Product';
        document.getElementById('p-name').value = '';
        document.getElementById('p-price').value = '';
        document.getElementById('p-category').value = 'hoodie';
        document.getElementById('p-description').value = '';
        document.getElementById('p-materials').value = '';
        document.getElementById('p-sizes').value = 'S, M, L, XL';
    }

    // Populate dynamic categories
    const catSelect = document.getElementById('p-category');
    const categories = dbData.settings.productCategories || ['hoodie', 't-shirt', 'bottoms', 'accessories', 'hats'];
    catSelect.innerHTML = categories.map(c =>
        `<option value="${c}" ${c === (index >= 0 ? dbData.products[index].category : 'hoodie') ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`
    ).join('');

    // Render image upload fields
    imageFields.innerHTML =
        createImageUploadHtml('p-image', 'Front Image', pImage, '800 × 1000px (4:5 ratio)') +
        createImageUploadHtml('p-backimage', 'Back Image', pBackImage, '800 × 1000px (4:5 ratio)');

    // Setup preview watchers
    setTimeout(() => {
        setupPreviewWatcher('p-image');
        setupPreviewWatcher('p-backimage');
    }, 50);

    modal.classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

async function saveProduct() {
    const productData = {
        name: document.getElementById('p-name').value.trim(),
        price: parseFloat(document.getElementById('p-price').value) || 0,
        category: document.getElementById('p-category').value,
        image: document.getElementById('p-image').value.trim(),
        backImage: document.getElementById('p-backimage').value.trim() || document.getElementById('p-image').value.trim(),
        description: document.getElementById('p-description').value.trim(),
        materials: document.getElementById('p-materials').value.trim(),
        sizes: document.getElementById('p-sizes').value.split(',').map(s => s.trim()).filter(Boolean)
    };

    if (!productData.name || !productData.price) {
        showAdminToast('Name and price are required', 'error');
        return;
    }

    if (editingProductIndex >= 0) {
        productData.id = dbData.products[editingProductIndex].id;
        dbData.products[editingProductIndex] = productData;
    } else {
        const maxId = dbData.products.reduce((max, p) => Math.max(max, p.id), 0);
        productData.id = maxId + 1;
        dbData.products.push(productData);
    }

    try {
        showAdminToast('Saving...', 'info');
        await saveDbToGitHub();
        showAdminToast('Product saved!', 'success');
        closeProductModal();
        renderProductList();
        renderDashboard();
    } catch (e) {
        showAdminToast('Save failed: ' + e.message, 'error');
    }
}

function editProduct(i) { openProductModal(i); }

async function deleteProduct(i) {
    if (!confirm(`Delete "${dbData.products[i].name}"?`)) return;
    dbData.products.splice(i, 1);
    try {
        showAdminToast('Deleting...', 'info');
        await saveDbToGitHub();
        showAdminToast('Product deleted!', 'success');
        renderProductList();
        renderDashboard();
    } catch (e) {
        showAdminToast('Delete failed: ' + e.message, 'error');
    }
}

// --- SETTINGS ---

function renderSettings() {
    if (!dbData) return;
    const s = dbData.settings;

    const currSelect = document.getElementById('s-currency');
    const currencies = [
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
        { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' }
    ];
    currSelect.innerHTML = currencies.map(c =>
        `<option value="${c.code}" ${c.code === s.currency.code ? 'selected' : ''}>${c.symbol} ${c.name} (${c.code})</option>`
    ).join('');

    document.querySelectorAll('[name="cartMode"]').forEach(r => { r.checked = r.value === s.cartMode; });
    document.querySelectorAll('[name="socialPlatform"]').forEach(r => { r.checked = r.value === s.socialPlatform; });
    document.querySelectorAll('[name="socialPlatform"]').forEach(r => { r.checked = r.value === s.socialPlatform; });

    renderCategories();
}

function renderCategories() {
    const container = document.getElementById('s-categories-list');
    if (!container) return;
    const cats = dbData.settings.productCategories || [];
    container.innerHTML = cats.map((c, i) => `
        <div class="flex items-center gap-2 bg-white/5 rounded px-3 py-2">
            <span class="flex-1 font-heading uppercase text-sm">${c}</span>
            <button onclick="removeCategory(${i})" class="text-brand-grey hover:text-red-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        </div>
    `).join('');
}

async function addCategory() {
    const input = document.getElementById('s-new-category');
    const val = input.value.trim().toLowerCase();
    if (!val) return;

    if (!dbData.settings.productCategories) dbData.settings.productCategories = [];
    if (dbData.settings.productCategories.includes(val)) {
        showAdminToast('Category already exists', 'error');
        return;
    }

    dbData.settings.productCategories.push(val);
    input.value = '';
    renderCategories();
    // Auto-save setting changes? Or wait for Save Settings button?
    // Let's wait for the main button to save API calls, but update UI now.
}

function removeCategory(i) {
    if (!confirm('Remove this category? Products using it won\'t be deleted but may need updating.')) return;
    dbData.settings.productCategories.splice(i, 1);
    renderCategories();
}

async function saveSettings() {
    const currSelect = document.getElementById('s-currency');
    const selectedCode = currSelect.value;
    const currencies = [
        { code: 'USD', symbol: '$' }, { code: 'EUR', symbol: '€' }, { code: 'GBP', symbol: '£' },
        { code: 'INR', symbol: '₹' }, { code: 'PKR', symbol: '₨' }, { code: 'AED', symbol: 'د.إ' },
        { code: 'SAR', symbol: '﷼' }, { code: 'CAD', symbol: 'C$' }, { code: 'AUD', symbol: 'A$' },
        { code: 'JPY', symbol: '¥' }, { code: 'CNY', symbol: '¥' }, { code: 'KRW', symbol: '₩' },
        { code: 'BRL', symbol: 'R$' }, { code: 'TRY', symbol: '₺' }, { code: 'ZAR', symbol: 'R' },
        { code: 'MYR', symbol: 'RM' }, { code: 'SGD', symbol: 'S$' }, { code: 'THB', symbol: '฿' },
        { code: 'NGN', symbol: '₦' }, { code: 'EGP', symbol: 'E£' }, { code: 'BDT', symbol: '৳' },
        { code: 'PHP', symbol: '₱' }, { code: 'IDR', symbol: 'Rp' }, { code: 'KES', symbol: 'KSh' },
        { code: 'GHS', symbol: 'GH₵' }
    ];
    const curr = currencies.find(c => c.code === selectedCode) || currencies[0];
    dbData.settings.currency = { code: curr.code, symbol: curr.symbol };

    const cartMode = document.querySelector('[name="cartMode"]:checked');
    if (cartMode) dbData.settings.cartMode = cartMode.value;

    const socialPlatform = document.querySelector('[name="socialPlatform"]:checked');
    if (socialPlatform) dbData.settings.socialPlatform = socialPlatform.value;

    try {
        showAdminToast('Saving settings...', 'info');
        await saveDbToGitHub();
        showAdminToast('Settings saved!', 'success');
        renderDashboard();
    } catch (e) {
        showAdminToast('Save failed: ' + e.message, 'error');
    }
}

// --- CONTACTS ---

function renderContacts() {
    if (!dbData) return;
    document.getElementById('c-instagram').value = dbData.contacts.instagram || '';
    document.getElementById('c-whatsapp').value = dbData.contacts.whatsapp || '';
    document.getElementById('c-facebook').value = dbData.contacts.facebook || '';
    document.getElementById('c-email').value = dbData.contacts.email || '';
}

async function saveContacts() {
    dbData.contacts.instagram = document.getElementById('c-instagram').value.trim();
    dbData.contacts.whatsapp = document.getElementById('c-whatsapp').value.trim();
    dbData.contacts.facebook = document.getElementById('c-facebook').value.trim();
    dbData.contacts.email = document.getElementById('c-email').value.trim();

    try {
        showAdminToast('Saving contacts...', 'info');
        await saveDbToGitHub();
        showAdminToast('Contacts saved!', 'success');
    } catch (e) {
        showAdminToast('Save failed: ' + e.message, 'error');
    }
}

// --- CONTENT ---

function renderContent() {
    if (!dbData) return;
    document.getElementById('ct-marquee').value = (dbData.settings.marqueeTexts || []).join('\n');
    document.getElementById('ct-tagline').value = dbData.settings.heroTagline || '';
    document.getElementById('ct-subtext').value = dbData.settings.heroSubtext || '';

    // Render site image upload fields
    const imgContainer = document.getElementById('site-images-container');
    if (imgContainer) {
        const imgs = dbData.images || {};
        imgContainer.innerHTML =
            createImageUploadHtml('img-hero', 'Hero Background', imgs.hero || '', '1920 × 1080px (16:9 ratio, full-width banner)') +
            '<div class="my-4"></div>' +
            createImageUploadHtml('img-brandstory', 'Brand Story Photo', imgs.brandStory || '', '800 × 800px (1:1 square or 800 × 1000px portrait)') +
            '<div class="my-4"></div>' +
            createImageUploadHtml('img-lookbook1', 'Lookbook — Main (Large)', imgs.lookbook1 || '', '1200 × 800px (3:2 landscape, covers 2 columns)') +
            '<div class="my-4"></div>' +
            createImageUploadHtml('img-lookbook2', 'Lookbook — Secondary (Small)', imgs.lookbook2 || '', '600 × 400px (3:2 landscape, half-width)');

        setTimeout(() => {
            setupPreviewWatcher('img-hero');
            setupPreviewWatcher('img-brandstory');
            setupPreviewWatcher('img-lookbook1');
            setupPreviewWatcher('img-lookbook2');
        }, 50);
    }
}

async function saveContent() {
    const marqueeRaw = document.getElementById('ct-marquee').value.trim();
    dbData.settings.marqueeTexts = marqueeRaw.split('\n').map(s => s.trim()).filter(Boolean);
    dbData.settings.heroTagline = document.getElementById('ct-tagline').value.trim();
    dbData.settings.heroSubtext = document.getElementById('ct-subtext').value.trim();

    // Save site images
    if (!dbData.images) dbData.images = {};
    const heroVal = document.getElementById('img-hero');
    const brandVal = document.getElementById('img-brandstory');
    const lb1Val = document.getElementById('img-lookbook1');
    const lb2Val = document.getElementById('img-lookbook2');

    if (heroVal) dbData.images.hero = heroVal.value.trim();
    if (brandVal) dbData.images.brandStory = brandVal.value.trim();
    if (lb1Val) dbData.images.lookbook1 = lb1Val.value.trim();
    if (lb2Val) dbData.images.lookbook2 = lb2Val.value.trim();

    try {
        showAdminToast('Saving content...', 'info');
        await saveDbToGitHub();
        showAdminToast('Content saved!', 'success');
    } catch (e) {
        showAdminToast('Save failed: ' + e.message, 'error');
    }
}

// --- TOAST ---

function showAdminToast(message, type = 'info') {
    let container = document.getElementById('admin-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-toast-container';
        container.className = 'fixed bottom-6 right-6 z-[100] flex flex-col gap-2';
        document.body.appendChild(container);
    }
    const colors = {
        info: 'bg-white/10 border border-white/20 text-white',
        success: 'bg-brand-lime text-black',
        error: 'bg-red-500 text-white'
    };
    const toast = document.createElement('div');
    toast.className = `${colors[type] || colors.info} px-6 py-3 rounded-lg font-heading font-bold text-sm shadow-lg animate-fade-in`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', initAuth);

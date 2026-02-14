# 🦅 FLYRAW CLOTHING

> **Define Your Raw.** \
> A premium, high-performance streetwear e-commerce frontend built with HTML, Tailwind CSS, and Vanilla JavaScript.

Experimental project featuring a **serverless CMS** powered entirely by the GitHub API.

---

## ✨ Key Features

### 🛒 Storefront
-   **Dynamic Product Grid**: Products loaded instantly from `db.json`.
-   **Universal Search**: Global search overlay (accessible via `CTRL+K` or Nav Icon) with real-time results.
-   **Smart Filtering**: Filter by category (Hoodies, Tees, etc.) with a "More" dropdown for excess categories.
-   **Mobile-First Design**:
    -   Swipeable product galleries.
    -   Smooth sidebar & cart drawer animations.
    -   Touch-optimized UI.
-   **Social Checkout**: Cart contents are formatted into a message and sent directly to **Instagram DM** or **WhatsApp**.

### ⚙️ Admin Panel (`/admin.html`)
A fully functional CMS to manage your store without touching code.
-   **Dashboard**: Real-time stats (Product count, Currency, Settings).
-   **Product Management**: Add, Edit, Delete products. Upload images via URL.
-   **Category Management**: Create and remove product categories dynamically.
-   **Site Content**:
    -   Update **Hero Banner** text & tagline.
    -   Manage **Marquee** scrolling text.
    -   Update **Site Images** (Hero, Brand Story, Lookbook).
-   **Settings**: Change Currency, Cart Mode (Social/Gateway), and Contact Links.

### 🔒 Security & Tech
-   **Database**: Uses `db.json` hosted on GitHub as a database.
-   **Auth**: Requires a GitHub Personal Access Token (Fine-grained) to save changes.
-   **Tech Stack**:
    -   **HTML5**
    -   **Tailwind CSS** (via CDN for speed)
    -   **Vanilla JavaScript** (No complex frameworks)
    -   **Lucide Icons**

---

## 🚀 Getting Started

### 1. Setup
Clone the repository or download the files.

```bash
git clone https://github.com/yourusername/flyraw.git
cd flyraw
```

### 2. Run Locally
Since this is a static site, you just need a simple server.

**VS Code Live Server:**
-   Right-click `index.html` -> "Open with Live Server".

**Python:**
```bash
python -m http.server 8000
```

### 3. Connect Admin Panel
1.  Go to `https://github.com/settings/tokens`.
2.  Generate a **Fine-grained Personal Access Token**.
3.  Grant **Read & Write** access to `Contents`.
4.  Open `/admin.html` and paste your token to log in.

---

## 📂 Project Structure

```
/
├── index.html        # Homepage
├── shop.html         # Storefront & Filters
├── product.html      # Product Details
├── admin.html        # CMS / Admin Panel
├── db.json           # Database (Products, Settings, Content)
└── assets/
    ├── css/
    │   └── style.css # Custom styles & Animations
    └── js/
        ├── shared.js # Global Logic (Search, Cart, Nav)
        ├── admin.js  # Admin Logic (GitHub API, Auth)
        └── data.js   # Data Fetching Layer
```

---

*Built with ❤️ by Flyraw Engineering.*

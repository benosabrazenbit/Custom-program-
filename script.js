
// ======================================
// TindahanPro - Store Management System
// ======================================

// Load saved products and sales
function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
        console.error("Unable to load saved data:", error);
        return fallback;
    }
}

let products = loadData("tindahanpro_products", [
    { id: 1, name: "Bottled Water", price: 15, stock: 20 },
    { id: 2, name: "Instant Noodles", price: 18, stock: 15 },
    { id: 3, name: "Canned Sardines", price: 28, stock: 10 }
]);

let sales = loadData("tindahanpro_sales", []);

function saveData() {
    localStorage.setItem(
        "tindahanpro_products",
        JSON.stringify(products)
    );

    localStorage.setItem(
        "tindahanpro_sales",
        JSON.stringify(sales)
    );
}

// Format Philippine peso
function money(amount) {
    return "₱" + Number(amount).toFixed(2);
}

// Safely display text
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

// Navigation
function showSection(section) {
    document.querySelectorAll(".section").forEach(item => {
        item.classList.remove("active");
    });

    document.getElementById(section).classList.add("active");

    displayProducts();
    updateDashboard();
    updateSaleOptions();
    displaySales();
}

// Add product
function addProduct(event) {
    event.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const stock = Number(document.getElementById("productStock").value);

    const message = document.getElementById("inventoryMessage");

    if (
        !name ||
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isInteger(stock) ||
        stock < 0
    ) {
        message.style.color = "red";
        message.textContent = "Please enter valid product information.";
        return;
    }

    products.push({
        id: Date.now(),
        name: name,
        price: price,
        stock: stock
    });

    saveData();

    document.getElementById("productForm").reset();

    message.style.color = "green";
    message.textContent = "Product added successfully!";

    displayProducts();
    updateDashboard();
    updateSaleOptions();
}

// Display products
function displayProducts() {
    const table = document.getElementById("productTable");
    const search = document.getElementById("searchProduct")
        .value.toLowerCase();

    table.innerHTML = "";

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(search)
    );

    filteredProducts.forEach(product => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(product.name)}</td>
            <td>${money(product.price)}</td>
            <td class="${product.stock <= 5 ? "low-stock" : ""}">
                ${product.stock}
            </td>
            <td>
                <button class="action-button edit"
                    onclick="editProduct(${product.id})">
                    Edit
                </button>

                <button class="action-button delete"
                    onclick="deleteProduct(${product.id})">
                    Delete
                </button>
            </td>
        `;

        table.appendChild(row);
    });

    if (filteredProducts.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="4">No products found.</td>
            </tr>
        `;
    }
}

// Edit product
function editProduct(id) {
    const product = products.find(p => p.id === id);

    if (!product) return;

    const name = prompt("Enter product name:", product.name);
    if (name === null) return;

    const price = prompt("Enter product price:", product.price);
    if (price === null) return;

    const stock = prompt("Enter stock quantity:", product.stock);
    if (stock === null) return;

    const newName = name.trim();
    const newPrice = Number(price);
    const newStock = Number(stock);

    if (
        !newName ||
        !Number.isFinite(newPrice) ||
        newPrice <= 0 ||
        !Number.isInteger(newStock) ||
        newStock < 0
    ) {
        alert("Invalid product information.");
        return;
    }

    product.name = newName;
    product.price = newPrice;
    product.stock = newStock;

    saveData();

    displayProducts();
    updateDashboard();
    updateSaleOptions();
}

// Delete product
function deleteProduct(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    products = products.filter(p => p.id !== id);

    saveData();

    displayProducts();
    updateDashboard();
    updateSaleOptions();
}

// Update sale product options
function updateSaleOptions() {
    const select = document.getElementById("saleProduct");
    const previous = select.value;

    select.innerHTML = "";

    products.filter(p => p.stock > 0).forEach(product => {
        const option = document.createElement("option");

        option.value = product.id;
        option.textContent =
            `${product.name} - ${money(product.price)} (${product.stock} available)`;

        select.appendChild(option);
    });

    if ([...select.options].some(option => option.value === previous)) {
        select.value = previous;
    }

    calculateSale();
}

// Calculate sale total
function calculateSale() {
    const id = Number(document.getElementById("saleProduct").value);
    const quantity = Number(document.getElementById("saleQuantity").value);

    const product = products.find(p => p.id === id);

    const total =
        product && Number.isInteger(quantity) && quantity > 0
            ? product.price * quantity
            : 0;

    document.getElementById("saleTotal").textContent =
        "Total: " + money(total);
}

// Record a sale
function recordSale(event) {
    event.preventDefault();

    const id = Number(document.getElementById("saleProduct").value);
    const quantity = Number(document.getElementById("saleQuantity").value);

    const product = products.find(p => p.id === id);
    const message = document.getElementById("saleMessage");

    if (!product || !Number.isInteger(quantity) || quantity < 1) {
        message.style.color = "red";
        message.textContent =
            "Please select a product and enter a valid quantity.";
        return;
    }

    if (quantity > product.stock) {
        message.style.color = "red";
        message.textContent = "Not enough stock available!";
        return;
    }

    const total = product.price * quantity;

    product.stock -= quantity;

    sales.push({
        id: Date.now(),
        product: product.name,
        quantity: quantity,
        total: total,
        date: new Date().toISOString()
    });

    saveData();

    message.style.color = "green";
    message.textContent =
        "Sale recorded successfully! Total: " + money(total);

    document.getElementById("saleQuantity").value = 1;

    updateSaleOptions();
    updateDashboard();
    displayProducts();
    displaySales();
}

// Update dashboard
function updateDashboard() {
    document.getElementById("totalProducts").textContent =
        products.length;

    const totalStock = products.reduce(
        (sum, product) => sum + product.stock,
        0
    );

    document.getElementById("totalStock").textContent =
        totalStock;

    const today = new Date().toDateString();

    const todayTotal = sales
        .filter(sale =>
            new Date(sale.date).toDateString() === today
        )
        .reduce((sum, sale) => sum + sale.total, 0);

    const allTotal = sales.reduce(
        (sum, sale) => sum + sale.total,
        0
    );

    document.getElementById("todaySales").textContent =
        money(todayTotal);

    document.getElementById("allSales").textContent =
        money(allTotal);

    const lowStock = products.filter(
        product => product.stock <= 5
    );

    document.getElementById("lowStock").innerHTML =
        lowStock.length
            ? lowStock.map(product =>
                `<p class="low-stock">
                    ${escapeHTML(product.name)} —
                    ${product.stock} remaining
                </p>`
            ).join("")
            : "<p>No low-stock products.</p>";
}

// Display sales history
function displaySales() {
    const table = document.getElementById("salesTable");

    table.innerHTML = "";

    [...sales].reverse().forEach(sale => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${new Date(sale.date).toLocaleString()}</td>
            <td>${escapeHTML(sale.product)}</td>
            <td>${sale.quantity}</td>
            <td>${money(sale.total)}</td>
        `;

        table.appendChild(row);
    });

    if (sales.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="4">No sales recorded yet.</td>
            </tr>
        `;
    }
}

// Export sales to CSV
function exportSales() {
    if (sales.length === 0) {
        alert("No sales available to export.");
        return;
    }

    const rows = [
        ["Date", "Product", "Quantity", "Total"],

        ...sales.map(sale => [
            new Date(sale.date).toLocaleString(),
            sale.product,
            sale.quantity,
            sale.total
        ])
    ];

    const csv = rows.map(row =>
        row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\n");

    const blob = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "TindahanPro-Sales.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// Connect buttons and forms
document.getElementById("productForm")
    .addEventListener("submit", addProduct);

document.getElementById("saleForm")
    .addEventListener("submit", recordSale);

document.getElementById("searchProduct")
    .addEventListener("input", displayProducts);

document.getElementById("saleProduct")
    .addEventListener("change", calculateSale);

document.getElementById("saleQuantity")
    .addEventListener("input", calculateSale);

document.getElementById("exportSalesBtn")
    .addEventListener("click", exportSales);

// Initialize application
document.getElementById("year").textContent =
    new Date().getFullYear();

saveData();
displayProducts();
updateDashboard();
updateSaleOptions();
displaySales();

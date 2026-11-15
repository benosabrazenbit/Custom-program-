
let products = JSON.parse(localStorage.getItem("products")) || [
    {id: 1, name: "Bottled Water", price: 15, stock: 20},
    {id: 2, name: "Instant Noodles", price: 18, stock: 15},
    {id: 3, name: "Canned Sardines", price: 28, stock: 10}
];

let sales = JSON.parse(localStorage.getItem("sales")) || [];

function saveData() {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("sales", JSON.stringify(sales));
}

function money(amount) {
    return "₱" + amount.toFixed(2);
}

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

function addProduct() {
    const name = document.getElementById("productName").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const stock = Number(document.getElementById("productStock").value);

    if (!name || !Number.isFinite(price) || price <= 0 ||
        !Number.isInteger(stock) || stock < 0) {
        alert("Please enter valid product information.");
        return;
    }

    products.push({
        id: Date.now(),
        name: name,
        price: price,
        stock: stock
    });

    saveData();

    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productStock").value = "";

    displayProducts();
    updateDashboard();
    updateSaleOptions();

    alert("Product added successfully!");
}

function displayProducts() {
    const table = document.getElementById("productTable");
    const search = document.getElementById("searchProduct").value.toLowerCase();

    table.innerHTML = "";

    products.filter(p => p.name.toLowerCase().includes(search))
    .forEach(product => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(product.name)}</td>
            <td>${money(product.price)}</td>
            <td>${product.stock}</td>
            <td>
                <button class="action-button edit"
                    onclick="editProduct(${product.id})">Edit</button>
                <button class="action-button delete"
                    onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;

        table.appendChild(row);
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    }[char]));
}

function editProduct(id) {
    const product = products.find(p => p.id === id);

    if (!product) return;

    const name = prompt("Enter new product name:", product.name);
    if (name === null) return;

    const price = prompt("Enter new price:", product.price);
    if (price === null) return;

    const stock = prompt("Enter new stock quantity:", product.stock);
    if (stock === null) return;

    const newPrice = Number(price);
    const newStock = Number(stock);

    if (!name.trim() || !Number.isFinite(newPrice) || newPrice <= 0 ||
        !Number.isInteger(newStock) || newStock < 0) {
        alert("Invalid product information.");
        return;
    }

    product.name = name.trim();
    product.price = newPrice;
    product.stock = newStock;

    saveData();
    displayProducts();
    updateDashboard();
    updateSaleOptions();
}

function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    products = products.filter(p => p.id !== id);

    saveData();
    displayProducts();
    updateDashboard();
    updateSaleOptions();
}

function updateSaleOptions() {
    const select = document.getElementById("saleProduct");
    const previous = select.value;

    select.innerHTML = "";

    products.filter(p => p.stock > 0).forEach(product => {
        const option = document.createElement("option");
        option.value = product.id;
        option.textContent = `${product.name} - ${money(product.price)}`;
        select.appendChild(option);
    });

    if ([...select.options].some(o => o.value === previous)) {
        select.value = previous;
    }

    calculateSale();
}

function calculateSale() {
    const id = Number(document.getElementById("saleProduct").value);
    const quantity = Number(document.getElementById("saleQuantity").value);

    const product = products.find(p => p.id === id);

    const total = product && Number.isInteger(quantity) && quantity > 0
        ? product.price * quantity : 0;

    document.getElementById("saleTotal").textContent =
        "Total: " + money(total);
}

function recordSale() {
    const id = Number(document.getElementById("saleProduct").value);
    const quantity = Number(document.getElementById("saleQuantity").value);

    const product = products.find(p => p.id === id);
    const message = document.getElementById("saleMessage");

    if (!product || !Number.isInteger(quantity) || quantity < 1) {
        message.style.color = "red";
        message.textContent = "Please select a product and valid quantity.";
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
    message.textContent = "Sale recorded successfully! Total: " + money(total);

    document.getElementById("saleQuantity").value = 1;

    updateSaleOptions();
    updateDashboard();
    displayProducts();
    displaySales();
}

function updateDashboard() {
    document.getElementById("totalProducts").textContent = products.length;

    const stock = products.reduce((sum, p) => sum + p.stock, 0);
    document.getElementById("totalStock").textContent = stock;

    const today = new Date().toDateString();

    const todayTotal = sales
        .filter(s => new Date(s.date).toDateString() === today)
        .reduce((sum, s) => sum + s.total, 0);

    const allTotal = sales.reduce((sum, s) => sum + s.total, 0);

    document.getElementById("todaySales").textContent = money(todayTotal);
    document.getElementById("allSales").textContent = money(allTotal);

    const low = products.filter(p => p.stock <= 5);

    document.getElementById("lowStock").innerHTML = low.length
        ? low.map(p => `<p>${escapeHTML(p.name)} — ${p.stock} remaining</p>`).join("")
        : "<p>No low-stock products.</p>";
}

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
}

function exportSales() {
    if (sales.length === 0) {
        alert("No sales available to export.");
        return;
    }

    const rows = [
        ["Date", "Product", "Quantity", "Total"],
        ...sales.map(s => [
            new Date(s.date).toLocaleString(),
            s.product,
            s.quantity,
            s.total
        ])
    ];

    const csv = rows.map(row =>
        row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "TindahanPro-Sales.csv";
    link.click();

    URL.revokeObjectURL(url);
}

document.getElementById("saleProduct")
    .addEventListener("change", calculateSale);

document.getElementById("saleQuantity")
    .addEventListener("input", calculateSale);

// Initialize program
saveData();
displayProducts();
updateDashboard();
updateSaleOptions();
displaySales();

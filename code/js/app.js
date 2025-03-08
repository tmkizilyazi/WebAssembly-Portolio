// Portföy Yönetim Sistemi - %100 WebAssembly ile Ana JavaScript Dosyası

// WebAssembly modül referansı
let wasmInstance = null;
let wasmMemory = null;

// WebAssembly için bellek yöneticisi
const MemoryManager = {
    // 64 bit float (double) verileri için bellek işlemleri
    setFloat64: function (offset, value) {
        const view = new DataView(wasmMemory.buffer);
        view.setFloat64(offset, value, true); // little-endian
    },
    getFloat64: function (offset) {
        const view = new DataView(wasmMemory.buffer);
        return view.getFloat64(offset, true); // little-endian
    },
    // 32 bit integer verileri için bellek işlemleri
    setInt32: function (offset, value) {
        const view = new DataView(wasmMemory.buffer);
        view.setInt32(offset, value, true); // little-endian
    },
    getInt32: function (offset) {
        const view = new DataView(wasmMemory.buffer);
        return view.getInt32(offset, true); // little-endian
    },
    // Float32 array için bellek işlemleri
    getFloat32Array: function (offset, length) {
        return new Float32Array(wasmMemory.buffer, offset, length);
    },
    // String işlemleri
    writeString: function (offset, str) {
        const bytes = new TextEncoder().encode(str);
        const array = new Uint8Array(wasmMemory.buffer, offset, bytes.length + 1);
        array.set(bytes);
        array[bytes.length] = 0; // null-terminator
        return bytes.length + 1;
    },
    readString: function (offset) {
        const buffer = wasmMemory.buffer;
        let end = offset;
        while (new Uint8Array(buffer)[end] !== 0) end++;
        return new TextDecoder().decode(new Uint8Array(buffer, offset, end - offset));
    }
};

// Uygulama verisi
const appData = {
    portfolio: [], // Kullanıcının varlıklarını içeren dizi
    transactions: [], // Kullanıcının işlemlerini içeren dizi
    marketData: {}, // Piyasa verilerini tutacak nesne
    priceHistory: {}, // Fiyat geçmişini tutacak nesne
    settings: {
        currency: "₺", // Varsayılan para birimi
        theme: "light", // Varsayılan tema
        language: "tr", // Varsayılan dil
        refreshRate: 5 * 60 * 1000, // Veri yenileme sıklığı (5 dakika)
    }
};

// DOM öğeleri için referanslar
const DOM = {
    // Gösterge paneli
    totalAssets: document.getElementById('total-assets'),
    totalChange: document.getElementById('total-change'),

    // Navigasyon
    navLinks: document.querySelectorAll('.nav-links a'),
    sections: document.querySelectorAll('main section'),

    // Portföy tablosu
    portfolioTable: document.getElementById('portfolio-table'),
    portfolioBody: document.getElementById('portfolio-body'),

    // Grafik
    portfolioChart: document.getElementById('portfolio-chart'),
    distributionChart: document.getElementById('distribution-chart'),

    // İşlem formu
    transactionForm: document.getElementById('add-transaction-form'),

    // Arama ve filtreleme
    searchInput: document.getElementById('search-assets'),
    filterOptions: document.querySelectorAll('.filter-option'),

    // Modal
    modal: document.getElementById('transaction-modal'),
    modalClose: document.querySelector('.modal-close'),
    modalOpenButtons: document.querySelectorAll('.add-transaction-btn'),
};

// WebAssembly bellek ofsetleri ve boyutları
const WASM_CONFIG = {
    // Giriş verileri için bellek alanı
    INPUT_BASE: 0,
    INPUT_SIZE: 4096,

    // Çıkış verileri için bellek alanı
    OUTPUT_BASE: 4096,
    OUTPUT_SIZE: 4096,

    // String verileri için bellek alanı
    STRING_BASE: 8192,
    STRING_SIZE: 8192,

    // Veri yapıları için bellek alanı
    ARRAY_BASE: 16384,
    ARRAY_SIZE: 16384
};

// WebAssembly modülünün yüklenmesini bekleyen olay dinleyicisi
document.addEventListener('wasmLoaded', () => {
    console.log("WebAssembly modülü yüklendi, uygulama başlatılıyor...");

    try {
        // WebAssembly modül referansını wasm_loader.js'den al
        wasmInstance = window.wasmModule;
        wasmMemory = window.wasmModule.memory;

        if (!wasmInstance || !wasmMemory) {
            throw new Error("WebAssembly modülü veya bellek nesnesi bulunamadı");
        }

        console.log("WebAssembly belleği başarıyla bağlandı. Bellek boyutu:", wasmMemory.buffer.byteLength, "bayt");

        // WebAssembly hazır olduğunda uygulamayı başlat
        initializeApp();
    } catch (error) {
        console.error("WebAssembly modülü başlatılırken hata oluştu:", error);
        document.body.innerHTML = `
            <div style="text-align: center; margin-top: 100px;">
                <h1>Hata</h1>
                <p>WebAssembly modülü yüklenemedi. Lütfen tarayıcınızın WebAssembly desteğine sahip olduğundan emin olun.</p>
                <p>Hata detayı: ${error.message}</p>
            </div>
        `;
    }
});

// %100 WebAssembly ile çalışan portföy hesaplayıcı
const WasmPortfolioCalculator = {
    // Toplam portföy değerini hesapla
    calculateTotalValue: function (assets) {
        // Belleği temizle
        this.clearMemoryRegion(WASM_CONFIG.INPUT_BASE, WASM_CONFIG.INPUT_SIZE);
        this.clearMemoryRegion(WASM_CONFIG.OUTPUT_BASE, WASM_CONFIG.OUTPUT_SIZE);

        // Varlık sayısını belleğe yaz
        MemoryManager.setInt32(WASM_CONFIG.INPUT_BASE, assets.length);

        // Varlık verileri için offset
        let offset = WASM_CONFIG.INPUT_BASE + 8;

        // Varlık verilerini WebAssembly belleğine yaz
        assets.forEach(asset => {
            MemoryManager.setFloat64(offset, asset.amount);
            offset += 8;
            MemoryManager.setFloat64(offset, asset.currentPrice);
            offset += 8;
        });

        try {
            // WebAssembly'den fonksiyon çağrısı
            if (wasmInstance.exports && typeof wasmInstance.exports.calculate_total_value === 'function') {
                // Doğrudan WASM fonksiyonu çağır
                wasmInstance.exports.calculate_total_value(WASM_CONFIG.INPUT_BASE, WASM_CONFIG.OUTPUT_BASE);
                // Sonucu WebAssembly belleğinden oku
                return MemoryManager.getFloat64(WASM_CONFIG.OUTPUT_BASE);
            } else {
                // Eğer modül içinde fonksiyon bulunamazsa wasm_loader'da tanımlanan fonksiyonu çağır
                return assets.reduce((total, asset) => total + (asset.amount * asset.currentPrice), 0);
            }
        } catch (error) {
            console.error("WebAssembly fonksiyonu çağrılırken hata:", error);
            // Hata durumunda JavaScript hesaplaması yaparak devam et
            return assets.reduce((total, asset) => total + (asset.amount * asset.currentPrice), 0);
        }
    },

    // Varlık değerini hesapla
    calculateAssetValue: function (amount, price) {
        try {
            // WebAssembly belleğini temizle
            this.clearMemoryRegion(WASM_CONFIG.INPUT_BASE, 32);
            this.clearMemoryRegion(WASM_CONFIG.OUTPUT_BASE, 16);

            // Giriş parametrelerini WebAssembly belleğine yaz
            MemoryManager.setFloat64(WASM_CONFIG.INPUT_BASE, amount);
            MemoryManager.setFloat64(WASM_CONFIG.INPUT_BASE + 8, price);

            // WebAssembly fonksiyonunu çağır (eğer varsa)
            if (wasmInstance.exports && typeof wasmInstance.exports.calculate_asset_value === 'function') {
                wasmInstance.exports.calculate_asset_value(WASM_CONFIG.INPUT_BASE, WASM_CONFIG.OUTPUT_BASE);
                return MemoryManager.getFloat64(WASM_CONFIG.OUTPUT_BASE);
            } else {
                // Loader'daki fonksiyonu kullan
                return PortfolioCalculator.calculateAssetValue(amount, price);
            }
        } catch (error) {
            console.error("WebAssembly asset değeri hesaplanırken hata:", error);
            // Basit hesaplama (hata durumunda)
            return amount * price;
        }
    },

    // Kâr/zarar hesapla
    calculateProfitLoss: function (buyPrice, currentPrice, amount) {
        try {
            // WebAssembly belleğini temizle
            this.clearMemoryRegion(WASM_CONFIG.INPUT_BASE, 32);
            this.clearMemoryRegion(WASM_CONFIG.OUTPUT_BASE, 16);

            // Giriş parametrelerini WebAssembly belleğine yaz
            MemoryManager.setFloat64(WASM_CONFIG.INPUT_BASE, buyPrice);
            MemoryManager.setFloat64(WASM_CONFIG.INPUT_BASE + 8, currentPrice);
            MemoryManager.setFloat64(WASM_CONFIG.INPUT_BASE + 16, amount);

            // WebAssembly fonksiyonunu çağır (eğer varsa)
            if (wasmInstance.exports && typeof wasmInstance.exports.calculate_profit_loss === 'function') {
                wasmInstance.exports.calculate_profit_loss(WASM_CONFIG.INPUT_BASE, WASM_CONFIG.OUTPUT_BASE);
                return MemoryManager.getFloat64(WASM_CONFIG.OUTPUT_BASE);
            } else {
                // Loader'daki fonksiyonu kullan
                return PortfolioCalculator.calculateProfitLoss(buyPrice, currentPrice, amount);
            }
        } catch (error) {
            console.error("WebAssembly kar/zarar hesaplanırken hata:", error);
            // Basit hesaplama (hata durumunda)
            return (currentPrice - buyPrice) * amount;
        }
    },

    // Yüzde değişimi hesapla
    calculatePercentageChange: function (oldValue, newValue) {
        try {
            // WebAssembly belleğini temizle
            this.clearMemoryRegion(WASM_CONFIG.INPUT_BASE, 32);
            this.clearMemoryRegion(WASM_CONFIG.OUTPUT_BASE, 16);

            // Giriş parametrelerini WebAssembly belleğine yaz
            MemoryManager.setFloat64(WASM_CONFIG.INPUT_BASE, oldValue);
            MemoryManager.setFloat64(WASM_CONFIG.INPUT_BASE + 8, newValue);

            // WebAssembly fonksiyonunu çağır (eğer varsa)
            if (wasmInstance.exports && typeof wasmInstance.exports.calculate_percentage_change === 'function') {
                wasmInstance.exports.calculate_percentage_change(WASM_CONFIG.INPUT_BASE, WASM_CONFIG.OUTPUT_BASE);
                return MemoryManager.getFloat64(WASM_CONFIG.OUTPUT_BASE);
            } else {
                // Loader'daki fonksiyonu kullan
                return PortfolioCalculator.calculatePercentageChange(oldValue, newValue);
            }
        } catch (error) {
            console.error("WebAssembly yüzde değişimi hesaplanırken hata:", error);
            // Basit hesaplama (hata durumunda)
            if (oldValue === 0) return 0;
            return ((newValue - oldValue) / oldValue) * 100;
        }
    },

    // Portföy dağılımını hesapla
    calculatePortfolioDistribution: function (assets) {
        try {
            // WebAssembly belleğini temizle
            this.clearMemoryRegion(WASM_CONFIG.INPUT_BASE, WASM_CONFIG.INPUT_SIZE);
            this.clearMemoryRegion(WASM_CONFIG.OUTPUT_BASE, WASM_CONFIG.OUTPUT_SIZE);

            // Varlık sayısını belleğe yaz
            MemoryManager.setInt32(WASM_CONFIG.INPUT_BASE, assets.length);

            // Varlık verileri için offset
            let offset = WASM_CONFIG.INPUT_BASE + 8;

            // Varlık verilerini WebAssembly belleğine yaz
            assets.forEach(asset => {
                MemoryManager.setFloat64(offset, asset.amount);
                offset += 8;
                MemoryManager.setFloat64(offset, asset.currentPrice);
                offset += 8;
            });

            // WebAssembly fonksiyonunu çağır (eğer varsa)
            if (wasmInstance.exports && typeof wasmInstance.exports.calculate_portfolio_distribution === 'function') {
                wasmInstance.exports.calculate_portfolio_distribution(WASM_CONFIG.INPUT_BASE, WASM_CONFIG.OUTPUT_BASE);

                // Sonuçları WebAssembly belleğinden oku
                const distributions = [];
                for (let i = 0; i < assets.length; i++) {
                    distributions.push(MemoryManager.getFloat64(WASM_CONFIG.OUTPUT_BASE + i * 8));
                }
                return distributions;
            } else {
                // Loader'daki fonksiyonu kullan
                return PortfolioCalculator.calculatePortfolioDistribution(assets);
            }
        } catch (error) {
            console.error("WebAssembly portföy dağılımı hesaplanırken hata:", error);
            // Basit hesaplama (hata durumunda)
            const total = assets.reduce((sum, asset) => sum + asset.amount * asset.currentPrice, 0);
            if (total === 0) return assets.map(() => 0);
            return assets.map(asset => {
                const value = asset.amount * asset.currentPrice;
                return (value / total) * 100;
            });
        }
    },

    // Belirli bir bellek bölgesini temizle (sıfırla)
    clearMemoryRegion: function (offset, size) {
        const view = new Uint8Array(wasmMemory.buffer, offset, size);
        for (let i = 0; i < size; i++) {
            view[i] = 0;
        }
    }
};

// Uygulama başlatma fonksiyonu
function initializeApp() {
    console.log("WebAssembly tabanlı portföy uygulaması başlatılıyor...");

    // Test verileri ile başlatma
    loadSampleData();

    // Kullanıcı arayüzünü güncelle
    updateUI();

    // Olay dinleyicilerini ekle
    setupEventListeners();

    // Piyasa verilerini periyodik olarak güncelle
    startMarketDataUpdates();

    console.log("WebAssembly tabanlı portföy yönetim sistemi hazır! 🚀");
    // WebAssembly belleğinin kullanım durumunu göster
    console.log("WebAssembly belleği: %d sayfa, %d bayt",
        wasmMemory.buffer.byteLength / 65536,
        wasmMemory.buffer.byteLength);
}

// Örnek veri yükleme
function loadSampleData() {
    // Portföy için örnek varlıklar
    appData.portfolio = [
        { id: 1, symbol: "BTC", name: "Bitcoin", amount: 1.5, buyPrice: 40000, currentPrice: 45000, type: "kripto" },
        { id: 2, symbol: "ETH", name: "Ethereum", amount: 10, buyPrice: 2800, currentPrice: 3200, type: "kripto" },
        { id: 3, symbol: "THYAO", name: "Türk Hava Yolları", amount: 100, buyPrice: 50, currentPrice: 55, type: "hisse" },
        { id: 4, symbol: "AAPL", name: "Apple Inc.", amount: 10, buyPrice: 150, currentPrice: 175, type: "hisse" },
        { id: 5, symbol: "XAU", name: "Altın (Ons)", amount: 2, buyPrice: 1800, currentPrice: 1950, type: "emtia" }
    ];

    // İşlemler için örnek veriler
    appData.transactions = [
        { id: 1, date: "2023-01-15", symbol: "BTC", type: "alım", amount: 0.5, price: 38000, total: 19000 },
        { id: 2, date: "2023-02-20", symbol: "BTC", type: "alım", amount: 1, price: 41000, total: 41000 },
        { id: 3, date: "2023-03-10", symbol: "ETH", type: "alım", amount: 10, price: 2800, total: 28000 },
        { id: 4, date: "2023-04-05", symbol: "THYAO", type: "alım", amount: 100, price: 50, total: 5000 },
        { id: 5, date: "2023-05-12", symbol: "AAPL", type: "alım", amount: 10, price: 150, total: 1500 }
    ];

    console.log("Örnek veriler WebAssembly uygulaması için yüklendi.");
}

// Kullanıcı arayüzünü güncelleme fonksiyonu
function updateUI() {
    updateDashboard();
    updatePortfolioTable();
    updateCharts();
    updateTransactionHistory();
}

// Gösterge panelini güncelleme
function updateDashboard() {
    if (!appData.portfolio.length) return;

    // WASM modülünü kullanarak toplam varlık değerini hesapla
    const totalValue = WasmPortfolioCalculator.calculateTotalValue(appData.portfolio);
    DOM.totalAssets.textContent = `${appData.settings.currency}${totalValue.toLocaleString('tr-TR')}`;

    // Değişim oranını hesapla (örnek veri ile)
    const weekAgoTotal = totalValue * 0.95; // Simülasyon
    const changePercentage = WasmPortfolioCalculator.calculatePercentageChange(weekAgoTotal, totalValue);

    DOM.totalChange.textContent = `${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(2)}%`;
    DOM.totalChange.className = changePercentage >= 0 ? 'positive' : 'negative';

    console.log("Gösterge paneli WebAssembly hesaplamaları ile güncellendi.");
}

// Portföy tablosunu güncelleme
function updatePortfolioTable() {
    if (!DOM.portfolioBody || !appData.portfolio.length) return;

    // Portföy tablosunu temizle
    DOM.portfolioBody.innerHTML = '';

    // Her varlık için bir satır ekle
    appData.portfolio.forEach(asset => {
        // WASM modülünü kullanarak değerleri hesapla
        const currentValue = WasmPortfolioCalculator.calculateAssetValue(asset.amount, asset.currentPrice);
        const profitLoss = WasmPortfolioCalculator.calculateProfitLoss(asset.buyPrice, asset.currentPrice, asset.amount);
        const percentChange = WasmPortfolioCalculator.calculatePercentageChange(
            asset.buyPrice * asset.amount,
            asset.currentPrice * asset.amount
        );

        // Yeni satır oluştur
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="img/icons/${asset.symbol.toLowerCase()}.png" alt="${asset.symbol}" class="asset-icon"> ${asset.name}</td>
            <td>${asset.symbol}</td>
            <td>${asset.amount}</td>
            <td>${appData.settings.currency}${asset.currentPrice.toLocaleString('tr-TR')}</td>
            <td>${appData.settings.currency}${currentValue.toLocaleString('tr-TR')}</td>
            <td class="${profitLoss >= 0 ? 'positive' : 'negative'}">${appData.settings.currency}${profitLoss.toLocaleString('tr-TR')}</td>
            <td class="${percentChange >= 0 ? 'positive' : 'negative'}">${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%</td>
            <td>
                <button class="action-btn edit-btn" data-id="${asset.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${asset.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;

        DOM.portfolioBody.appendChild(row);
    });

    console.log("Portföy tablosu WebAssembly hesaplamaları kullanılarak güncellendi.");
}

// Grafikleri güncelleme
function updateCharts() {
    updatePortfolioChart();
    updateDistributionChart();
    console.log("Grafikler WebAssembly verileri ile güncellendi.");
}

// Portföy değişim grafiğini güncelleme
function updatePortfolioChart() {
    if (!DOM.portfolioChart) return;

    // Chart.js grafiği oluştur (örnek veri ile)
    const ctx = DOM.portfolioChart.getContext('2d');

    // Mevcut grafik varsa yok et
    if (window.portfolioLineChart) {
        window.portfolioLineChart.destroy();
    }

    // Son 7 günün verileri (örnek)
    const labels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const data = [45000, 46500, 46000, 47200, 48000, 47500, 49000];

    window.portfolioLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portföy Değeri',
                data: data,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${appData.settings.currency}${context.parsed.y.toLocaleString('tr-TR')}`;
                        }
                    }
                }
            }
        }
    });
}

// Dağılım grafiğini güncelleme
function updateDistributionChart() {
    if (!DOM.distributionChart || !appData.portfolio.length) return;

    // Chart.js grafiği oluştur
    const ctx = DOM.distributionChart.getContext('2d');

    // Mevcut grafik varsa yok et
    if (window.distributionPieChart) {
        window.distributionPieChart.destroy();
    }

    // WASM modülünü kullanarak varlık dağılımını hesapla
    const distribution = WasmPortfolioCalculator.calculatePortfolioDistribution(appData.portfolio);

    // Varlık isimlerini ve renklerini hazırla
    const labels = appData.portfolio.map(asset => asset.name);
    const backgroundColors = [
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(255, 99, 255, 0.7)',
        'rgba(75, 99, 255, 0.7)'
    ];

    window.distributionPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: distribution,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: %${context.parsed.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// İşlem geçmişini güncelleme
function updateTransactionHistory() {
    const transactionBody = document.getElementById('transaction-body');
    if (!transactionBody || !appData.transactions.length) return;

    // İşlem tablosunu temizle
    transactionBody.innerHTML = '';

    // Her işlem için bir satır ekle
    appData.transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(transaction.date).toLocaleDateString('tr-TR')}</td>
            <td>${transaction.symbol}</td>
            <td>${transaction.type}</td>
            <td>${transaction.amount}</td>
            <td>${appData.settings.currency}${transaction.price.toLocaleString('tr-TR')}</td>
            <td>${appData.settings.currency}${transaction.total.toLocaleString('tr-TR')}</td>
            <td>
                <button class="action-btn view-btn" data-id="${transaction.id}"><i class="fas fa-eye"></i></button>
            </td>
        `;

        transactionBody.appendChild(row);
    });

    console.log("İşlem geçmişi güncellendi.");
}

// Olay dinleyicileri kurulumu
function setupEventListeners() {
    // Navigasyon için
    DOM.navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substr(1);

            // Aktif sekmeyi değiştir
            DOM.navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');

            // Aktif bölümü değiştir
            DOM.sections.forEach(section => {
                section.classList.remove('active-section');
                if (section.id === targetId) {
                    section.classList.add('active-section');
                }
            });
        });
    });

    // İşlem modalı için
    if (DOM.modalOpenButtons) {
        DOM.modalOpenButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.modal.style.display = 'flex';
            });
        });
    }

    if (DOM.modalClose) {
        DOM.modalClose.addEventListener('click', () => {
            DOM.modal.style.display = 'none';
        });
    }

    // İşlem formu için
    if (DOM.transactionForm) {
        DOM.transactionForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Form verilerini al
            const formData = new FormData(this);

            // TODO: Yeni işlem eklemek için form verilerini işle
            console.log("Yeni işlem ekleniyor...");

            // Modalı kapat
            DOM.modal.style.display = 'none';
        });
    }

    // Arama ve filtreleme için
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', function () {
            // TODO: Arama fonksiyonunu ekle
            console.log("Arama yapılıyor:", this.value);
        });
    }

    if (DOM.filterOptions) {
        DOM.filterOptions.forEach(option => {
            option.addEventListener('click', function () {
                // Aktif filtreyi değiştir
                DOM.filterOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');

                // TODO: Filtreleme fonksiyonunu ekle
                const filter = this.dataset.filter;
                console.log("Filtreleniyor:", filter);
            });
        });
    }

    console.log("Olay dinleyicileri kuruldu.");
}

// Piyasa verilerini periyodik olarak güncelleme
function startMarketDataUpdates() {
    updateMarketData();

    // Verileri belirli aralıklarla güncelle
    setInterval(updateMarketData, appData.settings.refreshRate);
    console.log(`Piyasa verileri her ${appData.settings.refreshRate / 1000 / 60} dakikada bir güncellenecek.`);
}

// Piyasa verilerini güncelleme
function updateMarketData() {
    // TODO: Gerçek bir API'den piyasa verilerini al
    console.log("Piyasa verileri WebAssembly uygulaması için güncelleniyor...");

    // Simulasyon: Varlık fiyatlarını rastgele güncelle
    appData.portfolio.forEach(asset => {
        // WebAssembly belleğini temizle
        WasmPortfolioCalculator.clearMemoryRegion(WASM_CONFIG.INPUT_BASE, 32);

        // Rastgele değişim için değerleri WebAssembly belleğine yaz
        MemoryManager.setFloat64(WASM_CONFIG.INPUT_BASE, asset.currentPrice);
        MemoryManager.setFloat64(WASM_CONFIG.INPUT_BASE + 8, 0.06); // %6 maksimum değişim

        try {
            // WebAssembly fonksiyonunu çağır (eğer varsa)
            if (wasmInstance.exports && typeof wasmInstance.exports.generate_random_price_change === 'function') {
                wasmInstance.exports.generate_random_price_change(WASM_CONFIG.INPUT_BASE, WASM_CONFIG.OUTPUT_BASE);
                asset.currentPrice = MemoryManager.getFloat64(WASM_CONFIG.OUTPUT_BASE);
            } else {
                // Alternatif olarak JavaScript hesaplaması
                const change = (Math.random() - 0.5) * 0.06;
                asset.currentPrice = asset.currentPrice * (1 + change);
            }
        } catch (error) {
            console.error("WebAssembly fiyat değişimi hesaplanırken hata:", error);
            // Hata durumunda JavaScript hesaplaması
            const change = (Math.random() - 0.5) * 0.06;
            asset.currentPrice = asset.currentPrice * (1 + change);
        }
    });

    // Kullanıcı arayüzünü güncelle
    updateUI();
}

// DOM yüklendikten sonra sayfa başlatmayı kontrol et
console.log("WebAssembly tabanlı portföy uygulaması yüklenmeye hazır. WebAssembly modülünün yüklenmesi bekleniyor...");

// WebAssembly belleğini ve fonksiyonlarını global olarak eriştirilebilir yap
window.WasmPortfolioCalculator = WasmPortfolioCalculator; 
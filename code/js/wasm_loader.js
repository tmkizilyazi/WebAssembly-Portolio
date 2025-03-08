// WebAssembly modülü yükleme fonksiyonu
let wasmModule = null;

// Portföy hesaplama fonksiyonlarını tutacak bir nesne
const PortfolioCalculator = {
    // JavaScript hesaplama fonksiyonları
    calculateTotalValue: function (assets) {
        return assets.reduce((total, asset) => total + (asset.amount * asset.currentPrice), 0);
    },

    calculateAssetValue: function (amount, price) {
        return amount * price;
    },

    calculateProfitLoss: function (buyPrice, currentPrice, amount) {
        return (currentPrice - buyPrice) * amount;
    },

    calculatePercentageChange: function (oldValue, newValue) {
        if (oldValue === 0) return 0;
        return ((newValue - oldValue) / oldValue) * 100;
    },

    calculatePortfolioDistribution: function (assets) {
        const total = this.calculateTotalValue(assets);
        if (total === 0) return assets.map(asset => 0);

        return assets.map(asset => {
            const value = asset.amount * asset.currentPrice;
            return (value / total) * 100;
        });
    }
};

// WebAssembly modülünü yükle
async function loadWasmModule() {
    try {
        // WebAssembly modülü zaten yüklü mü kontrol et
        if (window.wasmModule) {
            console.log("WebAssembly modülü zaten yüklenmiş!");
            return true;
        }

        console.log("WebAssembly portföy modülü yükleniyor...");

        // WebAssembly modülü yükleme işlemi - gerçekte oluşturulan portfolio.js dosyasını yükleyeceğiz
        // Simülasyon yerine gerçek modül kullanımı
        try {
            // Önce portfolio.js script dosyasını yükle (Emscripten tarafından oluşturulacak)
            // Bu dosya, portfolyo.wasm dosyasını da yükleyecek
            const scriptElement = document.createElement('script');
            scriptElement.src = 'js/portfolio.js';
            scriptElement.async = true;

            // Script dosyası yüklendiğinde belli bir süre sonra wasmLoaded olayını trigger edelim
            // Not: portfolio.js zaten kendi içinde wasmLoaded olayını tetikleyecek,
            // bu sadece dosya bulunamazsa yedek olarak kullanılacak
            scriptElement.onload = () => {
                console.log("portfolio.js dosyası yüklendi, WebAssembly modülü hazırlanıyor...");

                // Script yüklense bile WebAssembly hazırlığı biraz zaman alabilir
                // Bu nedenle kısa bir bekleme ekleyelim (gerçek uygulamada gerekli olmayabilir)
                setTimeout(() => {
                    if (!window.wasmModule) {
                        console.warn("WebAssembly modülü yüklenemedi, yedek hesaplama fonksiyonları kullanılacak.");
                        setupFallbackCalculators();
                        document.dispatchEvent(new CustomEvent('wasmLoaded'));
                    }
                }, 1000);
            };

            // Hata durumunda
            scriptElement.onerror = () => {
                console.error("portfolio.js dosyası yüklenirken hata oluştu!");
                setupFallbackCalculators();
                document.dispatchEvent(new CustomEvent('wasmLoaded'));
            };

            // Script elementini sayfaya ekle
            document.head.appendChild(scriptElement);

            // Script yükleme işlemi başlatıldı
            return true;
        } catch (error) {
            console.error("WebAssembly modülü yüklenirken hata:", error);
            setupFallbackCalculators();
            document.dispatchEvent(new CustomEvent('wasmLoaded'));
            return false;
        }
    } catch (error) {
        console.error("WebAssembly modülü yüklenirken hata oluştu:", error);
        setupFallbackCalculators();
        document.dispatchEvent(new CustomEvent('wasmLoaded'));
        return false;
    }
}

// WebAssembly yüklenmezse kullanılacak yedek hesaplama fonksiyonları
function setupFallbackCalculators() {
    console.warn("WebAssembly kullanılamıyor, JavaScript hesaplamaları kullanılacak.");

    // JavaScript ile hesaplama fonksiyonlarını ayarla
    PortfolioCalculator.calculateTotalValue = function (assets) {
        return assets.reduce((total, asset) => total + (asset.amount * asset.currentPrice), 0);
    };

    PortfolioCalculator.calculateAssetValue = function (amount, price) {
        return amount * price;
    };

    PortfolioCalculator.calculateProfitLoss = function (buyPrice, currentPrice, amount) {
        return (currentPrice - buyPrice) * amount;
    };

    PortfolioCalculator.calculatePercentageChange = function (oldValue, newValue) {
        if (oldValue === 0) return 0;
        return ((newValue - oldValue) / oldValue) * 100;
    };

    PortfolioCalculator.calculatePortfolioDistribution = function (assets) {
        const total = PortfolioCalculator.calculateTotalValue(assets);
        if (total === 0) return assets.map(asset => 0);

        return assets.map(asset => {
            const value = asset.amount * asset.currentPrice;
            return (value / total) * 100;
        });
    };

    console.log("JavaScript hesaplama fonksiyonları hazırlandı (WebAssembly yedeği).");
}

// WebAssembly modülünün yüklenmesini bekleyen olay dinleyicisi
document.addEventListener('wasmLoaded', () => {
    console.log("wasmLoaded olayı alındı, uygulama başlatılıyor...");

    // Uygulama başlatma işlemleri
    initializeApp();
});

// Uygulama başlatma fonksiyonu
function initializeApp() {
    console.log("Uygulama başlatılıyor...");

    // Test verileri ile başlatma
    loadSampleData();

    // Kullanıcı arayüzünü güncelle
    updateUI();

    // Olay dinleyicilerini ekle
    setupEventListeners();

    // Piyasa verilerini periyodik olarak güncelle
    startMarketDataUpdates();
}

// Hesaplama fonksiyonlarını dışa aktar
window.PortfolioCalculator = PortfolioCalculator; 
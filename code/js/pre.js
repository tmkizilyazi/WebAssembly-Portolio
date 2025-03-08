// WebAssembly Portföy Yönetim Sistemi - Pre JS Dosyası

// Bu kod, WebAssembly modülü yüklenmeden önce çalıştırılır
// WebAssembly modülümüz için bazı önizlemeler ve hazırlıklar yapabiliriz

// Modül başlatma işlemimizi, modül yüklendikten sonra çalıştırılacak şekilde ayarlıyoruz
var Module = {
    // WebAssembly modülünün yüklenmesini beklerken gösterilecek mesaj
    print: function (text) {
        console.log("[WASM] " + text);
    },
    printErr: function (text) {
        console.error("[WASM Error] " + text);
    },

    // Modül yüklendiğinde çalışacak fonksiyon
    onRuntimeInitialized: function () {
        console.log("WebAssembly portföy modülü başarıyla yüklendi ve başlatıldı!");

        // Dışa aktarılan fonksiyonları wrap ediyoruz
        this.exports = {
            calculate_total_value: Module.cwrap('calculate_total_value', 'number', ['number', 'number']),
            calculate_asset_value: Module.cwrap('calculate_asset_value', 'number', ['number', 'number']),
            calculate_profit_loss: Module.cwrap('calculate_profit_loss', 'number', ['number', 'number']),
            calculate_percentage_change: Module.cwrap('calculate_percentage_change', 'number', ['number', 'number']),
            calculate_portfolio_distribution: Module.cwrap('calculate_portfolio_distribution', null, ['number', 'number']),
            generate_random_price_change: Module.cwrap('generate_random_price_change', 'number', ['number', 'number']),
            calculate_risk_adjusted_return: Module.cwrap('calculate_risk_adjusted_return', 'number', ['number', 'number']),
            calculate_historical_volatility: Module.cwrap('calculate_historical_volatility', 'number', ['number', 'number', 'number']),
            initialize: Module.cwrap('initialize', null, [])
        };

        // WebAssembly belleğini dışa aktar
        this.memory = Module.HEAPU8.buffer;

        // Initialize fonksiyonunu çağır
        this.exports.initialize();

        // WebAssembly modülünün hazır olduğunu bildir
        document.dispatchEvent(new CustomEvent('wasmLoaded'));
    }
};

// WebAssembly yüklenirken ilerleme durumunu takip etmek için
Module.monitorRunDependencies = function (left) {
    console.log("[WASM] " + (left ? left + " bağımlılık yükleniyor..." : "Tüm bağımlılıklar yüklendi!"));
}; 
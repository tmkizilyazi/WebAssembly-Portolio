// WebAssembly Portföy Yönetim Sistemi - Post JS Dosyası

// Bu kod, WebAssembly modülü yüklendikten sonra çalıştırılır
// Modül referansını global alanda erişilebilir yapıyoruz

// WebAssembly modül referansını global olarak saklayalım
window.wasmModule = Module;

// Kolay kullanım için JavaScript arayüzü
window.PortfolioCalculator = {
    // WebAssembly bellekten okuma ve yazma
    writeToMemory: function (data, offset, type) {
        if (!Module.HEAPU8) {
            console.error("WebAssembly belleği henüz hazır değil!");
            return 0;
        }

        switch (type) {
            case 'double':
                const doubleView = new Float64Array(Module.HEAPU8.buffer, offset, 1);
                doubleView[0] = data;
                return 8; // double 8 byte

            case 'int':
                const intView = new Int32Array(Module.HEAPU8.buffer, offset, 1);
                intView[0] = data;
                return 4; // int 4 byte

            case 'doubleArray':
                const doubleArray = new Float64Array(Module.HEAPU8.buffer, offset, data.length);
                for (let i = 0; i < data.length; i++) {
                    doubleArray[i] = data[i];
                }
                return data.length * 8; // her double 8 byte

            default:
                console.error("Bilinmeyen veri tipi:", type);
                return 0;
        }
    },

    readFromMemory: function (offset, type, length = 1) {
        if (!Module.HEAPU8) {
            console.error("WebAssembly belleği henüz hazır değil!");
            return null;
        }

        switch (type) {
            case 'double':
                return new Float64Array(Module.HEAPU8.buffer, offset, 1)[0];

            case 'int':
                return new Int32Array(Module.HEAPU8.buffer, offset, 1)[0];

            case 'doubleArray':
                const result = [];
                const array = new Float64Array(Module.HEAPU8.buffer, offset, length);
                for (let i = 0; i < length; i++) {
                    result.push(array[i]);
                }
                return result;

            default:
                console.error("Bilinmeyen veri tipi:", type);
                return null;
        }
    },

    // Toplam portföy değerini hesapla
    calculateTotalValue: function (assets) {
        const INPUT_OFFSET = 0;
        const OUTPUT_OFFSET = 4096;

        // Varlık sayısını yaz
        this.writeToMemory(assets.length, INPUT_OFFSET, 'int');

        // Varlık verilerini yaz
        let offset = INPUT_OFFSET + 8;
        assets.forEach(asset => {
            offset += this.writeToMemory(asset.amount, offset, 'double');
            offset += this.writeToMemory(asset.currentPrice, offset, 'double');
        });

        // WebAssembly fonksiyonunu çağır
        Module.exports.calculate_total_value(INPUT_OFFSET, OUTPUT_OFFSET);

        // Sonucu oku
        return this.readFromMemory(OUTPUT_OFFSET, 'double');
    },

    // Varlık değerini hesapla
    calculateAssetValue: function (amount, price) {
        const INPUT_OFFSET = 0;
        const OUTPUT_OFFSET = 4096;

        // Girdi verilerini yaz
        this.writeToMemory(amount, INPUT_OFFSET, 'double');
        this.writeToMemory(price, INPUT_OFFSET + 8, 'double');

        // WebAssembly fonksiyonunu çağır
        Module.exports.calculate_asset_value(INPUT_OFFSET, OUTPUT_OFFSET);

        // Sonucu oku
        return this.readFromMemory(OUTPUT_OFFSET, 'double');
    },

    // Kâr/zarar hesapla
    calculateProfitLoss: function (buyPrice, currentPrice, amount) {
        const INPUT_OFFSET = 0;
        const OUTPUT_OFFSET = 4096;

        // Girdi verilerini yaz
        this.writeToMemory(buyPrice, INPUT_OFFSET, 'double');
        this.writeToMemory(currentPrice, INPUT_OFFSET + 8, 'double');
        this.writeToMemory(amount, INPUT_OFFSET + 16, 'double');

        // WebAssembly fonksiyonunu çağır
        Module.exports.calculate_profit_loss(INPUT_OFFSET, OUTPUT_OFFSET);

        // Sonucu oku
        return this.readFromMemory(OUTPUT_OFFSET, 'double');
    },

    // Yüzde değişimi hesapla
    calculatePercentageChange: function (oldValue, newValue) {
        const INPUT_OFFSET = 0;
        const OUTPUT_OFFSET = 4096;

        // Girdi verilerini yaz
        this.writeToMemory(oldValue, INPUT_OFFSET, 'double');
        this.writeToMemory(newValue, INPUT_OFFSET + 8, 'double');

        // WebAssembly fonksiyonunu çağır
        Module.exports.calculate_percentage_change(INPUT_OFFSET, OUTPUT_OFFSET);

        // Sonucu oku
        return this.readFromMemory(OUTPUT_OFFSET, 'double');
    },

    // Portföy dağılımını hesapla
    calculatePortfolioDistribution: function (assets) {
        const INPUT_OFFSET = 0;
        const OUTPUT_OFFSET = 4096;

        // Varlık sayısını yaz
        this.writeToMemory(assets.length, INPUT_OFFSET, 'int');

        // Varlık verilerini yaz
        let offset = INPUT_OFFSET + 8;
        assets.forEach(asset => {
            offset += this.writeToMemory(asset.amount, offset, 'double');
            offset += this.writeToMemory(asset.currentPrice, offset, 'double');
        });

        // WebAssembly fonksiyonunu çağır
        Module.exports.calculate_portfolio_distribution(INPUT_OFFSET, OUTPUT_OFFSET);

        // Sonuçları oku
        return this.readFromMemory(OUTPUT_OFFSET, 'doubleArray', assets.length);
    }
};

// WebAssembly modülünün hazır olduğunu konsola yazdır
console.log("WebAssembly portföy hesaplayıcı modülü yüklendi ve kullanıma hazır."); 
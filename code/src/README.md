# WebAssembly Portföy Yönetim Sistemi - C Kaynak Kodu

Bu dizin, WebAssembly modülünün C kaynak kodunu içermektedir. Bu kod, Emscripten derleyicisi kullanılarak WebAssembly'ye derlenir ve JavaScript tarafından kullanılır.

## Dosyalar

- `portfolio.c`: WebAssembly modülünün ana C kaynak kodu
- `Makefile`: Derleme işlemini otomatikleştiren Makefile

## Derleme

Emscripten derleyicisini kurduğunuzdan emin olun. Daha sonra aşağıdaki komutu çalıştırın:

```bash
make
```

Bu komut, C kodunu WebAssembly'ye derler ve `../js/` dizinine `portfolio.js` ve `portfolio.wasm` dosyalarını oluşturur.

## Gereksinimler

- Emscripten SDK (emsdk)
- Make
- C derleyicisi (GCC veya Clang)

## Dışa Aktarılan Fonksiyonlar

WebAssembly modülü aşağıdaki fonksiyonları JavaScript tarafından çağrılabilir şekilde dışa aktarır:

1. `calculate_total_value`: Toplam portföy değerini hesaplar
2. `calculate_asset_value`: Bir varlığın değerini hesaplar
3. `calculate_profit_loss`: Kâr/zarar hesaplar
4. `calculate_percentage_change`: Yüzde değişimi hesaplar
5. `calculate_portfolio_distribution`: Portföy dağılımını hesaplar
6. `generate_random_price_change`: Rastgele fiyat değişimi oluşturur
7. `calculate_risk_adjusted_return`: Riske göre ayarlanmış getiri hesaplar
8. `calculate_historical_volatility`: Tarihsel volatilite hesaplar
9. `initialize`: WebAssembly modülünü başlatır

## Bellek Düzeni

WebAssembly modülü, JavaScript ile veri alışverişi için aşağıdaki bellek düzenini kullanır:

- `0 - 4095`: Giriş verileri için
- `4096 - 8191`: Çıkış verileri için
- `8192 - 16383`: String verileri için
- `16384 - 32767`: Dizi verileri için

## Örnek Kullanım

JavaScript tarafında:

```javascript
// Toplam portföy değerini hesapla
const assets = [
    { amount: 1.5, currentPrice: 40000 },
    { amount: 10, currentPrice: 2800 }
];

// Varlık sayısını belleğe yaz
MemoryManager.setInt32(0, assets.length);

// Varlık verilerini belleğe yaz
let offset = 8;
assets.forEach(asset => {
    MemoryManager.setFloat64(offset, asset.amount);
    offset += 8;
    MemoryManager.setFloat64(offset, asset.currentPrice);
    offset += 8;
});

// WebAssembly fonksiyonunu çağır
Module.exports.calculate_total_value(0, 4096);

// Sonucu bellekten oku
const totalValue = MemoryManager.getFloat64(4096);
console.log("Toplam Portföy Değeri:", totalValue);
```

## Lisans

MIT 
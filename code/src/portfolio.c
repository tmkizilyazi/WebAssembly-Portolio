// Portföy Yönetim Sistemi - WebAssembly C Kaynak Kodu
#include <stdlib.h>
#include <math.h>
#include <stdbool.h>
#include <time.h>
#include <emscripten.h>

// Bellek offsetleri tanımları (JavaScript tarafıyla uyumlu olmalı)
#define INPUT_BASE 0
#define OUTPUT_BASE 4096
#define STRING_BASE 8192
#define ARRAY_BASE 16384

// Dışa aktarılan fonksiyonlar için ön tanımlamalar
EMSCRIPTEN_KEEPALIVE
double calculate_total_value(int input_offset, int output_offset);

EMSCRIPTEN_KEEPALIVE
double calculate_asset_value(int input_offset, int output_offset);

EMSCRIPTEN_KEEPALIVE
double calculate_profit_loss(int input_offset, int output_offset);

EMSCRIPTEN_KEEPALIVE
double calculate_percentage_change(int input_offset, int output_offset);

EMSCRIPTEN_KEEPALIVE
void calculate_portfolio_distribution(int input_offset, int output_offset);

EMSCRIPTEN_KEEPALIVE
double generate_random_price_change(int input_offset, int output_offset);

// JavaScript'ten çağrılabilecek yardımcı fonksiyonlar
// Bu fonksiyonlar WebAssembly modülünü başlatmak için kullanılabilir
EMSCRIPTEN_KEEPALIVE
void initialize()
{
    // Rastgele sayı üreteci başlat
    srand(time(NULL));

    // Gerekli başlatma işlemleri burada yapılabilir
}

// Toplam portföy değerini hesapla
// input_offset: Varlık sayısı ve varlık değerleri için bellek konumu
// output_offset: Sonuç için bellek konumu
EMSCRIPTEN_KEEPALIVE
double calculate_total_value(int input_offset, int output_offset)
{
    // Belleğe erişim için pointer'lar
    int *input_size_ptr = (int *)input_offset;
    double *input_data_ptr = (double *)(input_offset + 8);
    double *output_ptr = (double *)output_offset;

    // Varlık sayısını oku
    int asset_count = *input_size_ptr;

    // Toplam değeri hesapla
    double total_value = 0.0;
    for (int i = 0; i < asset_count; i++)
    {
        double amount = input_data_ptr[i * 2];
        double price = input_data_ptr[i * 2 + 1];
        total_value += amount * price;
    }

    // Sonucu belleğe yaz
    *output_ptr = total_value;

    return total_value;
}

// Varlık değerini hesapla (miktar * fiyat)
EMSCRIPTEN_KEEPALIVE
double calculate_asset_value(int input_offset, int output_offset)
{
    // Belleğe erişim için pointer'lar
    double *input_ptr = (double *)input_offset;
    double *output_ptr = (double *)output_offset;

    // Parametreleri oku
    double amount = input_ptr[0];
    double price = input_ptr[1];

    // Değeri hesapla
    double value = amount * price;

    // Sonucu belleğe yaz
    *output_ptr = value;

    return value;
}

// Kâr/zarar hesapla ((şimdiki fiyat - alış fiyatı) * miktar)
EMSCRIPTEN_KEEPALIVE
double calculate_profit_loss(int input_offset, int output_offset)
{
    // Belleğe erişim için pointer'lar
    double *input_ptr = (double *)input_offset;
    double *output_ptr = (double *)output_offset;

    // Parametreleri oku
    double buy_price = input_ptr[0];
    double current_price = input_ptr[1];
    double amount = input_ptr[2];

    // Kâr/zarar hesapla
    double profit_loss = (current_price - buy_price) * amount;

    // Sonucu belleğe yaz
    *output_ptr = profit_loss;

    return profit_loss;
}

// Yüzde değişimi hesapla (((yeni değer - eski değer) / eski değer) * 100)
EMSCRIPTEN_KEEPALIVE
double calculate_percentage_change(int input_offset, int output_offset)
{
    // Belleğe erişim için pointer'lar
    double *input_ptr = (double *)input_offset;
    double *output_ptr = (double *)output_offset;

    // Parametreleri oku
    double old_value = input_ptr[0];
    double new_value = input_ptr[1];

    // Yüzde değişimini hesapla
    double percentage_change = 0.0;
    if (old_value != 0.0)
    {
        percentage_change = ((new_value - old_value) / old_value) * 100.0;
    }

    // Sonucu belleğe yaz
    *output_ptr = percentage_change;

    return percentage_change;
}

// Portföy dağılımını hesapla (her varlığın toplam portföye yüzde etkisi)
EMSCRIPTEN_KEEPALIVE
void calculate_portfolio_distribution(int input_offset, int output_offset)
{
    // Belleğe erişim için pointer'lar
    int *input_size_ptr = (int *)input_offset;
    double *input_data_ptr = (double *)(input_offset + 8);
    double *output_ptr = (double *)output_offset;

    // Varlık sayısını oku
    int asset_count = *input_size_ptr;

    // Önce toplam portföy değerini hesapla
    double total_value = 0.0;
    for (int i = 0; i < asset_count; i++)
    {
        double amount = input_data_ptr[i * 2];
        double price = input_data_ptr[i * 2 + 1];
        total_value += amount * price;
    }

    // Her varlığın dağılımını hesapla
    if (total_value > 0.0)
    {
        for (int i = 0; i < asset_count; i++)
        {
            double amount = input_data_ptr[i * 2];
            double price = input_data_ptr[i * 2 + 1];
            double asset_value = amount * price;
            double percentage = (asset_value / total_value) * 100.0;
            output_ptr[i] = percentage;
        }
    }
    else
    {
        // Toplam değer 0 ise, tüm dağılım değerlerini 0 olarak ayarla
        for (int i = 0; i < asset_count; i++)
        {
            output_ptr[i] = 0.0;
        }
    }
}

// Rastgele fiyat değişimi oluştur (simülasyon için)
EMSCRIPTEN_KEEPALIVE
double generate_random_price_change(int input_offset, int output_offset)
{
    // Belleğe erişim için pointer'lar
    double *input_ptr = (double *)input_offset;
    double *output_ptr = (double *)output_offset;

    // Parametreleri oku
    double current_price = input_ptr[0];
    double max_change_percent = input_ptr[1];

    // Rastgele değişimi hesapla (-max_change_percent/2 ile +max_change_percent/2 arasında)
    double random_factor = ((double)rand() / RAND_MAX) - 0.5; // -0.5 ile 0.5 arasında
    double change_percent = random_factor * max_change_percent;
    double new_price = current_price * (1.0 + (change_percent / 100.0));

    // Sonucu belleğe yaz
    *output_ptr = new_price;

    return new_price;
}

// Daha kompleks işlemler için özel fonksiyonlar
// Gelecekte eklenebilir: risk analizi, portföy optimizasyonu, vb.

// Riske göre ayarlanmış getiri hesapla (Sharpe oranı)
EMSCRIPTEN_KEEPALIVE
double calculate_risk_adjusted_return(int input_offset, int output_offset)
{
    // Belleğe erişim için pointer'lar
    double *input_ptr = (double *)input_offset;
    double *output_ptr = (double *)output_offset;

    // Parametreleri oku - örnek: getiri, risksiz getiri oranı, standart sapma
    double return_rate = input_ptr[0];
    double risk_free_rate = input_ptr[1];
    double std_deviation = input_ptr[2];

    // Sharpe oranı hesapla
    double sharpe_ratio = 0.0;
    if (std_deviation > 0.0)
    {
        sharpe_ratio = (return_rate - risk_free_rate) / std_deviation;
    }

    // Sonucu belleğe yaz
    *output_ptr = sharpe_ratio;

    return sharpe_ratio;
}

// Tarihsel volatilite hesapla
EMSCRIPTEN_KEEPALIVE
double calculate_historical_volatility(int input_offset, int output_offset, int data_length)
{
    // Belleğe erişim için pointer'lar
    double *price_data_ptr = (double *)input_offset;
    double *output_ptr = (double *)output_offset;

    // Günlük getiri oranlarını hesapla
    double *returns = (double *)malloc((data_length - 1) * sizeof(double));
    if (!returns)
        return 0.0; // Bellek hatası

    for (int i = 1; i < data_length; i++)
    {
        returns[i - 1] = (price_data_ptr[i] / price_data_ptr[i - 1]) - 1.0;
    }

    // Ortalama getiriyi hesapla
    double sum = 0.0;
    for (int i = 0; i < data_length - 1; i++)
    {
        sum += returns[i];
    }
    double avg_return = sum / (data_length - 1);

    // Varyansı hesapla
    double variance = 0.0;
    for (int i = 0; i < data_length - 1; i++)
    {
        variance += pow(returns[i] - avg_return, 2);
    }
    variance /= (data_length - 2); // n-1 yerine n-2 kullanılabilir (örneklem düzeltmesi)

    // Standart sapmayı hesapla (volatilite)
    double volatility = sqrt(variance);

    // Sonucu belleğe yaz
    *output_ptr = volatility;

    // Geçici belleği temizle
    free(returns);

    return volatility;
}

// Ana fonksiyon - WebAssembly için gerekli olmasa da test için faydalı olabilir
int main()
{
    // WebAssembly modülü başlatma işlemi
    initialize();
    return 0;
}
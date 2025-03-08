# WebAssembly Portföy Yönetim Sistemi - Makefile

# Emscripten derleyici ve seçenekleri
CC = emcc
CFLAGS = -O3 -s WASM=1 -s EXPORTED_FUNCTIONS="['_calculate_total_value', '_calculate_asset_value', '_calculate_profit_loss', '_calculate_percentage_change', '_calculate_portfolio_distribution', '_generate_random_price_change', '_calculate_risk_adjusted_return', '_calculate_historical_volatility', '_initialize', '_main']" -s EXPORTED_RUNTIME_METHODS="['cwrap', 'ccall']" -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=16MB

# Matematikonsel operasyonlar için kütüphane
LIBS = -lm

# Hedef dosya
TARGET = portfolio.js

# Ana hedef
all: $(TARGET)

# WebAssembly modülünü derle
$(TARGET): portfolio.c
	$(CC) $(CFLAGS) -o ../js/$(TARGET) portfolio.c $(LIBS) --pre-js ../js/pre.js --post-js ../js/post.js

# Temizlik işlemi
clean:
	rm -f ../js/$(TARGET) ../js/portfolio.wasm

# Yardım metni
help:
	@echo "WebAssembly Portföy Yönetim Sistemi - Makefile"
	@echo "Kullanım: make [hedef]"
	@echo ""
	@echo "Hedefler:"
	@echo "  all     - WebAssembly modülünü derler (varsayılan)"
	@echo "  clean   - Derleme sonucu oluşan dosyaları temizler"
	@echo "  help    - Bu yardım metnini gösterir"
	@echo ""
	@echo "Örnek: make"

.PHONY: all clean help 
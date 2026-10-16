# VexEdit Studio

VexEdit Studio, mobil platformlar için geliştirilmiş profesyonel video düzenleme stüdyosudur. Bu depoda hem **gerçek ve derlenebilir Android uygulaması** (Kotlin + Jetpack Compose + AndroidX Media3), hem de referans ekran tasarımlarını tarayıcıda canlı test etmeye yarayan **React/Vite web tasarım önizlemesi** bulunmaktadır.

---

## 1. Android Projesi ve APK Derleme (Yerel ve CI)

### Gereksinimler
- **JDK:** OpenJDK 17
- **Gradle:** 8.11.1 (Depoda `gradlew` ve wrapper mevcuttur)
- **Android SDK:** Compile SDK 35, Min SDK 26 (Android 8.0+)
- **AGP:** 8.8.2
- **Kotlin:** 2.0.21 (Compose Compiler 2.0.21)

### Yerel Olarak Derleme ve Test Etme

```bash
# JVM Unit testlerini çalıştırma (14 test: Timeline, Keyframe, Repository)
./gradlew testDebugUnitTest

# Debug APK üretme
./gradlew assembleDebug
```

Derlenen APK dosyasının konumu:
```
app/build/outputs/apk/debug/app-debug.apk
```

---

## 2. GitHub Actions ile Otomatik APK İndirme

Bu depoda `.github/workflows/android.yml` iş akışı yapılandırılmıştır. Depo GitHub'a yüklendiğinde:

1. **Unit Tests (JVM):** `testDebugUnitTest` adımını çalıştırır, test raporlarını (`unit-test-results` ve `unit-test-html-report`) artifact olarak saklar. Test hatası gizlenmez.
2. **Build Debug APK:** Unit testlerden bağımsız olarak çalışır (böylece testler incelenirken derleme hataları ayrı teşhis edilebilir).
3. **Artifact Yükleme:** `app/build/outputs/apk/debug/app-debug.apk` dosyasının varlığı `test -s` ile teyit edilir ve **`vexedit-studio-debug-apk`** adıyla GitHub Actions artifact'i olarak sunulur.

### GitHub'dan APK Nasıl İndirilir? (Adım Adım)
1. GitHub deponuzun üst menüsündeki **Actions** sekmesine tıklayın.
2. Sol tarafta **Android CI - VexEdit Studio** iş akışını veya en son tamamlanan commit'i seçin.
3. Çalışmanın detay sayfasının en altında **Artifacts** (Yapı Yapıtları) bölümünü bulun.
4. **`vexedit-studio-debug-apk`** bağlantısına tıklayarak ZIP dosyasını indirin.
5. ZIP içerisindeki `app-debug.apk` dosyasını Android cihazınıza yükleyin (Cihaz ayarlarından "Bilinmeyen kaynaklardan yükle" izni gerekebilir).

### Önceki Hataların Önlenmesi
- **secrets.KEYSTORE_BASE64 hatası:** GitHub Actions ifadelerinde doğrudan `if: secrets.KEYSTORE_BASE64` kullanılmaz. Gizli anahtarlar job düzeyinde `env` değişkeni olarak aktarılır ve shell script içinde `[ -n "$KEYSTORE_BASE64" ]` ile güvenli kontrol edilir. İmzalama anahtarı yoksa release üretimi yapılmaz ve durum açıkça raporlanır.
- **JVM unit test "exit code 1" hatası:** `unitTests.isReturnDefaultValues = true` ve `unitTests.isIncludeAndroidResources = true` ayarlandı. Android framework sınıflarından bağımsız, saf Kotlin domain testleri ve JUnit 4 kullanıldı. JVM bellek sınırı `-Xmx1024m` ile dengelendi.

---

## 3. Ekranlar ve Tasarım Sistemi (Vex Hybrid)

Tüm ekranlar yüklenen tasarım görsellerine birebir sadık kalınarak oluşturulmuştur:
- **Ana Renk Paleti:**
  - Ana Arka Plan: `#101014`
  - İkincil Paneller: `#1C1B23`
  - Vex Moru Vurgu: `#A855F7`
  - Metinler: `#FFFFFF` ve `#9CA3AF`
- **Ekranlar:**
  1. **Ana Ekran (Home):** Marka başlığı, `New Project`, `Import Media`, son projeler şeridi, 2x2 hızlı erişim araçları (`Audio Studio`, `Effects Lab`, `Keyframe Editor`, `Module Center`).
  2. **Projeler (Projects):** Arama çubuğu, `All` / `Recent` / `Favorites` sekmeleri, sıralama, 2 sütunlu kartlar ve 3 nokta menüsü (`Open`, `Rename`, `Duplicate`, `Delete`).
  3. **Medya İçe Aktarma (Import Media):** `Videos`, `Photos`, `Audio`, `Files` sekmeleri, mor seçim çerçevesi, dairesel onay imi, seçim sayacı ve `Add to Timeline` butonu.
  4. **Ana Video Editörü (Studio):** `00:15:32:04` zaman cetveli, video önizlemesi, `Video 1`, `Audio 1`, `Audio 2`, `VFX`, `Text` katmanları, playhead, alt araç çubuğu (`Edit`, `Speed`, `Volume`, `Effects`, `Keyframes`, `Crop`).
  5. **Ses Stüdyosu (Audio Studio):** `MUSIC`, `VOICE`, `SOUND FX` dalga boyu kanalları, 6 kanallı dB seviye fader'ları, M (Mute) / S (Solo) anahtarları, efekt araçları ve transport denetimi.
  6. **Efekt Laboratuvarı (Effects Lab):** `Before | After` anahtarı, `Violet Glow`, `Film Grain`, `RGB Split`, `Cinematic` kartları, `Intensity`, `Radius`, `Opacity`, `Blend` kaydırıcıları.
  7. **Keyframe Düzenleyicisi (Keyframe Editor):** `Position X/Y`, `Scale`, `Rotation`, `Opacity`, Bezier eğri seçimi, elmas keyframe zaman çizelgesi, `Previous / Add / Next Keyframe` butonları.
  8. **Modül Merkezi (Module Center):** Kategori sekmeleri, `Cinematic Effects Pack`, kurulu ve güncellenebilir modül listesi.
  9. **Ayarlar (Settings):** Türkçe/İngilizce dil seçimi, Low/Medium/High performans profili, önizleme kalitesi ve önbellek temizleme.

---

## 4. Web Önizlemesi (Tasarım Doğrulama)

Tasarım referanslarını tarayıcı ortamında incelemek için:

```bash
npm install
npm run dev
```

Üretim derlemesi:
```bash
npm run build
```

---

## 5. Yol Haritası ve Mimari Detaylar

Ayrıntılı teknik analiz, risk değerlendirmesi ve Android mimarisi için `docs/ANDROID_PLAN_TR.md` dosyasını inceleyebilirsiniz.

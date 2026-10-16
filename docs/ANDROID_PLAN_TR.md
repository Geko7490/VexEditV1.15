# VexEdit Studio: Asama 1 Analiz ve Android Yol Haritasi

## 1. Ortam ve gorunur referanslar

Erisilebilir kaynaklar: `src/App.tsx` ile baslayan React/Vite/TypeScript projesi, Tailwind v4, Node/npm, terminal, dosya sistemi ve web arastirmasi. Bu ortamda baslangicta **JDK, Android SDK, Gradle, kotlinc ve adb yoktu**. Gonderilen 16 ekran goruntusu 8 ayri tasarimin iki kez tekrarindan olusuyor. Referanslar mesaj icindeydi; ayrica duzenlenebilir kaynak tasarim dosyasi verilmedi. Android derlemesi veya APK bu asamada yapilmadi.

## 2. Sekiz benzersiz gorselin ekran eslestirmesi

| Referans | Sayfa ve gorunen yerlesim | Gercek islev / uyarlama |
| --- | --- | --- |
| 1 ve tekrari 9 | Medya ice aktarma: ust baslik/geri/arama, dort tur sekmesi, klasor ve siralama satiri, dort sutunlu kare medya izgara, mor secim cizgisi, altta sabit secim ve ekleme eylemi. | Sistem dosya secicisi, videoyu/fotografi/sesi ayirma, metadata/kucuk resim, gercek secili oge sayisi, izinli URI'yi kalici tutma, timeline'a ekleme. |
| 2 ve tekrari 10 | Modul Merkezi: geri/arama, kategori sekmeleri, one cikan paket, kurulu/uygun filtresi, surum/boyut/durum satirlari, alt navigasyon. | Kurulum/guncelleme/kaldirma ve indirme ilerlemesi ancak gercek ve guvenli dagitim altyapisi oldugunda gorunmeli. Web onizlemesi yalnizca gercek yerlesik araclari gosteriyor. |
| 3 ve tekrari 11 | Ana ekran: mor geometrik Vex isareti ve buyuk urun adi, yeni proje/ice aktar CTA'lari, yatay son projeler, ikili hizli arac izgara, alt navigasyon. | Proje acma/olusturma, ice aktarma ve dort gercek arac rotasi. Referanstaki senkronizasyon gostergesi bulut servisi olmadan kullanilmamali. |
| 4 ve tekrari 12 | Projeler: marka basligi/yeni proje, arama, All/Recent/Favorites, sort satiri, iki sutunlu kucuk resim ve uc nokta menusu. | Arama, siralama, acma, yeniden adlandirma, kopyalama, yedekleme, silme, favori ve geri yukleme. |
| 5 ve tekrari 13 | Keyframe: ustte goruntu ve degerler, sagda elmas durumlari/easing grafigi; altta cetvel, video ve transform seritleri, onceki/ekle/sonraki. | Konum/olcek/donme/opaklik degerleri; zaman damgali keyframe, silme, gezinme ve enterpolasyon. Dar telefonda ust bolumler alt alta gelmeli. Easing gerceklenmeden secenek gostermemeli. |
| 6 ve tekrari 14 | Efekt Laboratuvari: buyuk preview, once/sonra, kategori seridi, kucuk resimli presetler, parametre kaydiricilari, iptal/uygula. | Yalnizca preview ile export'ta ayni sonucu verebilen presetleri etkinlestir; desteklenmeyen glow/VHS/glitch icin sahte Apply kullanma. |
| 7 ve tekrari 15 | Ses Studyosu: ustte video, cetvel ve uc renkli dalga kanali, mixer faderlari, M/S, ses araci izgara ve transport. | Gercek orneklerden dalga bicimi, ses duzeyi, fade, trim/split, mute/solo; EQ, noise gate ve pan ancak isleme zinciri ve export ile dogrulandiginda acilmali. |
| 8 ve tekrari 16 | Ana editor: ustte proje adi/undo-redo/save/export, buyuk video preview, cetvel/playhead, video-ses-VFX-metin katmanlari, altta araclar ve navigasyon. | Tek proje modeli uzerinden secme/tasima/trim/split/kopyala/sil, zamanlama, oynatma, otomatik kayit ve gercek export. |

**Ortak sistem:** #101014 zemin, #1C1B23 ikincil yuzey, #A855F7 aktif vurgu; beyaz/acik gri tipografi; orta gri yardimci metin. Kose yaricaplari kucuk, klipler dikdortgen, keyframe isaretleri elmas. Baslik/geri/eylem cubugu, dortlu Home/Projects/Studio/Settings navigasyonu, medya kareleri ve secim cizgileri ortak bilesenler. Referans dil Ingilizce, istenen urun iki dilli; degerler cevrilirken kullanici dosya adlari cevrilmez.

**Referans celişkileri / belirsizlikler:** Ilk medya ekraninda bes secili yazarken gorunurde besin uzerinde mor onay var; secim sayaci gercek veriyle hesaplanmali. Modul goruntusundeki %68 indirme, pack boyutlari/surumleri ve ana sayfadaki "Drafts Syncing" gercek servis olmadan olusturulamaz. Efekt ekraninda temsil edilen her efekt sistemde hazir kabul edilemez. Keyframe ekraninin yanyana sikisik panelleri dar telefonlarda okunakli degil; alt alta uyarlama gerekli. Gorsellerdeki bazi mor butonlar gradyanli, ancak belirtilen Vex Hybrid kuralina uygun olarak ana eylemlerde duz mor kullanildi. Referanslarda disari aktarma/ayarlar ekranlari bulunmadigindan bu iki ekranin ayrinti yerlesimi belirsiz; mevcut dilin devam ettirilmesi uygun.

## 3. Onerilen yerel Android mimarisi

- **Dil ve arayuz:** Kotlin + Jetpack Compose; ekran durumu ViewModel/StateFlow. Once `:app`, `:core:model`, `:core:data`, `:core:media` ve temel `:feature:editor`, `:feature:projects`; ihtiyac dogdukca ses/efekt/disari aktarma modulleri ayrilir. Bos Gradle modulleri uretilmez.
- **Veri modeli:** `Project`, `MediaAsset`, `Track`, `Clip`, `AudioSettings`, `EffectInstance`, `Keyframe` ayri nesneler. Timeline ve kaynak pozisyonlari `Long` mikrosaniye, video/ses katmanlari tek proje turunden okunur. Hiz/sure/yayilma kurallari tek domain katmaninda dogrulanir.
- **Kalicilik:** Room islemleri, sema migrasyonlari ve proje duzenleme komutlari. Otomatik kayit ve surumlu JSON yedekleri atomik dosya degisimiyle yapilir; kaynak medyalarin SAF URI izinleri `takePersistableUriPermission` ile korunur. Yeniden acilista URI erisimi tekrar dogrulanir; bozuk kayit icin son saglam snapshot tutulur.
- **Gecmis:** Klip islemleri tersine cevrilebilir komutlar veya sinirli transaction snapshot'lariyla Undo/Redo; hizli suruklemede coalescing, proje degisiminde gecmis izolasyonu, geri alinan islemin proje kaydina yazilmasi.
- **Icerik edinimi:** Android Photo Picker/SAF (`ACTION_OPEN_DOCUMENT`) ve izin/URI kontrolu. MediaStore tarama gerekiyorsa platform surumune uygun izin akisiyla; kaynagi RAM'e tumden almadan thumbnail ve dalga bicimi orneklemesi.
- **Onizleme / export:** Media3 ExoPlayer tekli preview icin; `CompositionPlayer` kompozisyon preview icin **deneysel** oldugundan gercek cihaz matrisiyle sinanir. Ayni domain proje `Composition` yapisina map edilir, `Transformer` ile export edilir. Ses mix/effect/offset/transition ancak Media3'te dogrulanan subset olarak acilir.
- **Kabiliyet denetimi:** `MediaCodecList` / codec capabilities ve kaynak formatindan desteklenen boyut, fps, mime, bitrate ve HDR politikasi belirlenir. 480p-4K secenekleri kosulsuz acik olmaz. Ozellikle 4K ve 2K icin encoder + profil dogrulamasi gerekir. Onizleme profili export kalitesinden ayri tutulur.
- **Arka plan ve kaynak guvenligi:** Uzun export foreground WorkManager gorevi veya platform uyumlu foreground service; gercek progress/cancel/error, gecici dosyayi basarili sonunda atomik yayimlama, iptalde temizleme. Profiller frame cache/proxy cozunurluk/aktif efekti gercekten etkiler.
- **Moduller:** Dagitim kanali belli olmadan keyfi APK/dex yukleme yapilmaz. Baslangicta yerlesik ozelliklerin yetenek listesi kullanilir; indirilebilir paketler icin sunucu, manifest, hash/imza dogrulama, surum, bagimlilik ve sandbox politikasi ayrica tasarlanir.

### Media3 uygulanabilirlik ve lisans notu

Android dokumantasyonuna gore Media3 Transformer kirpma, donusum, katman/efekt ve Composition export destekler; codec destegi `MediaCodec` ile sinirlidir. CompositionPlayer ayni Composition uzerinden preview saglar ancak Media3 yayin notlarinda `@ExperimentalApi` olarak yer alir ve coklu video sekansi preview bazi durumlarda gelistirme asamasindadir. Bu nedenle VN benzeri tum offset/crossfade, keyframe shader, EQ ve modul etkilerini "hazir" kabul etmiyoruz. AndroidX Media3 Android icin bakimi suren kutuphanedir; Media3 artefakt lisansi Apache-2.0 olarak dogrulanir. Yerel bagimlilik versiyonlari ancak Gradle/SDK ile gercek derleme yapilan asamada sabitlenecek, simdiden hayali bir surum yazilmayacaktir.

Kaynaklar:

- [Media3 ile temel video editoru](https://developer.android.com/media/implement/editing-app?hl=en)
- [CompositionPlayer preview ve sinirlar](https://developer.android.com/media/media3/transformer/compositionplayer?hl=en)
- [Media3 Transformer desteklenen formatlar](https://developer.android.com/media/media3/transformer/supported-formats?hl=en)
- [Media3 yayin notlari / deneysel API](https://developer.android.com/jetpack/androidx/releases/media3?hl=en)
- [AGP 8.9 JDK 17 / Gradle 8.11.1 uyumluluk ornegi](https://developer.android.com/build/releases/agp-8-9-0-release-notes?hl=en)

## 4. Gelistirme asamalari ve kabul kapilari

1. **Analiz ve tasarim dogrulama:** Sekiz tasarimi eslestir; teknik uygulanabilirligi belirle; islevsel web referansi uzerinde yerlesimi kontrol et. Bu asama web tip kontrolu, model testleri ve tarayici akislariyla dogrulandi. Android henuz yok.
2. **Yerel Android iskeleti:** Dogrulanmis JDK/AGP/Gradle/Kotlin/Compose surumleri, `gradlew` ve wrapper JAR, manifest, tema, kaynaklar, README; `./gradlew help`, Kotlin compile ve `assembleDebug` calismali.
3. **Ana akis:** Compose Home/Projects/Import/Settings navigasyonu, Room proje CRUD, SAF secici/kalici URI, thumbnail, yedek/geri yukleme, unit ve UI testleri.
4. **Editor cekirdegi:** Media3 preview, domain timeline komutlari, trim/split/move/duplicate/delete, zoom/playhead, otomatik kayit, undo/redo ve yeniden acma; cihazda medya kaybi senaryolari.
5. **Ses/efekt/keyframe:** Gercek ses kanallari ve PCM kontrollu efekt subseti, konum/olcek/donme/opaklik interpolasyonu, ortak preview/export mapping; desteklenmeyen kontroller gizli veya devre disi.
6. **Export/ayar/modul:** Codec probe ile secenek filtreleme, foreground gercek progress/cancel, coklu kalite, donanim profil ayarlari, guvenli modul dagitim karari.
7. **Kalite/CI:** Gradle config, JVM ve Compose testleri, Android kaynaklari, debug APK ve cihaz/emulator testleri, gorev iptali, farkli ekran boyutlari, referans karsilastirmasi ve Actions artifact kontrolu.

Her asama sonunda tamamlananlar, dokunulan dosyalar, calisanlar/eksikler, gercek test ciktisi, riskler ve siradaki asama raporlanir. Bir sonraki asamaya kullanici incelemesinden sonra gecilir.

## 5. GitHub APK kabul kriteri (yerel asama henuz baslamadi)

Yerel fazda depo `settings.gradle.kts`, kok ve app Gradle dosyalari, `gradle.properties`, `gradle/wrapper/gradle-wrapper.properties`, **gercek** wrapper JAR, `gradlew`, `gradlew.bat`, manifest, Kotlin kaynaklari, kaynaklar, testler, `README.md` ve `.github/workflows/android.yml` icerecek. `local.properties`, keystore ve imza sirri depoda olmayacak.

Workflow: `push`, `pull_request` ve `workflow_dispatch` tetikleyicileri; checkout + JDK + SDK + Gradle cache; `./gradlew help`; bagimsiz `testDebugUnitTest` ve `assembleDebug` isleri. Test isinin basarisizligi gizlenmez, debug APK isi ona `needs` bagimliligi kurmaz. Derleme sonunda `test -s app/build/outputs/apk/debug/app-debug.apk` gibi dosya varlik kontrolu yapilir ve ancak gercek dosya `upload-artifact` ile yuklenir. `if: always()` ile gercekten olusan rapor/loglar hatada da yuklenmeye calisilir; eksik rapor nedeni aciklanir. Release yalnizca manuel istekle calisir; imza sirri step `env` alanindan okunup shell'de zorunlu kontrol edilir, `if` icinde `secrets.*` dogrudan kullanilmaz. Sir yoksa imzasiz release "imzali" diye yayinlanmaz. JVM test hata kok nedeni ancak **gercek Gradle/XML loglari** elde edilince analiz edilir; onceki exit code 1'in nedenini bu depodan tahmin ederek ilan etmek dogru olmaz.

Actions artifact'i olustugunda GitHub deposunda **Actions > ilgili run > Artifacts** adimindan debug APK indirilecek; su anda boyle bir run/APK mevcut degildir. [GitHub secrets belgesi](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions) dogrudan `if: secrets.KEY` kullanimini desteklemez.

## 6. Kritik acik karar

Uygulama **Google Play uzerinden mi**, yoksa **GitHub'dan dogrudan APK** olarak mi dagitilacak? Bu secim, kurulur/guncellenir/silinir moduller icin Play Feature Delivery ile imzali uygulama-ici paket yaklasimindan hangisinin uygulanabilir oldugunu belirler. Varsayilan olarak once cevrimdisi yerlesik araclar ve GitHub debug APK gelistirilecek.
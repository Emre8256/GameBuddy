# GameBuddy - Oyuncu Eşleşme Platformu

GameBuddy, ortak oyun zevklerine sahip oyuncuların birbirlerini keşfetmesini ve iletişim kurmasını sağlayan mobil odaklı bir sosyal platformdur. 

## Proje Bileşenleri
Bu proje iki ana bileşenden oluşmaktadır:
- **gamebuddy-backend**: Java, Spring Boot, Spring Security (JWT), Spring Data JPA ve MySQL kullanılarak geliştirilmiş RESTful API katmanı.
- **gamebuddy-mobile**: React Native (TypeScript), React Navigation ve Axios kullanılarak geliştirilmiş mobil arayüz.

## Gereksinimler
Sistemi yerel makinenizde çalıştırabilmek için aşağıdaki yazılımların kurulu olması gereklidir:
- Java 17 (veya üzeri)
- Node.js (v18+)
- MySQL (v8.0+)
- Android Studio / Emulator (Mobil uygulamayı test etmek için)

## Kurulum ve Çalıştırma Adımları

### 1. Veritabanı (MySQL) Hazırlığı
MySQL sunucunuzu başlatın ve proje için gerekli olan veritabanını oluşturun:
```sql
CREATE DATABASE gamebuddy_db;
```
> **Not:** `gamebuddy-backend/src/main/resources/application.properties` dosyasında veritabanı kullanıcı adınızın (`root`) ve şifrenizin (`root`) sisteminizle uyuştuğundan emin olun. Sisteme otomatik olarak örnek kullanıcılar eklenmesi için `data.sql` dosyası yapılandırılmıştır.

### 2. Backend'i Çalıştırma
Spring Boot projesinin bulunduğu klasöre gidin ve projeyi ayağa kaldırın:
```bash
cd gamebuddy-backend
mvn spring-boot:run
```
*(Uygulama varsayılan olarak `http://localhost:8080` adresinde çalışacaktır.)*

### 3. Frontend'i (Mobil Uygulama) Çalıştırma
React Native klasörüne gidin, bağımlılıkları yükleyin ve uygulamayı Android emülatörünüzde başlatın:
```bash
cd gamebuddy-mobile
npm install
npx expo run --web
```
*(Alternatif olarak Metro bundler'ı başlatmak için `npm start` kullanabilirsiniz.)*

## Test ve Örnek Veriler (Seed Data)
Backend ilk kez çalıştırıldığında, veritabanınıza otomatik olarak 3 sahte oyuncu (SniperPro, RushB_NoStop, HealerMain) eklenecektir. 

Bu oyuncularla giriş yapmak isterseniz, e-postaları ve şifreleri şu şekildedir:
- **E-posta**: sniper@gamebuddy.com, rush@gamebuddy.com, healer@gamebuddy.com
- **Şifre**: `123456` (Tümü için geçerlidir)

Kendi hesabınızı uygulamadan `Kayıt Ol` adımından oluşturabilir ve bu sahte kullanıcılarla eşleşip onlara mesaj gönderebilirsiniz! İyi oyunlar!

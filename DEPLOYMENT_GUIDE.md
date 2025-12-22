# 🚀 배포 가이드 (종합)

## 📋 배포 전 체크리스트

### ✅ 1. app.json 설정 확인

**현재 설정:**
- 버전: `1.0.0`
- Android Package: `com.onsol.petconstitutionmobile` ✅
- iOS Bundle ID: `com.onsol.petconstitutionmobile` ✅
- 앱 이름: `온솔 반려동물 체질 검사`

**확인 사항:**
- [x] Android package name 설정 완료 ✅
- [x] 버전 번호 확인 (`1.0.0` - 첫 배포) ✅
- [x] EAS projectId 확인 ✅

---

### ✅ 2. 패키지명 관리

**현재:** `com.onsol.petconstitutionmobile`

**버전 관리:**
- `1.0.0` → `1.0.1`: 버그 수정
- `1.0.0` → `1.1.0`: 새 기능 추가
- `1.0.0` → `2.0.0`: 대규모 변경

**주의:** 패키지명은 한 번 설정하면 변경 불가!

---

### ✅ 3. 보안 확인

- [x] Service Role Key는 Edge Functions에서만 사용 ✅
- [x] Anon Key만 클라이언트에 노출 ✅
- [x] 민감한 정보 Git 커밋 안 됨 ✅
- [x] 콘솔 로그 `__DEV__` 조건부 처리 완료 ✅

---

### ✅ 4. 아이콘/스플래시 이미지

- [x] 모든 아이콘 파일 존재 확인 ✅
- [x] 스플래시 이미지 확인 ✅

---

## 🏗️ 로컬 빌드 방법 (EAS 없이)

### Android 빌드

#### Debug 빌드 (테스트용 - 권장)
```bash
# 1. 네이티브 코드 생성 (app.json 변경 시)
npx expo prebuild --platform android --clean

# 2. Debug APK 빌드 (키스토어 불필요)
cd android
gradlew.bat assembleDebug

# 3. APK 위치
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### Release 빌드 (배포용)
```bash
# 키스토어 필요 (Google Play 배포 시)
cd android
gradlew.bat assembleRelease
```

#### 빌드 + 설치 + 실행
```bash
npx expo run:android
```

---

### iOS 빌드 (MacBook 필요)

```bash
# 1. 네이티브 코드 생성
npx expo prebuild --platform ios

# 2. Xcode에서 Archive
open ios/petconstitutionmobile.xcworkspace
# Xcode에서 Product → Archive
```

---

## 🔐 키스토어/인증서

### Android 키스토어
- **Debug 빌드**: 키스토어 불필요 ✅
- **Release 빌드**: 키스토어 필요 (Google Play 배포 시)
- **테스트만 할 경우**: Debug 빌드로 충분

### iOS 인증서
- **Xcode 자동 처리** ✅
- **테스트**: 무료 Apple ID로 가능
- **배포**: Apple Developer 계정 필요 ($99/년)

---

## 🧪 테스트 방법

### 1단계: 개발 빌드로 테스트 (권장)
```bash
# 개발 서버 실행
npx expo start
```

### 2단계: Debug 빌드로 테스트
```bash
cd android
gradlew.bat assembleDebug
# APK 설치 후 테스트
```

### 3단계: 프로덕션 빌드로 최종 확인
```bash
cd android
gradlew.bat assembleRelease
```

---

## 🔧 문제 해결

### APK 설치 오류
```bash
# 1. adb 재시작
adb kill-server
adb start-server

# 2. 기기 잠금 해제 확인
# 3. USB 디버깅 권한 확인
# 4. 기존 앱 제거 (선택사항)
adb uninstall com.bjooyoung.petconstitutionmobile.dev
```

### Java 오류
- Java 17 이상 필요
- `java -version`으로 확인

### 빌드 실패
```bash
cd android
gradlew.bat clean
cd ..
npx expo prebuild --platform android --clean
```

---

## 📱 테스트 항목

- [ ] 로그인/회원가입
- [ ] 게스트 모드 진단
- [ ] 결과 저장
- [ ] 이미지 저장
- [ ] 이메일 전송
- [ ] 상담 문의
- [ ] OAuth 로그인 (카카오/구글)

---

## 🚀 배포 명령어 요약

### Android
```bash
# Debug 빌드 (테스트용)
cd android && gradlew.bat assembleDebug

# Release 빌드 (배포용)
cd android && gradlew.bat assembleRelease

# 빌드 + 설치 + 실행
npx expo run:android
```

### iOS (MacBook)
```bash
# 네이티브 코드 생성
npx expo prebuild --platform ios

# Xcode에서 Archive
open ios/petconstitutionmobile.xcworkspace
```

---

## 📝 배포 후 확인

- [ ] 앱스토어/플레이스토어 제출
- [ ] 프로덕션 환경 테스트
- [ ] 에러 모니터링 설정

---

## 💡 빠른 참조

**테스트만 할 경우:**
- Debug 빌드 사용 (키스토어 불필요)
- `npx expo start` 또는 `gradlew.bat assembleDebug`

**배포할 경우:**
- Release 빌드 + 키스토어 생성
- Google Play/App Store 제출

---

## 🚀 프로덕션 배포 가이드 (상세)

### 📱 Android 배포 (Google Play)

#### 1단계: Android 키스토어 생성

**키스토어란?**
- 앱 서명에 사용되는 인증서 파일
- Google Play에 앱을 업로드하려면 필수
- **한 번 생성하면 영구 보관 필수!** (분실 시 앱 업데이트 불가)

**생성 방법:**

```bash
# 1. android/app 폴더로 이동
cd android/app

# 2. 키스토어 생성 (keytool 명령어 사용)
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000

# 3. 정보 입력 (예시)
# - 키스토어 비밀번호: (안전한 비밀번호 입력, 기록 필수!)
# - 이름: 온솔
# - 조직 단위: 개발팀
# - 조직: 온솔
# - 도시: 서울
# - 시/도: 서울
# - 국가 코드: KR
# - 별칭 비밀번호: (키스토어 비밀번호와 동일하거나 다르게 설정)
```

**⚠️ 중요:**
- 키스토어 파일(`release.keystore`)과 비밀번호를 **안전한 곳에 백업**
- 분실 시 앱 업데이트 불가능 → 새 앱으로 등록해야 함
- 키스토어 파일은 Git에 커밋하지 말 것! (`.gitignore`에 추가)

#### 2단계: 키스토어 설정 (Gradle)

**`android/gradle.properties` 파일에 추가:**

```properties
# 키스토어 설정
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=release
MYAPP_RELEASE_STORE_PASSWORD=여기에_키스토어_비밀번호
MYAPP_RELEASE_KEY_PASSWORD=여기에_별칭_비밀번호
```

**⚠️ 보안 주의:**
- `gradle.properties`는 Git에 커밋하지 말 것!
- `.gitignore`에 `gradle.properties` 추가 또는
- 환경 변수로 관리 (권장)

**환경 변수 사용 (권장):**
```bash
# Windows PowerShell
$env:MYAPP_RELEASE_STORE_PASSWORD="비밀번호"
$env:MYAPP_RELEASE_KEY_PASSWORD="비밀번호"

# 또는 .env 파일 사용 (react-native-dotenv 등)
```

**`android/app/build.gradle` 확인:**

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

#### 3단계: Release APK 빌드

```bash
# android 폴더로 이동
cd android

# Release APK 빌드
.\gradlew.bat assembleRelease

# 빌드된 APK 위치
# android/app/build/outputs/apk/release/app-release.apk
```

**또는 AAB (Android App Bundle) 빌드 (권장):**
```bash
# AAB는 Google Play에서 권장하는 형식
.\gradlew.bat bundleRelease

# 빌드된 AAB 위치
# android/app/build/outputs/bundle/release/app-release.aab
```

#### 4단계: Google Play Console 설정

**1. Google Play Console 접속**
- https://play.google.com/console 접속
- Google Play Console 계정 생성 ($25 일회성 등록비)

**2. 앱 생성**
- "앱 만들기" 클릭
- 앱 이름: `온솔 반려동물 체질 검사`
- 기본 언어: 한국어
- 앱 또는 게임: 앱
- 무료 또는 유료: 무료

**3. 스토어 등록정보 작성**
- 앱 아이콘 업로드
- 기능 그래픽 (스크린샷 2장 이상)
- 짧은 설명 (80자)
- 전체 설명 (4000자)
- 카테고리: 건강/운동 또는 기타
- 연락처 정보

**4. 콘텐츠 등급 설정**
- 설문 작성 (앱 내용에 따라)

**5. 앱 액세스 권한**
- 개인정보처리방침 URL (필수)
- 데이터 보안 섹션 작성

#### 5단계: 앱 업로드

**1. 프로덕션 트랙 선택**
- Google Play Console → 프로덕션 → 새 버전 만들기

**2. AAB 파일 업로드**
- `app-release.aab` 파일 업로드
- 또는 APK 업로드 (AAB 권장)

**3. 출시 노트 작성**
- 예: "첫 번째 버전 출시"

**4. 검토 제출**
- "검토를 위해 출시" 클릭
- 검토 완료까지 보통 1-3일 소요

---

### 🍎 iOS 배포 (App Store)

#### 1단계: Apple Developer 계정

**필수 요구사항:**
- Apple Developer Program 가입 ($99/년)
- MacBook (Xcode 필요)
- iOS 기기 (테스트용)

**가입 방법:**
1. https://developer.apple.com 접속
2. Apple Developer Program 가입
3. 결제 및 승인 대기 (보통 1-2일)

#### 2단계: Xcode 프로젝트 설정

**⚠️ 참고:** 승인 대기 중에도 아래 작업은 가능합니다. 다만 Signing 설정은 개발자 계정 승인 후에만 가능합니다.

```bash
# 1. 네이티브 코드 생성 (승인 대기 중에도 가능)
npx expo prebuild --platform ios

# 2. Xcode에서 열기
open ios/petconstitutionmobile.xcworkspace
```

**Xcode에서 설정:**

**승인 대기 중 가능한 작업:**
1. **General** 탭
   - Version: `1.0.0`
   - Build: `1`
   - Bundle Identifier: `com.onsol.petconstitutionmobile` 확인

**승인 완료 후 필수 작업:**
2. **Signing & Capabilities** 탭
   - Team: Apple Developer 계정 선택 (승인 후에만 드롭다운에 표시됨)
   - Automatically manage signing 체크

#### 3단계: Archive 생성

**Xcode에서:**
1. 상단 메뉴: **Product → Destination → Any iOS Device**
2. **Product → Archive** 클릭
3. Archive 완료 대기
4. Organizer 창에서 Archive 확인

#### 4단계: App Store Connect 설정

**1. App Store Connect 접속**
- https://appstoreconnect.apple.com
- 앱 정보 → "+" 클릭 → 새 앱

**2. 앱 정보 입력**
- 이름: `온솔 반려동물 체질 검사`
- 기본 언어: 한국어
- Bundle ID: `com.onsol.petconstitutionmobile`
- SKU: 고유 식별자 (예: `pet-constitution-001`)

**3. 앱 스토어 정보 작성**
- 스크린샷 (필수)
- 앱 설명
- 키워드
- 카테고리
- 개인정보처리방침 URL

#### 5단계: 앱 업로드

**Xcode Organizer에서:**
1. Archive 선택
2. "Distribute App" 클릭
3. "App Store Connect" 선택
4. "Upload" 선택
5. 자동 서명 선택
6. 업로드 완료 대기

**또는 명령어로:**
```bash
# Xcode에서 Archive 후
xcrun altool --upload-app --type ios --file "앱경로.ipa" --apiKey "API_KEY" --apiIssuer "ISSUER_ID"
```

#### 6단계: 제출 및 검토

**App Store Connect에서:**
1. 빌드 선택
2. "검토를 위해 제출" 클릭
3. 검토 완료까지 보통 1-3일 소요

---

## 📋 배포 체크리스트

### Android
- [ ] 키스토어 생성 및 안전한 곳에 백업
- [ ] `gradle.properties`에 키스토어 정보 설정
- [ ] Release APK/AAB 빌드 성공
- [ ] Google Play Console 앱 생성
- [ ] 스토어 등록정보 작성 완료
- [ ] 개인정보처리방침 URL 준비
- [ ] 스크린샷 준비 (최소 2장)
- [ ] AAB 파일 업로드
- [ ] 검토 제출

### iOS
- [ ] Apple Developer 계정 가입 ($99/년)
- [ ] Xcode에서 Signing 설정 완료
- [ ] Archive 생성 성공
- [ ] App Store Connect 앱 생성
- [ ] 앱 스토어 정보 작성 완료
- [ ] 개인정보처리방침 URL 준비
- [ ] 스크린샷 준비 (다양한 기기 크기)
- [ ] 빌드 업로드
- [ ] 검토 제출

---

## ⚠️ 중요 주의사항

### 키스토어 관리
- **키스토어 파일과 비밀번호는 반드시 백업!**
- 분실 시 앱 업데이트 불가능
- Git에 커밋하지 말 것
- 팀원과 안전하게 공유 (1Password, LastPass 등)

### 버전 관리
- 앱 업데이트 시 `app.json`의 `version` 증가
- Android: `versionCode` 자동 증가 (EAS 사용 시)
- iOS: `build` 번호 증가

### 개인정보처리방침
- Google Play와 App Store 모두 필수
- 웹사이트에 호스팅 필요
- 앱에서 수집하는 데이터 명시

### 테스트
- 프로덕션 빌드로 최종 테스트 필수
- 모든 기능 동작 확인
- OAuth 로그인 테스트
- 이메일 전송 테스트





# 🚀 프로덕션 배포 전 체크리스트

> **📖 상세 가이드:** `DEPLOYMENT_GUIDE.md` 참고

## ✅ 1. app.json 설정 확인

### 현재 설정:
- **버전**: `1.0.0`
- **Android Package**: `com.bjooyoung.petconstitutionmobile.dev` ⚠️ **.dev 제거 필요**
- **iOS Bundle ID**: `com.bjooyoung.petconstitutionmobile` ✅
- **앱 이름**: `반려동물 체질진단`

### 확인 사항:
- [ ] Android package name에서 `.dev` 제거 여부 결정
  - 개발용: `com.bjooyoung.petconstitutionmobile.dev` (현재)
  - 프로덕션: `com.bjooyoung.petconstitutionmobile`
- [ ] 버전 번호 증가 (`1.0.0` → `1.0.1` 또는 `1.1.0`)
- [ ] EAS projectId 확인: `920da7a1-7f23-42ac-ba0d-144194d01305`

---

## ✅ 2. 아이콘 및 스플래시 이미지 확인

### 확인된 파일:
- ✅ `assets/icon.png` (Android 기본 아이콘)
- ✅ `assets/icon-ios.png` (iOS 아이콘)
- ✅ `assets/adaptive-icon.png` (Android 적응형 아이콘)
- ✅ `assets/splash.png` (Android 스플래시)
- ✅ `assets/splash-ios.png` (iOS 스플래시)
- ✅ `assets/splash-icon.png`

### 확인 사항:
- [ ] 모든 아이콘 이미지가 최신 버전인지 확인
- [ ] 스플래시 이미지가 올바른지 확인

---

## ✅ 3. API 엔드포인트 확인

### 현재 설정:
```typescript
API_BASE_URL = 'https://xpeyzdvtzdtzxxsgcsyf.supabase.co/functions/v1'
SUPABASE_URL = 'https://xpeyzdvtzdtzxxsgcsyf.supabase.co'
```

### 확인 사항:
- [x] 프로덕션 Supabase URL 사용 중 ✅
- [ ] Supabase Edge Functions 모두 배포 완료 확인
  - [ ] `auth-me`
  - [ ] `auth-login`
  - [ ] `auth-register`
  - [ ] `auth-find-id`
  - [ ] `auth-find-password`
  - [ ] `auth-withdraw`
  - [ ] `results-save`
  - [ ] `generate-result-image`
  - [ ] `email-send`
  - [ ] `consultation-save`
  - [ ] `consultations-get`
  - [ ] `my-results-get`
  - [ ] `users-get`
  - [ ] `user-detail`
  - [ ] `consultations-update`

---

## ✅ 4. OAuth 리다이렉트 URL 확인

### 현재 설정:
- **카카오/구글 로그인**: `petconstitution://auth/callback`
- **Supabase OAuth URL**: `https://xpeyzdvtzdtzxxsgcsyf.supabase.co/auth/v1/authorize`

### 확인 사항:
- [ ] Supabase 대시보드에서 OAuth 리다이렉트 URL 등록 확인
  - `petconstitution://auth/callback` (모바일)
  - 웹용 URL (필요시)
- [ ] 카카오/구글 OAuth 앱 설정에서 리다이렉트 URL 등록 확인

---

## ✅ 5. 콘솔 로그 정리

### 현재 상태:
- ✅ `api.ts`의 콘솔 로그를 `__DEV__` 조건부 처리 완료
- ✅ `LoginScreen.tsx`의 디버그 로그를 `__DEV__` 조건부 처리 완료
- ✅ 민감한 정보(토큰 등) 로그 제거 완료

### 확인 사항:
- [x] 프로덕션 빌드에서 콘솔 로그 제거 또는 조건부 처리 ✅
- [x] 민감한 정보(토큰, 사용자 정보) 로그 제거 확인 ✅

---

## ✅ 6. EAS 빌드 설정 확인

### 현재 설정 (`eas.json`):
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### 확인 사항:
- [x] production 프로파일 설정 확인 ✅
- [ ] Android 키스토어 설정 확인 (로컬 빌드 시 선택사항)
  - **Debug 빌드**: 키스토어 불필요 ✅
  - **Release 빌드 (배포용)**: 키스토어 필요 (Google Play 배포 시)
  - **테스트만 할 경우**: Debug 빌드로 충분
- [ ] iOS 인증서 및 프로비저닝 프로파일 확인 (로컬 빌드 시 선택사항)
  - **MacBook에서 Xcode 사용**: Xcode가 자동으로 처리
  - **App Store 배포 시**: Apple Developer 계정 필요 ($99/년)
  - **테스트만 할 경우**: 무료 Apple ID로 가능

---

## ✅ 7. Supabase 설정 확인

### 확인 사항:
- [ ] JWT 만료 시간 설정 (권장: 7일 = 604800초)
- [ ] Refresh Token 설정 확인
- [ ] RLS (Row Level Security) 정책 확인
- [ ] Edge Functions 환경 변수 확인:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `GMAIL_REFRESH_TOKEN`
  - [ ] `GMAIL_CLIENT_ID`
  - [ ] `GMAIL_CLIENT_SECRET`
  - [ ] `GMAIL_USER`

---

## ✅ 8. 보안 확인

### 확인 사항:
- [x] API 키가 코드에 하드코딩되어 있지 않은지 확인 ✅
  - ⚠️ Anon Key는 하드코딩되어 있지만 안전함 (클라이언트 노출 가능)
  - ✅ Service Role Key는 하드코딩되지 않음
- [x] Service Role Key는 Edge Functions에서만 사용되는지 확인 ✅
  - ✅ 모바일 앱 코드에서 사용되지 않음
  - ✅ Edge Functions에서만 환경 변수로 사용됨
- [x] Anon Key만 클라이언트에 노출되는지 확인 ✅
  - ✅ Anon Key만 모바일 앱에 사용됨
  - ✅ Service Role Key는 서버 사이드에서만 사용됨
- [x] 민감한 정보가 Git에 커밋되지 않았는지 확인 ✅
  - ✅ `.gitignore`에 키스토어, 인증서 파일 제외됨
  - ✅ 환경 변수 파일 (`.env*.local`) 제외됨
  - ⚠️ Anon Key는 코드에 포함되어 있지만 안전함

**상세 보고서:** `SECURITY_CHECK_REPORT.md` 참고

---

## ✅ 9. 테스트 확인

### 테스트 빌드 방법

**권장 순서:**
1. **개발 빌드로 먼저 테스트** (빠르고 수정 용이)
   ```bash
   # 개발 서버 실행
   npx expo start
   # 또는 개발 빌드 앱에서 테스트
   ```
2. **프로덕션 빌드로 최종 확인** (실제 배포 환경과 동일)
   ```bash
   # Android Debug 빌드 (테스트용)
   cd android
   gradlew.bat assembleDebug
   
   # 또는 Release 빌드 (최종 확인)
   gradlew.bat assembleRelease
   ```

### 확인 사항:
- [ ] 로그인/회원가입 테스트
  - 개발 빌드: ✅ 먼저 테스트
  - 프로덕션 빌드: ✅ 최종 확인
- [ ] 게스트 모드 진단 테스트
  - 개발 빌드: ✅ 먼저 테스트
  - 프로덕션 빌드: ✅ 최종 확인
- [ ] 결과 저장 테스트
  - 개발 빌드: ✅ 먼저 테스트
  - 프로덕션 빌드: ✅ 최종 확인
- [ ] 이미지 저장 테스트
  - 개발 빌드: ✅ 먼저 테스트
  - 프로덕션 빌드: ✅ 최종 확인
- [ ] 이메일 전송 테스트
  - 개발 빌드: ✅ 먼저 테스트
  - 프로덕션 빌드: ✅ 최종 확인
- [ ] 상담 문의 테스트
  - 개발 빌드: ✅ 먼저 테스트
  - 프로덕션 빌드: ✅ 최종 확인
- [ ] OAuth 로그인 (카카오/구글) 테스트
  - 개발 빌드: ✅ 먼저 테스트
  - 프로덕션 빌드: ✅ 최종 확인 (중요!)

**💡 팁:**
- 개발 빌드로 대부분의 기능 테스트 가능
- 프로덕션 빌드는 최종 확인용 (특히 OAuth 로그인)

---

## ✅ 10. 빌드 전 최종 확인

### 확인 사항:
- [ ] `git status`로 변경사항 확인
- [ ] `.gitignore`에 민감한 파일 제외 확인
- [ ] `package.json` 의존성 최신 버전 확인
- [ ] `npm install` 최신 상태 확인

---

## 🚀 배포 명령어

### Android 프로덕션 빌드:
```bash
eas build --platform android --profile production
```

### iOS 프로덕션 빌드:
```bash
eas build --platform ios --profile production
```

### 양쪽 모두:
```bash
eas build --platform all --profile production
```

---

## 📝 배포 후 확인 사항

- [ ] 앱스토어/플레이스토어 제출
- [ ] 테스트 플라이트/내부 테스트 배포 확인
- [ ] 프로덕션 환경에서 주요 기능 테스트
- [ ] 에러 모니터링 설정 (필요시)


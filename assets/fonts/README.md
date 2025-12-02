# NanumSquare 폰트 설정 가이드

React Native 앱에서 NanumSquare 폰트를 사용하려면 폰트 파일을 이 폴더에 추가해야 합니다.

## 폰트 파일 다운로드

1. 다음 링크에서 NanumSquare 폰트를 다운로드하세요:
   - https://github.com/moonspam/NanumSquare
   - 또는 https://hangeul.naver.com/2017/nanum 에서 다운로드

2. 필요한 폰트 파일:
   - `NanumSquareR.ttf` (Regular)
   - `NanumSquareB.ttf` (Bold)
   - `NanumSquareEB.ttf` (ExtraBold)
   - `NanumSquareL.ttf` (Light)

3. 다운로드한 폰트 파일을 이 폴더(`assets/fonts/`)에 복사하세요.

## 폰트 활성화

폰트 파일을 추가한 후, `App.tsx` 파일의 `useFonts` 훅에서 주석을 해제하세요:

```typescript
const [fontsLoaded] = useFonts({
  'NanumSquare': require('./assets/fonts/NanumSquareR.ttf'),
  'NanumSquareBold': require('./assets/fonts/NanumSquareB.ttf'),
  'NanumSquareExtraBold': require('./assets/fonts/NanumSquareEB.ttf'),
  'NanumSquareLight': require('./assets/fonts/NanumSquareL.ttf'),
});
```

## 앱 재시작

폰트 파일을 추가한 후에는 앱을 완전히 재시작해야 합니다:
- Expo: `npx expo start --clear`
- 또는 앱을 완전히 종료하고 다시 실행

## 참고

- 웹 버전은 CDN을 통해 자동으로 폰트가 로드됩니다.
- 네이티브 앱(iOS/Android)에서는 로컬 폰트 파일이 필요합니다.










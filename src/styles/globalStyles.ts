import { StyleSheet, Platform } from 'react-native';
import { scale, verticalScale, moderateScale } from '../utils/scale';

// 색상 팔레트
export const colors = {
  primary: '#667eea',
  secondary: '#764ba2',
  background: '#f5f5f5',
  white: '#ffffff',
  black: '#333333',
  gray: '#666666',
  lightGray: '#e9ecef',
  success: '#28a745',
  error: '#dc3545',
  warning: '#ffc107',
};

// 폰트 설정
// 웹: CDN으로 로드된 NanumSquare 사용
// 네이티브: 굵기별 폰트 파일 사용
export const fonts = {
  light: Platform.select({
    web: 'NanumSquare',
    ios: 'NanumSquareNeo-aLt',
    android: 'NanumSquareNeo-aLt',
    default: undefined,
  }) || undefined,
  regular: Platform.select({
    web: 'NanumSquare',
    ios: 'NanumSquareNeo-bRg',
    android: 'NanumSquareNeo-bRg',
    default: undefined,
  }) || undefined,
  bold: Platform.select({
    web: 'NanumSquare',
    ios: 'NanumSquareNeo-cBd',
    android: 'NanumSquareNeo-cBd',
    default: undefined,
  }) || undefined,
  extraBold: Platform.select({
    web: 'NanumSquare',
    ios: 'NanumSquareNeo-dEb',
    android: 'NanumSquareNeo-dEb',
    default: undefined,
  }) || undefined,
  heavy: Platform.select({
    web: 'NanumSquare',
    ios: 'NanumSquareNeo-eHv',
    android: 'NanumSquareNeo-eHv',
    default: undefined,
  }) || undefined,
  default: Platform.select({
    web: 'NanumSquare',
    ios: 'NanumSquareNeo-bRg',
    android: 'NanumSquareNeo-bRg',
    default: undefined,
  }) || undefined,
};

// fontWeight에 따라 적절한 폰트 반환
export const getFontFamily = (fontWeight?: string | number) => {
  if (Platform.OS === 'web') {
    return fonts.default;
  }
  
  const weight = typeof fontWeight === 'string' 
    ? fontWeight.toLowerCase()
    : fontWeight?.toString();
  
  if (weight === '300' || weight === 'light') {
    return fonts.light;
  } else if (weight === '700' || weight === 'bold') {
    return fonts.bold;
  } else if (weight === '800' || weight === 'extraBold' || weight === 'extrabold') {
    return fonts.extraBold;
  } else if (weight === '900' || weight === 'heavy') {
    return fonts.heavy;
  }
  
  return fonts.regular; // 기본값
};

// 폰트 크기 (스케일링 적용, 앱 시작 시 한 번만 계산)
export const fontSizes = {
  small: scale(12),
  medium: scale(16),
  large: scale(20),
  xlarge: scale(24),
  xxlarge: scale(32),
};

// 공통 스타일 (앱 시작 시 한 번만 생성, 고정값)
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: scale(20),
    paddingBottom: scale(40), // 하단 패딩 추가
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: scale(20),
  },
  title: {
    fontSize: fontSizes.xxlarge,
    fontWeight: 'bold',
    color: colors.black,
    textAlign: 'center',
    marginBottom: scale(20),
    fontFamily: fonts.default,
  },
  subtitle: {
    fontSize: fontSizes.large,
    fontWeight: '600',
    color: colors.black,
    textAlign: 'center',
    marginBottom: scale(15),
    fontFamily: fonts.default,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(30),
    borderRadius: scale(25),
    alignItems: 'center',
    marginVertical: verticalScale(10),
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSizes.medium,
    fontWeight: '600',
    fontFamily: fonts.default,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: scale(10),
    padding: scale(15),
    fontSize: fontSizes.medium,
    backgroundColor: colors.white,
    marginVertical: verticalScale(10),
    fontFamily: fonts.default,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: scale(15),
    padding: scale(20),
    marginVertical: verticalScale(10),
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(3.84),
    elevation: 5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scale(40), // ScrollView 하단 패딩
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  keyboardScrollView: {
    flex: 1,
  },
  // 기본 텍스트 스타일 (모든 Text에 적용)
  defaultText: {
    fontFamily: fonts.default,
  },
});

// 전역 텍스트 스타일 헬퍼 (모든 스타일에 쉽게 추가 가능)
export const getTextStyle = (customStyle?: any) => ({
  fontFamily: fonts.default,
  ...customStyle,
});

// 스케일 함수 export (다른 파일에서도 사용 가능)
export { scale, verticalScale, moderateScale };

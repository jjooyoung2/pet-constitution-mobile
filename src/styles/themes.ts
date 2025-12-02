import { StyleSheet } from 'react-native';
import { colors, fontSizes } from './globalStyles';

// 라이트 테마
export const lightTheme = {
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e9ecef',
  },
  fontSizes: {
    small: 12,
    medium: 16,
    large: 20,
    xlarge: 24,
    xxlarge: 32,
  },
};

// 다크 테마
export const darkTheme = {
  colors: {
    primary: '#8b5cf6',
    secondary: '#a855f7',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#b3b3b3',
    border: '#404040',
  },
  fontSizes: {
    small: 12,
    medium: 16,
    large: 20,
    xlarge: 24,
    xxlarge: 32,
  },
};

// 현재 테마 (나중에 설정에서 변경 가능)
export const currentTheme = lightTheme;

// 테마 기반 스타일 생성 함수
export const createThemedStyles = (theme: typeof lightTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  text: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.medium,
  },
  textSecondary: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.medium,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSizes.medium,
    fontWeight: '600',
  },
});

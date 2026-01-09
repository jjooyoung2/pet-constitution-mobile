import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, fonts, getFontFamily } from '../styles/globalStyles';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';

interface LoginScreenProps {
  navigation: StackNavigationProp<any>;
  route: any;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  onRegister: (email: string, password: string, nickname?: string) => Promise<{ success: boolean; message?: string }>;
  onFindId?: (email: string) => Promise<{ success: boolean; message?: string }>;
  onFindPassword?: (email: string) => Promise<{ success: boolean; message?: string }>;
  onOAuthCallback?: (url: string) => Promise<void>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, route, onLogin, onRegister, onFindId, onFindPassword, onOAuthCallback }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(route.params?.isRegisterMode || false);
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current; // 시작 위치를 화면 아래로
  const oauthTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true); // 마운트 상태 추적

  useEffect(() => {
    isMountedRef.current = true;
    // 모달이 나타날 때 애니메이션
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
    
    // 딥링크 리스너: OAuth 콜백이 돌아오면 로딩 상태 해제
    const handleDeepLink = (url: string) => {
      console.log('🔗 LoginScreen: Deep link received:', url);
      if (url.includes('auth/callback') || url.includes('petconstitution://')) {
        console.log('✅ LoginScreen: OAuth callback detected, clearing loading state');
        setIsLoading(false);
        // 타임아웃 클리어
        if (oauthTimeoutRef.current) {
          clearTimeout(oauthTimeoutRef.current);
          oauthTimeoutRef.current = null;
        }
      } else {
        console.log('⚠️ LoginScreen: Deep link received but not an OAuth callback');
      }
    };
    
    const linkingListener = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });
    
    // 앱이 이미 열려있는 상태에서 딥링크 처리
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });
    
    return () => {
      isMountedRef.current = false; // 언마운트 표시
      linkingListener?.remove();
      // 컴포넌트 언마운트 시 OAuth 타임아웃 클리어
      if (oauthTimeoutRef.current) {
        clearTimeout(oauthTimeoutRef.current);
        oauthTimeoutRef.current = null;
      }
    };
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onLogin(email.trim(), password);
      if (result.success) {
        // 결과 페이지에서 온 경우 결과 페이지로 돌아가기
        if (route.params?.returnToResults) {
          // AsyncStorage에도 저장 (일관성 유지)
          await AsyncStorage.setItem('returnToResults', 'true');
          await AsyncStorage.setItem('resultData', JSON.stringify(route.params.resultData));
          // 이전 Results 화면을 대체하여 새로운 Results 화면으로 이동 (로그인 상태 반영)
          navigation.replace('Results', route.params.resultData);
          // AsyncStorage 정리
          AsyncStorage.removeItem('returnToResults');
          AsyncStorage.removeItem('resultData');
        } else {
          navigation.navigate('Start');
        }
      } else {
        Alert.alert('로그인 실패', result.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !nickname.trim()) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await onRegister(email.trim(), password, nickname.trim());
      if (result.success) {
        // 결과 페이지에서 온 경우 결과 페이지로 돌아가기
        if (route.params?.returnToResults) {
          // AsyncStorage에도 저장 (일관성 유지)
          await AsyncStorage.setItem('returnToResults', 'true');
          await AsyncStorage.setItem('resultData', JSON.stringify(route.params.resultData));
          // 이전 Results 화면을 대체하여 새로운 Results 화면으로 이동 (로그인 상태 반영)
          navigation.replace('Results', route.params.resultData);
          // AsyncStorage 정리
          AsyncStorage.removeItem('returnToResults');
          AsyncStorage.removeItem('resultData');
        } else {
          navigation.navigate('Start');
        }
      } else {
        Alert.alert('회원가입 실패', result.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setEmail('');
    setPassword('');
    setNickname('');
  };

  // URL에서 토큰 추출 후 Supabase 세션 설정
  const handleOAuthResult = async (url: string) => {
    try {
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return false;
      
      const hashFragment = url.substring(hashIndex + 1);
      const params = new URLSearchParams(hashFragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      
      if (accessToken && refreshToken) {
        const { supabase } = require('../services/api');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (error) {
          console.error('세션 설정 오류:', error);
          return false;
        }
        console.log('✅ Supabase 세션 설정 완료');
        return true;
      }
      return false;
    } catch (error) {
      console.error('OAuth 결과 처리 오류:', error);
      return false;
    }
  };

  const handleKakaoLogin = async () => {
    console.log('=== 카카오 로그인 시작 ===');
    setIsLoading(true);
    
    try {
      const redirectUrl = 'petconstitution://auth/callback';
      const kakaoLoginUrl = `https://xpeyzdvtzdtzxxsgcsyf.supabase.co/auth/v1/authorize?provider=kakao&redirect_to=${encodeURIComponent(redirectUrl)}&prompt=login`;
      console.log('카카오 로그인 URL:', kakaoLoginUrl);
      
      if (Platform.OS === 'web') {
        window.location.href = kakaoLoginUrl;
      } else {
        // 인앱 브라우저 (Safari View Controller) 사용
        const result = await WebBrowser.openAuthSessionAsync(
          kakaoLoginUrl,
          redirectUrl
        );
        
        console.log('WebBrowser result:', result);
        
        if (result.type === 'success' && result.url) {
          // Supabase 세션 직접 설정 (onAuthStateChange가 처리)
          const success = await handleOAuthResult(result.url);
          if (success) {
            // 로그인 성공 시 모달 닫기 (이전 화면이 있을 때만)
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }
        } else if (result.type === 'cancel') {
          console.log('사용자가 로그인을 취소했습니다.');
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      setIsLoading(false);
      Alert.alert('오류', '카카오 로그인 중 오류가 발생했습니다.');
    }
  };

  const handleGoogleLogin = async () => {
    console.log('=== 구글 로그인 시작 ===');
    setIsLoading(true);
    
    try {
      const redirectUrl = 'petconstitution://auth/callback';
      const googleLoginUrl = `https://xpeyzdvtzdtzxxsgcsyf.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}&prompt=login`;
      console.log('구글 로그인 URL:', googleLoginUrl);
      
      if (Platform.OS === 'web') {
        window.location.href = googleLoginUrl;
      } else {
        // 인앱 브라우저 (Safari View Controller) 사용
        const result = await WebBrowser.openAuthSessionAsync(
          googleLoginUrl,
          redirectUrl
        );
        
        console.log('WebBrowser result:', result);
        
        if (result.type === 'success' && result.url) {
          // Supabase 세션 직접 설정 (onAuthStateChange가 처리)
          const success = await handleOAuthResult(result.url);
          if (success) {
            // 로그인 성공 시 모달 닫기 (이전 화면이 있을 때만)
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }
        } else if (result.type === 'cancel') {
          console.log('사용자가 로그인을 취소했습니다.');
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('구글 로그인 오류:', error);
      setIsLoading(false);
      Alert.alert('오류', '구글 로그인 중 오류가 발생했습니다.');
    }
  };

  // Apple 로그인 (iOS 전용)
  const handleAppleLogin = async () => {
    console.log('=== Apple 로그인 시작 ===');
    setIsLoading(true);
    
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      console.log('Apple credential:', credential);
      
      if (credential.identityToken) {
        // Supabase에 Apple 토큰으로 로그인
        const { supabase } = require('../services/api');
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        
        if (error) {
          console.error('Supabase Apple 로그인 오류:', error);
          Alert.alert('오류', 'Apple 로그인에 실패했습니다.');
        } else {
          console.log('Apple 로그인 성공:', data);
          // 네비게이션 스택 리셋하여 홈으로 이동
          navigation.reset({
            index: 0,
            routes: [{ name: 'Start' }],
          });
        }
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('사용자가 Apple 로그인을 취소했습니다.');
      } else {
        console.error('Apple 로그인 오류:', error);
        Alert.alert('오류', 'Apple 로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 네이버 로그인 제거됨

  const handleFindAccount = () => {
    navigation.navigate('FindAccount', {
      onFindId,
      onFindPassword,
    });
  };


  return (
    <View style={styles.modalContainer}>
      {/* 회색 오버레이 배경 (StartScreen이 보이는 부분) - 즉시 표시 */}
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => {
          // 닫을 때 애니메이션
          Animated.timing(slideAnim, {
            toValue: 300,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            if (navigation.goBack && typeof navigation.goBack === 'function' && navigation.canGoBack()) {
              navigation.goBack();
            }
          });
        }}
      />
      
      {/* 하얀색 모달 컨텐츠 (LoginScreen) - 아래에서 위로 슬라이드 */}
      <Animated.View 
        style={[
          styles.modalContent,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* 하단: 흰색 배경 + 로그인 버튼 */}
        <View style={styles.bottomSection}>
          {/* 카카오 로그인 버튼 */}
          <TouchableOpacity
            style={[styles.socialButton, isLoading && styles.disabledButton]}
            onPress={handleKakaoLogin}
            disabled={isLoading}
          >
            <Image
              source={require('../../assets/images/kakao-icon.png')}
              style={styles.socialButtonIcon}
              resizeMode="contain"
            />
            <Text style={styles.socialButtonText}>카카오 계정으로 시작하기</Text>
          </TouchableOpacity>

          {/* 구글 로그인 버튼 */}
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton, isLoading && styles.disabledButton]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <Image
              source={require('../../assets/images/google-icon.png')}
              style={styles.socialButtonIcon}
              resizeMode="contain"
            />
            <Text style={styles.socialButtonText}>구글 계정으로 시작하기</Text>
          </TouchableOpacity>

          {/* Apple 로그인 버튼 (iOS만) */}
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={scale(15)}
              style={styles.appleButton}
              onPress={handleAppleLogin}
            />
          )}
        </View>
      </Animated.View>

      {/* 숨겨진 이메일/비밀번호 로그인 폼 (로직 유지용) */}
      <View style={styles.hiddenForm}>
        {isRegisterMode && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>닉네임 (아이디)</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임을 입력하세요 (중복체크됨)"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="이메일을 입력하세요"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호를 입력하세요"
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={isRegisterMode ? handleRegister : handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading 
              ? '처리 중...' 
              : isRegisterMode ? '회원가입' : '로그인'
            }
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleMode}
          disabled={isLoading}
        >
          <Text style={styles.toggleButtonText}>
            {isRegisterMode 
              ? '이미 계정이 있으신가요? 로그인하기' 
              : '계정이 없으신가요? 회원가입하기'
            }
          </Text>
        </TouchableOpacity>

        {!isRegisterMode && (
          <TouchableOpacity
            style={styles.findAccountButton}
            onPress={handleFindAccount}
            disabled={isLoading}
          >
            <Text style={styles.findAccountButtonText}>
              아이디/비밀번호 찾기
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0, // BottomNavigation 높이만큼 제외
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSection: {
    paddingTop: scale(140),
    paddingBottom: scale(140),
    paddingHorizontal: scale(160),
    justifyContent: 'flex-start',
  },
  socialButton: {
    backgroundColor: '#f7e31e',
    paddingVertical: scale(55),
    paddingHorizontal: scale(15),
    paddingLeft: scale(80), // 아이콘 공간 확보
    borderRadius: scale(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(100),
    shadowColor: '#cccccc',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    width: '100%',
  },
  socialButtonIcon: {
    width: scale(76),
    height: scale(74),
    position: 'absolute',
    left: scale(50),
    alignSelf: 'center',
  },
  googleButton: {
    backgroundColor: '#eaeaea',
    marginBottom: scale(100),
  },
  appleButton: {
    width: '100%',
    height: scale(140),
  },
  socialButtonText: {
    color: '#0e0e0e',
    fontSize: scale(42),
    textAlign: 'center',
    fontFamily: getFontFamily('extraBold'),
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  // 숨겨진 폼 (로직 유지용)
  hiddenForm: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    opacity: 0,
    height: 0,
    overflow: 'hidden',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: fonts.default,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    fontFamily: fonts.default,
  },
  primaryButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: fonts.default,
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  toggleButtonText: {
    color: '#667eea',
    fontSize: 16,
    textDecorationLine: 'underline',
    fontFamily: fonts.default,
  },
  findAccountButton: {
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 10,
  },
  findAccountButtonText: {
    color: '#667eea',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontFamily: fonts.default,
  },
});

export default LoginScreen;
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
import { scale, fonts, getFontFamily } from '../styles/globalStyles';

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

  useEffect(() => {
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
      linkingListener?.remove();
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

  const handleKakaoLogin = async () => {
    console.log('=== 카카오 로그인 시작 ===');
    setIsLoading(true);
    
    try {
      // 웹과 모바일에서 다른 redirect URL 사용
      let redirectUrl;
      if (Platform.OS === 'web') {
        redirectUrl = `${window.location.origin}/auth/callback`;
      } else {
        // 개발 빌드에서는 커스텀 scheme 사용 (action 파라미터 제거)
        redirectUrl = 'petconstitution://auth/callback';
      }
      
      // prompt=login 파라미터 추가: 강제로 로그인 화면 표시 (이전 세션 무시)
      const kakaoLoginUrl = `https://tbctjhfypfcjextmxaow.supabase.co/auth/v1/authorize?provider=kakao&redirect_to=${encodeURIComponent(redirectUrl)}&prompt=login`;
      console.log('카카오 로그인 URL:', kakaoLoginUrl);
      console.log('Redirect URL:', redirectUrl);
      
      if (Platform.OS === 'web') {
        window.location.href = kakaoLoginUrl;
      } else {
        // Linking으로 열기 (카카오 앱이 있으면 앱으로, 없으면 브라우저로)
        try {
          // URL이 열 수 있는지 확인
          const canOpen = await Linking.canOpenURL(kakaoLoginUrl);
          console.log('Can open Kakao URL:', canOpen);
          
          if (canOpen) {
            console.log('Opening Kakao login URL with Linking...');
            console.log('URL to open:', kakaoLoginUrl);
            
            try {
              console.log('🔗 Attempting to open URL with Linking.openURL...');
              const opened = await Linking.openURL(kakaoLoginUrl);
              console.log('✅ Linking.openURL completed successfully');
              console.log('🔗 Return value:', opened);
              
              // 실제 디바이스에서 브라우저가 열렸는지 확인을 위한 추가 로그
              console.log('📱 Platform:', Platform.OS);
              console.log('📱 Waiting for deep link callback...');
              
              // 타임아웃 설정 (딥링크가 돌아올 때까지 대기)
              if (oauthTimeoutRef.current) {
                clearTimeout(oauthTimeoutRef.current);
              }
              oauthTimeoutRef.current = setTimeout(() => {
                console.log('⏰ OAuth timeout - no deep link received after 30 seconds');
                console.log('⚠️ This might mean:');
                console.log('   1. Browser did not open');
                console.log('   2. Deep link is not configured correctly');
                console.log('   3. Supabase redirect is not working');
                setIsLoading(false);
                Alert.alert(
                  '로그인 시간 초과',
                  '로그인 처리가 완료되지 않았습니다. 브라우저가 열렸는지 확인해주세요.',
                  [{ text: '확인' }]
                );
              }, 30000);
            } catch (linkError) {
              console.error('❌ Failed to open URL with Linking:', linkError);
              setIsLoading(false);
              Alert.alert('오류', '카카오 로그인 페이지를 열 수 없습니다.');
            }
          } else {
            // 직접 브라우저로 열기 시도
            console.log('CanOpenURL returned false, trying to open anyway...');
            try {
              const opened = await Linking.openURL(kakaoLoginUrl);
              console.log('Linking.openURL result (fallback):', opened);
            } catch (openError) {
              console.error('Failed to open URL:', openError);
              setIsLoading(false);
              Alert.alert('오류', '카카오 로그인 페이지를 열 수 없습니다. 브라우저를 확인해주세요.');
            }
          }
        } catch (error) {
          console.error('카카오 로그인 오류:', error);
          setIsLoading(false);
          Alert.alert('오류', '카카오 로그인 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('에러:', error);
      setIsLoading(false);
      Alert.alert('오류', '카카오 로그인 중 오류가 발생했습니다.');
    }
    // finally 블록 제거: 딥링크가 돌아올 때까지 로딩 상태 유지
  };

  const handleGoogleLogin = async () => {
    console.log('=== 구글 로그인 시작 ===');
    setIsLoading(true);
    
    try {
      // 웹과 모바일에서 다른 redirect URL 사용
      let redirectUrl;
      if (Platform.OS === 'web') {
        redirectUrl = `${window.location.origin}/auth/callback`;
      } else {
        // 개발 빌드에서는 커스텀 scheme 사용 (action 파라미터 제거)
        redirectUrl = 'petconstitution://auth/callback';
      }
      
      // prompt=login 파라미터 추가: 강제로 로그인 화면 표시 (이전 세션 무시)
      const googleLoginUrl = `https://tbctjhfypfcjextmxaow.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}&prompt=login`;
      console.log('구글 로그인 URL:', googleLoginUrl);
      console.log('Redirect URL:', redirectUrl);
      
      if (Platform.OS === 'web') {
        window.location.href = googleLoginUrl;
      } else {
        // Linking으로 열기 (구글 앱이 있으면 앱으로, 없으면 브라우저로)
        try {
          // URL이 열 수 있는지 확인
          const canOpen = await Linking.canOpenURL(googleLoginUrl);
          console.log('Can open Google URL:', canOpen);
          
          if (canOpen) {
            console.log('Opening Google login URL with Linking...');
            console.log('URL to open:', googleLoginUrl);
            
            try {
              await Linking.openURL(googleLoginUrl);
              console.log('Linking.openURL completed successfully');
              
              // 타임아웃 설정 (딥링크가 돌아올 때까지 대기)
              if (oauthTimeoutRef.current) {
                clearTimeout(oauthTimeoutRef.current);
              }
              oauthTimeoutRef.current = setTimeout(() => {
                console.log('OAuth timeout - no deep link received after 30 seconds');
                setIsLoading(false);
                Alert.alert(
                  '로그인 시간 초과',
                  '로그인 처리가 완료되지 않았습니다.',
                  [{ text: '확인' }]
                );
              }, 30000);
            } catch (linkError) {
              console.error('Failed to open URL with Linking:', linkError);
              setIsLoading(false);
              Alert.alert('오류', '구글 로그인 페이지를 열 수 없습니다.');
            }
          } else {
            // 직접 브라우저로 열기 시도
            console.log('CanOpenURL returned false, trying to open anyway...');
            try {
              const opened = await Linking.openURL(googleLoginUrl);
              console.log('Linking.openURL result (fallback):', opened);
            } catch (openError) {
              console.error('Failed to open URL:', openError);
              setIsLoading(false);
              Alert.alert('오류', '구글 로그인 페이지를 열 수 없습니다. 브라우저를 확인해주세요.');
            }
          }
        } catch (error) {
          console.error('구글 로그인 오류:', error);
          setIsLoading(false);
          Alert.alert('오류', '구글 로그인 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('에러:', error);
      setIsLoading(false);
      Alert.alert('오류', '구글 로그인 중 오류가 발생했습니다.');
    }
    // finally 블록 제거: 딥링크가 돌아올 때까지 로딩 상태 유지
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
            if (navigation.goBack && typeof navigation.goBack === 'function') {
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
    paddingHorizontal: scale(20),
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
    marginBottom: 0,
  },
  socialButtonText: {
    color: '#0e0e0e',
    fontSize: scale(40),
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
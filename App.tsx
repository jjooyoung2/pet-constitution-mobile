import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Alert, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { User } from './src/types';
import { authAPI, supabase } from './src/services/api';

// Screens
import StartScreen from './src/screens/StartScreen';
import BasicInfoScreen from './src/screens/BasicInfoScreen';
import SurveyScreen from './src/screens/SurveyScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MyPageScreen from './src/screens/MyPageScreen';
import ConsultationScreen from './src/screens/ConsultationScreen';
import FindAccountScreen from './src/screens/FindAccountScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import ResetPasswordCodeScreen from './src/screens/ResetPasswordCodeScreen';
import ManagementMethodsScreen from './src/screens/ManagementMethodsScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import HtmlCaptureScreen from './src/screens/HtmlCaptureScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = useRef<any>(null);

  // 폰트 로드 (웹에서는 CDN 사용, 네이티브에서는 로컬 파일 사용)
  // 웹에서는 require()가 작동하지 않으므로 Platform으로 분기 처리
  const [fontsLoaded] = useFonts(
    Platform.OS === 'web'
      ? {} // 웹에서는 빈 객체 (CDN으로 폰트 로드)
      : {
          // 굵기별 폰트 파일 등록
          'NanumSquareNeo-aLt': require('./assets/fonts/NanumSquareNeo-aLt.ttf'),
          'NanumSquareNeo-bRg': require('./assets/fonts/NanumSquareNeo-bRg.ttf'),
          'NanumSquareNeo-cBd': require('./assets/fonts/NanumSquareNeo-cBd.ttf'),
          'NanumSquareNeo-dEb': require('./assets/fonts/NanumSquareNeo-dEb.ttf'),
          'NanumSquareNeo-eHv': require('./assets/fonts/NanumSquareNeo-eHv.ttf'),
        }
  );

  // 웹에서는 폰트가 CDN으로 로드되므로 항상 true로 처리
  const isFontsReady = Platform.OS === 'web' ? true : fontsLoaded;

  // 폰트 로드 확인 (디버깅용)
  useEffect(() => {
    if (isFontsReady) {
      console.log('✅ Fonts loaded successfully');
    } else {
      console.log('⏳ Loading fonts...');
    }
  }, [isFontsReady]);

  // 앱 시작 시 로그인 상태 확인
  useEffect(() => {
    checkAuthStatus();
    
    // Supabase 세션 변경 리스너 (Apple 로그인 등)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        console.log('🔐 User signed in via Supabase');
        // AsyncStorage에 토큰 저장
        await AsyncStorage.setItem('authToken', session.access_token);
        if (session.refresh_token) {
          await AsyncStorage.setItem('refreshToken', session.refresh_token);
        }
        // 사용자 정보 업데이트
        const response = await authAPI.getMe(session.access_token);
        if (response.success && response.data) {
          setIsLoggedIn(true);
          setUser(response.data.user);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 User signed out');
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
        setIsLoggedIn(false);
        setUser(null);
      }
    });
    
    // OAuth 콜백 처리
    const handleDeepLink = (url: string) => {
      console.log('=== Deep link received ===');
      console.log('Full URL:', url);
      console.log('URL includes "auth/callback":', url.includes('auth/callback'));
      console.log('URL includes "petconstitution://":', url.includes('petconstitution://'));
      console.log('URL includes "exp://":', url.includes('exp://'));
      
      // 비밀번호 재설정 콜백 처리 (먼저 체크)
      if (url.includes('type=recovery') || url.includes('recovery')) {
        console.log('Password recovery callback detected');
        handlePasswordResetCallback(url);
        return;
      }
      
      // 에러 처리
      if (url.includes('error=')) {
        console.log('Error in deep link:', url);
        handleDeepLinkError(url);
        return;
      }
      
      // OAuth 콜백 처리
      // exp:// (Expo Go) 또는 petconstitution:// (개발 빌드) 모두 지원
      if (url.includes('auth/callback') || 
          url.includes('zbwfyuc-anonymous-8081.exp.direct') || 
          url.includes('petconstitution://') ||
          url.includes('exp://')) {
        console.log('✅ OAuth 콜백 감지됨 - handleOAuthCallback 호출');
        handleOAuthCallback(url);
      } else {
        console.log('⚠️ OAuth 콜백이 아닌 딥링크입니다. 처리하지 않습니다.');
      }
    };

    // 딥링크 리스너 등록
    const linkingListener = Linking.addEventListener('url', (event) => {
      console.log('🔗 App.tsx: Linking event received');
      console.log('🔗 Full URL:', event.url);
      console.log('🔗 Platform:', Platform.OS);
      handleDeepLink(event.url);
    });

    // 앱이 이미 열려있는 상태에서 딥링크 처리
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial URL:', url);
        handleDeepLink(url);
      } else {
        console.log('🔗 No initial URL');
      }
    }).catch((error) => {
      console.error('🔗 Error getting initial URL:', error);
    });

    return () => {
      linkingListener?.remove();
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // OAuth 콜백 처리 함수
  // 딥링크 에러 처리
  const handleDeepLinkError = (url: string) => {
    try {
      console.log('Processing deep link error:', url);
      
      // URL에서 에러 정보 추출
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) {
        console.log('No hash fragment found in URL');
        return;
      }
      
      const hashFragment = url.substring(hashIndex + 1);
      console.log('Hash fragment:', hashFragment);
      
      // URL 파라미터 파싱
      const params = new URLSearchParams(hashFragment);
      const error = params.get('error');
      const errorCode = params.get('error_code');
      const errorDescription = params.get('error_description');
      
      console.log('Error:', error);
      console.log('Error code:', errorCode);
      console.log('Error description:', errorDescription);
      
      // 에러 타입에 따라 처리
      if (errorCode === 'otp_expired' || errorDescription?.includes('expired')) {
        console.log('Link expired - showing error message to user');
        // TODO: 사용자에게 링크가 만료되었다는 메시지 표시
        Alert.alert(
          '링크 만료', 
          '비밀번호 재설정 링크가 만료되었습니다. 다시 비밀번호 찾기를 진행해주세요.',
          [{ text: '확인' }]
        );
      }
    } catch (error) {
      console.error('Deep link error processing error:', error);
    }
  };

  // 비밀번호 재설정 콜백 처리
  const handlePasswordResetCallback = async (url: string) => {
    try {
      console.log('Processing password reset callback:', url);
      
      // URL에서 토큰 추출 (해시 프래그먼트 사용)
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) {
        console.log('No hash fragment found in URL');
        return;
      }
      
      const hashFragment = url.substring(hashIndex + 1);
      console.log('Hash fragment:', hashFragment);
      
      // URL 파라미터 파싱
      const params = new URLSearchParams(hashFragment);
      const token = params.get('access_token'); // access_token으로 변경
      const type = params.get('type');
      const redirectTo = params.get('redirect_to');
      
      console.log('Token:', token ? 'Found' : 'Not found');
      console.log('Type:', type);
      console.log('Redirect to:', redirectTo);
      
      if (token && type === 'recovery') {
        // 비밀번호 재설정 화면으로 이동
        console.log('Password reset token received - navigating to ResetPassword');
        
        // JWT에서 이메일 추출 (토큰에 이메일 정보가 포함되어 있음)
        const emailFromToken = params.get('email') || 'user@example.com';
        
        if (navigationRef.current) {
          navigationRef.current.navigate('ResetPassword', {
            resetPasswordToken: token,
            email: emailFromToken
          });
        }
      }
    } catch (error) {
      console.error('Password reset callback error:', error);
    }
  };

  const handleOAuthCallback = async (url: string) => {
    try {
      console.log('=== OAuth 콜백 처리 시작 ===');
      console.log('전체 URL:', url);
      
      // URL 파싱: hash fragment에서 토큰 추출
      // petconstitution://auth/callback#access_token=... 형태 (action 파라미터 제거)
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      let error: string | null = null;
      let errorDescription: string | null = null;
      
      // hash fragment에서 토큰 추출
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
        const hashFragment = url.substring(hashIndex + 1);
        const hashParams = new URLSearchParams(hashFragment);
        accessToken = hashParams.get('access_token');
        refreshToken = hashParams.get('refresh_token');
        error = hashParams.get('error');
        errorDescription = hashParams.get('error_description');
      }
      
      console.log('Access token:', accessToken ? 'Found' : 'Not found');
      console.log('Refresh token:', refreshToken ? 'Found' : 'Not found');
      
      // 에러 처리
      if (error) {
        console.error('OAuth error:', error, errorDescription);
        Alert.alert(
          '로그인 실패',
          errorDescription || '소셜 로그인 중 오류가 발생했습니다.',
          [{ text: '확인' }]
        );
        return;
      }
      
      if (!accessToken) {
        console.log('No access token found in URL');
        Alert.alert('오류', '로그인 토큰을 받지 못했습니다. 다시 시도해주세요.');
        return;
      }
      
      console.log('OAuth tokens received, fetching user info...');
      
      // 사용자 정보 조회 (새로 생성되었는지 확인)
      const response = await authAPI.getMe(accessToken);
      if (response.success && response.data) {
        // 사용자 생성 시간 확인 (24시간 이내면 새 사용자로 간주)
        const isNewUser = response.data.user?.created_at && 
          new Date(response.data.user.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000;
        
        console.log('Is new user:', isNewUser);
        
        // 정상 케이스: 토큰 저장 및 로그인 처리
        await AsyncStorage.setItem('authToken', accessToken);
        if (refreshToken) {
          await AsyncStorage.setItem('refreshToken', refreshToken);
        }
        // OAuth 로그인 성공 플래그 저장 (LoginScreen 타임아웃 방지용)
        await AsyncStorage.setItem('oauthLoginSuccess', 'true');
        
        console.log('OAuth login/signup successful');
        setIsLoggedIn(true);
        setUser(response.data.user);
        
        // returnToResults 확인 (결과 페이지에서 온 경우)
        const returnToResults = await AsyncStorage.getItem('returnToResults');
        const resultDataStr = await AsyncStorage.getItem('resultData');
        
        if (navigationRef.current) {
          // Login 화면이 열려있으면 닫기
          navigationRef.current.goBack();
          
          setTimeout(() => {
            if (navigationRef.current) {
              if (returnToResults === 'true' && resultDataStr) {
                // 결과 페이지로 돌아가기
                const resultData = JSON.parse(resultDataStr);
                // navigationRef에는 replace가 없으므로 navigate 사용
                // Results 화면이 이미 스택에 있으면 그 화면으로 돌아감
                navigationRef.current.navigate('Results', resultData);
                // AsyncStorage 정리
                AsyncStorage.removeItem('returnToResults');
                AsyncStorage.removeItem('resultData');
              } else {
                // Start 화면으로 이동
                navigationRef.current.navigate('Start');
              }
            }
          }, 100);
        }
      } else {
        console.log('Failed to get user info:', response);
        Alert.alert('오류', '사용자 정보를 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      Alert.alert('오류', '로그인 처리 중 오류가 발생했습니다.');
    }
  };

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        console.log('Token found, verifying with server');
        // 서버에서 토큰 검증 및 사용자 정보 조회
        try {
          const response = await authAPI.getMe(token);
          if (response.success && response.data) {
            console.log('Token valid, user authenticated');
            setIsLoggedIn(true);
            setUser(response.data.user);
          } else {
            console.log('Token invalid, clearing storage');
            await AsyncStorage.removeItem('authToken');
            setIsLoggedIn(false);
            setUser(null);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // 토큰 만료 에러인 경우 사용자에게 알림
          if (error.message?.includes('토큰이 만료되었습니다')) {
            console.log('Token expired, logging out user');
          }
          await AsyncStorage.removeItem('authToken');
          setIsLoggedIn(false);
          setUser(null);
        }
      } else {
        console.log('No token found');
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.success && response.data) {
        await AsyncStorage.setItem('authToken', response.data.token);
        setIsLoggedIn(true);
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, message: response.message || '로그인에 실패했습니다.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: '로그인 중 오류가 발생했습니다.' };
    }
  };

  const handleRegister = async (email: string, password: string, nickname?: string) => {
    try {
      const response = await authAPI.register({ email, password, nickname });
      if (response.success && response.data) {
        // 토큰이 있는 경우에만 저장
        if (response.data.token) {
          await AsyncStorage.setItem('authToken', response.data.token);
          setIsLoggedIn(true);
          setUser(response.data.user);
          return { success: true };
        } else {
          // 이메일 확인이 필요한 경우
          return { 
            success: true, 
            message: response.message || '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
            requiresEmailConfirmation: true
          };
        }
      } else {
        return { success: false, message: response.message || '회원가입에 실패했습니다.' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: '회원가입 중 오류가 발생했습니다.' };
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setIsLoggedIn(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleFindId = async (nickname: string) => {
    try {
      const response = await authAPI.findId(nickname);
      if (response.success) {
        return { success: true, message: response.message || '닉네임으로 아이디를 찾았습니다.' };
      } else {
        return { success: false, message: response.message || '아이디를 찾을 수 없습니다.' };
      }
    } catch (error) {
      console.error('Find ID error:', error);
      return { success: false, message: '아이디 찾기 중 오류가 발생했습니다.' };
    }
  };

  const handleFindPassword = async (email: string) => {
    try {
      const response = await authAPI.findPassword(email);
      if (response.success) {
        return { success: true, message: response.message || '등록된 이메일로 비밀번호 재설정 링크를 발송했습니다.' };
      } else {
        return { success: false, message: response.message || '비밀번호를 찾을 수 없습니다.' };
      }
    } catch (error) {
      console.error('Find Password error:', error);
      return { success: false, message: '비밀번호 찾기 중 오류가 발생했습니다.' };
    }
  };

  // 폰트와 인증 상태가 모두 로드될 때까지 대기
  if (isLoading || !isFontsReady) {
    return null; // 로딩 중에는 아무것도 표시하지 않음
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Start"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Start">
          {(props) => (
            <StartScreen
              {...props}
              isLoggedIn={isLoggedIn}
              user={user}
              onLogin={handleLogin}
              onRegister={handleRegister}
              onLogout={handleLogout}
              onFindId={handleFindId}
              onFindPassword={handleFindPassword}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="BasicInfo">
          {(props) => (
            <BasicInfoScreen
              {...props}
              isLoggedIn={isLoggedIn}
              token={null}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Survey">
          {(props) => (
            <SurveyScreen
              {...props}
              isLoggedIn={isLoggedIn}
              token={null}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Results">
          {(props) => {
            const [token, setToken] = useState<string | null>(null);
            
            useEffect(() => {
              if (isLoggedIn) {
                AsyncStorage.getItem('authToken').then(setToken);
              }
            }, [isLoggedIn]);
            
            return (
              <ResultsScreen
                {...props}
                isLoggedIn={isLoggedIn}
                token={token}
                user={user}
              />
            );
          }}
        </Stack.Screen>
        <Stack.Screen name="Login">
          {(props) => (
            <LoginScreen
              {...props}
              onLogin={handleLogin}
              onRegister={handleRegister}
              onFindId={handleFindId}
              onFindPassword={handleFindPassword}
              onOAuthCallback={handleOAuthCallback}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Register">
          {(props) => (
            <RegisterScreen
              {...props}
              onRegister={handleRegister}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="FindAccount">
          {(props) => (
            <FindAccountScreen
              {...props}
              onFindId={handleFindId}
              onFindPassword={handleFindPassword}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="MyPage">
          {(props) => (
            <MyPageScreen
              {...props}
              user={user}
              token={isLoggedIn ? 'token' : null}
              onLogout={handleLogout}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Consultation">
          {(props) => (
            <ConsultationScreen
              {...props}
              isLoggedIn={isLoggedIn}
              token={null}
            />
          )}
        </Stack.Screen>
              <Stack.Screen name="ResetPasswordCode">
                {(props) => (
                  <ResetPasswordCodeScreen
                    {...props}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="ResetPassword">
                {(props) => (
                  <ResetPasswordScreen
                    {...props}
                  />
                )}
              </Stack.Screen>
        <Stack.Screen name="ManagementMethods">
          {(props) => (
            <ManagementMethodsScreen
              {...props}
            />
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="Capture" 
          options={{
            headerShown: false,
            animationEnabled: false, // 빠른 전환을 위해 애니메이션 비활성화
          }}
        >
          {(props) => (
            <CaptureScreen
              {...props}
            />
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="HtmlCapture" 
          options={{
            headerShown: false,
            animationEnabled: false,
          }}
        >
          {(props) => (
            <HtmlCaptureScreen
              {...props}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
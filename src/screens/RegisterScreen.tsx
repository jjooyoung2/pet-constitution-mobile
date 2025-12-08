import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Linking } from 'react-native';

interface RegisterScreenProps {
  navigation: StackNavigationProp<any>;
  route: any;
  onRegister: (email: string, password: string, nickname?: string) => Promise<{ success: boolean; message?: string }>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation, onRegister }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleKakaoRegister = async () => {
    console.log('=== 카카오 회원가입 시작 ===');
    setIsLoading(true);
    
    try {
      // 회원가입 플로우임을 명시 (action=signup)
      const kakaoLoginUrl = `https://xpeyzdvtzdtzxxsgcsyf.supabase.co/auth/v1/authorize?provider=kakao&redirect_to=exp://zbwfyuc-anonymous-8081.exp.direct/--/auth/callback?action=signup`;
      console.log('카카오 회원가입 URL:', kakaoLoginUrl);
      
      const supported = await Linking.canOpenURL(kakaoLoginUrl);
      
      if (supported) {
        await Linking.openURL(kakaoLoginUrl);
      } else {
        Alert.alert('오류', '카카오 회원가입을 열 수 없습니다.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('에러:', error);
      Alert.alert('오류', '에러가 발생했습니다: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    console.log('=== 구글 회원가입 시작 ===');
    setIsLoading(true);
    
    try {
      // 회원가입 플로우임을 명시 (action=signup)
      const googleLoginUrl = `https://xpeyzdvtzdtzxxsgcsyf.supabase.co/auth/v1/authorize?provider=google&redirect_to=exp://zbwfyuc-anonymous-8081.exp.direct/--/auth/callback?action=signup`;
      console.log('구글 회원가입 URL:', googleLoginUrl);
      
      const supported = await Linking.canOpenURL(googleLoginUrl);
      
      if (supported) {
        await Linking.openURL(googleLoginUrl);
      } else {
        Alert.alert('오류', '구글 회원가입을 열 수 없습니다.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('에러:', error);
      Alert.alert('오류', '에러가 발생했습니다: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 타이틀 */}
        <View style={styles.header}>
          <Text style={styles.title}>회원가입</Text>
        </View>

        {/* 소셜 회원가입 버튼 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.socialButton, isLoading && styles.disabledButton]}
            onPress={handleKakaoRegister}
            disabled={isLoading}
          >
            <Text style={styles.socialButtonText}>카카오톡</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, isLoading && styles.disabledButton]}
            onPress={handleGoogleRegister}
            disabled={isLoading}
          >
            <Text style={styles.socialButtonText}>구글</Text>
          </TouchableOpacity>
        </View>

        {/* 뒤로가기 버튼 */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  socialButton: {
    backgroundColor: '#667eea',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  socialButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  backButton: {
    marginTop: 30,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default RegisterScreen;


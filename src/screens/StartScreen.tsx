import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { User } from '../types';
import { globalStyles, scale, getFontFamily } from '../styles/globalStyles';
import BottomNavigation from '../components/BottomNavigation';

interface StartScreenProps {
  navigation: StackNavigationProp<any>;
  isLoggedIn: boolean;
  user: User | null;
  onLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  onRegister: (email: string, password: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  onLogout: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({
  navigation,
  isLoggedIn,
  user,
  onLogin,
  onRegister,
  onLogout,
}) => {
  const startAsGuest = () => {
    navigation.navigate('BasicInfo');
  };

  const startSurvey = () => {
    navigation.navigate('BasicInfo');
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  const goToMyPage = () => {
    navigation.navigate('MyPage');
  };

  const handleKakaoChannel = async () => {
    // 카카오채널 링크
    const kakaoChannelUrl = 'https://pf.kakao.com/_uMXkn';
    
    try {
      const supported = await Linking.canOpenURL(kakaoChannelUrl);
      if (supported) {
        await Linking.openURL(kakaoChannelUrl);
      } else {
        Alert.alert('오류', '카카오채널을 열 수 없습니다.');
      }
    } catch (error) {
      console.error('카카오채널 열기 오류:', error);
      Alert.alert('오류', '카카오채널을 열 수 없습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* 상단 인사말 */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>
              "안녕하세요,{'\n'}
              온솔 양한방 동물병원에 오신 걸 환영합니다."
            </Text>
          </View>
          
          {/* 설명 */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              단 3분! 우리 아이의 체질을 확인하고,
            </Text>
            <View style={styles.descriptionRow}>
              <Text style={styles.description}>
                맞는 음식과 계절별 관리 팁을 받아보세요.
              </Text>
              <Image source={require('../../assets/images/startscreen-icon.png')} style={styles.descImage}/>
            </View>
          </View>
          
          {/* 로고 */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          {/* 버튼 그룹 */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={isLoggedIn ? startSurvey : goToLogin}
            >
              <Text style={styles.loginButtonText}>
                {isLoggedIn ? '진단 시작하기' : '로그인 후 시작하기'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.disclaimer}>
              ※ 결과 저장과 상담 연결을 위해 최소 정보만 보관되며, 언제든지 삭제 가능합니다.
            </Text>
            
            <TouchableOpacity 
              style={styles.guestButton} 
              onPress={isLoggedIn ? goToMyPage : startAsGuest}
            >
              <Text style={styles.guestButtonText}>
                {isLoggedIn ? '마이페이지' : '게스트로 시작하기'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.disclaimer}>
              {isLoggedIn ? '※ 내 정보와 진단 결과를 확인할 수 있습니다.' : '※ 결과는 브라우저에만 저장됩니다.'}
            </Text>
            
            <TouchableOpacity 
              style={styles.kakaoChannelButton} 
              onPress={handleKakaoChannel}
            >
              <Text style={styles.kakaoChannelButtonText}>
                카카오채널 친구 추가
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <BottomNavigation navigation={navigation} currentScreen="Start" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee9e5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: scale(40),
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: scale(300),
  },
  header: {
    alignItems: 'center',
    marginTop: scale(150),
    marginBottom: scale(40),
  },
  welcomeText: {
    fontSize: scale(48),
    color: '#0e0e0e', // 진한 갈색
    textAlign: 'center',
    lineHeight: scale(65),
    fontFamily: getFontFamily('extraBold'),
  },
  descriptionContainer: {
    alignItems: 'center',
    marginBottom: scale(60),
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  descImage:{
    width: scale(98),
    height: scale(41),
    resizeMode: 'contain',
    marginLeft: scale(8),
  },
  description: {
    fontSize: scale(40),
    color: '#0e0e0e',
    textAlign: 'center',
    lineHeight: scale(56),
    fontFamily: getFontFamily('regular'),
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: scale(108),
  },
  logo: {
    width: scale(457),
    height: scale(520),
  },
  hospitalName: {
    fontSize: scale(36),
    color: '#3E2723',
    marginBottom: scale(10),
    fontFamily: getFontFamily('bold'),
  },
  hospitalNameEn: {
    fontSize: scale(28),
    color: '#757575',
    fontFamily: getFontFamily('regular'),
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: 'white',
    borderRadius: scale(15),
    paddingVertical: scale(50),
    width: scale(755),
    alignItems: 'center',
    marginBottom: scale(16),
    shadowColor: 'rgba(100, 100, 111, 0.68)',
    shadowOffset: {
      width: 0,
      height: scale(14),
    },
    shadowOpacity: 0.2,
    shadowRadius: scale(58),
    elevation: 7,
  },
  loginButtonText: {
    fontSize: scale(48),
    color: '#376943', // 초록색
    fontFamily: getFontFamily('extraBold'),
  },
  guestButton: {
    backgroundColor: 'white',
    borderRadius: scale(15),
    paddingVertical: scale(50),
    width: scale(755),
    alignItems: 'center',
    marginBottom: scale(16),
    shadowColor: 'rgba(100, 100, 111, 0.68)',
    shadowOffset: {
      width: 0,
      height: scale(14),
    },
    shadowOpacity: 0.2,
    shadowRadius: scale(58),
    elevation: 7,
  },
  guestButtonText: {
    fontSize: scale(48),
    color: '#5d5d5d',
    fontFamily: getFontFamily('extraBold'),
  },
  disclaimer: {
    fontSize: scale(26),
    color: '#0e0e0e',
    textAlign: 'center',
    marginBottom: scale(45),
    fontFamily: getFontFamily('regular'),
  },
  kakaoChannelButton: {
    backgroundColor: '#fae100', // 카카오 노란색
    borderRadius: scale(15),
    paddingVertical: scale(50),
    width: scale(755),
    alignItems: 'center',
    marginBottom: scale(70),
    marginTop: scale(20),
    shadowColor: 'rgba(100, 100, 111, 0.68)',
    shadowOffset: {
      width: 0,
      height: scale(14),
    },
    shadowOpacity: 0.2,
    shadowRadius: scale(58),
    elevation: 7,
  },
  kakaoChannelButtonText: {
    fontSize: scale(48),
    color: '#5c530b', // 진한 갈색
    fontFamily: getFontFamily('extraBold'),
  },
});

export default StartScreen;


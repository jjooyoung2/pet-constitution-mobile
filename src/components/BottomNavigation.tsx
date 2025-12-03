import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scale } from '../styles/globalStyles';

interface BottomNavigationProps {
  navigation: StackNavigationProp<any>;
  currentScreen: 'Results' | 'ManagementMethods' | 'Start' | 'MyPage';
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ navigation, currentScreen }) => {
  const insets = useSafeAreaInsets();
  
  const navigateToManagementMethods = () => {
    navigation.navigate('ManagementMethods');
  };

  const navigateToStart = () => {
    navigation.navigate('Start');
  };

  const navigateToMyPage = async () => {
    // 로그인 상태 확인
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      // 로그인하지 않았으면 Login 화면으로 이동 (StartScreen과 동일)
      navigation.navigate('Login');
    } else {
      // 로그인했으면 MyPage로 이동
      navigation.navigate('MyPage');
    }
  };

  return (
    <View style={[
      styles.container,
      {
        height: scale(188) + insets.bottom,
        paddingBottom: insets.bottom,
      }
    ]}>
      {/* 왼쪽: ManagementMethods */}
      <TouchableOpacity
        style={[
          styles.navItem,
          (currentScreen === 'ManagementMethods' || currentScreen === 'Results') && styles.activeNavItem
        ]}
        onPress={navigateToManagementMethods}
      >
        <Image
          source={require('../../assets/images/nav-icon1.png')}
          style={[
            styles.navIcon,
            (currentScreen === 'ManagementMethods' || currentScreen === 'Results') && styles.activeNavIcon
          ]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* 중간: 홈 (Start) */}
      <TouchableOpacity
        style={[
          styles.navItem,
          currentScreen === 'Start' && styles.activeNavItem
        ]}
        onPress={navigateToStart}
      >
        <Image
          source={require('../../assets/images/nav-icon2.png')}
          style={[
            styles.navIcon,
            currentScreen === 'Start' && styles.activeNavIcon
          ]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* 오른쪽: 마이페이지 */}
      <TouchableOpacity
        style={[
          styles.navItem,
          currentScreen === 'MyPage' && styles.activeNavItem
        ]}
        onPress={navigateToMyPage}
      >
        <Image
          source={require('../../assets/images/nav-icon3.png')}
          style={[
            styles.navIcon,
            currentScreen === 'MyPage' && styles.activeNavIcon
          ]}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(-4),
    },
    shadowOpacity: 0.25,
    shadowRadius: scale(8),
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100, // Android용
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(16),
  },
  activeNavItem: {
    opacity: 1,
  },
  navIcon: {
    width: scale(75),
    height:scale(75),
    opacity: 0.6,
  },
  activeNavIcon: {
    opacity: 1,
  },
});

export default BottomNavigation;

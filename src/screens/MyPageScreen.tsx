import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { resultsAPI, authAPI } from '../services/api';
import { globalStyles, scale, getFontFamily } from '../styles/globalStyles';
import BottomNavigation from '../components/BottomNavigation';

interface MyPageScreenProps {
  navigation: StackNavigationProp<any>;
  user: User | null;
  token: string | null;
  onLogout: () => void;
}

const MyPageScreen: React.FC<MyPageScreenProps> = ({
  navigation,
  user,
  token,
  onLogout,
}) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [petType, setPetType] = useState<'dog' | 'cat' | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false); // 첫 번째 모달 (확인)
  const [showWithdrawCompleteModal, setShowWithdrawCompleteModal] = useState(false); // 두 번째 모달 (완료)
  const [isWithdrawing, setIsWithdrawing] = useState(false); // 탈퇴 진행 중
  const [showResults, setShowResults] = useState(false); // 검사기록 표시 여부

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // token을 직접 가져오는 함수
  const getToken = async () => {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch {
      return null;
    }
  };

  const loadData = async () => {
    const authToken = await getToken();
    if (!authToken) {
      console.log('No auth token found');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Loading data with token:', authToken.substring(0, 20) + '...');
      
      // 결과 로드
      const resultsResponse = await resultsAPI.getMyResults(authToken);

      if (resultsResponse.success && resultsResponse.data) {
        console.log('Full results response:', JSON.stringify(resultsResponse, null, 2));
        console.log('Results response data:', resultsResponse.data);
        console.log('Results response data.data:', resultsResponse.data.data);
        
        // API 응답 구조가 중첩되어 있음: data.data.results
        const results = resultsResponse.data.data?.results || resultsResponse.data.results || [];
        console.log('Parsed results:', results);
        console.log('Results length:', results.length);
        
        // created_at 기준으로 정렬 (최신순부터)
        const sortedResults = [...results].sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA; // 내림차순 (최신순이 첫 번째)
        });
        
        console.log('Sorted results (newest first):', sortedResults);
        setResults(sortedResults);
        
        // 첫 진단 결과(가장 오래된 결과)에서 petType 가져오기 (정렬은 최신순이지만, petType은 가장 오래된 것 사용)
        // petType을 위해 오래된 순으로 다시 정렬
        const oldestFirst = [...sortedResults].sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateA - dateB; // 오름차순 (가장 오래된 것이 첫 번째)
        });
        
        if (oldestFirst.length > 0) {
          const firstResult = oldestFirst[0];
          console.log('First result (oldest for petType):', firstResult);
          let petInfo = null;
          
          // pet_info가 JSON 문자열인 경우 파싱
          if (firstResult.pet_info) {
            try {
              petInfo = typeof firstResult.pet_info === 'string' 
                ? JSON.parse(firstResult.pet_info) 
                : firstResult.pet_info;
              console.log('Parsed petInfo:', petInfo);
            } catch (e) {
              console.error('Error parsing pet_info:', e);
            }
          }
          
          // petType 설정 (pet_info에서 가져오거나, 없으면 pet_type 확인)
          let detectedPetType: 'dog' | 'cat' | null = null;
          
          if (petInfo?.petType) {
            detectedPetType = petInfo.petType === 'dog' || petInfo.petType === 'cat' 
              ? petInfo.petType 
              : null;
            console.log('PetType from petInfo.petType:', detectedPetType);
          } else if (firstResult.pet_type) {
            // pet_type이 'dog' 또는 'cat'인지 확인
            if (firstResult.pet_type === 'dog' || firstResult.pet_type === 'cat') {
              detectedPetType = firstResult.pet_type;
            } else if (firstResult.pet_type === '강아지' || firstResult.pet_type === '고양이') {
              detectedPetType = firstResult.pet_type === '강아지' ? 'dog' : 'cat';
            }
            console.log('PetType from pet_type:', firstResult.pet_type, '->', detectedPetType);
          }
          
          if (detectedPetType) {
            setPetType(detectedPetType);
            console.log('Final petType set to:', detectedPetType);
          } else {
            // 진단 결과는 있지만 petType을 찾지 못한 경우 기본값 dog
            console.warn('PetType not found in first result, using default dog');
            setPetType('dog');
          }
        } else {
          // 진단 결과가 없으면 랜덤으로 선택
          console.log('No results found, using random petType');
          setPetType(Math.random() > 0.5 ? 'dog' : 'cat');
        }
      } else {
        console.log('Results response failed:', resultsResponse);
        // API 응답 실패 시 랜덤으로 선택
        setPetType(Math.random() > 0.5 ? 'dog' : 'cat');
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      
      // 네트워크 오류인 경우 더 자세한 메시지
      if (error.name === 'AbortError') {
        Alert.alert('네트워크 오류', '서버 연결이 시간 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.');
      } else if (error.message === 'Network request failed') {
        Alert.alert('네트워크 오류', '서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.');
      } else {
        Alert.alert('오류', '데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleResultPress = (result: any) => {
    // 결과 상세 페이지로 이동 (ResultsScreen 재사용)
    // 데이터베이스에서 가져온 데이터를 ResultsScreen 형식으로 변환
    let petInfo: any = {
      name: result.pet_name,
      age: result.pet_age,
      weight: result.pet_weight,
      symptoms: result.pet_symptoms
    };
    
    console.log('handleResultPress - result:', result);
    console.log('handleResultPress - result.pet_info:', result.pet_info);
    console.log('handleResultPress - result.pet_type:', result.pet_type);
    
    // pet_info에서 petType 추출
    if (result.pet_info) {
      try {
        const parsedPetInfo = typeof result.pet_info === 'string' 
          ? JSON.parse(result.pet_info) 
          : result.pet_info;
        console.log('handleResultPress - parsedPetInfo:', parsedPetInfo);
        if (parsedPetInfo && parsedPetInfo.petType) {
          petInfo.petType = parsedPetInfo.petType;
          console.log('handleResultPress - petType from pet_info:', petInfo.petType);
        }
      } catch (e) {
        console.error('Error parsing pet_info:', e);
      }
    }
    
    // pet_type이 직접 있는 경우 (우선순위 높음)
    if (result.pet_type) {
      // pet_type이 'dog'/'cat' 또는 '강아지'/'고양이'일 수 있음
      if (result.pet_type === 'dog' || result.pet_type === 'cat') {
        petInfo.petType = result.pet_type;
      } else if (result.pet_type === '강아지') {
        petInfo.petType = 'dog';
      } else if (result.pet_type === '고양이') {
        petInfo.petType = 'cat';
      }
      console.log('handleResultPress - petType from pet_type:', result.pet_type, '->', petInfo.petType);
    }
    
    // 기본값 설정 (petType을 찾지 못한 경우)
    if (!petInfo.petType) {
      console.warn('handleResultPress - petType not found, using default dog');
      petInfo.petType = 'dog';
    }
    
    console.log('handleResultPress - final petInfo:', petInfo);
    
    let answers = [];
    try {
      answers = typeof result.answers === 'string' ? JSON.parse(result.answers) : result.answers;
    } catch (e) {
      console.error('Error parsing answers:', e);
      answers = [];
    }
    
    navigation.navigate('Results', {
      petInfo: petInfo,
      answers: answers,
      constitution: result.constitution,
      isFromMyPage: true,
      resultId: result.id.toString()
    });
  };

  // 날짜를 "25.10.27" 형식으로 포맷
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear().toString().slice(-2); // 마지막 2자리
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              // 로컬 토큰 제거
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('refreshToken');
              
              // 로그아웃 처리
              onLogout();
              
              // Start 화면으로 리셋
              navigation.reset({
                index: 0,
                routes: [{ name: 'Start' }],
              });
            } catch (error) {
              console.error('로그아웃 오류:', error);
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleWithdraw = () => {
    setShowWithdrawModal(true);
  };

  const handleWithdrawConfirm = async () => {
    setIsWithdrawing(true);
    setShowWithdrawModal(false);
    
    try {
      const authToken = await getToken();
      if (!authToken) {
        Alert.alert('오류', '인증 토큰을 찾을 수 없습니다.');
        setIsWithdrawing(false);
        return;
      }

      // 탈퇴 API 호출
      const response = await authAPI.withdraw(authToken);
      
      if (!response.success) {
        throw new Error(response.message || '탈퇴 처리에 실패했습니다.');
      }
      
      // 로딩 해제
      setIsWithdrawing(false);
      
      // 로컬 데이터 삭제
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('refreshToken');
      
      // 완료 알림 (iOS/Android 공통)
      Alert.alert(
        '탈퇴 완료',
        '탈퇴가 완료되었습니다.\n그동안 이용해 주셔서 감사합니다.',
        [
          {
            text: '확인',
            onPress: () => {
              onLogout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Start' }],
              });
            }
          }
        ],
        { cancelable: false }
      );
      
    } catch (error) {
      console.error('탈퇴 오류:', error);
      Alert.alert('오류', '탈퇴 처리 중 오류가 발생했습니다.');
      setIsWithdrawing(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Page</Text>
          <Text style={styles.subtitle}>회원정보</Text>
        </View>

        {/* 회원정보 카드 */}
        <View style={styles.userInfoCard}>
          <View style={styles.profileImageContainer}>
            <Image
              source={petType === 'cat' 
                ? require('../../assets/images/mypage-cat.png')
                : require('../../assets/images/mypage-dog.png')
              }
              style={styles.profileImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.userInfoContent}>
            <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
              {user?.name || user?.email}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.userButtons}>
              <TouchableOpacity 
                style={styles.checkRecordsButton}
                onPress={() => {
                  setShowResults(true);
                }}
              >
                <Text style={styles.checkRecordsButtonText}>검사 기록 확인하기</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.withdrawButton}
                onPress={handleWithdraw}
              >
                <Text style={styles.withdrawButtonText}>탈퇴하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 검사기록 섹션 */}
        {showResults && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsSectionTitle}>검사기록</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8e9b83" />
              <Text style={styles.loadingText}>결과를 불러오는 중...</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>아직 저장된 결과가 없습니다.</Text>
              <TouchableOpacity 
                style={styles.startDiagnosisButton}
                onPress={() => navigation.navigate('BasicInfo')}
              >
                <Text style={styles.startDiagnosisButtonText}>진단 시작하기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.resultsList}>
              {results.map((result, index) => (
                <TouchableOpacity
                  key={result.id || index}
                  style={styles.resultItem}
                  onPress={() => handleResultPress(result)}
                >
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>
                      {formatDateShort(result.created_at || result.createdAt || new Date().toISOString())}
                    </Text>
                  </View>
                  <Text style={styles.resultText}>체질 검사 기록</Text>
                  <Image source={require('../../assets/images/mypage-arrow.png')} style={styles.arrowIcon} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        )}

        {/* 로그아웃 버튼 */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNavigation navigation={navigation} currentScreen="MyPage" />

      {/* 탈퇴 확인 모달 */}
      <Modal
        visible={showWithdrawModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              탈퇴를{"\n"}
              진행하시겠습니까?
            </Text>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                탈퇴 시 체질 분석 결과와{"\n"}
                기록이 모두 삭제되며
              </Text>
              <Text style={styles.modalWarningText}>
                추후 상담 및 치료 시{"\n"}
                참고가 어려울 수 있습니다.
              </Text>
            </View>
            <Text style={styles.modalQuestion}>계속 진행하시겠습니까?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowWithdrawModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleWithdrawConfirm}
                disabled={isWithdrawing}
              >
                <Text style={styles.modalConfirmButtonText}>탈퇴하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 탈퇴 처리 중 로딩 모달 */}
      <Modal
        visible={isWithdrawing}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ActivityIndicator size="large" color="#5b6751" style={styles.loadingIndicator} />
            <Text style={styles.modalTitle}>
              탈퇴 처리 중...
            </Text>
            <Text style={styles.modalText}>
              잠시만 기다려주세요.
            </Text>
          </View>
        </View>
      </Modal>

      {/* 탈퇴 완료 모달 */}
      <Modal
        visible={showWithdrawCompleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWithdrawCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              탈퇴가{"\n"}
              완료되었습니다.
            </Text>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                기존 정보는 모두 삭제 처리되었습니다.
              </Text>
              <Text style={styles.modalText}>
                그동안 이용해 주셔서{"\n"}
                진심으로 감사드립니다.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.modalOkButton}
              onPress={() => {
                setShowWithdrawCompleteModal(false);
                onLogout();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Start' }],
                });
              }}
            >
              <Text style={styles.modalOkButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: scale(90),
    paddingTop: scale(190),
    paddingBottom: scale(500),
  },
  header: {
    alignItems: 'center',
    marginBottom: scale(20),
    marginTop: scale(20),
  },
  title: {
    fontSize: scale(82),
    color: '#0e0e0e',
    marginBottom: scale(90),
    fontFamily: getFontFamily('extraBold'),
  },
  subtitle: {
    fontSize: scale(56),
    color: '#5b6751',
    letterSpacing: scale(10),
    fontFamily: getFontFamily('extraBold'),
    marginBottom: scale(60),
  },
  userInfoCard: {
    backgroundColor: 'white',
    borderRadius: scale(15),
    padding: scale(50),
    marginBottom: scale(90),
    flexDirection: 'row',
    alignItems: 'center',
    // iOS shadow
    shadowColor: 'rgba(100, 100, 111, 0.32)',
    shadowOffset: {
      width: 0,
      height: scale(7),
    },
    shadowOpacity: 1,
    shadowRadius: scale(14.5),
    // Android shadow
    elevation: 8,
  },
  profileImageContainer: {
    width: scale(290),
    height: scale(290),
    borderRadius: '50%',
    backgroundColor: '#d1dec6',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(44),
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  userInfoContent: {
    flex: 1,
  },
  userName: {
    fontSize: scale(56),
    color: '#0e0e0e',
    marginBottom: scale(20),
    fontFamily: getFontFamily('extraBold'),
    flexShrink: 1,
  },
  userEmail: {
    fontSize: scale(32),
    color: '#0e0e0e',
    marginBottom: scale(30),
    fontFamily: getFontFamily('regular'),
  },
  userButtons: {
    flexDirection: 'column',
    gap: scale(20),
    alignItems: 'flex-start',
  },
  checkRecordsButton: {
    backgroundColor: '#2d3a28',
    paddingVertical: scale(18),
    paddingHorizontal: scale(34),
    borderRadius: scale(15),
    alignSelf: 'flex-start',
  },
  checkRecordsButtonText: {
    color: 'white',
    fontSize: scale(40),
    textAlign: 'center',
    fontFamily: getFontFamily('extraBold'),
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: scale(50),
    marginBottom: scale(30),
  },
  logoutButtonText: {
    color: '#0e0e0e',
    fontSize: scale(40),
    textAlign: 'center',
    fontFamily: getFontFamily('extraBold'),
    textDecorationLine: 'underline'
  },
  withdrawButton: {
    backgroundColor: '#919191',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(15),
    alignSelf: 'flex-start',
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: scale(36),
    fontFamily: getFontFamily('extraBold'),
  },
  divider: {
    height: 1,
    backgroundColor: '#5b6751',
    marginBottom: scale(84),
  },
  resultsSection: {
    marginBottom: scale(84),
  },
  resultsSectionTitle: {
    fontSize: scale(56),
    color: '#5b6751',
    marginBottom: scale(54),
    textAlign: 'center',
    fontFamily: getFontFamily('extraBold'),
    letterSpacing: scale(10),
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: scale(40),
  },
  loadingText: {
    marginTop: scale(10),
    fontSize: scale(36),
    color: '#666',
    fontFamily: getFontFamily('regular'),
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: scale(40),
  },
  emptyText: {
    fontSize: scale(36),
    color: '#666',
    textAlign: 'center',
    fontFamily: getFontFamily('regular'),
    marginBottom: scale(30),
  },
  startDiagnosisButton: {
    backgroundColor: '#8e9b83',
    paddingVertical: scale(20),
    paddingHorizontal: scale(74),
    borderRadius: scale(60),
  },
  startDiagnosisButtonText: {
    color: 'white',
    fontSize: scale(40),
    textAlign: 'center',
    fontFamily: getFontFamily('extraBold'),
  },
  resultsList: {
    gap: scale(20),
  },
  resultItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: scale(15),
    padding: scale(25),
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBadge: {
    backgroundColor: '#8e9b83',
    paddingVertical: scale(18),
    width: scale(290),
    borderRadius: scale(15),
    marginRight: scale(50),
  },
  dateBadgeText: {
    color: 'white',
    fontSize: scale(36),
    fontFamily: getFontFamily('extraBold'),
    textAlign: 'center',
  },
  resultText: {
    flex: 1,
    fontSize: scale(46),
    color: '#5b6751',
    fontFamily: getFontFamily('extraBold'),
  },
  arrowIcon: {
    width: scale(37),
    height: scale(40),
    resizeMode: 'contain',
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#f8f8f8',
    paddingVertical: scale(117),
    paddingHorizontal: scale(40),
    borderWidth: scale(3),
    borderColor: '#2d3a28',
    width: scale(700),
  },
  loadingIndicator: {
    marginBottom: scale(40),
  },
  modalTitle: {
    fontSize: scale(53),
    lineHeight: scale(74),
    fontFamily: getFontFamily('extraBold'),
    color: '#0e0e0e',
    marginBottom: scale(92),
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: scale(30),
  },
  modalText: {
    fontSize: scale(36),
    fontFamily: getFontFamily('bold'),
    color: '#0e0e0e',
    lineHeight: scale(48),
    marginBottom: scale(10),
    textAlign: 'center',
  },
  modalWarningText: {
    fontSize: scale(36),
    fontFamily: getFontFamily('bold'),
    color: '#ff0000',
    lineHeight: scale(48),
    marginBottom: scale(50),
    textAlign: 'center',
  },
  modalQuestion: {
    fontSize: scale(36),
    fontFamily: getFontFamily('bold'),
    color: '#0e0e0e',
    marginBottom: scale(140),
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: scale(60),
  },
  modalButton: {
    flex: 1,
    paddingVertical: scale(20),
    borderRadius: scale(15),
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#2d3a28',
  },
  modalCancelButtonText: {
    color: 'white',
    fontSize: scale(40),
    fontFamily: getFontFamily('extraBold'),
  },
  modalConfirmButton: {
    backgroundColor: '#ff0000',
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: scale(40),
    fontFamily: getFontFamily('extraBold'),
  },
  modalOkButton: {
    backgroundColor: '#2d3a28',
    width: scale(350),
    marginTop: scale(120),
    paddingVertical: scale(20),
    paddingHorizontal: scale(20),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(15),
    minHeight: scale(60),
  },
  modalOkButtonText: {
    color: '#ffffff',
    fontSize: scale(40),
    fontFamily: getFontFamily('extraBold'),
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default MyPageScreen;
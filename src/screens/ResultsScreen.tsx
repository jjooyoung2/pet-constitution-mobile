import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  Image,
  ImageBackground,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { resultsAPI } from '../services/api';
import { constitutionData } from '../data/constitutionData';
import { globalStyles, scale, getFontFamily } from '../styles/globalStyles';
import BottomNavigation from '../components/BottomNavigation';
import { 
  DOCTOR_IMAGE_BASE64,
  ICON1_IMAGE_BASE64,
  ICON2_IMAGE_BASE64,
  ICON3_IMAGE_BASE64,
  ICON4_IMAGE_BASE64,
} from '../utils/imageBase64';

interface ResultsScreenProps {
  navigation: StackNavigationProp<any>;
  route: any;
  isLoggedIn: boolean;
  token: string | null;
  user?: {
    id: string;
    email: string;
    name: string;
  } | null;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({
  navigation,
  route,
  isLoggedIn,
  token,
  user,
}) => {
  const insets = useSafeAreaInsets();
  const { petInfo, answers, constitution: passedConstitution, isFromMyPage, resultId } = route.params || {};
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false); 
  const [email, setEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [savedResultId, setSavedResultId] = useState<string | null>(null);
  const [localIsLoggedIn, setLocalIsLoggedIn] = useState(isLoggedIn);
  const resultCardRef = useRef<View>(null);
  const screenRef = useRef<View>(null);

  // 화면이 포커스될 때마다 로그인 상태 확인 (로그인 후 돌아왔을 때 반영)
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('authToken');
      setLocalIsLoggedIn(!!token);
    };
    
    checkLoginStatus();
    
    // 화면이 포커스될 때마다 확인
    const unsubscribe = navigation.addListener('focus', () => {
      checkLoginStatus();
    });
    
    return unsubscribe;
  }, [navigation]);

  // 디버깅을 위한 로그
  console.log('ResultsScreen - petInfo:', petInfo);
  console.log('ResultsScreen - petInfo.name:', petInfo?.name);
  console.log('ResultsScreen - petInfo.petType:', petInfo?.petType);
  console.log('ResultsScreen - petInfo 전체:', JSON.stringify(petInfo, null, 2));
  console.log('ResultsScreen - answers:', answers);
  console.log('ResultsScreen - route.params:', route.params);
  console.log('ResultsScreen - isFromMyPage:', isFromMyPage);

  // 체질 계산
  const calculateConstitution = () => {
    const scores: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
    answers?.forEach((answer: string, index: number) => {
      if (scores[answer] !== undefined) {
        // 문항 1번(인덱스 0)과 3번(인덱스 2)은 가중치 2점, 나머지는 1점
        const weight = (index === 0 || index === 2) ? 2 : 1;
        scores[answer] += weight;
      }
    });
    
    const maxScore = Math.max(...Object.values(scores));
    return Object.keys(scores).find(key => scores[key] === maxScore) || "목";
  };

  const constitution = passedConstitution || calculateConstitution();
  const constitutionInfo = constitutionData[constitution];

  // 체질별 색상 매핑
  const getConstitutionColor = (constitutionType: string): string => {
    const colorMap: Record<string, string> = {
      '목': '#668652',
      '화': '#c74f42',
      '금': '#b7b7b7',
      '토': '#d3ad13', 
      '수': '#0e0e0e', 
    };
    return colorMap[constitutionType] || '#376943';
  };

  const constitutionColor = getConstitutionColor(constitution);

  const handleSendEmail = async () => {
    if (!email.trim()) {
      Alert.alert('오류', '이메일 주소를 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('오류', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsSendingEmail(true);
    try {
      // 토큰이 없으면 AsyncStorage에서 직접 가져오기
      let authToken = token;
      if (!authToken) {
        authToken = await AsyncStorage.getItem('authToken');
        if (!authToken) {
          Alert.alert('오류', '로그인이 필요합니다.');
          setIsSendingEmail(false);
          return;
        }
      }

      // 결과 ID 확인 (마이페이지에서 온 경우 또는 저장된 결과)
      const currentResultId = resultId || savedResultId;
      console.log('=== EMAIL SEND DEBUG ===');
      console.log('resultId from route:', resultId);
      console.log('savedResultId:', savedResultId);
      console.log('currentResultId:', currentResultId);
      console.log('email:', email);
      
      if (!currentResultId) {
        Alert.alert('알림', '이메일을 보내려면 먼저 결과를 저장해주세요.');
        setIsSendingEmail(false);
        return;
      }

      console.log('Sending email with resultId:', currentResultId);
      const response = await resultsAPI.sendDietEmail(currentResultId, email, authToken);
      
      if (response.success) {
        Alert.alert('성공', '이메일이 성공적으로 전송되었습니다!');
        setShowEmailModal(false);
        setEmail('');
      } else {
        Alert.alert('오류', response.message || '이메일 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Email send error:', error);
      Alert.alert('오류', '이메일 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSaveResult = async () => {
    // 로컬 로그인 상태 확인 (로그인 후 돌아왔을 때 반영)
    const currentIsLoggedIn = localIsLoggedIn || isLoggedIn;
    if (!currentIsLoggedIn) {
      // returnToResults 정보를 AsyncStorage에 저장 (OAuth 로그인도 처리하기 위해)
      await AsyncStorage.setItem('returnToResults', 'true');
      await AsyncStorage.setItem('resultData', JSON.stringify({ petInfo, answers, constitution }));
      
      Alert.alert(
        '로그인 필요',
        '결과를 저장하려면 로그인이 필요합니다.',
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '로그인', 
            onPress: () => navigation.navigate('Login', { 
              returnToResults: true,
              resultData: { petInfo, answers, constitution }
            })
          }
        ]
      );
      return;
    }

    // 토큰이 없으면 AsyncStorage에서 직접 가져오기
    let authToken = token;
    if (!authToken) {
      try {
        authToken = await AsyncStorage.getItem('authToken');
        if (!authToken) {
          Alert.alert('오류', '인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.');
          return;
        }
      } catch (error) {
        console.error('Token retrieval error:', error);
        Alert.alert('오류', '토큰을 가져오는 중 오류가 발생했습니다.');
        return;
      }
    }

    if (!petInfo || !answers || answers.length === 0) {
      Alert.alert('오류', '저장할 데이터가 없습니다.');
      return;
    }

    setIsSaving(true);
    try {
      // token을 직접 가져오기
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        Alert.alert('오류', '로그인 토큰을 찾을 수 없습니다.');
        setIsSaving(false);
        return;
      }

      // petType 확인 및 로깅
      const currentPetType = petInfo?.petType;
      console.log('=== SAVE RESULT DEBUG ===');
      console.log('petInfo object:', petInfo);
      console.log('petInfo.petType (raw):', currentPetType);
      console.log('petInfo.petType type:', typeof currentPetType);
      console.log('petInfo.petType === "cat":', currentPetType === 'cat');
      console.log('petInfo.petType === "dog":', currentPetType === 'dog');
      
      if (!currentPetType || (currentPetType !== 'dog' && currentPetType !== 'cat')) {
        console.warn('⚠️ WARNING: petType is missing or invalid:', currentPetType);
        console.warn('⚠️ Using default value: dog');
      }

      const resultData = {
        petInfo: {
          name: petInfo.name && petInfo.name.trim() ? petInfo.name.trim() : '이름 없음',
          age: petInfo.age || '',
          weight: petInfo.weight || '',
          symptoms: petInfo.symptoms || '',
          petType: currentPetType === 'cat' ? 'cat' : (currentPetType === 'dog' ? 'dog' : 'dog'),
        },
        answers,
        constitution
      };

      console.log('Saving result with data:', JSON.stringify(resultData, null, 2));
      console.log('Saving result petType:', resultData.petInfo.petType);
      console.log('Saving result with token:', authToken.substring(0, 20) + '...');
      const response = await resultsAPI.saveResult(resultData, authToken);
      
      if (response.success) {
        setSavedResultId(response.data.resultId.toString());
        Alert.alert('성공', '결과가 저장되었습니다! 마이페이지에서 확인할 수 있습니다.');
        // 저장 성공 후 홈으로 이동하지 않고 결과 페이지 유지
      } else {
        Alert.alert('오류', response.message || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Save result error:', error);
      
      // 네트워크 오류인 경우 임시 저장 제안
      if (error.message === 'Network request failed') {
        Alert.alert(
          '네트워크 오류',
          '서버에 연결할 수 없습니다. 나중에 다시 시도하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            { 
              text: '나중에 시도', 
              onPress: () => {
                // 임시 저장 로직 (AsyncStorage 사용)
                console.log('임시 저장:', resultData);
                Alert.alert('알림', '결과가 임시 저장되었습니다. 네트워크가 복구되면 다시 시도해주세요.');
              }
            }
          ]
        );
      } else {
        Alert.alert('오류', '저장 중 오류가 발생했습니다.');
      }
    } finally {
      setIsSaving(false);
    }
  };


  const handleExportImage = async () => {
    setIsExporting(true);
    try {
      console.log('이미지 내보내기 시작...');
      
      // 권한 요청
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리에 저장하려면 권한이 필요합니다.');
        setIsExporting(false);
        return;
      }

      // 체질 정보 가져오기
      const constitutionInfo = constitutionData[constitution] || constitutionData['목'];
      
      // 이미지 Base64 사용 (미리 변환된 상수 사용)
      const doctorImageBase64 = DOCTOR_IMAGE_BASE64 && DOCTOR_IMAGE_BASE64.length > 0 ? `data:image/png;base64,${DOCTOR_IMAGE_BASE64}` : '';
      const icon1Base64 = ICON1_IMAGE_BASE64 && ICON1_IMAGE_BASE64.length > 0 ? `data:image/png;base64,${ICON1_IMAGE_BASE64}` : '';
      const icon2Base64 = ICON2_IMAGE_BASE64 && ICON2_IMAGE_BASE64.length > 0 ? `data:image/png;base64,${ICON2_IMAGE_BASE64}` : '';
      const icon3Base64 = ICON3_IMAGE_BASE64 && ICON3_IMAGE_BASE64.length > 0 ? `data:image/png;base64,${ICON3_IMAGE_BASE64}` : '';
      const icon4Base64 = ICON4_IMAGE_BASE64 && ICON4_IMAGE_BASE64.length > 0 ? `data:image/png;base64,${ICON4_IMAGE_BASE64}` : '';
      
      // 서버에서 이미지 생성
      const authToken = token || await AsyncStorage.getItem('authToken');
      const requestData = { 
        ...constitutionInfo, 
        doctorImageBase64,
        icon1Base64,
        icon2Base64,
        icon3Base64,
        icon4Base64,
      };
      
      const response = await resultsAPI.generateResultImage(
        petInfo,
        constitution,
        requestData,
        authToken
      );

      if (!response.success) {
        throw new Error(response.message || '이미지 생성에 실패했습니다.');
      }

      // apiCall이 반환하는 구조 확인
      const html = (response as any).html || (response as any).data?.html || response.data?.html;
      const image = (response as any).image || (response as any).data?.image || response.data?.image;

      // Base64 이미지가 있으면 저장
      if (image) {
        const base64Image = image;
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const filename = `pet-constitution-${Date.now()}.png`;
        
        const documentDir = FileSystem.documentDirectory;
        if (!documentDir) {
          throw new Error('파일 시스템에 접근할 수 없습니다.');
        }
        const fileUri = documentDir + filename;
        
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('반려동물 체질진단', asset, false);

        Alert.alert('성공', '이미지가 갤러리에 저장되었습니다!');
      } else if (html) {
        // HTML만 반환된 경우 - WebView로 렌더링 후 캡처
        console.log('HTML을 WebView로 렌더링하여 캡처합니다...');
        const htmlKey = `html_capture_${Date.now()}`;
        await AsyncStorage.setItem(htmlKey, html);
        navigation.navigate('HtmlCapture', {
          htmlKey: htmlKey,
        });
      } else {
        throw new Error('이미지 또는 HTML 데이터를 받지 못했습니다.');
      }
    } catch (error: any) {
      console.error('Image export error:', error);
      
      let errorMessage = '이미지 저장 중 오류가 발생했습니다.';
      
      if (error.message.includes('Permission')) {
        errorMessage = '갤러리 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.';
      } else if (error.message.includes('Network')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setIsExporting(false);
    }
  };


  const handleConsultation = () => {
    navigation.navigate('Consultation');
  };

  return (
    <SafeAreaView ref={screenRef} style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[
          globalStyles.scrollContent,
          { paddingBottom: (globalStyles.scrollContent.paddingBottom as number || scale(40)) + insets.bottom }
        ]}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.resultContainer}>
          {/* 반려동물 타입과 이름 표시 */}
          {petInfo && petInfo.petType && (
            <View style={styles.petInfoHeader}>
              <View style={styles.petTypeContainer}>
                <Text style={styles.petTypeText}>
                  {petInfo.petType === 'dog' ? '강아지' : '고양이'}
                </Text>
              </View>
              <Text style={styles.petNameText}>
                {petInfo.name && petInfo.name.trim() ? ` ${petInfo.name.trim()}` : ''}
              </Text>
            </View>
          )}
          
          {/* 제목과 수의사 이미지 */}
          <View style={styles.titleContainer}>
            <View style={styles.titleTextContainer}>
              <Text style={[styles.resultTitle, { color: constitutionColor }]}>
                {constitutionInfo.name}
              </Text>
              <Text style={styles.resultTitleSuffix}>
                {' '}체질
              </Text>
            </View>
            <Image 
              source={require('../../assets/images/results-doctor.png')} 
              style={styles.doctorImage}
              resizeMode="contain"
            />
          </View>

          {/* 설명 */}
          <Text style={styles.resultDescription}>
            {constitutionInfo.description}
          </Text>
          
          {/* 섹션들 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image 
                source={require('../../assets/images/results-icon1.png')} 
                style={styles.sectionIcon}
                resizeMode="contain"
              />
              <Text style={[styles.sectionTitle, { color: '#c17503' }]}>이렇게 관리해 주세요!</Text>
            </View>
            <Text style={styles.sectionContent}>{constitutionInfo.tips}</Text>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image 
                source={require('../../assets/images/results-icon2.png')} 
                style={styles.sectionIcon}
                resizeMode="contain"
              />
              <Text style={[styles.sectionTitle, { color: '#4b7529' }]}>잘 맞는 음식</Text>
            </View>
            <View>
              <Text style={styles.foodCategoryText}>
                (고기 → 곡물 → 채소 → 과일)
              </Text>
              <Text style={styles.foodListText}>
                {constitutionInfo.foods.meat}, {constitutionInfo.foods.grain}, {constitutionInfo.foods.vegetable}, {constitutionInfo.foods.fruit}
              </Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image 
                source={require('../../assets/images/results-icon3.png')} 
                style={styles.sectionIcon}
                resizeMode="contain"
              />
              <Text style={[styles.sectionTitle, { color: '#ef3333' }]}>이건 조심해 주세요!</Text>
            </View>
            <Text style={styles.sectionContent}>{constitutionInfo.avoid}</Text>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image 
                source={require('../../assets/images/results-icon4.png')} 
                style={styles.sectionIcon}
                resizeMode="contain"
              />
              <Text style={[styles.sectionTitle, { color: '#2052b8' }]}>계절 관리 포인트</Text>
            </View>
            <Text style={styles.sectionContent}>{constitutionInfo.season}</Text>
          </View>
          
          {/* 면책 조항 */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ※ 본 결과는 교육 및 상담 보조용입니다.
            </Text>
            <Text style={styles.disclaimerText2}>
              급성 폐색, 감염 등 응급 상황은{'\n'}
              즉시 서양의학 응급 처치 후,{'\n'}
              필요 시 한방 치료를 병행하세요.
            </Text>
            <Text style={styles.disclaimerText3}>
              한약 및 치료는 반드시 수의사 상담 후 진행하세요.
            </Text>
          </View>

          {/* 체질별 관리법 - ManagementMethodsScreen 내용 */}
          <View style={styles.managementSection}>
            {/* 상단 헤더 */}
            <View style={styles.managementHeader}>
              <Image source={require('../../assets/images/management-line.png')} style={styles.managementLineImage} />
              <Text style={styles.managementMainTitle}>"체질이 다르면 관리도 달라야 합니다."</Text>
              <Text style={styles.managementIntroText}>
                오행 체질 검사는 아이의 기질과 장부 균형(목ㆍ화ㆍ토ㆍ금ㆍ수)을
                점수화 해 주체질과 보조 체질을 도출합니다.{"\n"}
                {"\n"}
                주체질은 현재 몸의 중심 경향,
                보조 체질은 상황에 따라 드러나는 보완 성향을 뜻합니다.{"\n"}
                {"\n"}
                결과는 식단 선택, 계절 관리,
                재활ㆍ침구ㆍ한약 처방의 방향을 정하는 지침으로 활용됩니다.
              </Text>
            </View>

            {/* 주체질 + 보조 체질 조합 */}
            <View style={styles.managementSectionItem}>
              <View style={styles.managementSectionHeader}>
                <Image source={require('../../assets/images/management-play.png')} style={styles.managementPlayIcon} />
                <Text style={styles.managementSectionTitle}>주체질 + 보조 체질 조합</Text>
              </View>
              
              <View style={styles.managementCombinationItem}>
                <Text style={styles.managementCombinationTitle}>목(木)+화(火)</Text>
                <Text style={styles.managementCombinationDescription}>
                  활동성과 열감이 높아
                  집중력 저하와 갈증이 나타날 수 있습니다.
                  닭고기와 보리를 기본으로, 수분이 많은 채소
                  및 과일(오이, 수박) 등을 소량으로 곁들여 급여해보세요.
                  또한 한낮 야외활동은 줄이고,
                  열과 스트레스를 함께 관리하는 것이 좋습니다.
                </Text>
              </View>

              <View style={styles.managementCombinationItem}>
                <Text style={styles.managementCombinationTitle}>토(土)+금(金)</Text>
                <Text style={styles.managementCombinationDescription}>
                  소화기 부담과 건조 민감이 함께 올 수 있으니,
                  찹쌀로 위를 보호하고 오리고기와 배를 활용해
                  건조함을 보완해보세요.
                  건조한 날에는 실내 습도 조절과 피부 보습 루틴을
                  꾸준히 유지하는 것을 권장합니다.
                </Text>
              </View>

              <View style={[styles.managementCombinationItem, styles.managementCombinationItemLast]}>
                <Text style={styles.managementCombinationTitle}>수(水)+목(木)</Text>
                <Text style={styles.managementCombinationDescription}>
                  추위 민감과 근육, 힘줄 긴장이 겹칠 수 있습니다.
                  양고기와 흑미로 온기를 돋우고,
                  스트레칭형 산책과 저강도 근력 루틴을 권장합니다.
                </Text>
              </View>
            </View>
            <Text style={styles.managementNoteText}>
                ※조합 해석은 생활 습관과 계절, 기존 질환에 따라 달라질 수 있습니다.
            </Text>

            {/* 체질에 맞는 음식 추천 */}
            <View style={styles.managementSectionItem}>
              <View style={styles.managementSectionHeader}>
                <Image source={require('../../assets/images/management-play.png')} style={styles.managementPlayIcon} />
                <Text style={styles.managementSectionTitle}>체질에 맞는 음식 추천</Text>
              </View>
              
              <View style={styles.managementPaddingWrap}>
                <View style={styles.managementFoodRecommendationItem}>
                  <Text style={styles.managementConstitutionName}>목(木)</Text>
                  <Text style={styles.managementFoodList}>닭고기/보리/브로콜리/사과</Text>
                </View>

                <View style={styles.managementFoodRecommendationItem}>
                  <Text style={styles.managementConstitutionName}>화(火)</Text>
                  <Text style={styles.managementFoodList}>칠면조/현미/오이/수박</Text>
                </View>

                <View style={styles.managementFoodRecommendationItem}>
                  <Text style={styles.managementConstitutionName}>토(土)</Text>
                  <Text style={styles.managementFoodList}>소고기/찹쌀/단호박/배</Text>
                </View>

                <View style={styles.managementFoodRecommendationItem}>
                  <Text style={styles.managementConstitutionName}>금(金)</Text>
                  <Text style={styles.managementFoodList}>오리고기/조/무/배</Text>
                </View>

                <View style={[styles.managementFoodRecommendationItem, styles.managementFoodRecommendationItemLast]}>
                  <Text style={styles.managementConstitutionName}>수(水)</Text>
                  <Text style={styles.managementFoodList}>양고기/흑미/시금치/블루베리</Text>
                </View>
              </View>
            </View>

            {/* 주의해야 할 음식 */}
            <View style={styles.managementSectionItem}>
              <View style={styles.managementSectionHeader}>
                <Image source={require('../../assets/images/management-play.png')} style={styles.managementPlayIcon} />
                <Text style={styles.managementSectionTitle}>주의해야 할 음식</Text>
              </View>
              
              <View style={styles.managementPaddingWrap}>
                <Text style={styles.managementWarningIntro}>
                  체질 특성상 열을 과도하게 높이거나 수분을 고갈시키는 음식,{"\n"}
                  그리고 소화에 부담을 줄 수 있는 재료들입니다.
                </Text>

                <View style={styles.managementWarningItem}>
                  <Text style={styles.managementConstitutionName}>목(木)</Text>
                  <Text style={styles.managementWarningFoodList}>자극적이고 기름진 간식, 불규칙한 급여</Text>
                </View>

                <View style={styles.managementWarningItem}>
                  <Text style={styles.managementConstitutionName}>화(火)</Text>
                  <Text style={styles.managementWarningFoodList}>
                    기름진 붉은 고기 과다, 매우 자극적인 간식,{"\n"}
                    뜨거운 환경에서의 건조 간식 급여
                  </Text>
                </View>

                <View style={styles.managementWarningItem}>
                  <Text style={styles.managementConstitutionName}>토(土)</Text>
                  <Text style={styles.managementWarningFoodList}>고탄수 간식 남용, 급격한 사료 교체, 과일 과다 급여</Text>
                </View>

                <View style={styles.managementWarningItem}>
                  <Text style={styles.managementConstitutionName}>금(金)</Text>
                  <Text style={styles.managementWarningFoodList}>건조 간식 과다 급여, 향이 강한 간식</Text>
                </View>

                <View style={[styles.managementWarningItem, styles.managementWarningItemLast]}>
                  <Text style={styles.managementConstitutionName}>수(水)</Text>
                  <Text style={styles.managementWarningFoodList}>냉한 음식 과다 급여, 겨울철 찬 물, 얼음 급여</Text>
                </View>
              </View>
            </View>

            {/* 계절 및 환경 주의 */}
            <View style={styles.managementSectionItem}>
              <View style={styles.managementSectionHeader}>
                <Image source={require('../../assets/images/management-play.png')} style={styles.managementPlayIcon} />
                <Text style={styles.managementSectionTitle}>계절 및 환경 주의</Text>
              </View>

              <View style={styles.managementPaddingWrap}>
                <View style={styles.managementSeasonItem}>
                  <Text style={styles.managementSeasonTitle}>봄(바람, 건조 변동)</Text>
                  <Text style={styles.managementSeasonDescription}>목(木)과 금(金) 주의(알레르기/피부ㆍ호흡)</Text>
                  <Text style={styles.managementSeasonDescription2}>→ 환기와 보습 균형</Text>
                  <Text style={styles.managementSeasonDescription3}>
                    알레르기 / 피부 / 호흡기 관리,{"\n"}
                    산책 후 발 / 피부 세정 및 보습
                  </Text>
                </View>

                <View style={styles.managementSeasonItem}>
                  <Text style={styles.managementSeasonTitle}>여름(열/습)</Text>
                  <Text style={styles.managementSeasonDescription}>화(火)와 토(土) 주의(갈증/소화)</Text>
                  <Text style={styles.managementSeasonDescription2}>→ 한낮 산책 피하기, 미지근한 물 자주 급여</Text>
                  <Text style={styles.managementSeasonDescription3}>
                    한낮 산책 피하고 짧고 잦은 산책 권장,{"\n"}
                    미지근한 물 상시 제공 / 차에 홀로 두지 않기
                  </Text>
                </View>

                <View style={styles.managementSeasonItem}>
                  <Text style={styles.managementSeasonTitle}>가을(건조)</Text>
                  <Text style={styles.managementSeasonDescription}>금(金) 주의(호흡/피부)</Text>
                  <Text style={styles.managementSeasonDescription2}>→ 실내 습도 관리, 보습 케어</Text>
                  <Text style={styles.managementSeasonDescription3}>
                    가습, 실내 공기질 관리 / 건조 간식 제한
                  </Text>
                </View>

                <View style={[styles.managementSeasonItem, styles.managementSeasonItemLast]}>
                  <Text style={styles.managementSeasonTitle}>겨울(한기)</Text>
                  <Text style={styles.managementSeasonDescription}>수(水) 주의(관절, 신장, 방광)</Text>
                  <Text style={styles.managementSeasonDescription2}>→ 체온 유지, 찬 음식 급여 피하기</Text>
                  <Text style={styles.managementSeasonDescription3}>
                    의류 및 매트로 체온 유지 / 관절 보온 / 찬 물, 얼음 피하기
                  </Text>
                </View>  
              </View>
            </View>

            {/* 치료 및 케어 권장 */}
            <View style={styles.managementTreatmentContainer}>
              <Text style={styles.managementTreatmentMainTitle}>치료 및 케어 권장</Text>
              
              <View style={[styles.managementTreatmentItem, styles.managementTreatmentItemFirst]}>
                <Text style={styles.managementTreatmentTitle}>정밀진단</Text>
                <Text style={styles.managementTreatmentDescription}>
                  X-ray로 뼈와 관절, 흉복부 구조를 확인하고, 초음파로 장기 상태,
                  혈액검사로 염증 여부와 장기 기능을 살펴봅니다.
                  이를 통해 현재 건강 상태와 질병의 원인을 객관적으로 파악할 수 있습니다.
                </Text>
              </View>

              <View style={styles.managementTreatmentItem}>
                <Text style={styles.managementTreatmentTitle}>침구·뜸</Text>
                <Text style={styles.managementTreatmentDescription}>
                  통증 완화하고 혈류를 개선하며, 신경 기능 회복을 돕습니다.
                  특히 만성적인 관절 및 신경 질환에 효과적입니다.
                </Text>
              </View>

              <View style={styles.managementTreatmentItem}>
                <Text style={styles.managementTreatmentTitle}>저온 레이저 마사지 치료</Text>
                <Text style={styles.managementTreatmentDescription}>
                  일반 레이저 원리를 활용하면서도
                  저온 방식으로 화상 위험 없이 안전하게 전신 부위에 적용 가능합니다.
                  근육 긴장 완화, 미세순환 촉진, 회복력 향상에 도움이 되며
                  침ㆍ뜸과 병행 시 효과가 더욱 높아집니다.
                </Text>
              </View>

              <View style={styles.managementTreatmentItem}>
                <Text style={styles.managementTreatmentTitle}>체질 맞춤 한약</Text>
                <Text style={styles.managementTreatmentDescription}>
                  체질과 증상에 맞춰 면역, 염증, 장부 기능의 균형을 조절합니다.
                  복용 용량과 기간은 아이의 체중, 검사 결과, 경과에 따라 세밀 조정합니다.
                </Text>
              </View>

              <View style={styles.managementTreatmentItem}>
                <Text style={styles.managementTreatmentTitle}>서양의학적 처치</Text>
                <Text style={styles.managementTreatmentDescription}>
                  급성 감염, 외상, 수술 적응 등에는
                  항염제ㆍ소염제ㆍ수액ㆍ수술 등 표준 치료를 우선 적용합니다.
                  한방 치료는 회복과 재발 방지에 보조 및 상승 효과를 기대할 수 있습니다.
                </Text>
              </View>
            </View>

            {/* 급여 및 투약 TIP */}
            <View style={styles.managementSection2}>
              <View style={styles.managementTipHeader}>
                <View style={styles.managementTipBubble}>
                  <Image source={require('../../assets/images/management-tip.png')} style={styles.managementTipBubbleImage} />
                </View>
                <Text style={styles.managementTipTitle}>급여 및 투약 TIP</Text>
              </View>
              
              <Text style={styles.managementTipContent}>
                새로운 재료는 3~5일간 소량 도입 후 대변, 피부, 활동성 변화를 관찰하세요.
                간식은 하루 총열량의 10% 내에서 조절하고,
                체중과 활동량에 따라 주 단위로 급식량을 미세 조정합니다.
                한약ㆍ영양제ㆍ서양약을 함께 사용할 때는 상호작용을 고려해
                투약 간격과 용량을 병원 지시에 맞춰 주세요.
              </Text>
              <Text style={styles.managementTipContent2}>
                장기 관리가 필요한 만성 질환은 4-8주 단위로 재검사하고,
                계절 전환기엔 식단과 운동 루틴을 다시 점검하는 것이 좋습니다.
              </Text>
              
              <ImageBackground 
                source={require('../../assets/images/management-balloon.png')} 
                style={styles.managementSpeechBubble}
                resizeMode="stretch"
              >
                <Text style={styles.managementSpeechBubbleText}>
                  오행 결과는 아이의 현재 경향을 읽는 지도입니다.
                  오늘의 환경, 계절, 스트레스, 기존 질환에 따라 조정이 필요하며,
                  정밀검사와 문진을 통해 맞춤 처방을 완성합니다.
                </Text>
                <Text style={styles.managementSpeechBubbleText2}>
                  예약 또는 추가 상담을 원하시면 언제든 문의 주세요.
                  온솔 양한방 동물병원이 아이의 오늘의 편안함과
                  내일의 건강을 함께 설계하겠습니다.
                </Text>
              </ImageBackground>
            </View>

            {/* 하단 일러스트 */}
            <View style={styles.managementIllustrationContainer}>
              <Image 
                source={require('../../assets/images/management-bg.png')} 
                style={styles.managementIllustrationBg}
                resizeMode="cover"
              />
              <Image 
                source={require('../../assets/images/management-doctor.png')} 
                style={styles.managementIllustrationDoctor}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <View style={styles.topButtonsRow}>
            {!isFromMyPage && (
              <TouchableOpacity 
                style={[styles.saveResultButton, isSaving && styles.disabledButton]} 
                onPress={handleSaveResult}
                disabled={isSaving}
              >
                <Image source={require('../../assets/images/results-down.png')} style={styles.saveResultImage}/>
                <Text style={styles.saveResultButtonText}>
                  {isSaving ? '저장 중...' : '결과 저장하기'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.saveImageButton, isExporting && styles.disabledButton]} 
              onPress={handleExportImage}
              disabled={isExporting}
            >
              <Image source={require('../../assets/images/results-imgdown.png')} style={styles.saveImageImage}/>
              <Text style={styles.saveImageButtonText}>
                {isExporting ? '저장 중...' : '이미지로 저장하기'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.saveInfoText}>
            <Text style={styles.saveInfoTextLine}>
              로그인 사용자는{"\n"}
              마이페이지에서 과거 결과 열람이 가능합니다.
            </Text>
            <Text style={styles.saveInfoTextLine2}>
              (게스트 사용자는 기기에만 저장 가능)
            </Text>
            <Text style={styles.saveInfoTextLine3}>
              결과를 저장해 두면{"\n"}
              다음 상담 시 더 원활한 체질 상담이 가능합니다.
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.hospitalName}>ONSOL ANIMAL HOSPITAL</Text>

          <View style={styles.serviceCardsContainer}>
            <TouchableOpacity style={styles.serviceCard}>
              {/* TODO: service-laser.png 이미지 추가 */}
              <View style={styles.serviceCardIconPlaceholder}>
                <Image source={require('../../assets/images/results-btnicon1.png')} style={styles.serviceCardIcon1} />
              </View>
              <Text style={styles.serviceCardText}>
                저온 레이저{"\n"}
                마사지 치료{"\n"}
                소개 보기
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => {
                const currentResultId = resultId || savedResultId;
                if (!currentResultId) {
                  Alert.alert('알림', '이메일을 보내려면 먼저 결과를 저장해주세요.');
                  return;
                }
                if (user?.email) {
                  setEmail(user.email);
                }
                setShowEmailModal(true);
              }}
            >
              {/* TODO: service-diet.png 이미지 추가 */}
              <View style={styles.serviceCardIconPlaceholder}>
                <Image source={require('../../assets/images/results-btnicon2.png')} style={styles.serviceCardIcon2} />
              </View>
              <Text style={styles.serviceCardText}>
                체질별{"\n"}
                7일 식단{"\n"}
                샘플 받기
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serviceCard}>
              {/* TODO: service-xray.png 이미지 추가 */}
              <View style={styles.serviceCardIconPlaceholder}>
                <Image source={require('../../assets/images/results-btnicon3.png')} style={styles.serviceCardIcon3} />
              </View>
              <Text style={styles.serviceCardText}>
                X-rayㆍ혈액{"\n"}
                ·초음파 검사{"\n"}
                및 상담 예약
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.serviceHintText}>(원하는 항목을 눌러주세요)</Text>
        </View>
      </ScrollView>
      
      {/* 캡처용 숨겨진 View */}
      <View 
        ref={resultCardRef} 
        style={[styles.resultContainer, styles.hiddenCaptureView]}
        pointerEvents="none"
      >
        {/* 반려동물 타입과 이름 표시 */}
        {petInfo && petInfo.petType && (
          <View style={styles.petInfoHeader}>
            <View style={styles.petTypeContainer}>
              <Text style={styles.petTypeText}>
                {petInfo.petType === 'dog' ? '강아지' : '고양이'}
              </Text>
            </View>
            <Text style={styles.petNameText}>
              {petInfo.name && petInfo.name.trim() ? ` ${petInfo.name.trim()}` : ''}
            </Text>
          </View>
        )}
        
        {/* 제목과 수의사 이미지 */}
        <View style={styles.titleContainer}>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.resultTitle, { color: constitutionColor }]}>
              {constitutionInfo.name}
            </Text>
            <Text style={[styles.resultTitleSuffix, { color: constitutionColor }]}>
              {' '}체질
            </Text>
          </View>
          <Image 
            source={require('../../assets/images/results-doctor.png')} 
            style={styles.doctorImage}
            resizeMode="contain"
          />
        </View>

        {/* 설명 */}
        <Text style={styles.resultDescription}>
          {constitutionInfo.description}
        </Text>
        
        {/* 섹션들 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image 
              source={require('../../assets/images/results-icon1.png')} 
              style={styles.sectionIcon}
              resizeMode="contain"
            />
            <Text style={[styles.sectionTitle, { color: '#ff9500' }]}>이렇게 관리해 주세요!</Text>
          </View>
          <Text style={styles.sectionContent}>{constitutionInfo.tips}</Text>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image 
              source={require('../../assets/images/results-icon2.png')} 
              style={styles.sectionIcon}
              resizeMode="contain"
            />
            <Text style={[styles.sectionTitle, { color: '#8b6f47' }]}>잘 맞는 음식</Text>
          </View>
          <View>
            <Text style={styles.foodCategoryText}>
              (고기 → 곡물 → 채소 → 과일)
            </Text>
            <Text style={styles.foodListText}>
              {constitutionInfo.foods.meat}, {constitutionInfo.foods.grain}, {constitutionInfo.foods.vegetable}, {constitutionInfo.foods.fruit}
            </Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image 
              source={require('../../assets/images/results-icon3.png')} 
              style={styles.sectionIcon}
              resizeMode="contain"
            />
            <Text style={[styles.sectionTitle, { color: '#e74c3c' }]}>이건 조심해 주세요!</Text>
          </View>
          <Text style={styles.sectionContent}>{constitutionInfo.avoid}</Text>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image 
              source={require('../../assets/images/results-icon4.png')} 
              style={styles.sectionIcon}
              resizeMode="contain"
            />
            <Text style={[styles.sectionTitle, { color: '#5dade2' }]}>계절 관리 포인트</Text>
          </View>
          <Text style={styles.sectionContent}>{constitutionInfo.season}</Text>
        </View>
        
        {/* 면책 조항 */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ※ 본 결과는 교육 및 상담 보조용입니다.{'\n'}
            급성 폐색, 감염 등 응급 상황은 즉시 서양의학 응급 처치 후, 필요 시 한방 치료를 병행하세요. 한약 및 치료는 반드시 수의사 상담 후 진행하세요.
          </Text>
        </View>
      </View>

      {/* 이메일 전송 모달 */}
      {showEmailModal && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              contentContainerStyle={styles.modalScrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowEmailModal(false);
                    setEmail('');
                  }}
                >
                  <Image source={require('../../assets/images/results-popclose.png')} style={styles.modalCloseImg} />
                </TouchableOpacity>
                
                <Text style={styles.modalTitle}>ONSOL ANIMAL HOSPITAL</Text>
                <Text style={styles.modalSubtitle}>
                  샘플 받으실{'\n'}
                  이메일을 적어주세요.
                </Text>
                <Image source={require('../../assets/images/results-popimg.png')} style={styles.modalImg}/>
                
                <TextInput
                  style={styles.emailInput}
                  placeholder="Email :"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {user?.email && (
                  <Text style={styles.emailHint}>
                    가입된 이메일: {user.email}
                  </Text>
                )}
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalSendButton, isSendingEmail && styles.disabledButton]}
                    onPress={handleSendEmail}
                    disabled={isSendingEmail}
                  >
                    <Text style={styles.modalSendButtonText}>
                      {isSendingEmail ? '전송 중...' : '제출하기'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      )}
      <BottomNavigation navigation={navigation} currentScreen="Results" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee9e5',
  },
  content: {
    flex: 1,
    paddingVertical: scale(100),
    paddingHorizontal: scale(120),
    paddingBottom: scale(300), // BottomNavigation 공간 확보
  },
  resultContainer: {
    
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  petInfoHeader: {
    width: scale(500),
    marginBottom: scale(10),
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: scale(5),
  },
  petTypeContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#0e0e0e',
    paddingBottom: scale(3),
  },
  petTypeText: {
    fontSize: scale(36),
    color: '#0e0e0e',
    textAlign: 'left',
    fontFamily: getFontFamily('bold'),
  },
  petNameText: {
    fontSize: scale(32),
    lineHeight: scale(44),
    color: '#0e0e0e',
    textAlign: 'left',
    fontFamily: getFontFamily('regular'),
    paddingBottom: scale(3),
    borderBottomWidth: 2,
    borderBottomColor: '#cac6c2',
    width: '100%',
    paddingLeft: scale(10),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(25),
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: scale(20),
    padding: scale(30),
    marginBottom: scale(30),
  },
  titleTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    marginVertical: scale(50),
  },
  resultTitle: {
    fontSize: scale(116),
    color: '#376943',
    textAlign: 'left',
    fontFamily: getFontFamily('heavy'),
  },
  resultTitleSuffix: {
    fontSize: scale(60),
    fontFamily: getFontFamily('heavy'),
    color: '#0e0e0e',
    textAlign: 'left',
    marginBottom: scale(10),
  },
  doctorImage: {
    width: scale(393),
    height: scale(482),
    marginLeft: scale(10),
    position: 'absolute',
    top: 0,
    right: scale(-100),
  },
  resultDescription: {
    fontSize: scale(30),
    lineHeight: scale(45),
    color: '#0e0e0e',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'left',
    marginBottom: scale(50),
    fontFamily: getFontFamily('regular'),
    width: scale(615),
    padding: scale(24),
  },
  section: {
    marginBottom: scale(20),
    borderRadius: scale(15),
    borderWidth: scale(7),
    borderColor: '#ccccc8',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(12),
    backgroundColor: '#ececec',
    paddingVertical: scale(15),
  },
  sectionIcon: {
    width: scale(50),
    height: scale(50),
    marginRight: scale(12),
  },
  sectionTitle: {
    fontSize: scale(40),
    fontFamily: getFontFamily('extraBold'),
    textAlign: 'center',
  },
  sectionContent: {
    fontSize: scale(32),
    color: '#0e0e0e',
    lineHeight: scale(46),
    fontFamily: getFontFamily('bold'),
    backgroundColor: '#ffffff',
    padding: scale(24),
    textAlign: 'center',
  },
  foodCategoryText: {
    fontSize: scale(32),
    color: '#0e0e0e',
    fontFamily: getFontFamily('regular'),
    backgroundColor: '#ffffff',
    textAlign: 'center',
    paddingTop: scale(24),
    paddingBottom: scale(5),
  },
  foodListText: {
    fontSize: scale(32),
    color: '#0e0e0e',
    lineHeight: scale(46),
    fontFamily: getFontFamily('bold'),
    backgroundColor: '#ffffff',
    textAlign: 'center',
    paddingBottom: scale(24),
    paddingTop: scale(5),
  },
  disclaimer: {
    marginTop: scale(30),
    paddingTop: scale(20),
  },
  disclaimerText: {
    fontSize: scale(36),
    color: '#0e0e0e',
    lineHeight: scale(65),
    fontFamily: getFontFamily('extraBold'),
    textAlign: 'center',
  },
  disclaimerText2:{
    fontSize: scale(34),
    color: '#0e0e0e',
    lineHeight: scale(50),
    textAlign: 'center',
    marginTop: scale(40),
    fontFamily: getFontFamily('regular'),
  },
  disclaimerText3: {
    fontSize: scale(34),
    color: '#0e0e0e',
    lineHeight: scale(50),
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  foodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginBottom: 5,
  },
  foodEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  foodText: {
    fontSize: 14,
    color: '#333',
  },
  disabledButton: {
    opacity: 0.6,
  },
  emailButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  emailButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
    elevation: 10000, // Android용
  },
  modalKeyboardView: {
    flex: 1,
    width: '100%',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: scale(70),
    margin: 20,
    width: scale(700),
    position: 'relative',
    borderRadius: scale(15),
  },
  modalTitle: {
    fontSize: scale(26),
    fontFamily: getFontFamily('extraBold'),
    color: '#5b6751',
    textAlign: 'center',
    marginBottom: scale(60),
    backgroundColor: '#d1dec6',
    alignSelf: 'center',
    paddingHorizontal: scale(10),
    letterSpacing: scale(3),
  },
  modalSubtitle: {
    fontSize: scale(48),
    lineHeight: scale(64),
    color: '#0e0e0e',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: getFontFamily('extraBold'),
  },
  modalImg: {
    width: scale(159),
    height: scale(145),
    alignSelf: 'center',
    marginBottom: scale(100),
  },
  emailInput: {
    fontSize: scale(36),
    marginBottom: scale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#2d3a28',
    paddingVertical: scale(30),
    paddingHorizontal: scale(10),
    fontFamily: getFontFamily('extraBold'),
  },
  modalCloseButton: {
    position: 'absolute',
    top: scale(20),
    right: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modalCloseImg:{
    width: scale(54),
    height: scale(54),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: scale(20),
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  modalSendButton: {
    paddingVertical: scale(15),
    paddingHorizontal: scale(100),
    borderRadius: scale(15),
    backgroundColor: '#2d3a28',
    alignItems: 'center',
    minWidth: scale(200),
  },
  modalSendButtonText: {
    color: 'white',
    fontSize: scale(40),
    fontFamily: getFontFamily('extraBold'),
  },
  emailHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginBottom: 10,
    textAlign: 'center',
  },
  hiddenCaptureView: {
    position: 'absolute',
    top: -2000,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: 'white',
    zIndex: -1,
    overflow: 'hidden',
    padding: scale(40),
  },
  highlightTitle: {
    backgroundColor: '#fff3cd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  managementMethodsContainer: {
    gap: 15,
  },
  managementMethodItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  managementMethodTitle: {
    fontSize: 16,
    color: '#667eea',
    marginBottom: 8,
  },
  managementMethodContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // ManagementMethodsScreen 스타일
  managementSection: {
    marginBottom: scale(20),
  },
  managementHeader: {
    marginBottom: scale(30),
    marginTop: scale(20),
  },
  managementLineImage: {
    width: scale(580),
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  managementMainTitle: {
    fontSize: scale(52),
    color: '#498a36',
    textAlign: 'center',
    marginTop: scale(50),
    marginBottom: scale(40),
    fontFamily: getFontFamily('heavy'),
  },
  managementIntroText: {
    fontSize: scale(30),
    color: '#0e0e0e',
    lineHeight: scale(45),
    textAlign: 'center',
    fontFamily: getFontFamily('regular'),
    marginBottom: scale(70),
  },
  managementSectionItem: {
    marginBottom: scale(70),
    backgroundColor: '#ffffff',
    borderWidth: scale(6),
    borderColor: '#ccccc8',
    borderRadius: scale(15),
    overflow: 'hidden',
  },
  managementSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ececec',
    paddingVertical: scale(16),
  },
  managementPlayIcon: {
    width: scale(64),
    height: scale(64),
    resizeMode: 'contain',
    marginRight: scale(14),
  },
  managementSectionTitle: {
    fontSize: scale(40),
    lineHeight: scale(64),
    color: '#458831',
    fontFamily: getFontFamily('extraBold'),
  },
  managementCombinationItem: {
    paddingTop: scale(50),
    paddingHorizontal: scale(65),
  },
  managementCombinationItemLast: {
    paddingBottom: scale(50),
  },
  managementCombinationTitle: {
    fontSize: scale(40),
    color: '#0e0e0e',
    marginBottom: scale(24),
    fontFamily: getFontFamily('extraBold'),
    alignSelf: 'center',
    textAlign: 'center',
    backgroundColor: '#d1dec6',
    width: scale(292),
  },
  managementCombinationDescription: {
    fontSize: scale(28),
    lineHeight: scale(43),
    color: '#0e0e0e',
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  managementNoteText: {
    fontSize: scale(28),
    color: '#0e0e0e',
    marginBottom: scale(70),
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  managementPaddingWrap: {
    paddingHorizontal: scale(50),
    paddingVertical: scale(10),
  },
  managementFoodRecommendationItem: {
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: scale(22),
  },
  managementFoodRecommendationItemLast: {
    borderBottomWidth: 0,
  },
  managementConstitutionName: {
    fontSize: scale(36),
    lineHeight: scale(82),
    color: '#0e0e0e',
    fontFamily: getFontFamily('bold'),
    marginRight: scale(50),
  },
  managementFoodList: {
    fontSize: scale(34),
    lineHeight: scale(82),
    color: '#0e0e0e',
    fontFamily: getFontFamily('regular'),
  },
  managementWarningIntro: {
    fontSize: scale(28),
    lineHeight: scale(44),
    color: '#0e0e0e',
    marginVertical: scale(20),
    fontFamily: getFontFamily('regular'),
    textAlign: 'center',
  },
  managementWarningItem: {
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    flexDirection: 'row',
  },
  managementWarningItemLast: {
    borderBottomWidth: 0,
  },
  managementWarningFoodList: {
    fontSize: scale(28),
    color: '#0e0e0e',
    fontFamily: getFontFamily('regular'),
  },
  managementSeasonItem: {
    padding: scale(40),
    borderBottomWidth: scale(6),
    borderBottomColor: '#ccccc8',
  },
  managementSeasonItemLast: {
    borderBottomWidth: 0,
  },
  managementSeasonTitle: {
    fontSize: scale(32),
    color: '#0e0e0e',
    marginBottom: scale(10),
    fontFamily: getFontFamily('extraBold'),
    textAlign: 'center',
    width: scale(292),
    backgroundColor: '#d1dec6',
    alignSelf: 'center',
    paddingVertical: scale(8),
  },
  managementSeasonDescription: {
    fontSize: scale(28),
    color: '#bb0000',
    lineHeight: scale(40),
    fontFamily: getFontFamily('bold'),
    marginTop: scale(26),
    marginBottom: scale(10),
    textAlign: 'center',
  },
  managementSeasonDescription2: {
    fontSize: scale(32),
    color: '#458831',
    fontFamily: getFontFamily('extraBold'),
    marginBottom: scale(24),
    textAlign: 'center',
  },
  managementSeasonDescription3: {
    fontSize: scale(28),
    color: '#0e0e0e',
    lineHeight: scale(44),
    textAlign: 'center',
    fontFamily: getFontFamily('regular'),
  },
  managementTreatmentContainer: {
    marginBottom: scale(20),
  },
  managementTreatmentMainTitle: {
    fontSize: scale(50),
    color: '#0e0e0e',
    marginBottom: scale(60),
    textAlign: 'center',
    fontFamily: getFontFamily('extraBold'),
  },
  managementTreatmentItem: {
    marginBottom: scale(20),
    paddingVertical: scale(40),
    borderBottomWidth: scale(6),
    borderColor: '#ccccc8',
  },
  managementTreatmentItemFirst: {
    paddingTop: 0,
  },
  managementTreatmentTitle: {
    fontSize: scale(40),
    color: '#498a36',
    marginBottom: scale(26),
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
    paddingHorizontal: scale(40),
    paddingVertical: scale(12),
    borderWidth: scale(3),
    borderColor: '#498a36',
    alignSelf: 'center',
    borderRadius: scale(52),
  },
  managementTreatmentDescription: {
    fontSize: scale(28),
    color: '#0e0e0e',
    lineHeight: scale(44),
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  managementSection2: {
    paddingTop: scale(70),
  },
  managementTipHeader: {
    alignItems: 'center',
    marginBottom: scale(60),
  },
  managementTipBubble: {
    marginBottom: scale(40),
  },
  managementTipBubbleImage: {
    width: scale(180),
    height: scale(166),
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  managementTipTitle: {
    fontSize: scale(50),
    color: '#0e0e0e',
    fontFamily: getFontFamily('extraBold'),
  },
  managementTipContent: {
    fontSize: scale(27),
    color: '#0e0e0e',
    lineHeight: scale(44),
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  managementTipContent2: {
    fontSize: scale(28),
    color: '#0e0e0e',
    lineHeight: scale(44),
    fontFamily: getFontFamily('extraBold'),
    marginTop: scale(40),
    textAlign: 'center',
  },
  managementSpeechBubble: {
    marginTop: scale(50),
    paddingHorizontal: scale(65),
    width: scale(868),
    height: scale(402),
    marginBottom: scale(650),
    justifyContent: 'center',
    alignContent: 'center'
  },
  managementSpeechBubbleText: {
    fontSize: scale(28),
    color: '#0e0e0e',
    lineHeight: scale(44),
    fontFamily: getFontFamily('regular'),
    textAlign: 'center',
  },
  managementSpeechBubbleText2: {
    fontSize: scale(28),
    color: '#0e0e0e',
    lineHeight: scale(44),
    fontFamily: getFontFamily('extraBold'),
    marginTop: scale(35),
    marginBottom: scale(35),
    textAlign: 'center',
  },
  managementIllustrationContainer: {
    position: 'absolute',
    bottom: 0,
    left: scale(-120),
    right: scale(-120),
    height: scale(1050),
    zIndex: -1,
  },
  managementIllustrationBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    bottom: 0,
    left: 0,
  },
  managementIllustrationDoctor: {
    width: scale(567),
    height: scale(592),
    zIndex: 1,
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
  buttonGroup: {
    marginTop: scale(200),
  },
  topButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(90),
    gap: scale(68),
  },
  saveResultButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d3a28',
    paddingVertical: scale(23),
    borderRadius: scale(15),
  },
  saveResultImage: {
    width: scale(40),
    height: scale(40),
    marginBottom: scale(20),
  },
  saveResultButtonText: {
    color: 'white',
    fontSize: scale(40),
    fontFamily: getFontFamily('extraBold'),
  },
  saveImageButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5b6751',
    paddingVertical: scale(23),
    borderRadius: scale(15),
  },
  saveImageImage: {
    width: scale(40),
    height: scale(40),
    marginBottom: scale(20),
  },
  saveImageButtonText: {
    color: 'white',
    fontSize: scale(40),
    fontFamily: getFontFamily('extraBold'),
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveInfoText: {
    marginBottom: scale(30),
  },
  saveInfoTextLine: {
    fontSize: scale(36),
    color: '#0e0e0e',
    textAlign: 'center',
    marginBottom: scale(40),
    lineHeight: scale(48),
    fontFamily: getFontFamily('extraBold'),
  },
  saveInfoTextLine2: {
    fontSize: scale(36),
    color: '#0e0e0e',
    textAlign: 'center',
    marginBottom: scale(45),
    lineHeight: scale(48),
    fontFamily: getFontFamily('regular'),
  },
  saveInfoTextLine3: {
    fontSize: scale(36),
    color: '#0e0e0e',
    textAlign: 'center',
    lineHeight: scale(48),
    fontFamily: getFontFamily('bold'),
    backgroundColor: '#fff',
    borderRadius: scale(15),
    padding: scale(24),
  },
  divider: {
    height: 1,
    backgroundColor: '#5b6751',
    marginVertical: scale(112),
  },
  hospitalName: {
    fontSize: scale(36),
    color: '#5b6751',
    textAlign: 'center',
    marginBottom: scale(90),
    fontFamily: getFontFamily('extraBold'),
    letterSpacing: scale(10),
  },
  serviceCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(14),
    marginBottom: scale(73),
  },
  serviceCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: scale(80),
    borderRadius: scale(15),
    shadowColor: 'rgba(100, 100, 111, 0.38)',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 29,
    elevation: 10, // Android용 (숫자는 적당히 조절)
  },
  serviceCardIconPlaceholder: {
    width: scale(145),
    height: scale(145),
    marginBottom: scale(68),
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCardIcon1: {
    width: scale(145),
    height: scale(145),
  },
  serviceCardIcon2: {
    width: scale(145),
    height: scale(145),
  },
  serviceCardIcon3: {
    width: scale(145),
    height: scale(145),
  },
  serviceCardText: {
    fontSize: scale(36),
    lineHeight: scale(52),
    color: '#2d3a28',
    textAlign: 'center',
    fontFamily: getFontFamily('extraBold'),
  },
  serviceHintText: {
    fontSize: scale(32),
    color: '#0e0e0e',
    textAlign: 'center',
    marginTop: scale(10),
    fontFamily: getFontFamily('regular'),
    marginBottom: scale(300),
  },
});

export default ResultsScreen;


import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { constitutionData } from '../data/constitutionData';
import { globalStyles, scale, getFontFamily } from '../styles/globalStyles';

interface CaptureScreenProps {
  navigation: StackNavigationProp<any>;
  route: any;
}

const CaptureScreen: React.FC<CaptureScreenProps> = ({ navigation, route }) => {
  const { petInfo, constitution } = route.params || {};
  const captureViewRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isViewReady, setIsViewReady] = useState(false);
  
  const constitutionInfo = constitutionData[constitution] || constitutionData['목'];
  
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

  useEffect(() => {
    // 화면이 렌더링된 후 자동으로 캡처
    const captureAfterRender = async () => {
      // 권한 요청
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리에 저장하려면 권한이 필요합니다.');
        navigation.goBack();
        return;
      }

      // View 레이아웃 완료 대기
      if (!isViewReady) {
        console.log('CaptureScreen - View 레이아웃 대기 중...');
        await new Promise(resolve => {
          const checkReady = setInterval(() => {
            if (isViewReady) {
              clearInterval(checkReady);
              resolve(null);
            }
          }, 50);
          // 최대 3초 대기
          setTimeout(() => {
            clearInterval(checkReady);
            resolve(null);
          }, 3000);
        });
      }

      // 추가 렌더링 완료 대기 (Android GPU 렌더링 완료 - 더 길게)
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setTimeout(resolve, 2000);
              });
            });
          });
        });
      });

      setIsCapturing(true);

      try {
        if (!captureViewRef.current) {
          throw new Error('캡처할 View를 찾을 수 없습니다.');
        }

        console.log('CaptureScreen - 캡처 시작...');
        
        // 여러 옵션으로 시도
        const captureOptions = [
          { format: 'png' as const },
          { format: 'jpg' as const },
        ];
        
        let uri;
        let captureSuccess = false;
        
        for (let i = 0; i < captureOptions.length; i++) {
          try {
            console.log(`CaptureScreen - 캡처 시도 ${i + 1}/${captureOptions.length}...`);
            
            uri = await captureRef(captureViewRef, {
              format: captureOptions[i].format,
              quality: 1.0,
              result: 'tmpfile',
            });

            console.log('CaptureScreen - 캡처 성공! URI:', uri);
            captureSuccess = true;
            break;
          } catch (error: any) {
            console.log(`CaptureScreen - 캡처 실패 (옵션 ${i + 1}):`, error.message);
            if (i < captureOptions.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
        }
        
        if (!captureSuccess) {
          throw new Error('모든 캡처 시도가 실패했습니다.');
        }

        // 갤러리에 저장
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('반려동물 체질진단', asset, false);

        console.log('CaptureScreen - 갤러리 저장 완료');

        // 성공 메시지와 함께 뒤로가기
        Alert.alert('성공', '이미지가 갤러리에 저장되었습니다!', [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ]);
      } catch (error: any) {
        console.error('CaptureScreen - 캡처 실패:', error);
        Alert.alert('오류', '이미지 저장에 실패했습니다.', [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ]);
      } finally {
        setIsCapturing(false);
      }
    };

    // isViewReady가 true가 된 후에만 실행
    if (isViewReady) {
      captureAfterRender();
    }
  }, [isViewReady]);

  return (
    <View style={styles.container}>
      <View 
        ref={captureViewRef}
        style={styles.captureContainer}
        collapsable={false}
        removeClippedSubviews={false}
        renderToHardwareTextureAndroid={true}
        needsOffscreenAlphaCompositing={true}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          console.log('CaptureScreen - View 레이아웃 완료:', { width, height });
          // 레이아웃 완료 후 추가 딜레이를 두고 ready 상태로 변경
          setTimeout(() => {
            console.log('CaptureScreen - isViewReady를 true로 설정');
            setIsViewReady(true);
          }, 500);
        }}
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
            <Text style={styles.resultTitleSuffix}>
              {' '}
            </Text>
            <Text style={styles.resultTitleSuffixText}>
              체질
            </Text>
          </View>
          <View style={styles.doctorImageContainer}>
            <Image 
              source={require('../../assets/images/results-doctor.png')} 
              style={styles.doctorImage}
              resizeMode="contain"
            />
          </View>
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
            ※ 본 결과는 교육 및 상담 보조용입니다
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee9e5',
  },
  captureContainer: {
    flex: 1,
    padding: scale(40),
    backgroundColor: 'white',
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
    fontWeight: 'bold',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: scale(30),
    marginTop: scale(20),
  },
  titleTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    paddingRight: scale(20),
    marginBottom: scale(53),
  },
  resultTitle: {
    fontSize: scale(116),
    fontWeight: '900',
    textAlign: 'left',
    fontFamily: getFontFamily('heavy'),
    lineHeight: scale(120),
  },
  resultTitleSuffix: {
    fontSize: scale(116),
    fontWeight: '900',
    textAlign: 'left',
    fontFamily: getFontFamily('heavy'),
    lineHeight: scale(120),
  },
  resultTitleSuffixText: {
    fontSize: scale(116),
    fontWeight: '900',
    textAlign: 'left',
    fontFamily: getFontFamily('heavy'),
    lineHeight: scale(120),
    color: '#0e0e0e',
  },
  doctorImageContainer: {
    width: scale(200),
    height: scale(200),
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorImage: {
    width: '100%',
    height: '100%',
  },
  resultDescription: {
    fontSize: scale(32),
    lineHeight: scale(48),
    color: '#0e0e0e',
    marginBottom: scale(40),
    fontFamily: getFontFamily('regular'),
  },
  section: {
    marginBottom: scale(40),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(20),
  },
  sectionIcon: {
    width: scale(48),
    height: scale(48),
    marginRight: scale(12),
  },
  sectionTitle: {
    fontSize: scale(36),
    fontWeight: '800',
    fontFamily: getFontFamily('extraBold'),
  },
  sectionContent: {
    fontSize: scale(30),
    lineHeight: scale(44),
    color: '#0e0e0e',
    fontFamily: getFontFamily('regular'),
  },
  foodCategoryText: {
    fontSize: scale(28),
    color: '#666',
    marginBottom: scale(8),
    fontFamily: getFontFamily('regular'),
  },
  foodListText: {
    fontSize: scale(30),
    lineHeight: scale(44),
    color: '#0e0e0e',
    fontFamily: getFontFamily('regular'),
  },
  disclaimer: {
    marginTop: scale(40),
    padding: scale(20),
    backgroundColor: '#f5f5f5',
    borderRadius: scale(10),
  },
  disclaimerText: {
    fontSize: scale(26),
    color: '#666',
    marginBottom: scale(12),
    fontFamily: getFontFamily('regular'),
  },
  disclaimerText2: {
    fontSize: scale(26),
    color: '#666',
    lineHeight: scale(38),
    marginBottom: scale(12),
    fontFamily: getFontFamily('regular'),
  },
  disclaimerText3: {
    fontSize: scale(26),
    color: '#666',
    fontFamily: getFontFamily('regular'),
  },
});

export default CaptureScreen;


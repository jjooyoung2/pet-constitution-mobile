import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Text,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { resultsAPI } from '../services/api';

interface HtmlCaptureScreenProps {
  navigation: StackNavigationProp<any>;
  route: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HtmlCaptureScreen: React.FC<HtmlCaptureScreenProps> = ({ navigation, route }) => {
  const { htmlKey, html: directHtml, petInfo, constitution, constitutionInfo, token } = route.params || {};
  const webViewRef = useRef<WebView>(null);
  const [html, setHtml] = useState<string | null>(directHtml || null);
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadHtml = async () => {
      // 🔥 화면 진입 시 가장 먼저 권한 요청 (중간에 팝업 뜨는 것 방지)
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리에 저장하려면 권한이 필요합니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      // 직접 HTML이 전달된 경우
      if (directHtml) {
        setHtml(directHtml);
        return;
      }

      // 서버에서 HTML을 가져와야 하는 경우 (petInfo, constitution, constitutionInfo가 있는 경우)
      if (petInfo && constitution && constitutionInfo) {
        setIsLoading(true);
        try {
          const response = await resultsAPI.generateResultImage(
            petInfo,
            constitution,
            constitutionInfo,
            token
          );

          if (!response.success) {
            throw new Error(response.message || '이미지 생성에 실패했습니다.');
          }

          // apiCall이 반환하는 구조 확인
          const responseHtml = (response as any).html || (response as any).data?.html || response.data?.html;
          const responseImage = (response as any).image || (response as any).data?.image || response.data?.image;

          // Base64 이미지가 있으면 저장 (서버에서 이미지 생성 성공)
          if (responseImage) {
            const base64Image = responseImage;
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

            navigation.goBack();
            setTimeout(() => {
              Alert.alert('성공', '이미지가 갤러리에 저장되었습니다!');
            }, 100);
            return;
          } else if (responseHtml) {
            // HTML 반환된 경우
            setHtml(responseHtml);
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
          
          Alert.alert('오류', errorMessage, [
            { text: '확인', onPress: () => navigation.goBack() },
          ]);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // AsyncStorage에서 HTML을 가져오는 경우 (기존 방식)
      if (htmlKey) {
        try {
          const storedHtml = await AsyncStorage.getItem(htmlKey);
          if (storedHtml) {
            setHtml(storedHtml);
            // 사용 후 삭제
            await AsyncStorage.removeItem(htmlKey);
          } else {
            Alert.alert('오류', 'HTML 데이터를 찾을 수 없습니다.', [
              { text: '확인', onPress: () => navigation.goBack() },
            ]);
          }
        } catch (error) {
          console.error('HTML 로드 오류:', error);
          Alert.alert('오류', 'HTML 데이터를 불러오는데 실패했습니다.', [
            { text: '확인', onPress: () => navigation.goBack() },
          ]);
        }
      } else {
        Alert.alert('오류', 'HTML 데이터가 없습니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      }
    };

    loadHtml();
  }, [htmlKey, directHtml, petInfo, constitution, constitutionInfo, token, navigation]);

  useEffect(() => {
    // WebView가 완전히 로드된 후에만 캡처
    if (html && isWebViewLoaded && !isCapturing) {
      // WebView 로드 완료 후 딜레이 최소화
      const timer = setTimeout(() => {
        captureImageWithCanvas();
      }, 500); // 0.5초 대기

      return () => clearTimeout(timer);
    }
  }, [html, isWebViewLoaded, isCapturing]);

  const captureImageWithCanvas = () => {
    if (isCapturing || !webViewRef.current) return;
    
    setIsCapturing(true);

    // 기존 타임아웃이 있으면 클리어
    if ((webViewRef.current as any)?._timeoutId) {
      clearTimeout((webViewRef.current as any)._timeoutId);
    }

    // 60초 타임아웃 (이미지가 많을 수 있으므로 증가)
    const timeoutId = setTimeout(() => {
      // 이미 저장이 완료되었는지 확인
      if (!isCapturing) {
        return; // 이미 완료되었으면 타임아웃 무시
      }
      setIsCapturing(false);
      Alert.alert('오류', '이미지 생성 시간이 초과되었습니다. 다시 시도해주세요.', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    }, 60000);

    const captureScript = `
      (function() {
        try {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          
          script.onload = function() {
            // 이미 로드된 경우 바로 실행, 아니면 window.onload 대기
            // 이미지 로딩을 기다리기 위해 더 긴 딜레이
            const waitForImages = () => {
              const images = document.querySelectorAll('img');
              let loadedCount = 0;
              const totalImages = images.length;
              
              if (totalImages === 0) {
                setTimeout(capture, 300);
                return;
              }
              
              images.forEach((img) => {
                if (img.complete) {
                  loadedCount++;
                } else {
                  img.onload = () => {
                    loadedCount++;
                    if (loadedCount === totalImages) {
                      setTimeout(capture, 300);
                    }
                  };
                  img.onerror = () => {
                    loadedCount++;
                    if (loadedCount === totalImages) {
                      setTimeout(capture, 300);
                    }
                  };
                }
              });
              
              if (loadedCount === totalImages) {
                setTimeout(capture, 300);
              } else {
                // 최대 5초 대기
                setTimeout(() => {
                  if (loadedCount < totalImages) {
                    console.log('일부 이미지 로딩 실패, 계속 진행...');
                    setTimeout(capture, 300);
                  }
                }, 5000);
              }
            };
            
            if (document.readyState === 'complete') {
              waitForImages();
            } else {
              window.addEventListener('load', waitForImages);
            }
            
            function capture() {
              const body = document.body;
              const html = document.documentElement;
              
              // 스크롤을 맨 위로 이동
              window.scrollTo(0, 0);
              
              // body/html 스타일 강제 설정 (높이 계산 정확도 향상)
              body.style.overflow = 'visible';
              html.style.overflow = 'visible';
              
              // 고정 너비 사용 (1080px)
              const fixedWidth = 1080;
              
              // 실제 콘텐츠 높이 계산 (더 정확하게)
              // 모든 자식 요소의 실제 높이를 고려
              let maxBottom = 0;
              const allElements = body.querySelectorAll('*');
              allElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const bottom = rect.bottom + window.scrollY;
                if (bottom > maxBottom) {
                  maxBottom = bottom;
                }
              });
              
              // 기존 방식과 새로운 방식 중 더 큰 값 사용 + 여유 패딩 추가
              const fallbackHeight = Math.max(
                body.scrollHeight || 0,
                body.offsetHeight || 0,
                html.scrollHeight || 0,
                html.offsetHeight || 0,
                body.clientHeight || 0,
                html.clientHeight || 0
              );
              
              // 여유 패딩 150px 추가 (위아래 잘림 방지)
              const contentHeight = Math.max(maxBottom, fallbackHeight) + 150;
              
              console.log('캡처 높이:', contentHeight, 'maxBottom:', maxBottom, 'fallback:', fallbackHeight);
              
              // body의 margin/padding 제거하여 정확한 캡처
              const originalBodyMargin = body.style.margin;
              const originalHtmlMargin = html.style.margin;
              body.style.margin = '0';
              html.style.margin = '0';
              
              html2canvas(html, {
                backgroundColor: '#eee9e5',
                scale: 1,
                useCORS: true,
                allowTaint: true,
                width: fixedWidth,
                height: contentHeight + 50,
                windowWidth: fixedWidth,
                windowHeight: contentHeight + 50,
                x: 0,
                y: -50,
                scrollX: 0,
                scrollY: -50,
                logging: true,
                imageTimeout: 30000,
                removeContainer: false,
                foreignObjectRendering: false,
                onclone: function(clonedDoc) {
                  // 복제된 문서에서 margin/padding 조정
                  clonedDoc.body.style.overflow = 'visible';
                  clonedDoc.body.style.margin = '0';
                  clonedDoc.documentElement.style.overflow = 'visible';
                  clonedDoc.documentElement.style.margin = '0';
                }
              }).then(canvas => {
                // 원래 스타일 복원
                body.style.margin = originalBodyMargin;
                html.style.margin = originalHtmlMargin;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'capture',
                  image: canvas.toDataURL('image/png', 1.0)
                }));
              }).catch(error => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  message: error.message || '이미지 생성 실패'
                }));
              });
            }
          };
          
          script.onerror = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'html2canvas 라이브러리를 로드할 수 없습니다.'
            }));
          };
          
          document.head.appendChild(script);
        } catch (error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: error.message || '스크립트 실행 실패'
          }));
        }
      })();
      true;
    `;

    webViewRef.current.injectJavaScript(captureScript);
    (webViewRef.current as any)._timeoutId = timeoutId;
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const messageData = event.nativeEvent.data;
      console.log('HtmlCaptureScreen - WebView 메시지 수신, 길이:', messageData.length);
      console.log('HtmlCaptureScreen - 메시지 시작:', messageData.substring(0, 200));
      
      const data = JSON.parse(messageData);
      console.log('HtmlCaptureScreen - 파싱된 데이터 타입:', data.type);
      
      if (data.type === 'capture' && data.image) {
        console.log('HtmlCaptureScreen - 이미지 데이터 수신, 크기:', data.image.length);
        // Base64 이미지를 파일로 저장
        const base64Data = data.image.replace(/^data:image\/\w+;base64,/, '');
        const filename = `pet-constitution-${Date.now()}.png`;
        
        // 권한은 ResultsScreen에서 이미 받았음 (중복 요청 제거)

        // FileSystem 접근 시도 (여러 방법)
        let fileUri: string | null = null;
        
        // 1. documentDirectory 시도
        if (FileSystem.documentDirectory) {
          fileUri = FileSystem.documentDirectory + filename;
          console.log('HtmlCaptureScreen - documentDirectory 사용:', fileUri);
        }
        // 2. cacheDirectory 시도
        else if (FileSystem.cacheDirectory) {
          fileUri = FileSystem.cacheDirectory + filename;
          console.log('HtmlCaptureScreen - cacheDirectory 사용:', fileUri);
        }
        // 3. Android 외부 저장소 경로 직접 시도
        else if (Platform.OS === 'android') {
          // Android의 외부 캐시 디렉토리 (동적으로 패키지명 가져오기)
          const packageName = Constants.expoConfig?.android?.package || 'com.onsol.petconstitutionmobile';
          const androidCachePath = `/storage/emulated/0/Android/data/${packageName}/cache/`;
          fileUri = androidCachePath + filename;
          console.log('HtmlCaptureScreen - Android 직접 경로 사용:', fileUri);
        }
        
        if (!fileUri) {
          console.error('HtmlCaptureScreen - FileSystem.documentDirectory:', FileSystem.documentDirectory);
          console.error('HtmlCaptureScreen - FileSystem.cacheDirectory:', FileSystem.cacheDirectory);
          throw new Error('파일 시스템에 접근할 수 없습니다. expo-file-system이 제대로 설치되지 않았을 수 있습니다.');
        }

        console.log('HtmlCaptureScreen - 파일 저장 시작:', fileUri);

        try {
          // Base64를 파일로 저장
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: 'base64' as any,
          });

          console.log('HtmlCaptureScreen - 파일 저장 완료, 갤러리에 추가 중...');

          // 갤러리에 저장
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('반려동물 체질진단', asset, false);

          // 임시 파일 삭제 (선택사항)
          try {
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
          } catch (e) {
            // 삭제 실패는 무시
            console.log('임시 파일 삭제 실패 (무시):', e);
          }
        } catch (fileError: any) {
          console.error('HtmlCaptureScreen - 파일 저장 실패:', fileError);
          // 파일 저장 실패 시, 직접 경로 재시도
          if (fileError.message?.includes('ENOENT') || fileError.message?.includes('No such file')) {
            // 디렉토리가 없으면 생성 시도
            const dirPath = fileUri.substring(0, fileUri.lastIndexOf('/'));
            try {
              await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
              // 다시 저장 시도
              await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                encoding: 'base64' as any,
              });
              const asset = await MediaLibrary.createAssetAsync(fileUri);
              await MediaLibrary.createAlbumAsync('반려동물 체질진단', asset, false);
            } catch (retryError) {
              throw new Error(`파일 저장 실패: ${retryError}`);
            }
          } else {
            throw fileError;
          }
        }

        console.log('HtmlCaptureScreen - 갤러리 저장 완료');

        // 타임아웃 명시적으로 클리어 (저장 성공 시) - 가장 먼저 실행
        if ((webViewRef.current as any)?._timeoutId) {
          clearTimeout((webViewRef.current as any)._timeoutId);
          delete (webViewRef.current as any)._timeoutId;
          console.log('HtmlCaptureScreen - 타임아웃 클리어됨 (성공)');
        }
        
        setIsCapturing(false);

        // Alert 표시 전에 navigation.goBack()을 호출하여 화면을 먼저 닫기
        navigation.goBack();
        
        // 화면이 닫힌 후 Alert 표시
        setTimeout(() => {
          Alert.alert('성공', '이미지가 갤러리에 저장되었습니다!');
        }, 100);
      } else if (data.type === 'error') {
        console.error('HtmlCaptureScreen - WebView에서 에러 수신:', data.message);
        
        // 타임아웃 명시적으로 클리어 (에러 시)
        if ((webViewRef.current as any)?._timeoutId) {
          clearTimeout((webViewRef.current as any)._timeoutId);
          delete (webViewRef.current as any)._timeoutId;
          console.log('HtmlCaptureScreen - 타임아웃 클리어됨 (에러)');
        }
        
        setIsCapturing(false);
        throw new Error(data.message || '이미지 생성 실패');
      } else {
        console.warn('HtmlCaptureScreen - 알 수 없는 메시지 타입:', data.type);
      }
    } catch (error: any) {
      console.error('HtmlCaptureScreen - 캡처 실패:', error);
      console.error('HtmlCaptureScreen - 에러 스택:', error.stack);
      
      // 타임아웃 명시적으로 클리어 (catch 블록)
      if ((webViewRef.current as any)?._timeoutId) {
        clearTimeout((webViewRef.current as any)._timeoutId);
        delete (webViewRef.current as any)._timeoutId;
        console.log('HtmlCaptureScreen - 타임아웃 클리어됨 (catch)');
      }
      
      setIsCapturing(false);
      
      Alert.alert('오류', `이미지 저장에 실패했습니다: ${error.message}`, [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {html && (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ 
            html: html || '',
            baseUrl: 'https://localhost'
          }}
          style={styles.webView}
          scalesPageToFit={false}
        onLoadEnd={() => {
          console.log('WebView 로드 완료');
          // 딜레이 최소화
          setTimeout(() => {
            setIsWebViewLoaded(true);
          }, 300);
        }}
          onMessage={handleWebViewMessage}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView 에러:', nativeEvent);
            Alert.alert('WebView 오류', `HTML 렌더링 중 오류 발생: ${nativeEvent.description}`, [
              { text: '확인', onPress: () => navigation.goBack() },
            ]);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState={true}
          renderToHardwareTextureAndroid={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        />
      )}
      {/* 처음부터 끝까지 동일한 오버레이 표시 */}
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.overlayText}>이미지 저장 중...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  webView: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    marginTop: 10,
    color: 'white',
    fontSize: 16,
  },
});

export default HtmlCaptureScreen;


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

interface HtmlCaptureScreenProps {
  navigation: StackNavigationProp<any>;
  route: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HtmlCaptureScreen: React.FC<HtmlCaptureScreenProps> = ({ navigation, route }) => {
  const { htmlKey, html: directHtml } = route.params || {};
  const webViewRef = useRef<WebView>(null);
  const [html, setHtml] = useState<string | null>(directHtml || null);
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const loadHtml = async () => {
      if (directHtml) {
        setHtml(directHtml);
        return;
      }

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
  }, [htmlKey, directHtml, navigation]);

  useEffect(() => {
    // WebView가 완전히 로드된 후에만 캡처
    if (html && isWebViewLoaded && !isCapturing) {
      // WebView 로드 완료 후 추가 딜레이 (폰트/이미지 로드 대기)
      const timer = setTimeout(() => {
        captureImageWithCanvas();
      }, 2000); // 2초 대기

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
                setTimeout(capture, 3000);
                return;
              }
              
              images.forEach((img) => {
                if (img.complete) {
                  loadedCount++;
                } else {
                  img.onload = () => {
                    loadedCount++;
                    if (loadedCount === totalImages) {
                      setTimeout(capture, 2000);
                    }
                  };
                  img.onerror = () => {
                    loadedCount++;
                    if (loadedCount === totalImages) {
                      setTimeout(capture, 2000);
                    }
                  };
                }
              });
              
              if (loadedCount === totalImages) {
                setTimeout(capture, 3000);
              } else {
                // 최대 10초 대기
                setTimeout(() => {
                  if (loadedCount < totalImages) {
                    console.log('일부 이미지 로딩 실패, 계속 진행...');
                    setTimeout(capture, 2000);
                  }
                }, 10000);
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
              
              // 고정 너비 사용 (1080px)
              const fixedWidth = 1080;
              // 실제 콘텐츠 높이 계산
              const contentHeight = Math.max(
                body.scrollHeight || body.offsetHeight,
                html.scrollHeight || html.offsetHeight,
                body.clientHeight || html.clientHeight
              );
              
              html2canvas(body, {
                backgroundColor: '#fff',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                width: fixedWidth,
                height: contentHeight,
                windowWidth: fixedWidth,
                windowHeight: contentHeight,
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                logging: false,
                imageTimeout: 30000, // 이미지 로딩 타임아웃 증가
                removeContainer: false,
                foreignObjectRendering: false
              }).then(canvas => {
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
        
        // 권한 요청
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('권한 필요', '갤러리에 저장하려면 권한이 필요합니다.', [
            { text: '확인', onPress: () => navigation.goBack() },
          ]);
          setIsCapturing(false);
          return;
        }

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
          // Android의 외부 캐시 디렉토리
          const androidCachePath = '/storage/emulated/0/Android/data/com.bjooyoung.petconstitutionmobile.dev/cache/';
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

  if (!html) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#555" />
        <Text style={styles.loadingText}>결과를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          // 추가 딜레이를 두고 로드 완료 상태로 설정 (폰트/이미지 로드 대기)
          setTimeout(() => {
            setIsWebViewLoaded(true);
          }, 1000);
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
      {isCapturing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>이미지 저장 중...</Text>
        </View>
      )}
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


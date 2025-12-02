import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { globalStyles } from '../styles/globalStyles';

interface FindAccountScreenProps {
  navigation: StackNavigationProp<any>;
  onFindId: (nickname: string) => Promise<{ success: boolean; message?: string }>;
  onFindPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
}

const FindAccountScreen: React.FC<FindAccountScreenProps> = ({ 
  navigation, 
  onFindId, 
  onFindPassword 
}) => {
  const [mode, setMode] = useState<'id' | 'password'>('id');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (mode === 'id') {
      // 아이디 찾기: 닉네임
      if (!nickname.trim()) {
        setMessage('닉네임을 입력해주세요.');
        return;
      }
    } else {
      // 비밀번호 찾기: 이메일
      if (!email.trim()) {
        setMessage('이메일을 입력해주세요.');
        return;
      }
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      let result;
      if (mode === 'id') {
        result = await onFindId(nickname.trim());
      } else {
        result = await onFindPassword(email.trim());
      }
      
      if (result.success) {
        if (mode === 'password') {
          // 비밀번호 찾기 성공 시 코드 입력 화면으로 이동
          const resetCode = result.message?.match(/코드: (\w+)/)?.[1] || '';
          const resetToken = result.message?.match(/토큰: (\w+)/)?.[1] || '';
          navigation.navigate('ResetPasswordCode', { 
            email: email.trim(), 
            resetCode: resetCode,
            resetToken: resetToken
          });
        } else {
          // 아이디 찾기 성공 시 메시지 표시
          setMessage(result.message || '요청이 완료되었습니다.');
          Alert.alert(
            '완료', 
            result.message || '요청이 완료되었습니다.',
            [{ text: '확인', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        setMessage(result.message || '오류가 발생했습니다.');
      }
    } catch (error) {
      setMessage('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNickname('');
    setEmail('');
    setMessage('');
  };

  const switchMode = (newMode: 'id' | 'password') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, globalStyles.scrollContent]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>🔍 계정 찾기</Text>
            <Text style={styles.subtitle}>아이디 또는 비밀번호를 찾아보세요</Text>
          </View>

          <View style={styles.form}>
            {/* 탭 버튼 */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, mode === 'id' && styles.activeTab]}
                onPress={() => switchMode('id')}
                disabled={isLoading}
              >
                <Text style={[styles.tabText, mode === 'id' && styles.activeTabText]}>
                  아이디 찾기
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, mode === 'password' && styles.activeTab]}
                onPress={() => switchMode('password')}
                disabled={isLoading}
              >
                <Text style={[styles.tabText, mode === 'password' && styles.activeTabText]}>
                  비밀번호 찾기
                </Text>
              </TouchableOpacity>
            </View>

            {/* 설명 */}
            <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              {mode === 'id' 
                ? '가입 시 사용한 닉네임을 입력하시면 아이디를 확인할 수 있습니다.'
                : '가입 시 사용한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.'
              }
            </Text>
            </View>

            {/* 아이디 찾기: 닉네임 */}
            {mode === 'id' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>닉네임</Text>
                <TextInput
                  style={styles.input}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="가입 시 사용한 닉네임을 입력하세요"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            )}

            {/* 비밀번호 찾기: 이메일 */}
            {mode === 'password' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>이메일</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="가입 시 사용한 이메일을 입력하세요"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            )}

            {/* 메시지 표시 */}
            {message ? (
              <View style={[styles.messageContainer, message.includes('완료') || message.includes('발송') ? styles.successMessage : styles.errorMessage]}>
                <Text style={[styles.messageText, message.includes('완료') || message.includes('발송') ? styles.successMessageText : styles.errorMessageText]}>
                  {message}
                </Text>
              </View>
            ) : null}

            {/* 제출 버튼 */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading || (mode === 'id' ? !nickname.trim() : !email.trim())}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading 
                  ? (mode === 'id' ? '아이디 찾는 중...' : '이메일 발송 중...') 
                  : (mode === 'id' ? '아이디 찾기' : '비밀번호 재설정')
                }
              </Text>
            </TouchableOpacity>

            {/* 뒤로가기 버튼 */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.backButtonText}>뒤로가기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  descriptionContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  successMessage: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  messageText: {
    fontSize: 14,
    textAlign: 'center',
  },
  successMessageText: {
    color: '#155724',
  },
  errorMessageText: {
    color: '#721c24',
  },
  primaryButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default FindAccountScreen;

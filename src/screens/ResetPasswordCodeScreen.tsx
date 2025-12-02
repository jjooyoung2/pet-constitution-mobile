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
import { RouteProp } from '@react-navigation/native';
import { globalStyles } from '../styles/globalStyles';

type RootStackParamList = {
  ResetPasswordCode: { email: string; resetCode: string; resetToken: string };
  ResetPassword: { email: string; resetToken: string };
};

interface ResetPasswordCodeScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'ResetPasswordCode'>;
  route: RouteProp<RootStackParamList, 'ResetPasswordCode'>;
}

const ResetPasswordCodeScreen: React.FC<ResetPasswordCodeScreenProps> = ({ navigation, route }) => {
  const { email, resetCode, resetToken } = route.params;
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleVerifyCode = async () => {
    if (!inputCode.trim()) {
      setMessage('코드를 입력해주세요.');
      return;
    }

    if (inputCode.toUpperCase() !== resetCode) {
      setMessage('코드가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // 코드가 일치하면 비밀번호 재설정 화면으로 이동
      navigation.navigate('ResetPassword', { email, resetToken });
    } catch (error) {
      console.error('Code verification error:', error);
      setMessage('코드 확인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
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
            <Text style={styles.title}>비밀번호 재설정</Text>
            <Text style={styles.subtitle}>이메일로 전송된 코드를 입력해주세요.</Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>인증 코드</Text>
              <TextInput
                style={styles.input}
                value={inputCode}
                onChangeText={setInputCode}
                placeholder="6자리 코드 입력"
                maxLength={6}
                autoCapitalize="characters"
                editable={!isLoading}
              />
            </View>

            {message ? (
              <View style={[styles.messageContainer, message.includes('일치') ? styles.errorMessage : styles.successMessage]}>
                <Text style={[styles.messageText, message.includes('일치') ? styles.errorMessageText : styles.successMessageText]}>
                  {message}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleVerifyCode}
              disabled={isLoading || !inputCode.trim()}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? '확인 중...' : '코드 확인'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.backButtonText}>취소</Text>
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
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 10,
  },
  emailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    textAlign: 'center',
    letterSpacing: 2,
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
    marginTop: 15,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  successMessage: {
    backgroundColor: '#d4edda',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
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
});

export default ResetPasswordCodeScreen;

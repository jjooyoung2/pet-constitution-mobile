import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { consultationAPI } from '../services/api';
import { globalStyles } from '../styles/globalStyles';

interface ConsultationScreenProps {
  navigation: StackNavigationProp<any>;
  isLoggedIn: boolean;
  token: string | null;
}

const ConsultationScreen: React.FC<ConsultationScreenProps> = ({
  navigation,
  isLoggedIn,
  token,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    preferredDate: '',
    content: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || selectedDate;
    if (currentDate) {
      setSelectedDate(currentDate);
      const dateString = currentDate.toISOString().split('T')[0];
      setFormData({ ...formData, preferredDate: dateString });
    }
    // Android에서는 날짜 선택 후 자동으로 닫힘
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const handleDateConfirm = () => {
    setShowDatePicker(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // 이미 제출 중이면 무시
    
    if (!formData.name || !formData.phone || !formData.content) {
      Alert.alert('오류', '필수 정보를 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true); // 로딩 시작

    // preferredDate가 없으면 오늘 날짜로 설정
    const submitData = {
      ...formData,
      preferredDate: formData.preferredDate || new Date().toISOString().split('T')[0]
    };

    try {
      // token을 직접 가져오기
      const authToken = await AsyncStorage.getItem('authToken');
      
      // 상담 문의 API 호출
      console.log('상담 문의 제출:', submitData);
      console.log('Using token:', authToken ? authToken.substring(0, 20) + '...' : 'null');
      const response = await consultationAPI.createConsultation(submitData, authToken);
      
      if (response.success) {
        Alert.alert('성공', '상담 문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.');
        navigation.goBack();
      } else {
        Alert.alert('오류', response.message || '상담 문의 접수에 실패했습니다.');
      }
    } catch (error) {
      console.error('상담 문의 오류:', error);
      Alert.alert('오류', '상담 문의 접수 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false); // 로딩 종료
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={globalStyles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.header}>
          <Text style={styles.title}>상담 문의</Text>
          <Text style={styles.subtitle}>전문 수의사와 상담하세요</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이름 *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="이름을 입력하세요"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>연락처 *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="연락처를 입력하세요"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>희망 상담일</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formData.preferredDate ? formatDate(selectedDate) : '날짜를 선택하세요'}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <Text style={styles.datePickerTitle}>희망 상담일을 선택하세요</Text>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  style={styles.datePicker}
                  locale="ko-KR"
                />
                {Platform.OS === 'ios' && (
                  <View style={styles.datePickerButtons}>
                    <TouchableOpacity 
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerButtonText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.datePickerButton, styles.datePickerButtonConfirm]}
                      onPress={handleDateConfirm}
                    >
                      <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextConfirm]}>선택</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>상담 내용 *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.content}
              onChangeText={(text) => setFormData({ ...formData, content: text })}
              placeholder="상담하고 싶은 내용을 자세히 입력해주세요"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={[styles.submitButtonText, isSubmitting && styles.submitButtonTextDisabled]}>
              {isSubmitting ? '처리 중...' : '상담 문의하기'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>뒤로 가기</Text>
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
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  datePickerContainer: {
    marginTop: 15,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  datePicker: {
    backgroundColor: 'white',
    width: '100%',
    alignSelf: 'center',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  datePickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  datePickerButtonConfirm: {
    backgroundColor: '#4A90E2',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  datePickerButtonTextConfirm: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
  backButton: {
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default ConsultationScreen;


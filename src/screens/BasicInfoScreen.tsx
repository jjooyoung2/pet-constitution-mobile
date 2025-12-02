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
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PetInfo } from '../types';
import { globalStyles, colors, fontSizes, fonts, scale, getFontFamily } from '../styles/globalStyles';
import BottomNavigation from '../components/BottomNavigation';

interface BasicInfoScreenProps {
  navigation: StackNavigationProp<any>;
  isLoggedIn: boolean;
  token: string | null;
}

const BasicInfoScreen: React.FC<BasicInfoScreenProps> = ({
  navigation,
  isLoggedIn,
  token,
}) => {
  const [petInfo, setPetInfo] = useState<PetInfo>({
    name: '',
    age: '',
    weight: '',
    symptoms: '',
    petType: 'dog', // 기본값: 강아지
  });

  const handleSubmit = () => {
    // 필수 입력 확인 제거 - 바로 이동
    console.log('BasicInfoScreen - petInfo:', petInfo);
    console.log('BasicInfoScreen - petInfo.petType:', petInfo.petType);
    console.log('BasicInfoScreen - petInfo 전체:', JSON.stringify(petInfo, null, 2));
    navigation.navigate('Survey', { petInfo });
  };

  const handleSkip = () => {
    // 건너뛰기: 현재 입력된 정보로 설문으로 이동
    console.log('BasicInfoScreen - Skip:', petInfo);
    console.log('BasicInfoScreen - Skip petInfo.petType:', petInfo.petType);
    console.log('BasicInfoScreen - Skip petInfo 전체:', JSON.stringify(petInfo, null, 2));
    navigation.navigate('Survey', { petInfo });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={globalStyles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>기본 정보</Text>
          <Text style={styles.subtitle}>이름 입력만으로도 검사가 가능합니다.</Text>
          <Text style={styles.subtitle}>다만, 세부 정보를 입력할 수록 결과의 정확도가 높아집니다.</Text>
        </View>

        <View style={styles.form}>
          {/* 반려동물 종류 선택 (라디오 버튼) */}
          <View style={styles.inputGroup}>
            <Text style={styles.requiredInput}>*필수</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  petInfo.petType === 'dog' && styles.radioButtonSelected,
                ]}
                onPress={() => setPetInfo({ ...petInfo, petType: 'dog' })}
              >
                <View style={styles.radioButtonContent}>
                  <Text style={styles.radioText}>
                    강아지
                  </Text>
                  <Image 
                    source={require('../../assets/images/basicinfo-dog.png')} 
                    style={styles.radioImage}
                  />
                </View>
              </TouchableOpacity>
              
              <View style={styles.separator} />
              
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  petInfo.petType === 'cat' && styles.radioButtonSelected,
                ]}
                onPress={() => setPetInfo({ ...petInfo, petType: 'cat' })}
              >
                <View style={styles.radioButtonContent}>
                  <Text style={styles.radioText}>
                    고양이
                  </Text>
                  <Image 
                    source={require('../../assets/images/basicinfo-cat.png')} 
                    style={styles.radioImage}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>반려동물 이름</Text>
            <TextInput
              style={styles.input}
              value={petInfo.name}
              onChangeText={(text) => setPetInfo({ ...petInfo, name: text })}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#999999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>나이</Text>
            <TextInput
              style={styles.input}
              value={petInfo.age}
              onChangeText={(text) => setPetInfo({ ...petInfo, age: text })}
              placeholder="예: 3세, 1년 6개월"
              placeholderTextColor="#999999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>체중</Text>
            <TextInput
              style={styles.input}
              value={petInfo.weight}
              onChangeText={(text) => setPetInfo({ ...petInfo, weight: text })}
              placeholder="예: 5kg, 3.2kg"
              placeholderTextColor="#999999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>주요 증상</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={petInfo.symptoms}
              onChangeText={(text) => setPetInfo({ ...petInfo, symptoms: text })}
              placeholder="현재 보이는 증상이나 걱정되는 부분을 입력하세요"
              placeholderTextColor="#999999"
              multiline
              numberOfLines={3}
            />
          </View>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>다음으로</Text>
            <Text style={styles.skipArrow}>▶</Text>
          </TouchableOpacity>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ※ 본 검사는 참고용이며, 정확한 진단을 위해서는{'\n'}
              내원 후 X-ray/혈액/초음파 등의 정밀검사가 필요합니다.
            </Text>
          </View>


        </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNavigation navigation={navigation} currentScreen="BasicInfo" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee9e5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: scale(120),
    paddingBottom: scale(500),
    paddingHorizontal: scale(140),
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: scale(30),
    marginTop: scale(20),
  },
  title: {
    fontSize: scale(64),
    color: '#0e0e0e',
    marginBottom: scale(40),
    fontFamily: getFontFamily('bold'),
  },
  subtitle: {
    fontSize: scale(32),
    lineHeight: scale(46),
    color: '#0e0e0e',
    fontFamily: getFontFamily('regular'),
  },
  form: {
    flex: 1,
    marginTop: scale(50),
  },
  inputGroup: {
    marginBottom: scale(20),
  },
  label: {
    fontSize: scale(48),
    color: '#0e0e0e',
    marginBottom: scale(30),
    marginTop: scale(45),
    fontFamily: getFontFamily('bold'),
  },
  input: {
    borderRadius: scale(10),
    height: scale(90),
    paddingLeft: scale(30),
    paddingVertical: scale(10),
    fontSize: scale(36),
    backgroundColor: '#ffffff',
    fontFamily: getFontFamily('regular'),
  },
  textArea: {
    height: scale(90),
    textAlignVertical: 'top',
    paddingTop: scale(20),
  },
  requiredInput: {
    fontSize: scale(32),
    color: '#bc0000',
    fontFamily: getFontFamily('regular'),
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: scale(10),
    alignItems: 'stretch',
    gap: scale(10),
  },
  radioButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(12),
    borderWidth: scale(4),
    borderColor: '#ffffff',
    borderRadius: scale(10),
    backgroundColor: '#ffffff',
  },
  radioButtonSelected: {
    borderWidth: scale(4),
    borderColor: '#5b6751',
  },
  separator: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: scale(10),
  },
  radioButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  radioText: {
    fontSize: scale(46),
    color: '#0e0e0e',
    fontFamily: getFontFamily('bold'),
  },
  radioImage: {
    width: scale(60),
    height: scale(60),
    resizeMode: 'contain',
  },
  disclaimer: {
    marginTop: scale(80),
    marginBottom: scale(20),
  },
  disclaimerText: {
    fontSize: scale(32),
    color: '#0e0e0e',
    lineHeight: scale(46),
    fontFamily: getFontFamily('regular'),
  },
  skipButton: {
    flexDirection: 'row',
    backgroundColor: '#ccbeb1',
    paddingVertical: scale(30),
    paddingHorizontal: scale(10),
    borderRadius: scale(66),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(50),
    alignSelf: 'flex-end',
    minWidth: scale(252),
  },
  skipButtonText: {
    color: '#0e0e0e',
    fontSize: scale(38),
    fontFamily: getFontFamily('bold'),
  },
  skipArrow: {
    color: '#0e0e0e',
    fontSize: scale(38),
    marginLeft: scale(5),
    fontFamily: getFontFamily('regular'),
  },
});

export default BasicInfoScreen;


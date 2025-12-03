import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { questions } from '../data/questions';
import { globalStyles, scale, fonts, getFontFamily } from '../styles/globalStyles';

interface SurveyScreenProps {
  navigation: StackNavigationProp<any>;
  route: any;
  isLoggedIn: boolean;
  token: string | null;
}

const SurveyScreen: React.FC<SurveyScreenProps> = ({
  navigation,
  route,
  isLoggedIn,
  token,
}) => {
  const insets = useSafeAreaInsets();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const { petInfo } = route.params || {};

  const handleAnswer = (optionIndex: number) => {
    const selectedType = questions[currentQuestion].options[optionIndex].type;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedType;
    setAnswers(newAnswers);

    // 마지막 페이지가 아닌 경우에만 자동으로 다음 문항으로 이동
    // 선택된 답변의 CSS 피드백을 보여주기 위해 약간의 딜레이 추가
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300); // 300ms 딜레이
    }
    // 마지막 페이지에서는 답변만 저장하고 자동 이동하지 않음
  };

  const handleSubmit = () => {
    // 모든 답변이 채워졌는지 확인
    if (answers.length !== questions.length) {
      // 마지막 문항이 답변되지 않은 경우
      return;
    }

    // 설문 완료
    console.log('SurveyScreen - petInfo from route:', petInfo);
    console.log('SurveyScreen - answers:', answers);
    
    navigation.navigate('Results', { 
      petInfo: petInfo,
      answers: answers 
    });
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      navigation.goBack();
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;
  const currentAnswer = answers[currentQuestion];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (styles.scrollContent.paddingBottom as number || scale(40)) + insets.bottom }
        ]}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            
            {/* 진행률 바 */}
            <View style={styles.progressContainer}>
              {/* 배경 그림자 이미지 (::before처럼) */}
              <View style={styles.progressBarShadow}>
                <Image 
                  source={require('../../assets/images/surveyscreen-shadow.png')} 
                  style={styles.shadowImage}
                  resizeMode="stretch"
                />
              </View>
              {/* 프로그레스바 (위에 겹침) */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              {/* 퍼센트 표시 원 */}
              <View style={[
                styles.percentBadge,
                { 
                  left: progress >= 100 
                    ? '100%' 
                    : `${progress}%`, 
                  transform: progress >= 100 
                    ? [{ translateX: scale(-42.5) }] 
                    : [{ translateX: scale(-25) }]
                }
              ]}>
                <View style={styles.percentTextContainer}>
                  <Text style={styles.percentNumber}>{Math.round(progress)}</Text>
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.question}>
              Q. {questions[currentQuestion].question}
            </Text>

            <View style={styles.optionsContainer}>
              {questions[currentQuestion].options.map((option, index) => {
                const isSelected = currentAnswer === option.type;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleAnswer(index)}
                  >
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Image 
                          source={require('../../assets/images/surveyscreen-checked.png')} 
                          style={styles.checkImage}
                        />
                      </View>
                    )}
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}>
                      {option.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.navigation}>
          {isLastQuestion ? (
            <>
              <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <View style={styles.backButtonContent}>
                  <Text style={styles.backArrow}>◀</Text>
                  <Text style={styles.backButtonText}>이전답변</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !currentAnswer && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!currentAnswer}
              >
                <View style={styles.submitButtonContent}>
                  <Text style={styles.submitButtonText}>제출하기</Text>
                  <Text style={styles.submitArrow}>▶</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <View style={styles.backButtonContent}>
                <Text style={styles.backArrow}>◀</Text>
                <Text style={styles.backButtonText}>이전답변</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        </View>
      </ScrollView>
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
  },
  content: {
    paddingHorizontal: scale(150),
    paddingVertical: scale(150),
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
    fontFamily: getFontFamily('bold'),
  },
  progressContainer: {
    width: '100%',
    height: scale(33),
    marginTop: scale(20),
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: scale(25),
  },
  progressBarShadow: {
    position: 'absolute',
    width: '100%',
    height: scale(33),
    top: 0,
    left: 0,
    zIndex: 3,
  },
  shadowImage: {
    width: '100%',
    height: '100%',
  },
  progressBar: {
    width: '100%',
    height: scale(33),
    backgroundColor: '#ffffff',
    borderRadius: scale(16.5),
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ccbeb1',
    borderRadius: scale(16.5),
    position: 'absolute',
    left: 0,
    top: 0,
  },
  percentBadge: {
    position: 'absolute',
    width: scale(85),
    height: scale(85),
    borderRadius: '50%',
    backgroundColor: '#2d3a28',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    zIndex: 10,
    marginBottom: scale(10)
  },
  percentTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  percentNumber: {
    color: '#ffffff',
    fontSize: scale(30),
    fontFamily: getFontFamily('extraBold'),
    textAlign: 'center',
  },
  percentSymbol: {
    color: '#ffffff',
    fontSize: scale(24),
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  questionContainer: {
  },
  question: {
    fontSize: scale(48),
    fontFamily: getFontFamily('bold'),
    color: '#0e0e0e',
    marginBottom: scale(150),
    marginTop: scale(100),
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: scale(10),
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: scale(26),
    paddingHorizontal: scale(26),
    borderRadius: scale(15),
    borderWidth: scale(8),
    borderColor: '#ccccc8',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(46),
  },
  optionButtonSelected: {
    backgroundColor: '#d9e2d1',
    borderColor: '#2d3a28',
  },
  checkIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  checkImage: {
    width: scale(50),
    height: scale(50),
    resizeMode: 'cover',
  },
  optionText: {
    fontSize: scale(40),
    color: '#0e0e0e',
    textAlign: 'center',
    flex: 1,
    fontFamily: getFontFamily('bold'),
  },
  optionTextSelected: {
    color: '#0e0e0e',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(50),
    marginTop: scale(200),
  },
  backButton: {
    backgroundColor: '#ccbeb1',
    paddingVertical: scale(24),
    paddingHorizontal: scale(40),
    borderRadius: scale(66),
    minWidth: scale(220),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#0e0e0e',
    fontSize: scale(38),
    lineHeight: scale(50),
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  backArrow: {
    color: '#0e0e0e',
    fontSize: scale(38),
    lineHeight: scale(50),
    fontFamily: getFontFamily('regular'),
    marginRight: scale(5),
  },
  submitButton: {
    backgroundColor: '#5b6751',
    paddingVertical: scale(24),
    paddingHorizontal: scale(40),
    borderRadius: scale(66),
    minWidth: scale(220),
  },
  submitButtonDisabled: {
    backgroundColor: 'rgb(168, 168, 168)',
    opacity: 0.5,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: scale(38),
    lineHeight: scale(50),
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  submitArrow: {
    color: 'white',
    fontSize: scale(38),
    lineHeight: scale(50),
    fontFamily: getFontFamily('regular'),
    marginLeft: scale(5),
  },
});

export default SurveyScreen;

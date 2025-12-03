import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ImageBackground,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { globalStyles, scale, getFontFamily } from '../styles/globalStyles';
import BottomNavigation from '../components/BottomNavigation';

interface ManagementMethodsScreenProps {
  navigation: StackNavigationProp<any>;
}

const ManagementMethodsScreen: React.FC<ManagementMethodsScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.mainContainer}>
          {/* 상단 헤더 */}
          <View style={styles.header}>
            <Image source={require('../../assets/images/management-line.png')} style={styles.lineImage} />
            <Text style={styles.mainTitle}>"체질이 다르면 관리도 달라야 합니다."</Text>
            <Text style={styles.introText}>
              오행 체질 검사는 아이의 기질과 장부 균형(목ㆍ화ㆍ토ㆍ금ㆍ수)을{"\n"}
              점수화 해 주체질과 보조 체질을 도출합니다.{"\n"}
              {"\n"}
              주체질은 현재 몸의 중심 경향,{"\n"}
              보조 체질은 상황에 따라 드러나는 보완 성향을 뜻합니다.{"\n"}
              {"\n"}
              결과는 식단 선택, 계절 관리,{"\n"}
              재활ㆍ침구ㆍ한약 처방의 방향을 정하는 지침으로 활용됩니다.
            </Text>
          </View>

          {/* 주체질 + 보조 체질 조합 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image source={require('../../assets/images/management-play.png')} style={styles.playIcon} />
              <Text style={styles.sectionTitle}>주체질 + 보조 체질 조합</Text>
            </View>
            
            <View style={styles.combinationItem}>
              <Text style={styles.combinationTitle}>목(木)+화(火)</Text>
              <Text style={styles.combinationDescription}>
                활동성과 열감이 높아{"\n"}
                집중력 저하와 갈증이 나타날 수 있습니다.{"\n"}
                닭고기와 보리를 기본으로, 수분이 많은 채소{"\n"}
                및 과일(오이, 수박) 등을 소량으로 곁들여 급여해보세요.{"\n"}
                또한 한낮 야외활동은 줄이고,{"\n"}
                열과 스트레스를 함께 관리하는 것이 좋습니다.
              </Text>
            </View>

            <View style={styles.combinationItem}>
              <Text style={styles.combinationTitle}>토(土)+금(金)</Text>
              <Text style={styles.combinationDescription}>
                소화기 부담과 건조 민감이 함께 올 수 있으니,{"\n"}
                찹쌀로 위를 보호하고 오리고기와 배를 활용해{"\n"}
                건조함을 보완해보세요.{"\n"}
                건조한 날에는 실내 습도 조절과 피부 보습 루틴을{"\n"}
                꾸준히 유지하는 것을 권장합니다.
              </Text>
            </View>

            <View style={[styles.combinationItem, styles.combinationItemLast]}>
              <Text style={styles.combinationTitle}>수(水)+목(木)</Text>
              <Text style={styles.combinationDescription}>
                추위 민감과 근육, 힘줄 긴장이 겹칠 수 있습니다.{"\n"}
                양고기와 흑미로 온기를 돋우고,{"\n"}
                스트레칭형 산책과 저강도 근력 루틴을 권장합니다.
              </Text>
            </View>
          </View>
          <Text style={styles.noteText}>
              ※조합 해석은 생활 습관과 계절, 기존 질환에 따라 달라질 수 있습니다.
          </Text>

          {/* 체질에 맞는 음식 추천 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image source={require('../../assets/images/management-play.png')} style={styles.playIcon} />
              <Text style={styles.sectionTitle}>체질에 맞는 음식 추천</Text>
            </View>
            
            <View style={styles.paddingWrap}>
              <View style={styles.foodRecommendationItem}>
                <Text style={styles.constitutionName}>목(木)</Text>
                <Text style={styles.foodList}>닭고기/보리/브로콜리/사과</Text>
              </View>

              <View style={styles.foodRecommendationItem}>
                <Text style={styles.constitutionName}>화(火)</Text>
                <Text style={styles.foodList}>칠면조/현미/오이/수박</Text>
              </View>

              <View style={styles.foodRecommendationItem}>
                <Text style={styles.constitutionName}>토(土)</Text>
                <Text style={styles.foodList}>소고기/찹쌀/단호박/배</Text>
              </View>

              <View style={styles.foodRecommendationItem}>
                <Text style={styles.constitutionName}>금(金)</Text>
                <Text style={styles.foodList}>오리고기/조/무/배</Text>
              </View>

              <View style={[styles.foodRecommendationItem, styles.foodRecommendationItemLast]}>
                <Text style={styles.constitutionName}>수(水)</Text>
                <Text style={styles.foodList}>양고기/흑미/시금치/블루베리</Text>
              </View>
            </View>
          </View>

          {/* 주의해야 할 음식 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image source={require('../../assets/images/management-play.png')} style={styles.playIcon} />
              <Text style={styles.sectionTitle}>주의해야 할 음식</Text>
            </View>
            
            <View style={styles.paddingWrap}>
              <Text style={styles.warningIntro}>
                체질 특성상 열을 과도하게 높이거나 수분을 고갈시키는 음식,{"\n"}
                그리고 소화에 부담을 줄 수 있는 재료들입니다.
              </Text>

              <View style={styles.warningItem}>
                <Text style={styles.constitutionName}>목(木)</Text>
                <Text style={styles.warningFoodList}>자극적이고 기름진 간식, 불규칙한 급여</Text>
              </View>

              <View style={styles.warningItem}>
                <Text style={styles.constitutionName}>화(火)</Text>
                <Text style={styles.warningFoodList}>
                  기름진 붉은 고기 과다, 매우 자극적인 간식,{"\n"}
                  뜨거운 환경에서의 건조 간식 급여
                </Text>
              </View>

              <View style={styles.warningItem}>
                <Text style={styles.constitutionName}>토(土)</Text>
                <Text style={styles.warningFoodList}>고탄수 간식 남용, 급격한 사료 교체, 과일 과다 급여</Text>
              </View>

              <View style={styles.warningItem}>
                <Text style={styles.constitutionName}>금(金)</Text>
                <Text style={styles.warningFoodList}>건조 간식 과다 급여, 향이 강한 간식</Text>
              </View>

              <View style={[styles.warningItem, styles.warningItemLast]}>
                <Text style={styles.constitutionName}>수(水)</Text>
                <Text style={styles.warningFoodList}>냉한 음식 과다 급여, 겨울철 찬 물, 얼음 급여</Text>
              </View>
            </View>
          </View>

          {/* 계절 및 환경 주의 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Image source={require('../../assets/images/management-play.png')} style={styles.playIcon} />
              <Text style={styles.sectionTitle}>계절 및 환경 주의</Text>
            </View>

            <View style={styles.paddingWrap}>
              <View style={styles.seasonItem}>
                <Text style={styles.seasonTitle}>봄(바람, 건조 변동)</Text>
                <Text style={styles.seasonDescription}>목(木)과 금(金) 주의(알레르기/피부ㆍ호흡)</Text>
                <Text style={styles.seasonDescription2}>→ 환기와 보습 균형</Text>
                <Text style={styles.seasonDescription3}>
                  알레르기 / 피부 / 호흡기 관리,{"\n"}
                  산책 후 발 / 피부 세정 및 보습
                </Text>
              </View>

              <View style={styles.seasonItem}>
                <Text style={styles.seasonTitle}>여름(열/습)</Text>
                <Text style={styles.seasonDescription}>화(火)와 토(土) 주의(갈증/소화)</Text>
                <Text style={styles.seasonDescription2}>→ 한낮 산책 피하기, 미지근한 물 자주 급여</Text>
                <Text style={styles.seasonDescription3}>
                  한낮 산책 피하고 짧고 잦은 산책 권장,{"\n"}
                  미지근한 물 상시 제공 / 차에 홀로 두지 않기
                </Text>
              </View>

              <View style={styles.seasonItem}>
                <Text style={styles.seasonTitle}>가을(건조)</Text>
                <Text style={styles.seasonDescription}>금(金) 주의(호흡/피부)</Text>
                <Text style={styles.seasonDescription2}>→ 실내 습도 관리, 보습 케어</Text>
                <Text style={styles.seasonDescription3}>
                  가습, 실내 공기질 관리 / 건조 간식 제한
                </Text>
              </View>

              <View style={[styles.seasonItem, styles.seasonItemLast]}>
                <Text style={styles.seasonTitle}>겨울(한기)</Text>
                <Text style={styles.seasonDescription}>수(水) 주의(관절, 신장, 방광)</Text>
                <Text style={styles.seasonDescription2}>→ 체온 유지, 찬 음식 급여 피하기</Text>
                <Text style={styles.seasonDescription3}>
                  의류 및 매트로 체온 유지 / 관절 보온 / 찬 물, 얼음 피하기
                </Text>
              </View>  
            </View>
          </View>

          {/* 치료 및 케어 권장 */}
          <View >
            <Text style={styles.treatmentMainTitle}>치료 및 케어 권장</Text>
            
            <View style={[styles.treatmentItem, styles.treatmentItemFirst]}>
              <Text style={styles.treatmentTitle}>정밀진단</Text>
              <Text style={styles.treatmentDescription}>
                X-ray로 뼈와 관절, 흉복부 구조를 확인하고, 초음파로 장기 상태,{"\n"}
                혈액검사로 염증 여부와 장기 기능을 살펴봅니다.{"\n"}
                이를 통해 현재 건강 상태와 질병의 원인을 객관적으로 파악할 수 있습니다.
              </Text>
            </View>

            <View style={styles.treatmentItem}>
              <Text style={styles.treatmentTitle}>침구·뜸</Text>
              <Text style={styles.treatmentDescription}>
                통증 완화하고 혈류를 개선하며, 신경 기능 회복을 돕습니다.{"\n"}
                특히 만성적인 관절 및 신경 질환에 효과적입니다.
              </Text>
            </View>

            <View style={styles.treatmentItem}>
              <Text style={styles.treatmentTitle}>저온 레이저 마사지 치료</Text>
              <Text style={styles.treatmentDescription}>
                일반 레이저 원리를 활용하면서도{"\n"}
                저온 방식으로 화상 위험 없이 안전하게 전신 부위에 적용 가능합니다.{"\n"}
                근육 긴장 완화, 미세순환 촉진, 회복력 향상에 도움이 되며{"\n"}
                침ㆍ뜸과 병행 시 효과가 더욱 높아집니다.
              </Text>
            </View>

            <View style={styles.treatmentItem}>
              <Text style={styles.treatmentTitle}>체질 맞춤 한약</Text>
              <Text style={styles.treatmentDescription}>
                체질과 증상에 맞춰 면역, 염증, 장부 기능의 균형을 조절합니다.{"\n"}
                복용 용량과 기간은 아이의 체중, 검사 결과, 경과에 따라 세밀 조정합니다.
              </Text>
            </View>

            <View style={styles.treatmentItem}>
              <Text style={styles.treatmentTitle}>서양의학적 처치</Text>
              <Text style={styles.treatmentDescription}>
                급성 감염, 외상, 수술 적응 등에는{"\n"}
                항염제ㆍ소염제ㆍ수액ㆍ수술 등 표준 치료를 우선 적용합니다.{"\n"}
                한방 치료는 회복과 재발 방지에 보조 및 상승 효과를 기대할 수 있습니다.
              </Text>
            </View>
          </View>

          {/* 급여 및 투약 TIP */}
          <View style={styles.section2}>
            <View style={styles.tipHeader}>
              <View style={styles.tipBubble}>
                <Image source={require('../../assets/images/management-tip.png')} style={styles.tipBubbleImage} />
              </View>
              <Text style={styles.tipTitle}>급여 및 투약 TIP</Text>
            </View>
            
            <Text style={styles.tipContent}>
              새로운 재료는 3~5일간 소량 도입 후 대변, 피부, 활동성 변화를 관찰하세요.{"\n"}
              간식은 하루 총열량의 10% 내에서 조절하고,{"\n"}
              체중과 활동량에 따라 주 단위로 급식량을 미세 조정합니다.{"\n"}
              한약ㆍ영양제ㆍ서양약을 함께 사용할 때는 상호작용을 고려해{"\n"}
              투약 간격과 용량을 병원 지시에 맞춰 주세요.
            </Text>
            <Text style={styles.tipContent2}>
              장기 관리가 필요한 만성 질환은 4-8주 단위로 재검사하고,{"\n"}
              계절 전환기엔 식단과 운동 루틴을 다시 점검하는 것이 좋습니다.
            </Text>
            
            <ImageBackground 
              source={require('../../assets/images/management-balloon.png')} 
              style={styles.speechBubble}
              resizeMode="contain"
            >
              <Text style={styles.speechBubbleText}>
                오행 결과는 아이의 현재 경향을 읽는 지도입니다.{"\n"}
                오늘의 환경, 계절, 스트레스, 기존 질환에 따라 조정이 필요하며,{"\n"}
                정밀검사와 문진을 통해 맞춤 처방을 완성합니다.
              </Text>
              <Text style={styles.speechBubbleText2}>
                예약 또는 추가 상담을 원하시면 언제든 문의 주세요.{"\n"}
                온솔 양한방 동물병원이 아이의 오늘의 편안함과{"\n"}
                내일의 건강을 함께 설계하겠습니다.
              </Text>
            </ImageBackground>
          </View>

          {/* 하단 일러스트 */}
          <View style={styles.illustrationContainer}>
            <Image 
              source={require('../../assets/images/management-bg.png')} 
              style={styles.illustrationBg}
              resizeMode="cover"
            />
            <Image 
              source={require('../../assets/images/management-doctor.png')} 
              style={styles.illustrationDoctor}
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>
      
      <BottomNavigation navigation={navigation} currentScreen="ManagementMethods" />
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
    paddingTop: scale(140),
    paddingHorizontal: scale(120),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scale(180),
  },
  mainContainer: {
    // paddingBottom: scale(100), // 일러스트가 바닥에 딱 붙도록 제거
  },
  header: {
    marginBottom: scale(30),
    marginTop: scale(20),
  },
  lineImage:{
    width: scale(580),
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  mainTitle: {
    fontSize: scale(52),
    color: '#498a36',
    textAlign: 'center',
    marginTop: scale(50),
    marginBottom: scale(40),
    fontFamily: getFontFamily('heavy'),
  },
  introText: {
    fontSize: scale(30),
    color: '#0e0e0e',
    lineHeight: scale(45),
    textAlign: 'center',
    fontFamily: getFontFamily('regular'),
    marginBottom: scale(70),
  },
  section: {
    marginBottom: scale(70),
    backgroundColor: '#ffffff',
    borderWidth: scale(6),
    borderColor: '#ccccc8',
    borderRadius: scale(15),
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ececec',
    paddingVertical: scale(16),
  },
  playIcon: {
    width: scale(64),
    height: scale(64),
    resizeMode: 'contain',
    marginRight: scale(14),
  },
  sectionTitle: {
    fontSize: scale(40),
    lineHeight: scale(64),
    color: '#458831',
    fontFamily: getFontFamily('extraBold'),
  },
  combinationItem: {
    paddingTop: scale(50),
  },
  combinationItemLast: {
    paddingBottom: scale(50),
  },
  combinationTitle: {
    fontSize: scale(40),
    color: '#0e0e0e',
    marginBottom: scale(24),
    fontFamily: getFontFamily('extraBold'),
    alignSelf: 'center',
    textAlign: 'center',
    backgroundColor: '#d1dec6',
    width: scale(292),
  },
  combinationDescription: {
    fontSize: scale(28),
    lineHeight: scale(43),
    color: '#0e0e0e',
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  noteText: {
    fontSize: scale(28),
    color: '#0e0e0e',
    marginBottom: scale(70),
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  paddingWrap: {
    paddingHorizontal: scale(50),
    paddingVertical: scale(10),
  },
  foodRecommendationItem: {
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: scale(22),
  },
  foodRecommendationItemLast: {
    borderBottomWidth: 0,
  },
  constitutionName: {
    fontSize: scale(36),
    lineHeight: scale(82),
    color: '#0e0e0e',
    fontFamily: getFontFamily('bold'),
    marginRight: scale(50),
  },
  foodList: {
    fontSize: scale(34),
    lineHeight: scale(82),
    color: '#0e0e0e',
    fontFamily: getFontFamily('regular'),
  },
  warningIntro: {
    fontSize: scale(28),
    lineHeight: scale(44),
    color: '#0e0e0e',
    marginVertical: scale(20),
    fontFamily: getFontFamily('regular'),
    textAlign: 'center',
  },
  warningItem: {
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    flexDirection: 'row',
  },
  warningItemLast: {
    borderBottomWidth: 0,
  },
  warningFoodList: {
    fontSize: scale(28),
    color: '#0e0e0e',
    fontFamily: getFontFamily('regular'),
  },
  seasonItem: {
    padding: scale(40),
    borderBottomWidth: scale(6),
    borderBottomColor: '#ccccc8',
  },
  seasonItemLast: {
    borderBottomWidth: 0,
  },
  seasonTitle: {
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
  seasonDescription: {
    fontSize: scale(28),
    color: '#bb0000',
    lineHeight: scale(40),
    fontFamily: getFontFamily('bold'),
    marginTop: scale(26),
    marginBottom: scale(10),
    textAlign: 'center',
  },
  seasonDescription2: {
    fontSize: scale(32),
    color: '#458831',
    fontFamily: getFontFamily('extraBold'),
    marginBottom: scale(24),
    textAlign: 'center',
  },
  seasonDescription3: {
    fontSize: scale(28),
    color: '#0e0e0e',
    lineHeight: scale(44),
    textAlign: 'center',
  },
  treatmentMainTitle: {
    fontSize: scale(50),
    color: '#0e0e0e',
    marginBottom: scale(60),
    textAlign: 'center',
    fontFamily: getFontFamily('extraBold'),
  },
  treatmentItem: {
    marginBottom: scale(20),
    paddingVertical: scale(40),
    borderBottomWidth: scale(6),
    borderColor: '#ccccc8',
  },
  treatmentItemFirst: {
    paddingTop: 0,
  },
  treatmentTitle: {
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
  treatmentDescription: {
    fontSize: scale(28),
    color: '#0e0e0e',
    lineHeight: scale(44),
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  section2:{
    paddingTop: scale(70),
  },
  tipHeader: {
    alignItems: 'center',
    marginBottom: scale(60),
  },
  tipBubble: {
    marginBottom: scale(40),
  },
  tipBubbleImage: {
    width: scale(180),
    height: scale(166),
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  tipBubbleText: {
    fontSize: scale(24),
    color: '#ffffff',
    fontFamily: getFontFamily('bold'),
  },
  tipTitle: {
    fontSize: scale(50),
    color: '#0e0e0e',
    fontFamily: getFontFamily('extraBold'),
  },
  tipContent: {
    fontSize: scale(27),
    color: '#0e0e0e',
    lineHeight: scale(44),
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  tipContent2: {
    fontSize: scale(28),
    color: '#0e0e0e',
    lineHeight: scale(44),
    fontFamily: getFontFamily('extraBold'),
    marginTop: scale(40),
    textAlign: 'center',
  },
  illustrationContainer: {
    position: 'absolute',
    bottom: 0,
    left: scale(-120),
    right: scale(-120),
    height: scale(1050),
    zIndex: -1,
  },
  illustrationBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    bottom: 0,
    left: 0,
  },
  illustrationDoctor: {
    width: scale(567),
    height: scale(592),
    zIndex: 1,
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
  speechBubble: {
    marginTop: scale(50),
    width: scale(868),
    height: scale(402),
    marginBottom: scale(650),
    justifyContent: 'center',
    alignContent: 'center'
  },
  speechBubbleText: {
    fontSize: scale(28),
    color: '#0e0e0e',
    lineHeight: scale(44),
    fontFamily: getFontFamily('regular'),
    textAlign: 'center',
  },
  speechBubbleText2: {
    fontSize: scale(28),
    color: '#0e0e0e',
    lineHeight: scale(44),
    fontFamily: getFontFamily('extraBold'),
    marginTop: scale(35),
    marginBottom: scale(35),
    textAlign: 'center',
  },
});

export default ManagementMethodsScreen;

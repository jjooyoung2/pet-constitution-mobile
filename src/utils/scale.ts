import { Dimensions } from 'react-native';

// 앱 시작 시 화면 크기 한 번만 읽기 (고정값 방식)
const { width, height } = Dimensions.get('window');

// 디자인 시안 기준 (1100px 기준)
const guidelineBaseWidth = 1100;
const guidelineBaseHeight = 2000;

/**
 * 가로 스케일링 함수
 * 디자인 시안의 px 값을 현재 디바이스 크기에 맞게 변환
 * 앱 시작 시 화면 크기를 기준으로 계산 (고정값)
 * @param size - 디자인 시안의 픽셀 값
 * @returns 스케일링된 값
 */
export const scale = (size: number) => (width / guidelineBaseWidth) * size;

/**
 * 세로 스케일링 함수
 * 디자인 시안의 px 값을 현재 디바이스 높이에 맞게 변환
 * 앱 시작 시 화면 크기를 기준으로 계산 (고정값)
 * @param size - 디자인 시안의 픽셀 값
 * @returns 스케일링된 값
 */
export const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;

/**
 * 중간 스케일링 함수 (moderate scale)
 * scale과 원본 사이의 중간값을 반환 (더 부드러운 스케일링)
 * @param size - 디자인 시안의 픽셀 값
 * @param factor - 스케일링 팩터 (0~1, 기본값 0.5)
 * @returns 스케일링된 값
 */
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;


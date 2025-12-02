// 모든 이미지를 Base64로 변환하는 스크립트
const fs = require('fs');
const path = require('path');

const images = [
  'assets/images/results-doctor.png',
  'assets/images/results-icon1.png',
  'assets/images/results-icon2.png',
  'assets/images/results-icon3.png',
  'assets/images/results-icon4.png',
];

const outputPath = path.join(__dirname, '..', 'src', 'utils', 'imageBase64.ts');

console.log('이미지 Base64 변환 시작...\n');

const base64Map = {};

for (const imagePath of images) {
  const fullPath = path.join(__dirname, '..', imagePath);
  const imageName = path.basename(imagePath, path.extname(imagePath));
  // results-doctor -> DOCTOR_IMAGE, results-icon1 -> ICON1_IMAGE
  let constName;
  if (imageName === 'results-doctor') {
    constName = 'DOCTOR_IMAGE_BASE64';
  } else if (imageName.startsWith('results-icon')) {
    const num = imageName.replace('results-icon', '');
    constName = `ICON${num}_IMAGE_BASE64`;
  } else {
    constName = imageName.toUpperCase().replace(/-/g, '_') + '_BASE64';
  }
  
  console.log(`처리 중: ${imagePath} -> ${constName}`);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`  ⚠️  파일을 찾을 수 없습니다: ${fullPath}`);
    base64Map[constName] = '';
    continue;
  }

  try {
    const imageBuffer = fs.readFileSync(fullPath);
    const base64 = imageBuffer.toString('base64');
    base64Map[constName] = base64;
    console.log(`  ✅ 성공: ${imageBuffer.length} bytes → ${base64.length} chars`);
  } catch (error) {
    console.error(`  ❌ 실패:`, error.message);
    base64Map[constName] = '';
  }
}

// 파일 내용 생성
const content = `// 이미지 Base64 상수
// 자동 생성됨: ${new Date().toISOString()}
// 이 파일은 scripts/convert-all-images-to-base64.js로 자동 생성되었습니다.

// 의사 이미지
export const DOCTOR_IMAGE_BASE64 = '${base64Map.DOCTOR_IMAGE_BASE64 || ''}';

// 섹션 아이콘들
export const ICON1_IMAGE_BASE64 = '${base64Map.ICON1_IMAGE_BASE64 || ''}';
export const ICON2_IMAGE_BASE64 = '${base64Map.ICON2_IMAGE_BASE64 || ''}';
export const ICON3_IMAGE_BASE64 = '${base64Map.ICON3_IMAGE_BASE64 || ''}';
export const ICON4_IMAGE_BASE64 = '${base64Map.ICON4_IMAGE_BASE64 || ''}';
`;

fs.writeFileSync(outputPath, content);
console.log(`\n✅ 모든 이미지가 ${outputPath} 파일에 저장되었습니다!`);


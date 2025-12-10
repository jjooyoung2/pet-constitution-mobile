// 이미지를 Base64로 변환하는 스크립트
// 사용법: node scripts/convert-image-to-base64.js assets/images/results-doctor.png

const fs = require('fs');
const path = require('path');

const imagePath = process.argv[2];

if (!imagePath) {
  console.error('사용법: node scripts/convert-image-to-base64.js <이미지경로>');
  console.error('예: node scripts/convert-image-to-base64.js assets/images/results-doctor.png');
  process.exit(1);
}

const fullPath = path.join(__dirname, '..', imagePath);

if (!fs.existsSync(fullPath)) {
  console.error(`이미지 파일을 찾을 수 없습니다: ${fullPath}`);
  process.exit(1);
}

try {
  const imageBuffer = fs.readFileSync(fullPath);
  const base64 = imageBuffer.toString('base64');
  
  console.log('Base64 변환 완료!');
  console.log(`이미지 크기: ${imageBuffer.length} bytes`);
  console.log(`Base64 길이: ${base64.length} characters`);
  console.log('\n아래 Base64 문자열을 src/utils/imageBase64.ts 파일의 DOCTOR_IMAGE_BASE64에 붙여넣으세요:\n');
  console.log(base64);
  
  // 자동으로 파일에 쓰기 (선택사항)
  const outputPath = path.join(__dirname, '..', 'src', 'utils', 'imageBase64.ts');
  const content = `// 의사 이미지 Base64 (results-doctor.png)
// 자동 생성됨: ${new Date().toISOString()}

export const DOCTOR_IMAGE_BASE64 = '${base64}';
`;
  
  fs.writeFileSync(outputPath, content);
  console.log(`\n✅ 자동으로 ${outputPath} 파일에 저장되었습니다!`);
} catch (error) {
  console.error('변환 실패:', error);
  process.exit(1);
}












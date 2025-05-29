// 정렬 표시기 스타일 추가
function addSortIndicatorStyles() {
  const styleElem = document.createElement('style');
  styleElem.textContent = `
    th {
      cursor: pointer;
      position: relative;
      user-select: none;
    }
    th:hover {
      background-color: #264c70;
    }
    .sort-indicator {
      display: inline-block;
      margin-left: 5px;
      font-size: 0.8em;
    }
    th[data-field] {
      padding-right: 20px; /* 정렬 아이콘 공간 확보 */
    }
  `;
  document.head.appendChild(styleElem);
}

/** ===============================
 *  Firebase 초기화
 * ===============================**/
const firebaseConfig = {
  apiKey: "AIzaSyCoOg2HPjk-oEhtVrLv3hH-3VLCwa2MAfE",
  authDomain: "sanghoon-d8f1c.firebaseapp.com",
  databaseURL: "https://sanghoon-d8f1c-default-rtdb.firebaseio.com",
  projectId: "sanghoon-d8f1c",
  storageBucket: "sanghoon-d8f1c.appspot.com",
  messagingSenderId: "495391900753",
  appId: "1:495391900753:web:b0d708eeca64fafe562470",
  measurementId: "G-J2E22BW61H"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// 페이지 로딩 성능 향상을 위한 캐시 및 지연 로딩 변수
let asData = [];
let currentMode = 'manager';  // 초기: 담당자
let sortField = '';
let sortAsc = true;
let adminAuthorized = false;  // 관리자 비번 확인용
let userData = [];
let isTableRendering = false; // 테이블 렌더링 중복 방지
let tableRenderTimeout = null;
let dataChanged = false;      // 데이터 변경 여부 추적
let dataLoaded = false; // 데이터 로드 여부
let pendingRowUpdates = new Map(); // 업데이트 대기 중인 행

// === 성능 개선을 위한 추가 변수 ===
let currentFilterState = {}; // 필터 상태 저장
let lastRenderedData = []; // 마지막으로 렌더링된 데이터
let isFilterActive = false; // 필터 활성화 여부

// 전역 변수 섹션에 추가
let modifiedRows = new Set();

// 경로 정의
const asPath = 'as-service/data';
const userPath = 'as-service/users';
const histPath = 'as-service/history';
const aiHistoryPath = 'as-service/ai_history';
const aiConfigPath = "as-service/admin/aiConfig";
const apiConfigPath = "as-service/admin/apiConfig";
const userMetaPath = 'as-service/user_meta';

// AI 설정 글로벌 변수
let g_aiConfig = {
  apiKey: "",
  model: "",
  promptRow: "",
  promptHistory: "",
  promptOwner: ""
};

// API 설정 글로벌 변수
let g_apiConfig = {
  apiKey: "",
  baseUrl: "https://api.vesselfinder.com/masterdata"
};

// 현재 선택된 언어
let currentLanguage = 'ko';

// 언어별 텍스트 사전
const translations = {
  // 한국어 (기본)
  ko: {
    // 헤더 및 버튼
    "AS 현황 관리": "AS 현황 관리",
    "사용자": "사용자",
    "로그아웃": "로그아웃",
    "연결 상태": "연결 상태",
    "확인 중": "확인 중",
    "행 추가": "행 추가",
    "선택 행 삭제": "선택 행 삭제",
    "저장": "저장",
    "엑셀 다운로드": "엑셀 다운로드",
    "엑셀 업로드": "엑셀 업로드",
    "AS 현황 업로드": "AS 현황 업로드",
    "히스토리 조회": "히스토리 조회",
    "히스토리 전체 삭제": "히스토리 전체 삭제",
    "현황 번역": "현황 번역",
    "선사별 AI 요약": "선사별 AI 요약",
    "API 전체 반영": "API 전체 반영",
    "전체조회": "전체조회",
    "전체": "전체",
    "AS진행": "AS진행",
    "담당자": "담당자",
    "선주사": "선주사",
    "사용자 관리": "사용자 관리",
    "AI 설정 관리": "AI 설정 관리",
    "API 설정 관리": "API 설정 관리",
    "연결됨": "연결됨",
    
    // 상태 카드
    "정상A": "정상A",
    "정상B": "정상B",
    "유상정상": "유상정상",
    "부분동작": "부분동작",
    "동작불가": "동작불가",
    
    // 필터 레이블
    "IMO NO.": "IMO NO.",
    "HULL NO.": "HULL NO.",
    "SHIPNAME": "SHIPNAME",
    "SHIPOWNER": "SHIPOWNER",
    "주요선사": "주요선사",
    "호선 대표메일": "호선 대표메일",
    "그룹": "그룹",
    "AS 구분": "AS 구분",
    "현 담당": "현 담당",
    "동작여부": "동작여부",
    "전체": "전체",
    "무상": "무상",
    "유상": "유상",
    "위탁": "위탁",
    
    // 테이블 헤더
    "공번": "공번",
    "공사": "공사",
    "NAME": "NAME",
    "OWNER": "OWNER",
    "MANAGER": "MANAGER",
    "반영": "반영",
    "SHIP TYPE": "SHIP TYPE",
    "SCALE": "SCALE",
    "구분": "구분",
    "주요선사": "주요선사",
    "그룹": "그룹",
    "SHIPYARD": "SHIPYARD",
    "계약": "계약",
    "인도일": "인도일",
    "보증종료일": "보증종료일",
    "전 담당": "전 담당",
    "현 담당": "현 담당",
    "현황": "현황",
    "현황번역": "현황 번역",
    "AI 요약": "AI 요약",
    "조치계획": "조치계획",
    "접수내용": "접수내용",
    "조치결과": "조치결과",
    "AS접수일자": "AS접수일자",
    "기술적종료일": "기술적종료일",
    "경과일": "경과일",
    "정상지연": "정상지연",
    "지연 사유": "지연 사유",
    
    // 모달 제목
    "변경 이력": "변경 이력",
    "사용자 관리": "사용자 관리",
    "API 설정 관리": "API 설정 관리",
    "엑셀 업로드 방식 선택": "엑셀 업로드 방식 선택",
    "전체 내용": "전체 내용",
    "선사별 접수내용/조치결과 요약": "선사별 접수내용/조치결과 요약",
    "AI 설정 관리": "AI 설정 관리",
    "AI 요약 진행 상황": "AI 요약 진행 상황",
    "API 데이터 가져오기": "API 데이터 가져오기",
    "비밀번호 초기화": "비밀번호 초기화",
    "비밀번호 변경": "비밀번호 변경",
    "반영": "반영",
    "SHIPYARD": "SHIPYARD",
    "경과일": "경과일"
  },
  
  // 영어
  en: {
    // 헤더 및 버튼
    "AS 현황 관리": "AS Status Management",
    "사용자": "User",
    "로그아웃": "Logout",
    "연결 상태": "Connection Status",
    "확인 중": "Checking",
    "행 추가": "Add Row",
    "선택 행 삭제": "Delete Selected",
    "저장": "Save",
    "엑셀 다운로드": "Excel Download",
    "엑셀 업로드": "Excel Upload",
    "AS 현황 업로드": "AS Status Upload",
    "히스토리 조회": "View History",
    "히스토리 전체 삭제": "Clear All History",
    "현황 번역": "Translate Status",
    "선사별 AI 요약": "Owner AI Summary",
    "API 전체 반영": "API Refresh All",
    "전체조회": "View All",
    "전체": "All",
    "AS진행": "AS In Progress",
    "담당자": "Manager",
    "선주사": "Owner",
    "사용자 관리": "User Management",
    "AI 설정 관리": "AI Configuration",
    "API 설정 관리": "API Configuration",
    "연결됨": "Connected",
    
    // 상태 카드
    "정상A": "Normal A",
    "정상B": "Normal B",
    "유상정상": "Paid Normal",
    "부분동작": "Partial Operation",
    "동작불가": "Inoperable",
    
    // 필터 레이블
    "IMO NO.": "IMO NO.",
    "HULL NO.": "HULL NO.",
    "SHIPNAME": "SHIPNAME",
    "SHIPOWNER": "SHIPOWNER",
    "주요선사": "Major Shipping",
    "호선 대표메일": "Vessel Email",
    "그룹": "Group",
    "AS 구분": "AS Type",
    "현 담당": "Current Manager",
    "동작여부": "Operation Status",
    "전체": "All",
    "무상": "Free",
    "유상": "Paid",
    "위탁": "Consignment",
    
    // 테이블 헤더
    "공번": "Project No.",
    "공사": "Work",
    "NAME": "NAME",
    "OWNER": "OWNER",
    "MANAGER": "MANAGER",
    "반영": "Apply",
    "SHIP TYPE": "SHIP TYPE",
    "SCALE": "SCALE",
    "구분": "Category",
    "주요선사": "Major Shipping",
    "그룹": "Group",
    "SHIPYARD": "SHIPYARD",
    "계약": "Contract",
    "인도일": "Delivery Date",
    "보증종료일": "Warranty End",
    "전 담당": "Previous Manager",
    "현 담당": "Current Manager",
    "현황": "Status",
    "현황번역": "Status Translation",
    "AI 요약": "AI Summary",
    "조치계획": "Action Plan",
    "접수내용": "Receipt Details",
    "조치결과": "Action Results",
    "AS접수일자": "AS Receipt Date",
    "기술적종료일": "Technical End Date",
    "경과일": "Elapsed Days",
    "정상지연": "Normal Delay",
    "지연 사유": "Delay Reason",
    
    // 모달 제목
    "변경 이력": "Change History",
    "사용자 관리": "User Management",
    "API 설정 관리": "API Configuration",
    "엑셀 업로드 방식 선택": "Excel Upload Method",
    "전체 내용": "Full Content",
    "선사별 접수내용/조치결과 요약": "Owner-based Summary",
    "AI 설정 관리": "AI Configuration",
    "AI 요약 진행 상황": "AI Summary Progress",
    "API 데이터 가져오기": "API Data Retrieval",
    "비밀번호 초기화": "Reset Password",
    "비밀번호 변경": "Change Password",
    "반영": "Apply",
    "SHIPYARD": "SHIPYARD",
    "경과일": "Elapsed Days"
  },
  
  // 중국어
  zh: {
    // 헤더 및 버튼
    "AS 현황 관리": "AS状态管理",
    "사용자": "用户",
    "로그아웃": "登出",
    "연결 상태": "连接状态",
    "확인 중": "确认中",
    "행 추가": "添加行",
    "선택 행 삭제": "删除所选",
    "저장": "保存",
    "엑셀 다운로드": "下载Excel",
    "엑셀 업로드": "上传Excel",
    "AS 현황 업로드": "上传AS状态",
    "히스토리 조회": "查看历史",
    "히스토리 전체 삭제": "清除所有历史",
    "현황 번역": "翻译状态",
    "선사별 AI 요약": "船东AI摘要",
    "API 전체 반영": "API全部更新",
    "전체조회": "查看全部",
    "전체": "全部",
    "AS진행": "AS进行中",
    "담당자": "负责人",
    "선주사": "船东",
    "사용자 관리": "用户管理",
    "AI 설정 관리": "AI设置管理",
    "API 설정 관리": "API设置管理",
    "연결됨": "已连接",
    
    // 상태 카드
    "정상A": "正常A",
    "정상B": "正常B",
    "유상정상": "有偿正常",
    "부분동작": "部分运行",
    "동작불가": "无法运行",
    
    // 필터 레이블
    "IMO NO.": "IMO号码",
    "HULL NO.": "船体号码",
    "SHIPNAME": "船名",
    "SHIPOWNER": "船东",
    "주요선사": "主要船公司",
    "호선 대표메일": "船舶代表邮箱",
    "그룹": "组别",
    "AS 구분": "AS类型",
    "현 담당": "当前负责人",
    "동작여부": "运行状态",
    "전체": "全部",
    "무상": "免费",
    "유상": "有偿",
    "위탁": "委托",
    
    // 테이블 헤더
    "공번": "项目编号",
    "공사": "工程",
    "NAME": "名称",
    "OWNER": "所有者",
    "MANAGER": "管理者",
    "반영": "应用",
    "SHIP TYPE": "船舶类型",
    "SCALE": "规模",
    "구분": "类别",
    "주요선사": "主要船公司",
    "그룹": "组别",
    "SHIPYARD": "造船厂",
    "계약": "合同",
    "인도일": "交付日期",
    "보증종료일": "保修结束日",
    "전 담당": "前任负责人",
    "현 담당": "当前负责人",
    "현황": "状态",
    "현황번역": "状态翻译",
    "AI 요약": "AI摘要",
    "조치계획": "措施计划",
    "접수내용": "接收内容",
    "조치결과": "措施结果",
    "AS접수일자": "AS接收日期",
    "기술적종료일": "技术终止日期",
    "경과일": "经过天数",
    "정상지연": "正常延迟",
    "지연 사유": "延迟原因",
    
    // 모달 제목
    "변경 이력": "变更历史",
    "사용자 관리": "用户管理",
    "API 설정 관리": "API设置管理",
    "엑셀 업로드 방식 선택": "Excel上传方式选择",
    "전체 내용": "全部内容",
    "선사별 접수내용/조치결과 요약": "按船东分类的摘要",
    "AI 설정 관리": "AI设置管理",
    "AI 요약 진행 상황": "AI摘要进展",
    "API 데이터 가져오기": "获取API数据",
    "비밀번호 초기화": "重置密码",
    "비밀번호 변경": "更改密码",
    "반영": "应用",
    "SHIPYARD": "造船厂",
    "경과일": "经过天数"
  },
  
  // 일본어
  ja: {
    // 헤더 및 버튼
    "AS 현황 관리": "ASステータス管理",
    "사용자": "ユーザー",
    "로그아웃": "ログアウト",
    "연결 상태": "接続状態",
    "확인 중": "確認中",
    "행 추가": "行追加",
    "선택 행 삭제": "選択行削除",
    "저장": "保存",
    "엑셀 다운로드": "Excel ダウンロード",
    "엑셀 업로드": "Excel アップロード",
    "AS 현황 업로드": "ASステータスアップロード",
    "히스토리 조회": "履歴表示",
    "히스토리 전체 삭제": "履歴全削除",
    "현황 번역": "ステータス翻訳",
    "선사별 AI 요약": "船主AI要約",
    "API 전체 반영": "API全体反映",
    "전체조회": "全体表示",
    "전체": "全体",
    "AS진행": "AS進行中",
    "담당자": "担当者",
    "선주사": "船主",
    "사용자 관리": "ユーザー管理",
    "AI 설정 관리": "AI設定管理",
    "API 설정 관리": "API設定管理",
    "연결됨": "接続済み",
    
    // 상태 카드
    "정상A": "正常A",
    "정상B": "正常B",
    "유상정상": "有償正常",
    "부분동작": "部分動作",
    "동작불가": "動作不可",
    
    // 필터 레이블
    "IMO NO.": "IMO番号",
    "HULL NO.": "船体番号",
    "SHIPNAME": "船名",
    "SHIPOWNER": "船主",
    "주요선사": "主要船社",
    "호선 대표메일": "船舶代表メール",
    "그룹": "グループ",
    "AS 구분": "AS区分",
    "현 담당": "現担当者",
    "동작여부": "動作状態",
    "전체": "全体",
    "무상": "無償",
    "유상": "有償",
    "위탁": "委託",
    
    // 테이블 헤더
    "공번": "工番",
    "공사": "工事",
    "NAME": "名称",
    "OWNER": "所有者",
    "MANAGER": "管理者",
    "반영": "反映",
    "SHIP TYPE": "船舶タイプ",
    "SCALE": "規模",
    "구분": "区分",
    "주요선사": "主要船社",
    "그룹": "グループ",
    "SHIPYARD": "造船所",
    "계약": "契約",
    "인도일": "引渡日",
    "보증종료일": "保証終了日",
    "전 담당": "前担当者",
    "현 담당": "現担当者",
    "현황": "状況",
    "현황번역": "状況翻訳",
    "AI 요약": "AI要約",
    "조치계획": "措置計画",
    "접수내용": "受付内容",
    "조치결과": "措置結果",
    "AS접수일자": "AS受付日",
    "기술적종료일": "技術的終了日",
    "경과일": "経過日数",
    "정상지연": "正常遅延",
    "지연 사유": "遅延理由",
    
    // 모달 제목
    "변경 이력": "変更履歴",
    "사용자 관리": "ユーザー管理",
    "API 설정 관리": "API設定管理",
    "엑셀 업로드 방식 선택": "Excelアップロード方式選択",
    "전체 내용": "全体内容",
    "선사별 접수내용/조치결과 요약": "船主別要約",
    "AI 설정 관리": "AI設定管理",
    "AI 요약 진행 상황": "AI要約進行状況",
    "API 데이터 가져오기": "APIデータ取得",
    "비밀번호 초기화": "パスワードリセット",
    "비밀번호 변경": "パスワード変更",
    "반영": "反映",
    "SHIPYARD": "造船所",
    "경과일": "経過日数"
  }
};

/** ===============================
 *  초기화 및 이벤트 핸들러 등록
 * ===============================**/
document.addEventListener('DOMContentLoaded', () => {
  // 모든 이벤트 리스너 등록
  registerEventListeners();
  
  // 테이블 가로 스크롤 대응 스타일 추가
  addTableScrollStyles();
  
  // 정렬 화살표 스타일 추가
  addSortIndicatorStyles();
  
  // 언어 초기화
  initializeLanguage();
});

// 모든 이벤트 리스너 등록 함수 - 성능 개선을 위해 일괄 처리
function registerEventListeners() {
  // 사이드바 관련
  document.getElementById('btnManager').addEventListener('click', () => switchSideMode('manager'));
  document.getElementById('btnOwner').addEventListener('click', () => switchSideMode('owner'));
  
  // 사용자 관리 관련
  document.getElementById('userManageBtn').addEventListener('click', openUserModal);
  document.getElementById('addUserConfirmBtn').addEventListener('click', addNewUser);
  document.getElementById('deleteSelectedUsersBtn').addEventListener('click', deleteSelectedUsers);
  
  // AI 설정 관련
  document.getElementById('aiConfigBtn').addEventListener('click', openAiConfigModal);
  document.getElementById('saveAiConfigBtn').addEventListener('click', saveAiConfig);
  document.getElementById('ownerAISummaryBtn').addEventListener('click', openOwnerAIModal);
  
  // API 설정 관련
  document.getElementById('apiConfigBtn').addEventListener('click', openApiConfigModal);
  document.getElementById('saveApiConfigBtn').addEventListener('click', saveApiConfig);
  document.getElementById('apiRefreshAllBtn').addEventListener('click', refreshAllVessels);
  
  // 테이블 관련
  document.getElementById('asTable').addEventListener('click', handleTableClick);
  document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
  document.getElementById('addRowBtn').addEventListener('click', addNewRow);
  document.getElementById('deleteRowBtn').addEventListener('click', deleteSelectedRows);
  document.getElementById('saveBtn').addEventListener('click', saveAllData);
  document.getElementById('loadBtn').addEventListener('click', () => renderTable(true));
  
  // 엑셀 관련
  document.getElementById('downloadExcelBtn').addEventListener('click', downloadExcel);
  document.getElementById('uploadExcelBtn').addEventListener('click', () => document.getElementById('excelModal').style.display = 'block');
  document.getElementById('excelReplaceBtn').addEventListener('click', () => { document.getElementById('excelModal').style.display = 'none'; proceedExcelUpload("replace"); });
  document.getElementById('excelAppendBtn').addEventListener('click', () => { document.getElementById('excelModal').style.display = 'none'; proceedExcelUpload("append"); });
  document.getElementById('excelCancelBtn').addEventListener('click', () => document.getElementById('excelModal').style.display = 'none');
  
  // AS 현황 업로드
  document.getElementById('uploadAsStatusBtn').addEventListener('click', () => document.getElementById('uploadAsStatusInput').click());
  document.getElementById('uploadAsStatusInput').addEventListener('change', handleAsStatusUpload);
  
  // 히스토리 관련
  document.getElementById('historyBtn').addEventListener('click', showHistoryModal);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

  // 번역 관련
  document.getElementById('translateBtn').addEventListener('click', translateStatusField);
  
  // 비밀번호 찾기 관련
  document.getElementById('forgotPasswordLink').addEventListener('click', openForgotPasswordModal);
  document.getElementById('sendResetLinkBtn').addEventListener('click', sendPasswordResetEmail);
  
  // 비밀번호 변경 관련
  document.getElementById('changePasswordBtn').addEventListener('click', changeUserPassword);
  document.getElementById('currentPassword').addEventListener('keypress', (e) => { if (e.key === 'Enter') e.preventDefault(), document.getElementById('newPassword').focus(); });
  document.getElementById('newPassword').addEventListener('keypress', (e) => { if (e.key === 'Enter') e.preventDefault(), document.getElementById('confirmPassword').focus(); });
  document.getElementById('confirmPassword').addEventListener('keypress', (e) => { if (e.key === 'Enter') e.preventDefault(), document.getElementById('changePasswordBtn').click(); });
  
  // 로그인 관련
  document.getElementById('loginConfirmBtn').addEventListener('click', performLogin);
  document.getElementById('loginPw').addEventListener('keypress', (e) => { if (e.key === 'Enter') e.preventDefault(), performLogin(); });
  document.getElementById('loginUser').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!document.getElementById('loginPw').value.trim()) {
        document.getElementById('loginPw').focus();
      } else {
        performLogin();
      }
    }
  });
  document.getElementById('resetEmail').addEventListener('keypress', (e) => { if (e.key === 'Enter') e.preventDefault(), document.getElementById('sendResetLinkBtn').click(); });
  document.getElementById('logoutBtn').addEventListener('click', logoutUser);
  
  // 키보드 이벤트 처리
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('forgotPasswordModal').style.display === 'block') {
        closeForgotPasswordModal();
      }
      if (document.getElementById('changePasswordModal').style.display === 'block' &&
          document.getElementById('changePasswordModal').getAttribute('data-first-login') !== 'true') {
        document.getElementById('changePasswordModal').style.display = 'none';
      }
      if (document.getElementById('contentModal').style.display === 'block') {
        closeContentModal();
      }
      if (document.getElementById('ownerAIModal').style.display === 'block') {
        document.getElementById('ownerAIModal').style.display = 'none';
      }
      if (document.getElementById('aiProgressModal').style.display === 'block') {
        document.getElementById('aiProgressModal').style.display = 'none';
      }
      if (document.getElementById('apiProgressModal').style.display === 'block') {
        document.getElementById('apiProgressModal').style.display = 'none';
      }
      if (document.getElementById('apiConfigModal').style.display === 'block') {
        closeApiConfigModal();
      }
    }
  });
  
  // 열 리사이징 관련
  document.addEventListener('mousedown', handleMouseDown);
  
  // 필터 변경 이벤트를 디바운스로 관리
  setupFilterDebounce();
  
  // 언어 선택 버튼 이벤트 리스너 등록
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const lang = this.getAttribute('data-lang');
      changeLanguage(lang);
    });
  });
}

// 필터 변경 이벤트에 디바운스 적용 - 성능 개선
function setupFilterDebounce() {
  const filters = ['filterIMO', 'filterHull', 'filterName', 'filterOwner', 'filterMajor', 'filterRepMail', 'filterGroup', 'filterAsType', 'filterManager', 'filterActive'];
  
  filters.forEach(id => {
    const element = document.getElementById(id);
    if (element.tagName === 'SELECT') {
      element.addEventListener('change', debounceRenderTable);
    } else {
      element.addEventListener('input', debounceRenderTable);
    }
  });
}

// 테이블 렌더링 디바운스 함수
function debounceRenderTable() {
  if (tableRenderTimeout) {
    clearTimeout(tableRenderTimeout);
  }
  tableRenderTimeout = setTimeout(() => {
    saveFilterState(); // 필터 상태 저장
    renderTable();
  }, 300); // 300ms 지연
}

// === 필터 상태 저장/복원 함수 추가 ===
function saveFilterState() {
  currentFilterState = {
    imo: document.getElementById('filterIMO').value,
    hull: document.getElementById('filterHull').value,
    name: document.getElementById('filterName').value,
    owner: document.getElementById('filterOwner').value,
    major: document.getElementById('filterMajor').value,
    repMail: document.getElementById('filterRepMail').value,
    group: document.getElementById('filterGroup').value,
    asType: document.getElementById('filterAsType').value,
    manager: document.getElementById('filterManager').value,
    active: document.getElementById('filterActive').value
  };
  
  // 필터가 하나라도 있으면 필터 활성화
  isFilterActive = Object.values(currentFilterState).some(val => val !== '');
}

function restoreFilterState() {
  if (currentFilterState) {
    document.getElementById('filterIMO').value = currentFilterState.imo || '';
    document.getElementById('filterHull').value = currentFilterState.hull || '';
    document.getElementById('filterName').value = currentFilterState.name || '';
    document.getElementById('filterOwner').value = currentFilterState.owner || '';
    document.getElementById('filterMajor').value = currentFilterState.major || '';
    document.getElementById('filterRepMail').value = currentFilterState.repMail || '';
    document.getElementById('filterGroup').value = currentFilterState.group || '';
    document.getElementById('filterAsType').value = currentFilterState.asType || '';
    document.getElementById('filterManager').value = currentFilterState.manager || '';
    document.getElementById('filterActive').value = currentFilterState.active || '';
  }
}

// renderTable 함수 내부, tbody 렌더링 직전에 추가
function renderTableHeaders() {
  const thead = document.querySelector('#asTable thead tr');
  if (!thead) return;
  
  // 헤더 정의 (필드명과 기본 텍스트)
  const headers = [
    { field: null, text: '', isCheckbox: true },
    { field: '공번', text: '공번' },
    { field: '공사', text: '공사' },
    { field: 'imo', text: 'IMO NO.' },
    { field: 'api_name', text: 'NAME' },
    { field: 'api_owner', text: 'OWNER' },
    { field: 'api_manager', text: 'MANAGER' },
    { field: null, text: '반영' },
    { field: 'hull', text: 'HULL NO.' },
    { field: 'shipName', text: 'SHIPNAME' },
    { field: 'repMail', text: '호선 대표메일' },
    { field: 'shipType', text: 'SHIP TYPE' },
    { field: 'scale', text: 'SCALE' },
    { field: '구분', text: '구분' },
    { field: 'shipowner', text: 'SHIPOWNER' },
    { field: 'major', text: '주요선사' },
    { field: 'group', text: '그룹' },
    { field: 'shipyard', text: 'SHIPYARD' },
    { field: 'contract', text: '계약' },
    { field: 'asType', text: 'AS 구분' },
    { field: 'delivery', text: '인도일' },
    { field: 'warranty', text: '보증종료일' },
    { field: 'prevManager', text: '전 담당' },
    { field: 'manager', text: '현 담당' },
    { field: '현황', text: '현황' },
{ field: '현황번역', text: '현황 번역' },
    { field: null, text: 'AI 요약', isAI: true },
    { field: '동작여부', text: '동작여부' },
    { field: '조치계획', text: '조치계획' },
    { field: '접수내용', text: '접수내용' },
    { field: '조치결과', text: '조치결과' },
    { field: null, text: 'AI 요약', isAI: true },
    { field: 'AS접수일자', text: 'AS접수일자' },
    { field: '기술적종료일', text: '기술적종료일' },
    { field: '경과일', text: '경과일' },
    { field: '정상지연', text: '정상지연' },
    { field: '지연 사유', text: '지연 사유' }
  ];
  
  // 기존 헤더 제거
  thead.innerHTML = '';
  
  // 새 헤더 생성
  headers.forEach(header => {
    const th = document.createElement('th');
    
    if (header.isCheckbox) {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'selectAll';
      checkbox.addEventListener('change', toggleSelectAll);
      th.appendChild(checkbox);
    } else {
      // 번역된 텍스트 가져오기
      const translatedText = translations[currentLanguage][header.text] || header.text;
      
      if (header.field) {
        th.setAttribute('data-field', header.field);
        th.style.cursor = 'pointer';
        
        // 텍스트 노드 추가
        const textNode = document.createTextNode(translatedText);
        th.appendChild(textNode);
        
        // 정렬 표시기 추가 (현재 정렬된 필드인 경우)
        if (sortField === header.field) {
          const sortIndicator = document.createElement('span');
          sortIndicator.className = 'sort-indicator';
          sortIndicator.innerHTML = sortAsc ? ' &#9650;' : ' &#9660;';
          th.appendChild(sortIndicator);
        }
      } else {
        th.textContent = translatedText;
      }
      
      // col-resizer 추가
      const resizer = document.createElement('div');
      resizer.className = 'col-resizer';
      th.appendChild(resizer);
    }
    
    thead.appendChild(th);
  });
  
  // 정렬 표시기 복원
  if (sortField) {
    const sortedTh = document.querySelector(`th[data-field="${sortField}"]`);
    if (sortedTh) {
      const sortIndicator = document.createElement('span');
      sortIndicator.className = 'sort-indicator';
      sortIndicator.innerHTML = sortAsc ? ' &#9650;' : ' &#9660;';
      sortedTh.appendChild(sortIndicator);
    }
  }
}

/** ==================================
 *  언어 변경 및 번역 관련 기능
 * ===================================*/
// 언어 변경 함수 개선 - 필터 상태 유지
function changeLanguage(lang) {
  // 이미 같은 언어로 설정되어 있다면 종료
  if (currentLanguage === lang) return;
  
  console.log(`언어 변경 요청: ${currentLanguage} → ${lang}`);
  
  // 필터 상태 저장
  saveFilterState();
  
  // 현재 언어 업데이트
  currentLanguage = lang;
  
  // 버튼 활성화 상태 업데이트
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // 즉시 UI 언어 업데이트
  updateUILanguage();
  
  // 테이블이 렌더링된 상태인지 확인
  const tbody = document.getElementById('asBody');
  if (tbody && tbody.children.length > 0) {
    // 테이블이 이미 렌더링된 경우, 강제로 다시 렌더링
    isTableRendering = false; // 렌더링 플래그 초기화
    
    // 필터 상태 복원
    restoreFilterState();
    
// 현재 필터된 상태로 다시 렌더링
if (isFilterActive) {
  // 필터가 활성화되어 있으면 필터 적용된 상태로 렌더링
  renderTable(false);
} else if (lastRenderedData.length > 0) {
  // 필터는 없지만 데이터가 표시되어 있었다면 전체 표시
  renderTable(true);
}
  }
  
  // 사이드바 메뉴 업데이트
  updateSidebarList();
  
  // 언어 변경 기록 저장
  localStorage.setItem('selectedLanguage', lang);
  
  console.log(`언어가 ${lang}으로 변경되었습니다.`);
}

// updateUILanguage 함수 개선 - 모든 UI 요소를 포괄적으로 업데이트
function updateUILanguage() {
  const langData = translations[currentLanguage];
  if (!langData) return;
  
  console.log(`UI 언어 업데이트: ${currentLanguage}`);
  
  // 1. 헤더 및 상단 요소 변경
  const h1 = document.querySelector('.header h1');
  if (h1) h1.textContent = langData["AS 현황 관리"] || "AS 현황 관리";
  
  // 사용자 정보 텍스트 변경
  const userInfoText = langData["사용자"] || "사용자";
  const userName = document.getElementById('currentUserName')?.textContent || "-";
  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl) {
    userInfoEl.innerHTML = `${userInfoText}: <span id="currentUserName">${userName}</span>`;
  }
  
  // 연결 상태 메시지
  const connectionStatus = document.getElementById('connectionStatus');
  if (connectionStatus) {
    const statusText = connectionStatus.textContent;
    const statusValue = statusText.includes(':') ? statusText.split(':')[1].trim() : "확인 중";
    
    // 상태값도 번역
    let translatedStatus = statusValue;
    if (statusValue === "확인 중" || statusValue === "Checking" || statusValue === "确认中" || statusValue === "確認中") {
      translatedStatus = langData["확인 중"] || "확인 중";
    } else if (statusValue === "Firebase 연결됨" || statusValue === "Firebase Connected") {
      translatedStatus = "Firebase " + (langData["연결됨"] || "연결됨");
    }
    
    connectionStatus.textContent = `${langData["연결 상태"] || "연결 상태"}: ${translatedStatus}`;
  }
  
  // 2. 상태 카드 변경 - 역매핑 사용
  const statusCards = {
    '정상A': ['정상A', 'Normal A', '正常A', '正常A'],
    '정상B': ['정상B', 'Normal B', '正常B', '正常B'],
    '유상정상': ['유상정상', 'Paid Normal', '有偿正常', '有償正常'],
    '부분동작': ['부분동작', 'Partial Operation', '部分运行', '部分動作'],
    '동작불가': ['동작불가', 'Inoperable', '无法运行', '動作不可']
  };
  
  document.querySelectorAll('.status-card h3').forEach(el => {
    const currentText = el.textContent.trim();
    for (const [koKey, variations] of Object.entries(statusCards)) {
      if (variations.includes(currentText)) {
        el.textContent = langData[koKey] || koKey;
        break;
      }
    }
  });
  
  // 3. 필터 레이블 변경 - 역매핑 사용
  const labelMappings = {
    'IMO NO.': ['IMO NO.', 'IMO NO.', 'IMO号码', 'IMO番号'],
    'HULL NO.': ['HULL NO.', 'HULL NO.', '船体号码', '船体番号'],
    'SHIPNAME': ['SHIPNAME', 'SHIPNAME', '船名', '船名'],
    'SHIPOWNER': ['SHIPOWNER', 'SHIPOWNER', '船东', '船主'],
    '주요선사': ['주요선사', 'Major Shipping', '主要船公司', '主要船社'],
    '호선 대표메일': ['호선 대표메일', 'Vessel Email', '船舶代表邮箱', '船舶代表メール'],
    '그룹': ['그룹', 'Group', '组别', 'グループ'],
    'AS 구분': ['AS 구분', 'AS Type', 'AS类型', 'AS区分'],
    '현 담당': ['현 담당', 'Current Manager', '当前负责人', '現担当者'],
    '동작여부': ['동작여부', 'Operation Status', '运行状态', '動作状態']
  };
  
  document.querySelectorAll('.filter-group label').forEach(el => {
    const currentText = el.textContent.trim();
    for (const [koKey, variations] of Object.entries(labelMappings)) {
      if (variations.includes(currentText)) {
        el.textContent = langData[koKey] || koKey;
        break;
      }
    }
  });
  
  // 4. 테이블 헤더 변경
  if (document.querySelector('#asTable thead tr')) {
    renderTableHeaders();
  }

  // 5. 모든 버튼을 한 번에 처리 - ID 우선, 그 다음 텍스트 매칭
  const buttonMappings = {
    // ID 기반 매핑
    'loadBtn': '전체조회',
    'addRowBtn': '행 추가',
    'deleteRowBtn': '선택 행 삭제',
    'saveBtn': '저장',
    'downloadExcelBtn': '엑셀 다운로드',
    'uploadExcelBtn': '엑셀 업로드',
    'uploadAsStatusBtn': 'AS 현황 업로드',
    'historyBtn': '히스토리 조회',
    'clearHistoryBtn': '히스토리 전체 삭제',
    'translateBtn': '현황 번역',
    'ownerAISummaryBtn': '선사별 AI 요약',
    'apiRefreshAllBtn': 'API 전체 반영',
    'logoutBtn': '로그아웃',
    'btnManager': '담당자',
    'btnOwner': '선주사',
    'userManageBtn': '사용자 관리',
    'aiConfigBtn': 'AI 설정 관리',
    'apiConfigBtn': 'API 설정 관리',
    // 모달 버튼들 추가
    'loginConfirmBtn': '로그인',
    'sendResetLinkBtn': '초기화 링크 전송',
    'changePasswordBtn': '비밀번호 변경',
    'addUserConfirmBtn': '추가',
    'deleteSelectedUsersBtn': '선택 사용자 삭제',
    'saveAiConfigBtn': '저장',
    'saveApiConfigBtn': '저장',
    'excelReplaceBtn': '기존 삭제 후 업로드',
    'excelAppendBtn': '추가만',
    'excelCancelBtn': '취소'
  };

  // 모든 버튼 처리 - ID를 가진 버튼 우선 처리
  document.querySelectorAll('button').forEach(btn => {
    // 언어 선택 버튼은 제외
    if (btn.classList.contains('lang-btn')) return;
    
    // ID를 가진 버튼은 buttonMappings에서 직접 찾아서 번역
    if (btn.id && buttonMappings[btn.id]) {
      const koKey = buttonMappings[btn.id];
      btn.textContent = langData[koKey] || koKey;
    }
  });
  
  // 6. 사이드바 제목 업데이트
  const listTitle = document.getElementById('listTitle');
  if (listTitle) {
    const currentText = listTitle.textContent;
    if (currentText.includes('담당') || currentText.includes('Manager') || currentText.includes('负责人') || currentText.includes('担当者')) {
      listTitle.textContent = `${langData['현 담당'] || '현 담당'} 목록`;
    } else if (currentText.includes('SHIPOWNER') || currentText.includes('船东') || currentText.includes('船主') || currentText.includes('선주사')) {
      listTitle.textContent = `${langData['SHIPOWNER'] || 'SHIPOWNER'} 목록`;
    }
  }
  
  // 7. 모달 내 텍스트 및 버튼 변경
  updateModalTexts(langData);
  
  // 8. 필터 내 select option 텍스트 업데이트
  updateSelectOptions(langData);
  
  console.log('UI 언어 업데이트 완료');
}

// 역방향 키 찾기 헬퍼 함수
function findReverseKey(text) {
  for (const [lang, translations] of Object.entries(translations)) {
    for (const [koKey, translation] of Object.entries(translations)) {
      if (translation === text) return koKey;
    }
  }
  return null;
}

// Select 옵션 업데이트 함수
function updateSelectOptions(langData) {
  // AS 구분 필터
  const asTypeFilter = document.getElementById('filterAsType');
  if (asTypeFilter) {
    Array.from(asTypeFilter.options).forEach(option => {
      const value = option.value;
      if (!value) option.textContent = langData["전체"] || "전체";
      else if (value === "무상") option.textContent = langData["무상"] || "무상";
      else if (value === "유상") option.textContent = langData["유상"] || "유상";
      else if (value === "위탁") option.textContent = langData["위탁"] || "위탁";
    });
  }
  
  // 동작여부 필터
  const activeFilter = document.getElementById('filterActive');
  if (activeFilter) {
    Array.from(activeFilter.options).forEach(option => {
      const value = option.value;
      if (!value) option.textContent = langData["전체"] || "전체";
      else if (value === "정상A") option.textContent = langData["정상A"] || "정상A";
      else if (value === "정상B") option.textContent = langData["정상B"] || "정상B";
      else if (value === "유상정상") option.textContent = langData["유상정상"] || "유상정상";
      else if (value === "부분동작") option.textContent = langData["부분동작"] || "부분동작";
      else if (value === "동작불가") option.textContent = langData["동작불가"] || "동작불가";
    });
  }
  
  // 그룹 필터
  const groupFilter = document.getElementById('filterGroup');
  if (groupFilter && groupFilter.options[0]) {
    groupFilter.options[0].textContent = langData["전체"] || "전체";
  }
  
  // 테이블 내 select 요소들도 업데이트
  document.querySelectorAll('td select').forEach(select => {
    const field = select.dataset.field;
    if (field === 'asType') {
      Array.from(select.options).forEach(option => {
        const value = option.value;
        if (value === "무상") option.textContent = langData["무상"] || "무상";
        else if (value === "유상") option.textContent = langData["유상"] || "유상";
        else if (value === "위탁") option.textContent = langData["위탁"] || "위탁";
      });
    } else if (field === '동작여부') {
      Array.from(select.options).forEach(option => {
        const value = option.value;
        if (langData[value]) option.textContent = langData[value];
      });
    }
  });
}

// 모달 텍스트 업데이트를 위한 새 함수
function updateModalTexts(langData) {
  // 모달 제목 매핑
  const modalTitles = {
    "historyModal": "변경 이력",
    "userModal": "사용자 관리",
    "apiConfigModal": "API 설정 관리",
    "excelModal": "엑셀 업로드 방식 선택",
    "contentModal": "전체 내용",
    "ownerAIModal": "선사별 접수내용/조치결과 요약",
    "aiConfigModal": "AI 설정 관리",
    "aiProgressModal": "AI 요약 진행 상황",
    "apiProgressModal": "API 데이터 가져오기",
    "forgotPasswordModal": "비밀번호 초기화",
    "changePasswordModal": "비밀번호 변경"
  };
  
  // 각 모달의 제목과 버튼 텍스트 변경
  Object.entries(modalTitles).forEach(([modalId, defaultTitle]) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // 제목 변경
    const titleEl = modal.querySelector('h2');
    if (titleEl && langData[defaultTitle]) {
      titleEl.textContent = langData[defaultTitle];
    }
    
    // 모달 내 버튼 텍스트 변경
    modal.querySelectorAll('button').forEach(btn => {
      const key = btn.textContent.trim();
      if (key && langData[key]) {
        btn.textContent = langData[key];
      }
    });
    
    // 모달 내 레이블 변경
    modal.querySelectorAll('label').forEach(label => {
      const key = label.textContent.trim();
      if (key && langData[key]) {
        label.textContent = langData[key];
      }
    });
  });
}

// 현황 필드 번역 함수 - 선택한 언어로 번역
async function translateStatusField() {
  // 현재 언어가 한국어인 경우 번역 안 함
  if (currentLanguage === 'ko') {
    alert('한국어가 선택된 상태에서는 번역할 필요가 없습니다.');
    return;
  }
  
  // 번역할 행 찾기
  const rows = document.querySelectorAll('#asBody tr');
  if (rows.length === 0) {
    alert('번역할 데이터가 없습니다.');
    return;
  }
  
  // 번역 방향 확인
  const translationDirection = getTranslationDirection(currentLanguage);
  if (!translationDirection) {
    alert('번역할 언어가 설정되지 않았습니다.');
    return;
  }
  
  const targetLangName = {
    'en': '영어',
    'zh': '중국어', 
    'ja': '일본어'
  }[translationDirection.to] || translationDirection.to;
  
  if (!confirm(`현황 필드를 ${targetLangName}로 번역하시겠습니까?`)) {
    return;
  }
  
  // 진행 표시기 생성
  const progressIndicator = document.createElement('div');
  progressIndicator.className = 'translation-progress';
  progressIndicator.innerHTML = `
    <div class="translation-spinner"></div>
    <div>${targetLangName}로 번역 중... (0/${rows.length})</div>
  `;
  document.body.appendChild(progressIndicator);
  
  // 테이블 비활성화
  document.getElementById('asTable').classList.add('translating');
  document.getElementById('translateBtn').disabled = true;
  
  try {
    // 일괄 업데이트를 위한 객체
    const updates = {};
    let successCount = 0;
    let errorCount = 0;
    
    // 각 행 순차적으로 처리
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // 행의 UID 가져오기
        const checkbox = row.querySelector('.rowSelectChk');
        if (!checkbox) continue;
        
        const uid = checkbox.dataset.uid;
        if (!uid) continue;
        
        // 현황 필드 내용 가져오기
        const statusCell = row.querySelector('td[data-field="현황"] input');
        if (!statusCell || !statusCell.value.trim()) continue;
        
        const originalText = statusCell.value.trim();
        
        // 이미 번역된 내용이 있는지 확인 (데이터베이스)
        const rowData = asData.find(r => r.uid === uid);
        if (!rowData) continue;
        
        // 현재 언어와 원본이 동일하고 번역본이 있으면 기존 번역 사용
        const currentTranslationKey = `현황번역_${currentLanguage}`;
        if (rowData[currentTranslationKey] && rowData.현황 === originalText) {
          // 이미 해당 언어로 번역된 내용이 있으면 기존 번역 사용
          const translationCell = row.querySelector('td[data-field="현황번역"] input');
          if (translationCell) {
            translationCell.value = rowData[currentTranslationKey];
          }
          successCount++;
        } else {
          try {
            // 번역 시도
            const translatedText = await translateText(originalText, translationDirection.to);
            
            if (translatedText && translatedText.trim()) {
              // 번역 결과를 화면에 표시
              const translationCell = row.querySelector('td[data-field="현황번역"] input');
              if (translationCell) {
                translationCell.value = translatedText;
              }
              
              // 데이터 업데이트 준비 (언어별로 저장)
              rowData.현황번역 = translatedText;
              rowData[currentTranslationKey] = translatedText; // 언어별 백업
              updates[`${asPath}/${uid}/현황번역`] = translatedText;
              updates[`${asPath}/${uid}/${currentTranslationKey}`] = translatedText;
              successCount++;
            } else {
              console.error(`행 ${i+1} 번역 결과가 비어있음`);
              errorCount++;
            }
          } catch (translationError) {
            console.error(`행 ${i+1} 번역 오류:`, translationError);
            errorCount++;
          }
        }
        
        // 진행 상황 업데이트
        progressIndicator.querySelector('div:last-child').textContent = 
          `${targetLangName}로 번역 중... (${i+1}/${rows.length}) - 성공: ${successCount}, 실패: ${errorCount}`;
        
      } catch (rowError) {
        console.error(`행 ${i+1} 처리 오류:`, rowError);
        errorCount++;
      }
      
      // API 호출 사이에 지연
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 데이터베이스에 일괄 업데이트
    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
      addHistory(`현황 번역(${targetLangName}) 완료 - 성공: ${successCount}, 실패: ${errorCount}`);
    }
    
    if (errorCount > 0) {
      alert(`${targetLangName} 번역 완료: ${successCount}개 성공, ${errorCount}개 실패\n\n일부 항목은 번역에 실패했습니다.`);
    } else {
      alert(`${targetLangName} 번역 완료: ${successCount}개 항목`);
    }
    
  } catch (error) {
    console.error('번역 처리 중 오류:', error);
    alert('번역 처리 중 오류가 발생했습니다.');
  } finally {
    // 진행 표시기 제거
    if (document.body.contains(progressIndicator)) {
      document.body.removeChild(progressIndicator);
    }
    
    // 테이블 활성화
    document.getElementById('asTable').classList.remove('translating');
    document.getElementById('translateBtn').disabled = false;
  }
}

// 수정된 translateText 함수 - 다른 API로 대체
async function translateText(text, targetLang) {
  try {
    // 텍스트가 비어있으면 바로 빈 문자열 반환
    if (!text || text.trim() === '') return '';

    // 먼저 LibreTranslate API 시도
    try {
      console.log("LibreTranslate API 시도 중...");
      const libreResult = await tryLibreTranslate(text, targetLang);
      console.log("LibreTranslate 성공!");
      return libreResult;
    } catch (libreError) {
      console.error("LibreTranslate API 실패:", libreError);
      
      // LibreTranslate 실패 시 MyMemory API 시도
      console.log("MyMemory API로 대체 시도 중...");
      const myMemoryResult = await tryMyMemoryTranslate(text, targetLang);
      console.log("MyMemory 번역 성공!");
      return myMemoryResult;
    }
  } catch (error) {
    console.error('모든 번역 API 실패:', error);
    throw new Error('번역 서비스를 사용할 수 없습니다.');
  }
}

// LibreTranslate API 시도
async function tryLibreTranslate(text, targetLang) {
  const apiUrl = 'https://libretranslate.com/translate';
  
  // 타임아웃 설정을 위한 AbortController 사용
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: 'ko',
        target: targetLang,
        format: 'text',
        api_key: ''
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.translatedText) {
      return data.translatedText;
    } else {
      throw new Error('번역 결과가 없습니다.');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error; // 오류를 상위로 전파
  }
}

// MyMemory API 시도 (대체 API)
async function tryMyMemoryTranslate(text, targetLang) {
  // MyMemory는 무료 사용 시 더 짧은 텍스트에 최적화되어 있으므로
  // 긴 텍스트는 문장 단위로 나누어 처리
  const sentences = text.split(/(?<=[.!?])\s+/);
  let translatedText = "";
  
  for (const sentence of sentences) {
    if (!sentence.trim()) continue;
    
    // MyMemory API URL - 언어 코드 매핑
    const langCodeMap = {
      'en': 'en',
      'zh': 'zh-CN', // MyMemory에서는 zh-CN 사용
      'ja': 'ja'
    };
    const mappedTargetLang = langCodeMap[targetLang] || targetLang;
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sentence)}&langpair=ko|${mappedTargetLang}&de=a@example.com`;
    
    // 타임아웃 설정을 위한 AbortController 사용
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.responseData && data.responseData.translatedText) {
        translatedText += data.responseData.translatedText + " ";
      } else {
        throw new Error('MyMemory 번역 결과가 없습니다.');
      }
      
      // API 제한 방지를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  return translatedText.trim();
}

// 언어 코드 매핑 함수 (translateStatusField 함수 앞에 추가)
function getTargetLanguageCode(currentLang) {
  const languageMap = {
    'ko': 'ko',  // 한국어 → 한국어 (번역 안 함)
    'en': 'en',  // 영어
    'zh': 'zh',  // 중국어
    'ja': 'ja'   // 일본어
  };
  
  return languageMap[currentLang] || 'en';
}

// 언어별 번역 방향 결정 함수
function getTranslationDirection(currentLang) {
  if (currentLang === 'ko') {
    return null; // 한국어일 때는 번역하지 않음
  }
  return { from: 'ko', to: getTargetLanguageCode(currentLang) };
}

/** ==================================
 *  사용자 인증 및 관리
 * ===================================*/
// 로그인 상태 감지 핸들러
auth.onAuthStateChanged(user => {
  if (user) {
    // 로그인됨
    document.getElementById('loginModal').style.display = 'none';
    
    // 현재 사용자 이메일 표시
    document.getElementById('currentUserName').textContent = user.email || "-";
    
    // 최초 로그인 여부 확인
    checkFirstLogin(user.uid)
      .then(isFirstLogin => {
        if (isFirstLogin) {
          // 최초 로그인이면 비밀번호 변경 모달 표시
          showChangePasswordModal();
        } else {
          // 최초 로그인이 아니면 정상적으로 화면 표시
          showMainInterface();
        }
      })
      .catch(error => {
        console.error('최초 로그인 확인 오류:', error);
        // 오류 발생 시 일단 정상적으로 화면 표시
        showMainInterface();
      });
  } else {
    // 미로그인
    resetInterface();
  }
});

// 인터페이스 초기화
function resetInterface() {
  document.getElementById('loginModal').style.display = 'block';
  document.getElementById('sidebar').classList.add('hidden');
  document.getElementById('mainContainer').classList.add('hidden');
  
  // 로그인 화면 초기화
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPw').value = '';
  document.getElementById('loginError').textContent = '';
  
  // 데이터 초기화
  asData = [];
  dataLoaded = false;
}

// 메인 인터페이스 표시
function showMainInterface() {
  document.getElementById('sidebar').classList.remove('hidden');
  document.getElementById('mainContainer').classList.remove('hidden');
  
  // 초기 데이터 로드는 한 번만 수행
  if (!dataLoaded) {
    testConnection();
    loadData();
    loadAiConfig();
    loadApiConfig();
    dataLoaded = true;
  }
}

// 로그인 수행
function performLogin() {
  const email = document.getElementById('loginUser').value.trim();
  const pw = document.getElementById('loginPw').value.trim();
  
  // 입력값 검증
  if (!email || !pw) {
    document.getElementById('loginError').textContent = "이메일과 비밀번호를 모두 입력하세요.";
    return;
  }
  
  // 이메일 형식 체크
  if (!email.includes('@')) {
    document.getElementById('loginError').textContent = "올바른 이메일 형식을 입력해주세요.";
    return;
  }
  
  // 로그인 상태 표시
  document.getElementById('loginError').textContent = "로그인 중...";
  
  auth.signInWithEmailAndPassword(email, pw)
    .then(() => {
      document.getElementById('loginError').textContent = "";
    })
    .catch(err => {
      console.error("로그인 오류:", err);
      
      // 오류 코드에 따른 세부 메시지 표시
      let errorMsg = "로그인에 실패했습니다.";
      
      switch(err.code) {
        case 'auth/wrong-password':
          errorMsg = "비밀번호가 올바르지 않습니다.";
          break;
        case 'auth/user-not-found':
          errorMsg = "등록되지 않은 이메일입니다.";
          break;
        case 'auth/invalid-email':
          errorMsg = "유효하지 않은 이메일 형식입니다.";
          break;
        case 'auth/user-disabled':
          errorMsg = "비활성화된 계정입니다. 관리자에게 문의하세요.";
          break;
        case 'auth/too-many-requests':
          errorMsg = "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
          break;
        default:
          errorMsg = "로그인 실패: " + err.message;
      }
      
      document.getElementById('loginError').textContent = errorMsg;
    });
}

// 로그아웃
function logoutUser() {
  if(confirm("로그아웃 하시겠습니까?")) {
    auth.signOut()
      .then(() => {
        console.log("로그아웃 완료");
      })
      .catch(err => {
        console.error("로그아웃 오류:", err);
        alert("로그아웃 중 오류가 발생했습니다.");
      });
  }
}

// 최초 로그인 여부 확인
async function checkFirstLogin(userId) {
  try {
    const snapshot = await db.ref(`${userMetaPath}/${userId}`).once('value');
    const userData = snapshot.val();
    
    if (!userData || !userData.lastLogin) {
      return true; // 최초 로그인
    }
    return false;
  } catch (error) {
    console.error('최초 로그인 확인 중 오류:', error);
    throw error;
  }
}

// 로그인 기록 업데이트
async function updateLoginRecord(userId) {
  try {
    const now = new Date().toISOString();
    await db.ref(`${userMetaPath}/${userId}`).update({
      lastLogin: now,
      passwordChanged: true
    });
  } catch (error) {
    console.error('로그인 기록 업데이트 오류:', error);
    throw error;
  }
}

// 비밀번호 변경 모달 표시
function showChangePasswordModal(isFirstLogin = true) {
  // 입력 필드 초기화
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  document.getElementById('changePasswordStatus').textContent = '';
  document.getElementById('changePasswordStatus').className = '';
  
  // 최초 로그인 여부 플래그 설정
  document.getElementById('changePasswordModal').setAttribute('data-first-login', isFirstLogin ? 'true' : 'false');
  
  // 모달 표시
  document.getElementById('changePasswordModal').style.display = 'block';
  
  // 현재 비밀번호 필드에 포커스
  setTimeout(() => {
    document.getElementById('currentPassword').focus();
  }, 300);
}

// 비밀번호 변경 처리
async function changeUserPassword() {
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const statusElement = document.getElementById('changePasswordStatus');
  
  // 상태 메시지 초기화
  statusElement.textContent = '';
  statusElement.className = '';
  
  // 입력값 검증
  if (!currentPassword) {
    statusElement.textContent = '현재 비밀번호를 입력해주세요.';
    statusElement.className = 'error';
    document.getElementById('currentPassword').focus();
    return;
  }
  
  if (!newPassword) {
    statusElement.textContent = '새 비밀번호를 입력해주세요.';
    statusElement.className = 'error';
    document.getElementById('newPassword').focus();
    return;
  }
  
  if (!confirmPassword) {
    statusElement.textContent = '새 비밀번호 확인을 입력해주세요.';
    statusElement.className = 'error';
    document.getElementById('confirmPassword').focus();
    return;
  }
  
  if (newPassword !== confirmPassword) {
    statusElement.textContent = '새 비밀번호가 일치하지 않습니다.';
    statusElement.className = 'error';
    document.getElementById('confirmPassword').focus();
    return;
  }
  
  if (newPassword.length < 6) {
    statusElement.textContent = '비밀번호는 6자 이상이어야 합니다.';
    statusElement.className = 'error';
    document.getElementById('newPassword').focus();
    return;
  }
  
  if (currentPassword === newPassword) {
    statusElement.textContent = '현재 비밀번호와 새 비밀번호가 같습니다.';
    statusElement.className = 'error';
    document.getElementById('newPassword').focus();
    return;
  }
  
  statusElement.textContent = '비밀번호 변경 중...';
  
  try {
    // 현재 사용자 가져오기
    const user = auth.currentUser;
    if (!user) {
      throw new Error('로그인된 사용자가 없습니다.');
    }
    
    // 재인증 (현재 비밀번호 확인)
    const credential = firebase.auth.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    
    await user.reauthenticateWithCredential(credential);
    
    // 비밀번호 변경
    await user.updatePassword(newPassword);
    
    // 비밀번호 변경 성공 후 데이터베이스에 로그인 기록 저장
    await updateLoginRecord(user.uid);
    
    statusElement.textContent = '비밀번호가 성공적으로 변경되었습니다.';
    statusElement.className = 'success';
    
    // 비밀번호 변경이 성공적으로 이루어졌다면, 2초 후 모달 닫고 메인 화면 표시
    setTimeout(() => {
      document.getElementById('changePasswordModal').style.display = 'none';
      
      // 최초 로그인 일 경우에만 메인 화면으로 전환
      if (document.getElementById('changePasswordModal').getAttribute('data-first-login') === 'true') {
        showMainInterface();
      }
    }, 2000);
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    let errorMsg = '비밀번호 변경 중 오류가 발생했습니다.';
    
    if (error.code === 'auth/wrong-password') {
      errorMsg = '현재 비밀번호가 올바르지 않습니다.';
      document.getElementById('currentPassword').focus();
    } else if (error.code === 'auth/weak-password') {
      errorMsg = '새 비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요.';
      document.getElementById('newPassword').focus();
    } else if (error.code === 'auth/requires-recent-login') {
      errorMsg = '보안을 위해 재로그인이 필요합니다. 로그아웃 후 다시 로그인해주세요.';
      // 로그아웃 처리
      setTimeout(() => {
        auth.signOut().then(() => {
          alert('보안을 위해 재로그인이 필요합니다. 다시 로그인해주세요.');
        });
      }, 2000);
    }
    
    statusElement.textContent = errorMsg;
    statusElement.className = 'error';
  }
}

// 비밀번호 찾기 모달 열기
function openForgotPasswordModal(e) {
  if (e) e.preventDefault();
  // 로그인 창의 이메일을 비밀번호 찾기 창에 복사
  const loginEmail = document.getElementById('loginUser').value.trim();
  document.getElementById('resetEmail').value = loginEmail;
  document.getElementById('resetEmailStatus').textContent = '';
  document.getElementById('resetEmailStatus').className = '';
  
  // 비밀번호 찾기 모달 표시
  document.getElementById('forgotPasswordModal').style.display = 'block';
}

// 비밀번호 초기화 이메일 전송
function sendPasswordResetEmail() {
  const email = document.getElementById('resetEmail').value.trim();
  if (!email) {
    document.getElementById('resetEmailStatus').textContent = '이메일을 입력하세요.';
    document.getElementById('resetEmailStatus').className = 'error';
    return;
  }
  
  // Firebase 비밀번호 재설정 이메일 전송
  auth.sendPasswordResetEmail(email)
    .then(() => {
      document.getElementById('resetEmailStatus').textContent = '비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.';
      document.getElementById('resetEmailStatus').className = 'success';
      
      // 3초 후 모달 닫기
      setTimeout(() => {
        closeForgotPasswordModal();
      }, 3000);
    })
    .catch((error) => {
      console.error('비밀번호 재설정 이메일 전송 오류:', error);
      let errorMsg = '이메일 전송 중 오류가 발생했습니다.';
      
      if (error.code === 'auth/user-not-found') {
        errorMsg = '해당 이메일로 등록된 사용자가 없습니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = '유효하지 않은 이메일 형식입니다.';
      }
      
      document.getElementById('resetEmailStatus').textContent = errorMsg;
      document.getElementById('resetEmailStatus').className = 'error';
    });
}

// 비밀번호 찾기 모달 닫기
function closeForgotPasswordModal() {
  document.getElementById('forgotPasswordModal').style.display = 'none';
  document.getElementById('resetEmailStatus').textContent = '';
  document.getElementById('resetEmailStatus').className = '';
}

/** ==================================
 *  사용자 관리
 * ===================================*/
// 사용자 관리 모달 열기
function openUserModal() {
  if (!adminAuthorized) {
    const pw = prompt("관리자 비밀번호:");
    if (pw !== 'snsys1234') {
      alert("관리자 비밀번호가 다릅니다.");
      return;
    }
    adminAuthorized = true;
  }
  
  // 사용자 목록 불러오기
  db.ref(userPath).once('value').then(snap => {
    const val = snap.val() || {};
    userData = Object.entries(val).map(([k, v]) => ({uid: k, ...v}));
    renderUserList();
    document.getElementById('userModal').style.display = 'block';
  });
}

// 사용자 목록 렌더링
function renderUserList() {
  const listDiv = document.getElementById('userList');
  listDiv.innerHTML = '';
  userData.forEach(u => {
    const row = document.createElement('div');
    row.style.marginBottom = '4px';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.dataset.uid = u.uid;
    chk.style.marginRight = '6px';
    row.appendChild(chk);

    const txt = document.createElement('span');
    txt.textContent = `사용자명: ${u.username}, 비번: ${u.password}`;
    row.appendChild(txt);

    listDiv.appendChild(row);
  });
}

// 사용자 관리 모달 닫기
function closeUserModal() {
  document.getElementById('userModal').style.display = 'none';
}

// 선택된 사용자 삭제
function deleteSelectedUsers() {
  const cks = document.querySelectorAll('#userList input[type=checkbox]:checked');
  if (!cks.length) {
    alert("삭제할 사용자를 선택하세요.");
    return;
  }
  if (!confirm("선택한 사용자들을 삭제하시겠습니까?")) return;

  // 일괄 업데이트를 위한 객체
  const updates = {};
  cks.forEach(chk => {
    const uid = chk.dataset.uid;
    updates[uid] = null; // Firebase에서 null은 삭제를 의미
  });

  // 일괄 업데이트 수행
  db.ref(userPath).update(updates)
    .then(() => {
      // 재조회
      return db.ref(userPath).once('value');
    })
    .then(snap => {
      const val = snap.val() || {};
      userData = Object.entries(val).map(([k, v]) => ({uid: k, ...v}));
      renderUserList();
    });
}

// 새 사용자 추가
function addNewUser() {
  const uname = document.getElementById('newUserName').value.trim();
  const upw = document.getElementById('newUserPw').value.trim();
  if (!uname || !upw) {
    alert("사용자명/비번 필수 입력");
    return;
  }
  const key = db.ref(userPath).push().key;
  db.ref(`${userPath}/${key}`).set({username: uname, password: upw})
    .then(() => {
      alert("사용자 등록 완료");
      document.getElementById('newUserName').value = '';
      document.getElementById('newUserPw').value = '';
      // 목록 갱신
      return db.ref(userPath).once('value');
    })
    .then(snap => {
      const val = snap.val() || {};
      userData = Object.entries(val).map(([k, v]) => ({uid: k, ...v}));
      renderUserList();
    });
}

/** ==================================
 *  AI 설정 관리
 * ===================================*/
// AI 설정 모달 열기
function openAiConfigModal() {
  if (!adminAuthorized) {
    const pw = prompt("관리자 비밀번호:");
    if (pw !== 'snsys1234') {
      alert("관리자 비밀번호가 다릅니다.");
      return;
    }
    adminAuthorized = true;
  }
  
  // 모달에 현재값 세팅
  document.getElementById('aiApiKey').value = g_aiConfig.apiKey || "";
  document.getElementById('aiModel').value = g_aiConfig.model || "";
  document.getElementById('aiPromptRow').value = g_aiConfig.promptRow || "";
  document.getElementById('aiPromptHistory').value = g_aiConfig.promptHistory || "";
  document.getElementById('aiPromptOwner').value = g_aiConfig.promptOwner || "";

  document.getElementById('aiConfigModal').style.display = 'block';
}

// AI 설정 저장
async function saveAiConfig() {
  const newConfig = {
    apiKey: document.getElementById('aiApiKey').value.trim(),
    model: document.getElementById('aiModel').value.trim(),
    promptRow: document.getElementById('aiPromptRow').value,
    promptHistory: document.getElementById('aiPromptHistory').value,
    promptOwner: document.getElementById('aiPromptOwner').value
  };
  await db.ref(aiConfigPath).set(newConfig);
  alert("AI 설정이 저장되었습니다.");
  g_aiConfig = newConfig;
  document.getElementById('aiConfigModal').style.display = 'none';
}

// AI 설정 로드
async function loadAiConfig() {
  const snap = await db.ref(aiConfigPath).once('value');
  if (snap.exists()) {
    g_aiConfig = snap.val();
  }
}

/** ==================================
 *  API 설정 관리
 * ===================================*/
// API 설정 모달 열기
function openApiConfigModal() {
  if (!adminAuthorized) {
    const pw = prompt("관리자 비밀번호:");
    if (pw !== 'snsys1234') {
      alert("관리자 비밀번호가 다릅니다.");
      return;
    }
    adminAuthorized = true;
  }
  
  // 모달에 현재값 세팅
  document.getElementById('vesselfinder_apikey').value = g_apiConfig.apiKey || "";
  document.getElementById('vesselfinder_baseurl').value = g_apiConfig.baseUrl || "https://api.vesselfinder.com/masterdata";

  // API 크레딧 상태 확인
  checkApiCreditStatus();
  
  document.getElementById('apiConfigModal').style.display = 'block';
}

// API 설정 모달 닫기
function closeApiConfigModal() {
  document.getElementById('apiConfigModal').style.display = 'none';
}

// API 설정 저장
async function saveApiConfig() {
  const newConfig = {
    apiKey: document.getElementById('vesselfinder_apikey').value.trim(),
    baseUrl: document.getElementById('vesselfinder_baseurl').value.trim()
  };
  await db.ref(apiConfigPath).set(newConfig);
  alert("API 설정이 저장되었습니다.");
  g_apiConfig = newConfig;
  document.getElementById('apiConfigModal').style.display = 'none';
}

// API 설정 로드
async function loadApiConfig() {
  const snap = await db.ref(apiConfigPath).once('value');
  if (snap.exists()) {
    g_apiConfig = snap.val();
  }
}

// API 크레딧 상태 확인 함수 수정 (이어서)
async function checkApiCreditStatus() {
  const statusElem = document.getElementById('apiCreditStatus');
  statusElem.textContent = "API 상태 확인 중...";
  
  const apiKey = document.getElementById('vesselfinder_apikey').value.trim() || g_apiConfig.apiKey;
  
  if (!apiKey) {
    statusElem.textContent = "API Key가 설정되지 않았습니다.";
    return;
  }
  
  try {
    // CORS 프록시 사용
    const corsProxy = "https://api.allorigins.win/raw?url=";
    // STATUS 메서드를 직접 호출
    const targetUrl = `https://api.vesselfinder.com/status?userkey=${apiKey}`;
    const statusUrl = `${corsProxy}${encodeURIComponent(targetUrl)}`;
    
    const response = await fetch(statusUrl);
    const responseText = await response.text();
    
    // 응답이 JSON인지 확인
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      statusElem.innerHTML = `<p>JSON 파싱 오류: ${e.message}</p><p>원본 응답: ${responseText}</p>`;
      return;
    }
    
    // 오류 확인
    if (data.error) {
      statusElem.textContent = `오류: ${data.error}`;
      return;
    }
    
    // 정상 응답 처리 (문서에 따른 형식)
    if (data.CREDITS !== undefined) {
      // 문서에 있는 형식으로 응답이 온 경우
      const credits = data.CREDITS;
      const expirationDate = data.EXPIRATION_DATE || 'N/A';
      
      statusElem.innerHTML = `
        <div style="margin-top:10px;">
          <p><strong>남은 크레딧:</strong> ${credits}</p>
          <p><strong>만료일:</strong> ${expirationDate}</p>
        </div>
      `;
    } 
    // 배열 형태로 응답이 올 경우
    else if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      
      if (firstItem.CREDITS !== undefined) {
        const credits = firstItem.CREDITS;
        const expirationDate = firstItem.EXPIRATION_DATE || 'N/A';
        
        statusElem.innerHTML = `
          <div style="margin-top:10px;">
            <p><strong>남은 크레딧:</strong> ${credits}</p>
            <p><strong>만료일:</strong> ${expirationDate}</p>
          </div>
        `;
      } else {
        statusElem.innerHTML = `<p>예상치 못한 응답 형식입니다: ${JSON.stringify(data)}</p>`;
      }
    } 
    // STATUS 객체 내에 정보가 있는 경우
    else if (data.STATUS) {
      const status = data.STATUS;
      const credits = status.CREDITS || status.credits || 'N/A';
      const expirationDate = status.EXPIRATION_DATE || status.expiration_date || 'N/A';
      
      statusElem.innerHTML = `
        <div style="margin-top:10px;">
          <p><strong>남은 크레딧:</strong> ${credits}</p>
          <p><strong>만료일:</strong> ${expirationDate}</p>
        </div>
      `;
    }
    // 다른 형식의 응답
    else {
      statusElem.innerHTML = `
        <p>응답을 해석할 수 없습니다. 원본 응답:</p>
        <pre style="max-height:150px;overflow:auto;background:#f5f5f5;padding:5px;font-size:0.8em;">${JSON.stringify(data, null, 2)}</pre>
      `;
    }
    
  } catch (error) {
    console.error("API 상태 확인 오류:", error);
    statusElem.textContent = `API 상태 확인 중 오류가 발생했습니다: ${error.message}`;
  }
}

/** ==================================
 *  API 진행 상황 모달
 * ===================================*/
function showApiProgressModal() {
  document.getElementById('apiProgressText').textContent = "데이터 요청 중...";
  document.getElementById('apiProgressModal').style.display = 'block';
}

function updateApiProgressText(text) {
  const div = document.getElementById('apiProgressText');
  div.textContent += "\n" + text;
  // 자동 스크롤
  div.scrollTop = div.scrollHeight;
}

function clearApiProgressText() {
  document.getElementById('apiProgressText').textContent = "";
}

function closeApiProgressModal() {
  document.getElementById('apiProgressModal').style.display = 'none';
}

/** ==================================
 *  AI 실시간 진행 모달
 * ===================================*/
function showAiProgressModal() {
  document.getElementById('aiProgressText').textContent = "요약 요청 중...";
  document.getElementById('aiProgressModal').style.display = 'block';
}

function updateAiProgressText(chunk) {
  const div = document.getElementById('aiProgressText');
  div.textContent += chunk;
  // 자동 스크롤
  div.scrollTop = div.scrollHeight;
}

function clearAiProgressText() {
  document.getElementById('aiProgressText').textContent = "";
}

function closeAiProgressModal() {
  document.getElementById('aiProgressModal').style.display = 'none';
}

/** ==================================
 *  데이터 관리 및 테이블 기능
 * ===================================*/
// Firebase 연결 테스트
function testConnection() {
  db.ref('test').set({time: Date.now()})
    .then(() => {
      document.getElementById('connectionStatus').textContent = "연결 상태: Firebase 연결됨";
      document.getElementById('connectionStatus').style.color = "green";
    })
    .catch(err => {
      document.getElementById('connectionStatus').textContent = "연결 오류:" + err.message;
      document.getElementById('connectionStatus').style.color = "red";
    });
}

// 메인 데이터 로드 - 성능 최적화를 위해 수정
function loadData() {
  db.ref(asPath).once('value').then(snap => {
    const val = snap.val() || {};
    
    // Object.values 대신 더 효율적인 방법 사용
    asData = [];
    Object.keys(val).forEach(key => {
      const r = val[key];
      
      // 호환 처리 - 기존 필드에 바로 업데이트하여 중복 작업 줄임
      if (r["현 담당"] && !r.manager) r.manager = r["현 담당"];
      if (r["SHIPOWNER"] && !r.shipowner) r.shipowner = r["SHIPOWNER"];
      if (r.group && typeof r.group !== 'string') r.group = String(r.group);
if (!("AS접수일자" in r)) r["AS접수일자"] = "";
      if (!("정상지연" in r)) r["정상지연"] = "";
      if (!("지연 사유" in r)) r["지연 사유"] = "";
      
      // API 필드 초기화 (추가된 부분)
      if (!("api_name" in r)) r["api_name"] = "";
      if (!("api_owner" in r)) r["api_owner"] = "";
      if (!("api_manager" in r)) r["api_manager"] = "";
      
      // 현황번역 필드 초기화 (추가된 부분)
      if (!("현황번역" in r)) r["현황번역"] = "";
      
      asData.push(r);
    });
    
    // 좌측 패널(담당자/선주사 목록) 표시
    updateSidebarList();
  });
}


// onCellChange 함수 수정 - 변경된 행 추적
function onCellChange(e) {
  const uid = e.target.dataset.uid;
  const field = e.target.dataset.field;
  let newVal = "";
  
  if (e.target.type === 'checkbox') {
    newVal = e.target.checked ? "Y" : "";
  } else {
    newVal = e.target.value;
  }
  
  // 해당 UID의 데이터 찾기
  const row = asData.find(x => x.uid === uid);
  if (!row) return;
  
  const oldVal = row[field] || '';
  if (oldVal === newVal) return;
  
  // 데이터 로컬 업데이트
  row[field] = newVal;
  
  // 수정된 행 추적
  modifiedRows.add(uid);
  
  // 변경 사항 일괄 업데이트를 위해 저장
  if (!pendingRowUpdates.has(uid)) {
    pendingRowUpdates.set(uid, {});
  }
  pendingRowUpdates.get(uid)[field] = newVal;
  
  // 일괄 처리 예약 (300ms 디바운스)
  if (window.pendingUpdateTimer) {
    clearTimeout(window.pendingUpdateTimer);
  }
  window.pendingUpdateTimer = setTimeout(processRowUpdates, 300);
  
  // 특정 필드 변경 시 테이블 즉시 다시 그리기
  if (field === "정상지연" || field === "AS접수일자" || field === "기술적종료일") {
    // 필터 상태 저장
    saveFilterState();
    
    // 현재 필터 활성화 상태에 따라 렌더링
    if (isFilterActive) {
      renderTable(false);
    } else if (lastRenderedData.length > 0) {
      renderTable(true);
    } else {
      renderTable(false);
    }
    
    restoreFilterState();
  }
  
  // 현황 필드가 변경되었다면 현황번역 필드를 초기화
  if (field === "현황") {
    row.현황번역 = "";
    if (!pendingRowUpdates.has(uid)) {
      pendingRowUpdates.set(uid, {});
    }
    pendingRowUpdates.get(uid)["현황번역"] = "";
    
    // 번역 필드 UI 업데이트
    const translationCell = e.target.closest('tr').querySelector('td[data-field="현황번역"] input');
    if (translationCell) {
      translationCell.value = "";
    }
  }
}

// 수정된 데이터만 저장
// saveAllData 함수 수정 - modifiedRows를 사용하지 않고 직접 비교
// 수정된 항목만 저장하는 saveAllData
function saveAllData() {
  if (modifiedRows.size === 0) {
    alert("수정된 내용이 없습니다.");
    return;
  }
  
  if (!confirm(`수정된 ${modifiedRows.size}개 항목을 저장하시겠습니까?`)) return;
  
  // 저장 중 표시
  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn.textContent;
  saveBtn.textContent = "저장 중...";
  saveBtn.disabled = true;
  
  // 수정된 행만 업데이트 객체 생성
  const updates = {};
  modifiedRows.forEach(uid => {
    const row = asData.find(r => r.uid === uid);
    if (row) {
      updates[uid] = row;
    }
  });
  
  db.ref(asPath).update(updates)
    .then(() => {
      const count = modifiedRows.size;
      modifiedRows.clear(); // 저장 후 수정된 행 목록 초기화
      
      alert(`${count}개 항목 저장 완료`);
      addHistory(`수정된 ${count}개 항목 저장`);
      
      // 버튼 상태 복원
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
      
      // 저장 성공 표시
      saveBtn.classList.add('save-success');
      setTimeout(() => {
        saveBtn.classList.remove('save-success');
      }, 1000);
    })
    .catch(err => {
      alert("저장 중 오류 발생: " + err.message);
      console.error("저장 오류:", err);
      
      // 버튼 상태 복원
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    });
}


// 새 행 추가 시에도 수정된 행으로 추가
function addNewRow() {
  const uid = db.ref().push().key;
  const obj = {
    uid,
    공번: '', 공사: '', imo: '', hull: '', shipName: '', repMail: '',
    shipType: '', scale: '', 구분: '', shipowner: '', major: '', group: '',
    shipyard: '', contract: '', asType: '유상', delivery: '', warranty: '',
    prevManager: '', manager: '', 현황: '', 현황번역: '', 동작여부: '정상A',
    조치계획: '', 접수내용: '', 조치결과: '',
    "AS접수일자": '',
    "기술적종료일": '',
    "정상지연": '',
    "지연 사유": '',
    // API 필드 추가
    "api_name": '',
    "api_owner": '',
    "api_manager": ''
  };
  
  // 행을 배열 앞에 추가하여 최근 추가 항목이 맨 위에 표시되도록 함
  asData.unshift(obj);
  
  // 새로 추가된 행을 수정된 행으로 표시
  modifiedRows.add(uid);
  
  // 필터 상태 저장 및 복원
  saveFilterState();
  renderTable(true); // 바로 보여주도록
  restoreFilterState();
}

// 새 행 추가
function addNewRow() {
  const uid = db.ref().push().key;
  const obj = {
    uid,
    공번: '', 공사: '', imo: '', hull: '', shipName: '', repMail: '',
    shipType: '', scale: '', 구분: '', shipowner: '', major: '', group: '',
    shipyard: '', contract: '', asType: '유상', delivery: '', warranty: '',
    prevManager: '', manager: '', 현황: '', 현황번역: '', 동작여부: '정상A',
    조치계획: '', 접수내용: '', 조치결과: '',
    "AS접수일자": '',
    "기술적종료일": '',
    "정상지연": '',
    "지연 사유": '',
    // API 필드 추가
    "api_name": '',
    "api_owner": '',
    "api_manager": ''
  };
  
  // 행을 배열 앞에 추가하여 최근 추가 항목이 맨 위에 표시되도록 함
  asData.unshift(obj);
  
  // 필터 상태 저장 및 복원
  saveFilterState();
  renderTable(true); // 바로 보여주도록
  restoreFilterState();
}

// 선택 행 삭제
function deleteSelectedRows() {
  const cks = document.querySelectorAll('.rowSelectChk:checked');
  if (!cks.length) {
    alert("삭제할 행을 선택하세요.");
    return;
  }
  if (!confirm("정말 삭제하시겠습니까?")) return;
  
  // 선택된 항목의 uid를 모두 수집
  const uidsToDelete = Array.from(cks).map(chk => chk.dataset.uid);
  
  // 데이터 배열에서 선택된 항목 필터링
  asData = asData.filter(x => !uidsToDelete.includes(x.uid));
  
  // 체크박스 초기화 및 테이블 다시 그리기
  document.getElementById('selectAll').checked = false;
  
  // 필터 상태 저장 및 복원
  saveFilterState();
  renderTable(true);
  restoreFilterState();
}

// 모든 체크박스 선택/해제
function toggleSelectAll(e) {
  const cks = document.querySelectorAll('.rowSelectChk');
  cks.forEach(c => c.checked = e.target.checked);
}

// 테이블 클릭 이벤트 핸들러
function handleTableClick(e) {
  // 헤더 클릭 시 정렬 (col-resizer 클릭은 제외)
  if ((e.target.tagName === 'TH' || e.target.closest('th')) && !e.target.classList.contains('col-resizer')) {
    const th = e.target.tagName === 'TH' ? e.target : e.target.closest('th');
    const field = th.dataset.field;
    
    if (!field) return;
    
    // 정렬 디버깅 로그
    console.log(`헤더 클릭: ${field}`);
    
    // 기존 정렬 표시기 제거
    document.querySelectorAll('th .sort-indicator').forEach(indicator => {
      indicator.remove();
    });
    
    // 정렬 방향 결정
    if (sortField === field) {
      sortAsc = !sortAsc; // 같은 필드 클릭 시 정렬 방향 반전
    } else {
      sortField = field;
      sortAsc = true;
    }
    
    console.log(`정렬 설정: field=${sortField}, asc=${sortAsc}`);
    
    // 정렬 표시기 추가
    const sortIndicator = document.createElement('span');
    sortIndicator.className = 'sort-indicator';
    sortIndicator.innerHTML = sortAsc ? ' &#9650;' : ' &#9660;'; // 위/아래 화살표
    th.appendChild(sortIndicator);
    
    // 전체 데이터 정렬 - 메모리 내에서 직접 정렬
    asData.sort((a, b) => {
      // 정렬 대상 필드의 값을 추출 (문자열로 변환하여 비교)
      const aVal = String(a[field] || '').toLowerCase();
      const bVal = String(b[field] || '').toLowerCase();
      
      // 정렬 방향에 따라 비교 결과 반환
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
    
    console.log(`정렬 완료, 첫 번째 값: ${asData[0][field]}, 마지막 값: ${asData[asData.length-1][field]}`);
    
    // 전체 테이블 다시 그리기 (정렬된 데이터로)
    saveFilterState();
    renderTable(true);
    restoreFilterState();
  }
}

// 테이블 렌더링 함수 - 성능 최적화를 위해 완전히 개선
/**
 * renderTable - 필터링 및 정렬된 테이블 렌더링
 * @param {boolean} overrideAll - true면 필터가 전부 비어 있어도 전체데이터 표시
 */
function renderTable(overrideAll = false) {
  // 중복 렌더링 방지
  if (isTableRendering) return;
  isTableRendering = true;
  
  try {
    // 데이터 유효성 검사
    if (!asData.length) {
      document.getElementById('asBody').innerHTML = '';
      document.getElementById('count정상A').textContent = '0';
      document.getElementById('count정상B').textContent = '0';
      document.getElementById('count유상정상').textContent = '0';
      document.getElementById('count부분동작').textContent = '0';
      document.getElementById('count동작불가').textContent = '0';
      isTableRendering = false;
      return;
    }

    // 현재 필터 상태 저장
    saveFilterState();

    // 필터값 수집
    const fIMO = currentFilterState.imo || '';
    const fHull = currentFilterState.hull || '';
    const fName = currentFilterState.name || '';
    const fOwner = currentFilterState.owner || '';
    const fMajor = currentFilterState.major || '';
    const fRepMail = currentFilterState.repMail || '';
    const fGroup = currentFilterState.group || '';
    const fAsType = currentFilterState.asType || '';
    const fMgr = currentFilterState.manager || '';
    const fActive = currentFilterState.active || '';

    const allEmpty = !fIMO && !fHull && !fName && !fOwner && !fMajor && !fRepMail && !fGroup && !fAsType && !fMgr && !fActive;
    if (allEmpty && !overrideAll) {
      document.getElementById('asBody').innerHTML = '';
      updateSidebarList(); 
      // 상태 집계 초기화
      document.getElementById('count정상A').textContent = '0';
      document.getElementById('count정상B').textContent = '0';
      document.getElementById('count유상정상').textContent = '0';
      document.getElementById('count부분동작').textContent = '0';
      document.getElementById('count동작불가').textContent = '0';
      isTableRendering = false;
      lastRenderedData = [];
      return;
    }

    // 필터링 및 정렬 작업 - 새 배열 생성으로 원본 데이터 보존
    let filteredData = [];
    
    // 필터링 작업
    filteredData = asData.filter(row => {
      if (!overrideAll) {
        const imoVal = String(row.imo || '').toLowerCase();
        const hullVal = String(row.hull || '').toLowerCase();
        const nameVal = String(row.shipName || '').toLowerCase();
        const ownVal = String(row.shipowner || '').toLowerCase();
        const majVal = String(row.major || '').toLowerCase();
        const repMailVal = String(row.repMail || '').toLowerCase();
        const mgrVal = String(row.manager || '').toLowerCase();
        const actVal = String(row.동작여부 || '');

        if (fIMO && !imoVal.includes(fIMO.toLowerCase())) return false;
        if (fHull && !hullVal.includes(fHull.toLowerCase())) return false;
        if (fName && !nameVal.includes(fName.toLowerCase())) return false;
        if (fOwner && !ownVal.includes(fOwner.toLowerCase())) return false;
        if (fMajor && !majVal.includes(fMajor.toLowerCase())) return false;
        if (fRepMail && !repMailVal.includes(fRepMail.toLowerCase())) return false;
        if (fGroup && row.group !== fGroup) return false;
        if (fAsType && row.asType !== fAsType) return false;
        if (fMgr && !mgrVal.includes(fMgr.toLowerCase())) return false;
        if (fActive && actVal !== fActive) return false;
      }
      return true;
    });

    // 정렬 적용 - 정렬 필드가 있을 때만
    if (sortField) {
      filteredData.sort((a, b) => {
        const aa = String(a[sortField] || '');
        const bb = String(b[sortField] || '');
        if (aa < bb) return sortAsc ? -1 : 1;
        if (aa > bb) return sortAsc ? 1 : -1;
        return 0;
      });
    }
    
    // 렌더링된 데이터 저장
    lastRenderedData = filteredData;
    
    // 상태 집계
    const counts = {정상A: 0, 정상B: 0, 유상정상: 0, 부분동작: 0, 동작불가: 0};
    
    filteredData.forEach(row => {
      if (counts.hasOwnProperty(row.동작여부)) counts[row.동작여부]++;
    });
    
    // DOM 조작 - 최적화를 위해 배치 렌더링 사용
    const tbody = document.getElementById('asBody');
    const batchSize = 50; // 한 번에 렌더링할 행 수
    let currentIndex = 0;
    
    // 테이블 헤더 먼저 렌더링
    renderTableHeaders();

    // 기존 내용 초기화
    tbody.innerHTML = '';
    
    // 배치 렌더링 함수
    const renderBatch = () => {
      const fragment = document.createDocumentFragment();
      const endIndex = Math.min(currentIndex + batchSize, filteredData.length);
      
      for (let i = currentIndex; i < endIndex; i++) {
        const row = filteredData[i];
        const tr = createTableRow(row, counts);
        fragment.appendChild(tr);
      }
      
      tbody.appendChild(fragment);
      currentIndex = endIndex;
      
      // 다음 배치가 있으면 계속 렌더링
      if (currentIndex < filteredData.length) {
        requestAnimationFrame(renderBatch);
      } else {
        // 렌더링 완료 후 작업
        finishRendering(counts);
      }
    };
    
    // 첫 번째 배치 렌더링 시작
    if (filteredData.length > 0) {
      requestAnimationFrame(renderBatch);
    } else {
      finishRendering(counts);
    }
    
  } finally {
    // 렌더링 플래그 초기화
    isTableRendering = false;
  }
}

// 렌더링 완료 후 작업
function finishRendering(counts) {
  // 동작여부 집계 표시
  document.getElementById('count정상A').textContent = counts.정상A;
  document.getElementById('count정상B').textContent = counts.정상B;
  document.getElementById('count유상정상').textContent = counts.유상정상;
  document.getElementById('count부분동작').textContent = counts.부분동작;
  document.getElementById('count동작불가').textContent = counts.동작불가;

  // 사이드바 목록 갱신
  updateSidebarList();
  
  // 언어 적용 (헤더 제외)
  updateUILanguageExceptHeaders();
}

// 헤더를 제외한 UI 업데이트 함수
function updateUILanguageExceptHeaders() {
  const langData = translations[currentLanguage];
  if (!langData) return;
  
  // 1. 헤더 및 상단 요소 변경
  document.querySelector('.header h1').textContent = langData["AS 현황 관리"] || "AS 현황 관리";
  
  // 사용자 정보 텍스트 변경
  const userInfoText = langData["사용자"] || "사용자";
  const userName = document.getElementById('currentUserName').textContent;
  document.getElementById('userInfo').innerHTML = `${userInfoText}: <span id="currentUserName">${userName}</span>`;
  
  // 로그아웃 버튼
  document.getElementById('logoutBtn').textContent = langData["로그아웃"] || "로그아웃";
  
  // 연결 상태 메시지
  const connectionText = document.getElementById('connectionStatus').textContent;
  const statusLabel = langData["연결 상태"] || "연결 상태";
  const statusValue = connectionText.split(":")[1] ? connectionText.split(":")[1].trim() : "";
  document.getElementById('connectionStatus').textContent = `${statusLabel}: ${statusValue}`;
  
  // 2. 상태 카드 변경
  document.querySelectorAll('.status-card h3').forEach(el => {
    const key = el.textContent;
    if (langData[key]) {
      el.textContent = langData[key];
    }
  });
  
  // 3. 필터 레이블 변경
  document.querySelectorAll('.filter-group label').forEach(el => {
    const key = el.textContent;
    if (langData[key]) {
      el.textContent = langData[key];
    }
  });
  
  // 필터 선택 옵션 변경 (select 요소 내부의 option 태그들)
  document.querySelectorAll('select option').forEach(el => {
    const key = el.textContent;
    if (langData[key]) {
      el.textContent = langData[key];
    }
  });

  // 5. 하단 버튼들의 ID 기반 매핑 (추가)
  const bottomButtonMappings = {
    'loadBtn': '전체조회',
    'addRowBtn': '행 추가', 
    'deleteRowBtn': '선택 행 삭제',
    'saveBtn': '저장',
    'downloadExcelBtn': '엑셀 다운로드',
    'uploadExcelBtn': '엑셀 업로드',
    'uploadAsStatusBtn': 'AS 현황 업로드',
    'historyBtn': '히스토리 조회',
    'clearHistoryBtn': '히스토리 전체 삭제',
    'translateBtn': '현황 번역',
    'ownerAISummaryBtn': '선사별 AI 요약',
    'apiRefreshAllBtn': 'API 전체 반영'
  };

  // ID 기반으로 하단 버튼들 업데이트
  Object.entries(bottomButtonMappings).forEach(([btnId, koKey]) => {
    const btn = document.getElementById(btnId);
    if (btn && langData[koKey]) {
      btn.textContent = langData[koKey];
    }
  });

  // 일반 버튼 텍스트 변경 (lang-btn 제외)
  document.querySelectorAll('button:not(.lang-btn)').forEach(btn => {
    // 이미 ID로 처리된 버튼은 건너뛰기
    if (btn.id && bottomButtonMappings[btn.id]) return;
    
    const key = btn.textContent.trim();
    if (key && langData[key]) {
      btn.textContent = langData[key];
    }
  });
  
  // 7. 테이블 내 모든 버튼 텍스트 변경
  document.querySelectorAll('td button').forEach(btn => {
    const key = btn.textContent.trim();
    if (key && langData[key]) {
      btn.textContent = langData[key];
    }
  });

  // 8. 사이드바 버튼들도 업데이트
  document.getElementById('btnManager').textContent = langData['담당자'] || '담당자';
  document.getElementById('btnOwner').textContent = langData['선주사'] || '선주사';
  document.getElementById('userManageBtn').textContent = langData['사용자 관리'] || '사용자 관리';
  document.getElementById('aiConfigBtn').textContent = langData['AI 설정 관리'] || 'AI 설정 관리';
  document.getElementById('apiConfigBtn').textContent = langData['API 설정 관리'] || 'API 설정 관리';
  
  // 8. 모달 내 텍스트 및 버튼 변경
  updateModalTexts(langData);
  
  console.log('UI 언어 업데이트 완료');
}

// 테이블 행 생성 함수 수정 - 언어별 버튼 텍스트 처리
function createTableRow(row, counts) {
  const tr = document.createElement('tr');

  // 체크박스
  let td = document.createElement('td');
  const chk = document.createElement('input');
  chk.type = 'checkbox';
  chk.classList.add('rowSelectChk');
  chk.dataset.uid = row.uid;
  td.appendChild(chk);
  tr.appendChild(td);

  // 기본 셀 생성
  tr.appendChild(makeCell(row.공번, '공번'));
  tr.appendChild(makeCell(row.공사, '공사'));
  tr.appendChild(makeCell(row.imo, 'imo'));
  
  // API 관련 셀 추가
  tr.appendChild(makeCell(row.api_name, 'api_name'));
  tr.appendChild(makeCell(row.api_owner, 'api_owner'));
  tr.appendChild(makeCell(row.api_manager, 'api_manager'));
  
  // API 반영 버튼 - 언어별 텍스트
  const apiTd = document.createElement('td');
  const apiBtn = document.createElement('button');
  apiBtn.textContent = translations[currentLanguage]["반영"] || "반영";
  apiBtn.style.background = "#28a745";
  apiBtn.style.color = "#fff";
  apiBtn.style.cursor = "pointer";
  apiBtn.style.border = "none";
  apiBtn.style.borderRadius = "4px";
  apiBtn.style.padding = "4px 8px";
  apiBtn.addEventListener('click', () => fetchAndUpdateVesselData(row.uid));
  apiTd.appendChild(apiBtn);
  tr.appendChild(apiTd);

  // 나머지 셀 생성
  tr.appendChild(makeCell(row.hull, 'hull'));
  tr.appendChild(makeCell(row.shipName, 'shipName'));
  tr.appendChild(makeCell(row.repMail, 'repMail'));
  tr.appendChild(makeCell(row.shipType, 'shipType'));
  tr.appendChild(makeCell(row.scale, 'scale'));
  tr.appendChild(makeCell(row.구분, '구분'));
  tr.appendChild(makeCell(row.shipowner, 'shipowner'));
  tr.appendChild(makeCell(row.major, 'major'));
  tr.appendChild(makeCell(row.group, 'group'));
  tr.appendChild(makeCell(row.shipyard, 'shipyard'));
  tr.appendChild(makeCell(row.contract, 'contract'));
  tr.appendChild(makeCell(row.asType, 'asType'));
  tr.appendChild(makeCell(row.delivery, 'delivery'));
  tr.appendChild(makeCell(row.warranty, 'warranty'));
  tr.appendChild(makeCell(row.prevManager, 'prevManager'));
  tr.appendChild(makeCell(row.manager, 'manager'));
  tr.appendChild(makeCell(row.현황, '현황'));
  
  // 현황 번역 필드 추가
  tr.appendChild(makeCell(row.현황번역 || '', '현황번역'));

  // (1) AI 요약 버튼 (단일 행) - 언어별 텍스트
  const aiTd = document.createElement('td');
  const aiBtn = document.createElement('button');
  aiBtn.textContent = translations[currentLanguage]["AI 요약"] || "AI 요약";
  aiBtn.style.background = "#6c757d";
  aiBtn.style.color = "#fff";
  aiBtn.style.cursor = "pointer";
  aiBtn.addEventListener('click', () => summarizeAndUpdateRow(row.uid));
  aiTd.appendChild(aiBtn);
  tr.appendChild(aiTd);

  // 동작여부
  const activeCell = makeCell(row.동작여부, '동작여부');
  tr.appendChild(activeCell);

  // 조치계획/접수내용/조치결과
  tr.appendChild(makeCell(row.조치계획, '조치계획'));
  tr.appendChild(makeCell(row.접수내용, '접수내용'));
  tr.appendChild(makeCell(row.조치결과, '조치결과'));

  // (2) 히스토리 AI 요약 - 언어별 텍스트
  const historyTd = document.createElement('td');
  const historyBtn = document.createElement('button');
  historyBtn.textContent = translations[currentLanguage]["AI 요약"] || "AI 요약";
  historyBtn.style.background = "#007bff";
  historyBtn.style.color = "#fff";
  historyBtn.style.cursor = "pointer";
  historyBtn.addEventListener('click', () => summarizeHistoryForProject(row.공번));
  historyTd.appendChild(historyBtn);
  tr.appendChild(historyTd);

  // AS접수일자/기술적종료일
  tr.appendChild(makeCell(row["AS접수일자"], 'AS접수일자'));
  tr.appendChild(makeCell(row["기술적종료일"], '기술적종료일'));

  // 경과일, 정상지연, 지연 사유
  tr.appendChild(makeElapsedCell(row));
  tr.appendChild(makeNormalDelayCell(row));
  tr.appendChild(makeDelayReasonCell(row));

  // 보증종료일 강조
  if (row.warranty) {
    const wDate = new Date(row.warranty + "T00:00");
    const today = new Date(new Date().toLocaleDateString());
    if (wDate < today && row.asType !== '유상') {
      tr.cells[17].style.backgroundColor = 'yellow';
    }
  }
  if (row.기술적종료일 && ["정상B", "부분동작", "동작불가"].includes(row.동작여부)) {
    activeCell.style.backgroundColor = 'yellow';
  }
  if (row.접수내용 && !row.기술적종료일 && ["정상A", "유상정상"].includes(row.동작여부)) {
    activeCell.style.backgroundColor = 'lightgreen';
  }

  // 행 크기 조절 핸들
  const rowRes = document.createElement('div');
  rowRes.className = 'row-resizer';
  rowRes.addEventListener('mousedown', (ev) => startRowResize(ev, tr));
  tr.appendChild(rowRes);

  return tr;
}

// 셀 생성 함수 - 최적화 및 모듈화
function makeCell(val, fld) {
  const c = document.createElement('td');
  c.dataset.field = fld;
  
  if (['delivery', 'warranty', '기술적종료일', 'AS접수일자'].includes(fld)) {
    // 날짜 입력 필드
    const inp = document.createElement('input');
    inp.type = 'date';
    inp.value = val || '';
    inp.dataset.uid = '';  // rowId는 행 생성 시 할당
    inp.dataset.field = fld;
    inp.addEventListener('change', onCellChange);
    c.appendChild(inp);
  } else if (fld === 'asType') {
    // AS 유형 선택
    const sel = document.createElement('select');
    ['유상', '무상', '위탁'].forEach(op => {
      const o = document.createElement('option');
      o.value = op;
      o.textContent = op;
      sel.appendChild(o);
    });
    sel.value = val || '유상';
    sel.dataset.uid = '';  // rowId는 행 생성 시 할당
    sel.dataset.field = fld;
    sel.addEventListener('change', onCellChange);
    c.appendChild(sel);
  } else if (fld === '동작여부') {
    // 동작여부 선택
    const sel = document.createElement('select');
    ['정상A', '정상B', '유상정상', '부분동작', '동작불가'].forEach(op => {
      const o = document.createElement('option');
      o.value = op;
      o.textContent = op;
      sel.appendChild(o);
    });
    sel.value = val || '정상A';
    sel.dataset.uid = '';  // rowId는 행 생성 시 할당
    sel.dataset.field = fld;
    sel.addEventListener('change', onCellChange);
    c.appendChild(sel);
  } else if (fld === 'imo') {
    // IMO 번호 필드
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = val || '';
    inp.style.width = '75%';
    inp.dataset.uid = '';  // rowId는 행 생성 시 할당
    inp.dataset.field = fld;
    inp.addEventListener('change', onCellChange);
    c.appendChild(inp);

    // 링크 버튼
    const linkIcon = document.createElement('span');
    linkIcon.textContent = ' 🔎';
    linkIcon.style.cursor = 'pointer';
    linkIcon.title = '새 창에서 조회';
    linkIcon.addEventListener('click', () => {
      const imoVal = inp.value.trim();
      if (imoVal) {
        window.open('https://www.vesselfinder.com/vessels/details/' + encodeURIComponent(imoVal), '_blank');
      }
    });
    c.appendChild(linkIcon);
  } else if (['조치계획', '접수내용', '조치결과'].includes(fld)) {
    // 내용 모달 열기 필드
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = val || '';
    inp.style.width = '95%';
    inp.readOnly = true;
    inp.dataset.uid = '';  // rowId는 행 생성 시 할당
    inp.dataset.field = fld;
    c.addEventListener('click', () => openContentModal(val || ''));
    c.appendChild(inp);
  } else if (['api_name', 'api_owner', 'api_manager'].includes(fld)) {
    // API 데이터 필드 (읽기 전용)
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = val || '';
    inp.style.width = '95%';
    inp.readOnly = true;
    inp.dataset.uid = '';  // rowId는 행 생성 시 할당
    inp.dataset.field = fld;
    c.appendChild(inp);
  } else if (fld === '현황번역') {
    // 현황 번역 필드 (읽기 전용)
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = val || '';
    inp.style.width = '95%';
    inp.readOnly = true;
    inp.dataset.uid = '';  // rowId는 행 생성 시 할당
    inp.dataset.field = fld;
    c.appendChild(inp);
  } else {
    // 일반 텍스트 필드
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.value = val || '';
    inp.style.width = '95%';
    inp.dataset.uid = '';  // rowId는 행 생성 시 할당
    inp.dataset.field = fld;
    inp.addEventListener('change', onCellChange);
    c.appendChild(inp);
  }
  
  // 모든 입력 요소에 대해 rowId 설정
  if (c.firstChild) {
    // 상위 TR 요소를 찾은 뒤 dataset.uid 할당
    setTimeout(() => {
      const tr = c.closest('tr');
      if (tr) {
        const rowId = tr.querySelector('.rowSelectChk').dataset.uid;
        if (c.firstChild.dataset) {
          c.firstChild.dataset.uid = rowId;
        }
      }
    }, 0);
  }
  
  return c;
}

// 경과일 셀 생성
function makeElapsedCell(r) {
  const c = document.createElement('td');
  c.dataset.field = "경과일";
  if (r["기술적종료일"]) {
    c.textContent = "";
  } else {
    let asDate = r["AS접수일자"] || "";
    if (!asDate) {
      c.textContent = "";
    } else {
      const today = new Date();
      const asD = new Date(asDate + "T00:00");
      if (asD.toString() === 'Invalid Date') {
        c.textContent = "";
      } else {
        const diff = Math.floor((today - asD) / (1000 * 3600 * 24));
        if (diff < 0) {
          c.textContent = "0일";
        } else {
          c.textContent = diff + "일";
          if (!r["정상지연"]) {
            if (diff >= 90) {
              c.style.backgroundColor = 'red';
              c.style.color = '#fff';
            } else if (diff >= 60) {
              c.style.backgroundColor = 'orange';
            } else if (diff >= 30) {
              c.style.backgroundColor = 'yellow';
            }
          }
        }
      }
    }
  }
  return c;
}

// 정상지연 체크박스 셀 생성
function makeNormalDelayCell(r) {
  const c = document.createElement('td');
  c.dataset.field = "정상지연";
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.dataset.uid = r.uid;
  check.dataset.field = "정상지연";
  check.checked = (r["정상지연"] === "Y");
  check.addEventListener('change', onCellChange);
  c.appendChild(check);
  return c;
}

// 지연 사유 셀 생성
function makeDelayReasonCell(r) {
  const c = document.createElement('td');
  c.dataset.field = "지연 사유";
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.value = r["지연 사유"] || '';
  inp.style.width = '95%';
  inp.dataset.uid = r.uid;
  inp.dataset.field = "지연 사유";
  inp.addEventListener('change', onCellChange);
  c.appendChild(inp);
  return c;
}

// 셀 변경 이벤트 핸들러 - 성능 최적화
function onCellChange(e) {
  const uid = e.target.dataset.uid;
  const field = e.target.dataset.field;
  let newVal = "";
  
  if (e.target.type === 'checkbox') {
    newVal = e.target.checked ? "Y" : "";
  } else {
    newVal = e.target.value;
  }
  
  // 해당 UID의 데이터 찾기
  const row = asData.find(x => x.uid === uid);
  if (!row) return;
  
  const oldVal = row[field] || '';
  if (oldVal === newVal) return;
  
  // 데이터 로컬 업데이트
  row[field] = newVal;
  
  // 변경 사항 일괄 업데이트를 위해 저장
  if (!pendingRowUpdates.has(uid)) {
    pendingRowUpdates.set(uid, {});
  }
  pendingRowUpdates.get(uid)[field] = newVal;
  
  // 일괄 처리 예약 (300ms 디바운스)
  if (window.pendingUpdateTimer) {
    clearTimeout(window.pendingUpdateTimer);
  }
  window.pendingUpdateTimer = setTimeout(processRowUpdates, 300);
  
// 특정 필드 변경 시 테이블 즉시 다시 그리기
if (field === "정상지연" || field === "AS접수일자" || field === "기술적종료일") {
  // 필터 상태 저장
  saveFilterState();
  
  // 현재 필터 활성화 상태에 따라 렌더링
  // isFilterActive가 true면 필터 적용, false면 마지막 렌더링 상태 유지
  if (isFilterActive) {
    renderTable(false); // 필터 적용된 상태로 렌더링
  } else if (lastRenderedData.length > 0) {
    renderTable(true); // 전체 데이터가 표시되어 있었다면 전체 표시
  } else {
    renderTable(false); // 기본 상태 유지
  }
  
  restoreFilterState();
}
  
  // 현황 필드가 변경되었다면 현황번역 필드를 초기화
  if (field === "현황") {
    row.현황번역 = "";
    if (!pendingRowUpdates.has(uid)) {
      pendingRowUpdates.set(uid, {});
    }
    pendingRowUpdates.get(uid)["현황번역"] = "";
    
    // 번역 필드 UI 업데이트
    const translationCell = e.target.closest('tr').querySelector('td[data-field="현황번역"] input');
    if (translationCell) {
      translationCell.value = "";
    }
  }
}

// 실시간 저장을 비활성화한 processRowUpdates
function processRowUpdates() {
  // Firebase 업데이트를 하지 않고 pendingRowUpdates만 초기화
  // 실제 저장은 saveAllData에서만 수행
  if (pendingRowUpdates.size === 0) return;
  
  // modifiedRows에 추가
  pendingRowUpdates.forEach((fields, uid) => {
    modifiedRows.add(uid);
  });
  
  // 대기 중인 업데이트 초기화
  pendingRowUpdates.clear();
}




// 단일 선박 데이터 반영 함수 수정 - 성능 개선
async function fetchAndUpdateVesselData(uid) {
  const row = asData.find(x => x.uid === uid);
  if (!row) {
    alert("해당 행을 찾을 수 없습니다.");
    return;
  }
  
  const imoNumber = row.imo.trim();
  if (!imoNumber) {
    alert("IMO 번호가 없습니다. IMO 번호를 먼저 입력해주세요.");
    return;
  }
  
  if (!g_apiConfig.apiKey) {
    alert("API 키가 설정되지 않았습니다. API 설정에서 키를 설정해주세요.");
    return;
  }
  
  showApiProgressModal();
  clearApiProgressText();
  updateApiProgressText(`IMO ${imoNumber} 데이터 요청 중...`);
  
  try {
    // CORS 프록시 사용
    const corsProxy = "https://api.allorigins.win/raw?url=";
    // STATUS 메서드를 직접 호출
    const targetUrl = `${g_apiConfig.baseUrl}?userkey=${g_apiConfig.apiKey}&imo=${imoNumber}`;
    const apiUrl = `${corsProxy}${encodeURIComponent(targetUrl)}`;
    
    updateApiProgressText(`\n요청 URL: ${targetUrl}`);
    
    const response = await fetch(apiUrl);
    const responseText = await response.text();
    
    // 응답이 JSON인지 확인
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      updateApiProgressText(`\nJSON 파싱 오류: ${e.message}`);
      setTimeout(() => closeApiProgressModal(), 5000);
      return;
    }
    
    // 응답이 배열인지 확인
    if (Array.isArray(data)) {
      if (data.length === 0) {
        updateApiProgressText(`\n응답 배열이 비어 있습니다.`);
        setTimeout(() => closeApiProgressModal(), 3000);
        return;
      }
      
      // 첫 번째 항목 사용
      data = data[0];
    }
    
    if (data.error) {
      updateApiProgressText(`\n오류 발생: ${data.error}`);
      setTimeout(() => closeApiProgressModal(), 3000);
      return;
    }
    
    // API 응답 구조 검사
    if (!data.MASTERDATA) {
      updateApiProgressText(`\nMASTERDATA 필드가 없습니다. 전체 응답 구조: ${JSON.stringify(data)}`);
      setTimeout(() => closeApiProgressModal(), 5000);
      return;
    }
    
    // MASTERDATA 사용
    const vesselData = data.MASTERDATA;
    
    // 데이터 매핑 및 업데이트
    row.api_name = vesselData.NAME || '';
    row.api_owner = vesselData.OWNER || '';
    row.api_manager = vesselData.MANAGER || '';
    
    // Firebase 업데이트
    await db.ref(`${asPath}/${uid}`).update({
      api_name: row.api_name,
      api_owner: row.api_owner,
      api_manager: row.api_manager
    });
    
    updateApiProgressText(`\n데이터 가져오기 성공!\n\n선박명: ${row.api_name}\n선주사: ${row.api_owner}\n관리사: ${row.api_manager}`);
    
    // 히스토리 추가
    addHistory(`IMO ${imoNumber} API 데이터 업데이트`);
    
    // 현재 행만 업데이트하여 순서 유지
    updateRowInTable(row);
    
    // 성공 후 모달 닫기 (3초 후)
    setTimeout(() => closeApiProgressModal(), 3000);
    
  } catch (error) {
    console.error("API 요청 오류:", error);
    updateApiProgressText(`\n오류 발생: ${error.message}`);
    setTimeout(() => closeApiProgressModal(), 3000);
  }
}

// 전체 선박 데이터 반영
async function refreshAllVessels() {
  // 관리자 비밀번호 확인
  if (!adminAuthorized) {
    const pw = prompt("관리자 비밀번호를 입력하세요:");
    if (pw !== 'snsys1234') {
      alert("관리자 비밀번호가 다릅니다.");
      return;
    }
    adminAuthorized = true;
  }

  if (!g_apiConfig.apiKey) {
    alert("API 키가 설정되지 않았습니다. API 설정에서 키를 설정해주세요.");
    return;
  }
  
  // IMO 번호가 있는 행들 필터링
  const vesselsWithImo = asData.filter(row => row.imo && row.imo.trim());
  
  if (vesselsWithImo.length === 0) {
    alert("IMO 번호가 있는 선박이 없습니다.");
    return;
  }
  
  if (!confirm(`${vesselsWithImo.length}개 선박의 데이터를 모두 업데이트하시겠습니까? 이 작업은 시간이 오래 걸릴 수 있습니다.`)) {
    return;
  }
  
  // API 진행 모달 표시
  showApiProgressModal();
  clearApiProgressText();
  updateApiProgressText(`전체 ${vesselsWithImo.length}개 선박 데이터 업데이트 시작...`);
  
  // 크레딧 확인
  try {
    // CORS 프록시 사용
    const corsProxy = "https://corsproxy.io/?";
    const statusUrl = `${corsProxy}${encodeURIComponent(`https://api.vesselfinder.com/status?userkey=${g_apiConfig.apiKey}`)}`;
    
    const statusResponse = await fetch(statusUrl);
    const statusData = await statusResponse.json();
    
    if (statusData.STATUS && statusData.STATUS.CREDITS) {
      const credits = parseInt(statusData.STATUS.CREDITS, 10);
      const neededCredits = vesselsWithImo.length * 3; // 각 선박당 3 크레딧 필요
      
      updateApiProgressText(`\n사용 가능 크레딧: ${credits}`);
      updateApiProgressText(`\n필요 크레딧: ${neededCredits} (${vesselsWithImo.length}개 선박 × 3)`);
      
      if (credits < neededCredits) {
        updateApiProgressText(`\n⚠️ 경고: 크레딧이 부족합니다. 일부 선박만 업데이트될 수 있습니다.`);
        
        if (!confirm("크레딧이 부족합니다. 계속 진행하시겠습니까?")) {
          closeApiProgressModal();
          return;
        }
      }
    }
  } catch (error) {
    console.error("API 상태 확인 오류:", error);
    updateApiProgressText(`\n크레딧 확인 중 오류: ${error.message}`);
    
    if (!confirm("크레딧 확인 중 오류가 발생했습니다. 계속 진행하시겠습니까?")) {
      closeApiProgressModal();
      return;
    }
  }
  
  // 일괄 업데이트를 위한 객체
  const updates = {};
  let successCount = 0;
  let errorCount = 0;
  
  // API 속도 제한을 위한 딜레이 함수
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  
   // 순차적으로 각 선박에 대해 API 호출
  for (let i = 0; i < vesselsWithImo.length; i++) {
    const row = vesselsWithImo[i];
    const imoNumber = row.imo.trim();
    
    updateApiProgressText(`\n[${i+1}/${vesselsWithImo.length}] IMO ${imoNumber} 처리 중...`);
    
    try {
      const corsProxy = "https://api.allorigins.win/raw?url=";
      const targetUrl = `${g_apiConfig.baseUrl}?userkey=${g_apiConfig.apiKey}&imo=${imoNumber}`;
      const apiUrl = `${corsProxy}${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(apiUrl);
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        updateApiProgressText(`\n  JSON 파싱 오류: ${e.message}`);
        errorCount++;
        continue;
      }
      
      // 응답이 배열인지 확인
      if (Array.isArray(data)) {
        if (data.length === 0) {
          updateApiProgressText(`\n  응답 배열이 비어 있습니다.`);
          errorCount++;
          continue;
        }
        
        // 첫 번째 항목 사용
        data = data[0];
      }
      
      if (data.error) {
        updateApiProgressText(`\n  오류: ${data.error}`);
        errorCount++;
        continue;
      }
      
      // API 응답 구조 검사
      if (!data.MASTERDATA) {
        updateApiProgressText(`\n  MASTERDATA 필드가 없습니다.`);
        errorCount++;
        continue;
      }
      
      // MASTERDATA 사용
      const vesselData = data.MASTERDATA;
      
      // 데이터 매핑 및 업데이트를 위해 준비
      const api_name = vesselData.NAME || '';
      const api_owner = vesselData.OWNER || '';
      const api_manager = vesselData.MANAGER || '';
      
      updates[`${asPath}/${row.uid}/api_name`] = api_name;
      updates[`${asPath}/${row.uid}/api_owner`] = api_owner;
      updates[`${asPath}/${row.uid}/api_manager`] = api_manager;
      
      // 메모리 내 데이터도 업데이트
      row.api_name = api_name;
      row.api_owner = api_owner;
      row.api_manager = api_manager;
      
      updateApiProgressText(`\n  성공: ${api_name} (${api_owner})`);
      successCount++;
      
      // API 속도 제한을 위한 딜레이 (1초)
      await delay(1000);
      
    } catch (error) {
      console.error(`IMO ${imoNumber} 처리 오류:`, error);
      updateApiProgressText(`\n  오류: ${error.message}`);
      errorCount++;
    }
  }
  
  // 일괄 업데이트 수행
  try {
    await db.ref().update(updates);
    updateApiProgressText(`\n\n업데이트 완료: 성공 ${successCount}건, 실패 ${errorCount}건`);
    
    // 히스토리 추가
    addHistory(`전체 선박 API 데이터 업데이트 (성공 ${successCount}건, 실패 ${errorCount}건)`);
    
    // 테이블 새로고침
    saveFilterState();
    renderTable(true);
    restoreFilterState();
    
    // 완료 메시지 (5초 후 닫기)
    setTimeout(() => closeApiProgressModal(), 5000);
    
  } catch (error) {
    console.error("일괄 업데이트 오류:", error);
    updateApiProgressText(`\n\n일괄 업데이트 중 오류 발생: ${error.message}`);
  }
}

// 단일 행만 업데이트하는 함수 (순서 유지)
function updateRowInTable(rowData) {
  if (!rowData || !rowData.uid) return;
  
  // 해당 행 찾기
  const rowElement = document.querySelector(`.rowSelectChk[data-uid="${rowData.uid}"]`);
  if (!rowElement) return;
  
  const tr = rowElement.closest('tr');
  if (!tr) return;
  
  // API 관련 셀 업데이트
  const apiNameCell = tr.querySelector(`td[data-field="api_name"] input`);
  const apiOwnerCell = tr.querySelector(`td[data-field="api_owner"] input`);
  const apiManagerCell = tr.querySelector(`td[data-field="api_manager"] input`);
  
  if (apiNameCell) apiNameCell.value = rowData.api_name || '';
  if (apiOwnerCell) apiOwnerCell.value = rowData.api_owner || '';
  if (apiManagerCell) apiManagerCell.value = rowData.api_manager || '';
}

// 여러 행 업데이트하는 함수 (순서 유지)
function updateMultipleRowsInTable() {
  // 모든 행에 대해 업데이트 적용
  asData.forEach(rowData => {
    updateRowInTable(rowData);
  });
  
  // 상태 카드 업데이트 (필요한 경우)
  updateStatusCounts();
}

// 상태 카운트 업데이트 함수
function updateStatusCounts() {
  const counts = {
    정상A: 0,
    정상B: 0,
    유상정상: 0,
    부분동작: 0,
    동작불가: 0
  };
  
  // 현재 필터된 데이터 기준으로 카운트
  lastRenderedData.forEach(row => {
    if (counts.hasOwnProperty(row.동작여부)) {
      counts[row.동작여부]++;
    }
  });
  
  // DOM 업데이트
  Object.keys(counts).forEach(status => {
    document.getElementById(`count${status}`).textContent = counts[status];
  });
}

/** ==================================
 *  사이드바 및 필터 기능
 * ===================================*/
// 사이드바 모드 전환 함수 개선
function switchSideMode(mode) {
  currentMode = mode;
  document.getElementById('btnManager').classList.remove('active');
  document.getElementById('btnOwner').classList.remove('active');

  // 필터 초기화
  document.getElementById('filterIMO').value = "";
  document.getElementById('filterHull').value = "";
  document.getElementById('filterName').value = "";
  document.getElementById('filterOwner').value = "";
  document.getElementById('filterMajor').value = "";
  document.getElementById('filterRepMail').value = "";
  document.getElementById('filterGroup').value = "";
  document.getElementById('filterAsType').value = "";
  document.getElementById('filterManager').value = "";
  document.getElementById('filterActive').value = "";

  // 현재 모드에 맞게 버튼 활성화 및 제목 변경
  if (mode === 'manager') {
    document.getElementById('btnManager').classList.add('active');
    const managerLabel = translations[currentLanguage]['현 담당'] || '현 담당';
    document.getElementById('listTitle').textContent = `${managerLabel} 목록`;
    document.getElementById('sidebar').classList.remove('expanded');
  } else {
    document.getElementById('btnOwner').classList.add('active');
    const ownerLabel = translations[currentLanguage]['SHIPOWNER'] || 'SHIPOWNER';
    document.getElementById('listTitle').textContent = `${ownerLabel} 목록`;
    document.getElementById('sidebar').classList.add('expanded');
  }
  
  updateSidebarList();
  renderTable(false);
}

// 사이드바 업데이트 함수 개선
function updateSidebarList() {
  const listDiv = document.getElementById('itemList');
  listDiv.innerHTML = '';

  if (currentMode === 'manager') {
    // 담당자 모드
    const mgrMap = new Map();
    let allTotalCount = 0, allProgressCount = 0;
    
    // 한 번의 순회로 모든 데이터 수집
    asData.forEach(d => {
      const mgr = d.manager || '';
      if (!mgr) return;
      
      if (!mgrMap.has(mgr)) {
        mgrMap.set(mgr, {totalCount: 0, progressCount: 0});
      }
      
      mgrMap.get(mgr).totalCount++;
      allTotalCount++;
      
      if (d.접수내용 && !d.기술적종료일) {
        mgrMap.get(mgr).progressCount++;
        allProgressCount++;
      }
    });
    
    // 전체 버튼 생성 - 현재 언어에 맞는 "전체" 텍스트 사용
    appendSidebarButton(listDiv, translations[currentLanguage]['전체'] || '전체', allTotalCount, allProgressCount, () => {
      clearFilters();
      renderTable(true);
    });
    
    // 담당자별 버튼 생성
    const sortedManagers = Array.from(mgrMap.entries())
      .sort(([, a], [, b]) => b.totalCount - a.totalCount);
    
    sortedManagers.forEach(([mgr, {totalCount, progressCount}]) => {
      appendSidebarButton(listDiv, mgr, totalCount, progressCount, () => {
        document.getElementById('filterManager').value = mgr;
        renderTable();
      });
    });
  } else {
    // 선주사 모드
    const owMap = new Map();
    let allTotalCount = 0, allProgressCount = 0;
    
    // 한 번의 순회로 모든 데이터 수집
    asData.forEach(d => {
      const ow = d.shipowner || '';
      if (!ow) return;
      
      if (!owMap.has(ow)) {
        owMap.set(ow, {totalCount: 0, progressCount: 0});
      }
      
      owMap.get(ow).totalCount++;
      allTotalCount++;
      
      if (d.접수내용 && !d.기술적종료일) {
        owMap.get(ow).progressCount++;
        allProgressCount++;
      }
    });
    
    // 전체 버튼 생성 - 현재 언어에 맞는 "전체" 텍스트 사용
    appendSidebarButton(listDiv, translations[currentLanguage]['전체'] || '전체', allTotalCount, allProgressCount, () => {
      clearFilters();
      renderTable(true);
    });
    
    // 선주사별 버튼 생성
    const sortedOwners = Array.from(owMap.entries())
      .sort(([a], [b]) => {
        // 한글 감지 정규식
        const isHangulA = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(a.charAt(0));
        const isHangulB = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(b.charAt(0));
        
        // 둘 다 한글이거나 둘 다 영문이면 일반 비교
        if (isHangulA === isHangulB) {
          return a.localeCompare(b);
        }
        
        // 한글이 아닌 것(영문 등)이 먼저 오도록
        return isHangulA ? 1 : -1;
      });
    
    sortedOwners.forEach(([owner, {totalCount, progressCount}]) => {
      appendSidebarButton(listDiv, owner, totalCount, progressCount, () => {
        document.getElementById('filterOwner').value = owner;
        renderTable();
      });
    });
  }
}

// 사이드바 버튼 생성 함수 개선
function appendSidebarButton(container, label, total, progress, clickHandler) {
  const btn = document.createElement('button');
  btn.style.display = 'flex';
  btn.style.justifyContent = 'space-between';
  
  const left = document.createElement('span');
  left.textContent = `${label}(${total})`;
  
  const right = document.createElement('span');
  // 현재 언어에 따라 "AS진행" 텍스트 변경
  const asProgressText = translations[currentLanguage]["AS진행"] || "AS진행";
  right.textContent = `${asProgressText}(${progress})`;
  
  btn.appendChild(left);
  btn.appendChild(right);
  btn.onclick = clickHandler;
  
  container.appendChild(btn);
}

// 언어 초기화 함수
function initializeLanguage() {
  // 이전에 선택한 언어 복원 (로컬 스토리지에서)
  const savedLanguage = localStorage.getItem('selectedLanguage');
  if (savedLanguage && translations[savedLanguage]) {
    currentLanguage = savedLanguage;
    
    // 버튼 활성화 상태 업데이트
    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.getAttribute('data-lang') === savedLanguage) {
        btn.classList.add('active');
} else {
        btn.classList.remove('active');
      }
    });
  }
  
  // 초기 UI 언어 설정
  updateUILanguage();
}

// 모든 필터 초기화
function clearFilters() {
  document.getElementById('filterIMO').value = '';
  document.getElementById('filterHull').value = '';
  document.getElementById('filterName').value = '';
  document.getElementById('filterOwner').value = '';
  document.getElementById('filterMajor').value = '';
  document.getElementById('filterRepMail').value = '';
  document.getElementById('filterGroup').value = '';
  document.getElementById('filterAsType').value = '';
  document.getElementById('filterManager').value = '';
  document.getElementById('filterActive').value = '';
  
  // 필터 상태 초기화
  currentFilterState = {};
  isFilterActive = false;
}

/** ==================================
 *  히스토리 관리
 * ===================================*/
// 히스토리 추가
function addHistory(msg) {
  const k = db.ref(histPath).push().key;
  const t = new Date().toISOString();
  db.ref(`${histPath}/${k}`).set({time: t, msg});
}

// 히스토리 모달 표시
function showHistoryModal() {
  db.ref(histPath).once('value').then(snap => {
    const val = snap.val() || {};
    // Object.values 대신 효율적인 방식 사용
    const arr = [];
    Object.entries(val).forEach(([, item]) => arr.push(item));
    
    // 시간순 정렬
    arr.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    // 리스트 렌더링
    const hl = document.getElementById('historyList');
    hl.innerHTML = '';
    
    if (arr.length === 0) {
      const li = document.createElement('li');
      li.textContent = '히스토리가 없습니다.';
      hl.appendChild(li);
    } else {
      // DocumentFragment 사용으로 렌더링 성능 향상
      const fragment = document.createDocumentFragment();
      arr.forEach(it => {
        const li = document.createElement('li');
        li.textContent = `[${it.time}] ${it.msg}`;
        fragment.appendChild(li);
      });
      hl.appendChild(fragment);
    }
    
    document.getElementById('historyModal').style.display = 'block';
  });
}

// 히스토리 모달 닫기
function closeHistoryModal() {
  document.getElementById('historyModal').style.display = 'none';
}

// 히스토리 전체 삭제
function clearHistory() {
  if (!confirm("히스토리 전체 삭제?")) return;
  
  db.ref(histPath).remove().then(() => {
    document.getElementById('historyList').innerHTML = '<li>히스토리가 없습니다.</li>';
    alert("히스토리 삭제 완료");
  });
}

/** ==================================
 *  테이블 UI 관련 기능
 * ===================================*/
// 테이블 스크롤 스타일 추가
function addTableScrollStyles() {
  const styleElem = document.createElement('style');
  styleElem.textContent = `
    .table-container {
      overflow-x: auto !important;
      white-space: nowrap !important;
    }
    #asTable {
      display:inline-table !important;
      width:auto !important;
      min-width:0 !important;
      table-layout:auto !important;
    }
  `;
  document.head.appendChild(styleElem);
}

// 내용 보기 모달 열기
function openContentModal(text) {
  const htmlText = convertMarkdownToHTML(text);
  document.getElementById('contentText').innerHTML = htmlText;
  document.getElementById('contentModal').style.display = 'block';
}

// 내용 보기 모달 닫기
function closeContentModal() {
  document.getElementById('contentModal').style.display = 'none';
}

// 내용 모달 전체화면 전환
function toggleContentModalFullscreen() {
  const modal = document.getElementById('contentModal');
  modal.classList.toggle('fullscreen');
}

// 선사별 AI 요약 모달 전체화면 전환
function toggleOwnerAIModalFullscreen() {
  const modal = document.getElementById('ownerAIModal');
  modal.classList.toggle('fullscreen');
}

// 마크다운 → HTML 변환
function convertMarkdownToHTML(markdownText) {
  return marked.parse(markdownText || '');
}

// 더블클릭으로 열 폭 자동맞춤
document.addEventListener('dblclick', (e) => {
  const colRes = e.target.closest('.col-resizer');
  if (colRes) {
    const th = colRes.parentElement;
    if (th) autoFitColumn(th);
  } else {
    const th = e.target.closest('th');
    if (th) autoFitColumn(th);
  }
});

// 열 폭 자동맞춤 계산
function autoFitColumn(th) {
  const table = document.getElementById('asTable');
  if (!table) return;
  
  const colIndex = Array.from(th.parentElement.children).indexOf(th);
  let maxWidth = 0;
  const rows = table.rows;
  
  // 가상 DOM 요소 한 번만 생성
  const span = document.createElement('span');
  span.style.position = 'absolute';
  span.style.visibility = 'hidden';
  span.style.whiteSpace = 'nowrap';
  span.style.font = '14px sans-serif';
  document.body.appendChild(span);
  
  // 모든 행 순회하며 최대 폭 계산
  for (let i = 0; i < rows.length; i++) {
    const cell = rows[i].cells[colIndex];
    if (!cell) continue;
    
    let textContent = '';
    const widget = cell.querySelector('input, select, span');
    
    if (widget) {
      if (widget.tagName === 'SELECT') {
        textContent = widget.options[widget.selectedIndex]?.text || '';
      } else if (widget.tagName === 'INPUT') {
        textContent = widget.value || '';
      } else if (widget.tagName === 'SPAN') {
        textContent = widget.textContent || '';
      }
    } else {
      textContent = cell.innerText || cell.textContent || '';
    }
    
    span.textContent = textContent;
    const w = span.offsetWidth + 16;
    if (w > maxWidth) maxWidth = w;
  }
  
  // 가상 DOM 요소 제거
  document.body.removeChild(span);
  
  // 최소 너비 보장
  maxWidth = Math.max(maxWidth, 50);
  th.style.width = maxWidth + 'px';
}

/** ==================================
 *  열/행 크기 조절 관련 기능
 * ===================================*/
let resizingCol = null, startX = 0, startW = 0;
let resizingRow = null, startY = 0, startH = 0;

// 마우스 다운 핸들러
function handleMouseDown(e) {
  if (e.target.classList.contains('col-resizer')) {
    startColumnResize(e);
  }
}

// 열 크기 조절 시작
function startColumnResize(e) {
  resizingCol = e.target.parentElement;
  startX = e.pageX;
  startW = resizingCol.offsetWidth;
  
  document.addEventListener('mousemove', handleColumnResize);
  document.addEventListener('mouseup', stopColumnResize);
  e.preventDefault();
}

// 열 크기 조절 중
function handleColumnResize(e) {
  if (!resizingCol) return;
  
  const dx = e.pageX - startX;
  const newWidth = startW + dx;
  
  // 최소 너비 보장
  if (newWidth >= 30) {
    resizingCol.style.width = newWidth + 'px';
   }
}

// 열 크기 조절 종료
function stopColumnResize() {
  document.removeEventListener('mousemove', handleColumnResize);
  document.removeEventListener('mouseup', stopColumnResize);
  resizingCol = null;
}

// 행 높이 조절 시작
function startRowResize(e, tr) {
  resizingRow = tr;
  startY = e.pageY;
  startH = tr.offsetHeight;
  
  document.addEventListener('mousemove', handleRowResize);
  document.addEventListener('mouseup', stopRowResize);
  e.preventDefault();
}

// 행 높이 조절 중
function handleRowResize(e) {
  if (!resizingRow) return;
  
  const dy = e.pageY - startY;
  const newHeight = startH + dy;
  
  if (newHeight > 20) {
    resizingRow.style.height = newHeight + 'px';
  }
}

// 행 높이 조절 종료
function stopRowResize() {
  document.removeEventListener('mousemove', handleRowResize);
  document.removeEventListener('mouseup', stopRowResize);
  resizingRow = null;
}

/** ==================================
 *  엑셀 다운로드/업로드
 * ===================================*/
// 엑셀 다운로드
function downloadExcel() {
  // 다운로드 중 표시
  const btn = document.getElementById('downloadExcelBtn');
  const originalText = btn.textContent;
  btn.textContent = "다운로드 중...";
  btn.disabled = true;
  
  // 비동기로 배열 변환 및 엑셀 생성
  setTimeout(() => {
    try {
      const arr = asData.map(d => ({
        공번: d.공번, 공사: d.공사, IMO: d.imo, HULL: d.hull, SHIPNAME: d.shipName,
        'API_NAME': d.api_name, 'API_OWNER': d.api_owner, 'API_MANAGER': d.api_manager,
        '호선 대표메일': d.repMail, 'SHIP TYPE': d.shipType, SCALE: d.scale, 구분: d.구분,
        SHIPOWNER: d.shipowner, 주요선사: d.major, 그룹: d.group, SHIPYARD: d.shipyard,
        계약: d.contract, 'AS 구분': d.asType, 인도일: d.delivery, 보증종료일: d.warranty,
        '전 담당': d.prevManager, '현 담당': d.manager, 현황: d.현황, 현황번역: d.현황번역, 동작여부: d.동작여부,
        조치계획: d.조치계획, 접수내용: d.접수내용, 조치결과: d.조치결과,
        AS접수일자: d["AS접수일자"], 기술적종료일: d["기술적종료일"],
        정상지연: d["정상지연"], '지연 사유': d["지연 사유"]
      }));
      
      const ws = XLSX.utils.json_to_sheet(arr);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "AS_Data");
      
      // 엑셀 파일 저장
      XLSX.writeFile(wb, "AS_Data.xlsx");
    } catch (err) {
      console.error("엑셀 다운로드 오류:", err);
      alert("엑셀 다운로드 중 오류가 발생했습니다.");
    } finally {
      // 버튼 상태 복원
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }, 100);
}

// 엑셀 업로드 처리
function proceedExcelUpload(mode) {
  document.getElementById('uploadExcelInput').click();
  document.getElementById('uploadExcelInput').onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    readExcelFile(file, mode);
    e.target.value = '';
  };
}

// 엑셀 파일 읽기
function readExcelFile(file, mode) {
  const reader = new FileReader();
  
  reader.onload = function(evt) {
    // 로딩 표시
    let loadingEl = document.createElement('div');
    loadingEl.style.position = 'fixed';
    loadingEl.style.top = '50%';
    loadingEl.style.left = '50%';
    loadingEl.style.transform = 'translate(-50%, -50%)';
    loadingEl.style.background = 'rgba(0,0,0,0.7)';
    loadingEl.style.color = 'white';
    loadingEl.style.padding = '20px';
    loadingEl.style.borderRadius = '5px';
    loadingEl.style.zIndex = '9999';
    loadingEl.textContent = '엑셀 데이터 처리 중...';
    document.body.appendChild(loadingEl);
    
    // 비동기 처리로 UI 응답성 유지
    setTimeout(() => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, {type: 'array', cellDates: true, dateNF: "yyyy-mm-dd"});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, {defval: ""});
        
        // 데이터 가공
        let newData = json.map(r => {
          const uid = db.ref().push().key;
          return {
            uid,
            공번: parseCell(r['공번']),
            공사: parseCell(r['공사']),
            imo: parseCell(r['IMO']),
            hull: parseCell(r['HULL']),
            shipName: parseCell(r['SHIPNAME']),
            // API 필드 추가
            api_name: parseCell(r['API_NAME']),
            api_owner: parseCell(r['API_OWNER']),
            api_manager: parseCell(r['API_MANAGER']),
            repMail: parseCell(r['호선 대표메일']),
            shipType: parseCell(r['SHIP TYPE']),
            scale: parseCell(r['SCALE']),
            구분: parseCell(r['구분']),
            shipowner: parseCell(r['SHIPOWNER']),
            major: parseCell(r['주요선사']),
            group: String(parseCell(r['그룹']) || ''),
            shipyard: parseCell(r['SHIPYARD']),
            contract: parseCell(r['계약']),
            asType: parseCell(r['AS 구분']) || '유상',
            delivery: parseDate(r['인도일'] || ''),
            warranty: parseDate(r['보증종료일'] || ''),
            prevManager: parseCell(r['전 담당']),
            manager: parseCell(r['현 담당']),
            현황: parseCell(r['현황']),
            현황번역: parseCell(r['현황번역']), // 현황번역 필드 추가
            동작여부: parseCell(r['동작여부']) || '정상A',
            조치계획: parseCell(r['조치계획']),
            접수내용: parseCell(r['접수내용']),
            조치결과: parseCell(r['조치결과']),
            "AS접수일자": parseDate(r['AS접수일자'] || ''),
            "기술적종료일": parseDate(r['기술적종료일'] || ''),
            "정상지연": (r['정상지연'] === 'Y') ? 'Y' : '',
            "지연 사유": parseCell(r['지연 사유'])
          };
        });
        
        if (mode === 'replace') {
          // 모든 데이터 교체
          db.ref(asPath).remove().then(() => {
            // 대량 데이터 일괄 업데이트
            const updates = {};
            newData.forEach(obj => {
              updates[obj.uid] = obj;
            });
            
            db.ref(asPath).update(updates)
              .then(() => {
                asData = newData;
                renderTable(true);
                document.body.removeChild(loadingEl);
                alert(`엑셀 업로드(교체) 완료 (총 ${json.length}건)`);
              })
              .catch(err => {
                console.error("엑셀 업로드 오류:", err);
                document.body.removeChild(loadingEl);
                alert("데이터 저장 중 오류가 발생했습니다.");
              });
          });
        } else {
          // 데이터 추가
          const updates = {};
          newData.forEach(obj => {
            updates[obj.uid] = obj;
          });
          
          db.ref(asPath).update(updates)
            .then(() => {
              asData = asData.concat(newData);
              renderTable(true);
              document.body.removeChild(loadingEl);
              alert(`엑셀 업로드(추가) 완료 (총 ${json.length}건)`);
            })
            .catch(err => {
              console.error("엑셀 업로드 오류:", err);
              document.body.removeChild(loadingEl);
              alert("데이터 저장 중 오류가 발생했습니다.");
            });
        }
      } catch (err) {
        console.error("엑셀 파일 처리 오류:", err);
        document.body.removeChild(loadingEl);
        alert("엑셀 파일 처리 중 오류가 발생했습니다.");
      }
    }, 100);
  };
  
  reader.readAsArrayBuffer(file);
}

// 셀 값 파싱 헬퍼 함수
function parseCell(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'number') return String(v);
  if (v === '#N/A') return '';
  return String(v);
}

// 날짜 파싱 헬퍼 함수
function parseDate(v) {
  if (!v) return '';
  
  // Date 객체인 경우
  if (typeof v === 'object' && v instanceof Date) {
    return toYMD(v);
  }
  
  // 문자열인 경우
  if (typeof v === 'string') {
    let s = v.trim().replace(/\//g, '-').replace(/\./g, '-');
    if (s === '#N/A' || s === '0' || s === '') return '';
    
    if (s.includes('-')) {
      const parts = s.split('-');
      if (parts.length === 3) {
        let yy = parts[0].padStart(4, '0');
        let mm = parts[1].padStart(2, '0');
        let dd = parts[2].padStart(2, '0');
        return `${yy}-${mm}-${dd}`;
      }
    }
    return s;
  }
  
  return '';
}

// Date를 YYYY-MM-DD 형식으로 변환
function toYMD(dt) {
  const y = dt.getFullYear();
  const m = ('0' + (dt.getMonth() + 1)).slice(-2);
  const d = ('0' + dt.getDate()).slice(-2);
  return `${y}-${m}-${d}`;
}

/** ==================================
 *  AS 현황 업로드
 * ===================================*/
// AS 현황 파일 업로드 핸들러
function handleAsStatusUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  readAsStatusFile(file);
  e.target.value = '';
}

// AS 현황 파일 읽기
function readAsStatusFile(file) {
  const reader = new FileReader();
  
  reader.onload = function(evt) {
    // 로딩 표시
    let loadingEl = document.createElement('div');
    loadingEl.style.position = 'fixed';
    loadingEl.style.top = '50%';
    loadingEl.style.left = '50%';
    loadingEl.style.transform = 'translate(-50%, -50%)';
    loadingEl.style.background = 'rgba(0,0,0,0.7)';
    loadingEl.style.color = 'white';
    loadingEl.style.padding = '20px';
    loadingEl.style.borderRadius = '5px';
    loadingEl.style.zIndex = '9999';
    loadingEl.textContent = 'AS 현황 데이터 처리 중...';
    document.body.appendChild(loadingEl);
    
    // 비동기 처리로 UI 응답성 유지
    setTimeout(() => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, {type: 'array', cellDates: true, dateNF: "yyyy-mm-dd"});
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, {defval: ""});
        
        // 데이터 맵 생성
        const map = {};
        const projectCount = {};
        const batchAiRecords = {};
        
        // 첫 번째 패스: 프로젝트별 데이터 수집
        json.forEach(row => {
          const asStatus = (row['AS진행상태'] || '').trim();
          if (asStatus === '접수취소') return;
          
          const project = (row['수익프로젝트'] || '').trim();
          if (!project) return;
          
          // AI 히스토리 레코드 준비
          const aiRecordKey = db.ref(aiHistoryPath).push().key;
          batchAiRecords[`${aiHistoryPath}/${aiRecordKey}`] = {
            project: project,
            조치결과: (row['조치결과'] || '').trim()
          };
          
          // 프로젝트 카운트 증가
          if (!projectCount[project]) {
            projectCount[project] = 1;
          } else {
            projectCount[project]++;
          }
          
          // 가장 최근 데이터 찾기 위해 접수일 확인
          const asDateRaw = row['AS접수일자'] || '';
          const asDateObj = new Date(asDateRaw.replace(/[./]/g, '-') + "T00:00");
          const asDateMS = asDateObj.getTime();
          
          if (isNaN(asDateMS)) return; // 날짜 변환 실패 시 스킵
          
          const plan = row['조치계획'] || '';
          const rec = row['접수내용'] || '';
          const res = row['조치결과'] || '';
          const tEnd = row['기술적종료일자'] || '';
          
          if (!map[project]) {
            map[project] = {asDate: asDateMS, plan, rec, res, tEnd};
          } else if (asDateMS > map[project].asDate) {
            // 더 최근 데이터로 갱신
            map[project] = {asDate: asDateMS, plan, rec, res, tEnd};
          }
        });
        
        // AI 히스토리 레코드에 접수건수 추가
        for (const recordPath in batchAiRecords) {
          const project = batchAiRecords[recordPath].project;
          if (projectCount[project]) {
            batchAiRecords[recordPath].접수건수 = projectCount[project];
          }
        }
        
        // 일괄 업데이트를 위한 준비
        const updates = {};
        
        // AI 히스토리 레코드 추가
        Object.assign(updates, batchAiRecords);
        
        // 두 번째 패스: 기존 데이터 업데이트
        let updateCount = 0;
        for (let project in map) {
          const item = map[project];
          const row = asData.find(x => x.공번 === project);
          
          if (row) {
            row.조치계획 = item.plan;
            row.접수내용 = item.rec;
            row.조치결과 = item.res;
            row["기술적종료일"] = parseDateString(item.tEnd);
            row["AS접수일자"] = dateToYMD(item.asDate);
            
            // 현황번역 필드 초기화 (현황이 변경되었을 수 있으므로)
            row["현황번역"] = "";
            
            // Firebase 업데이트 준비
            updates[`${asPath}/${row.uid}/조치계획`] = row.조치계획;
            updates[`${asPath}/${row.uid}/접수내용`] = row.접수내용;
            updates[`${asPath}/${row.uid}/조치결과`] = row.조치결과;
            updates[`${asPath}/${row.uid}/기술적종료일`] = row["기술적종료일"];
            updates[`${asPath}/${row.uid}/AS접수일자`] = row["AS접수일자"];
            updates[`${asPath}/${row.uid}/현황번역`] = "";
            
            updateCount++;
          }
        }
        
        // 모든 변경사항 일괄 업데이트
        db.ref().update(updates)
          .then(() => {
            addHistory(`AS 현황 업로드 - 총 ${updateCount}건 접수/조치정보 갱신`);
            
            // 필터 상태 저장 및 복원
            saveFilterState();
            renderTable(true);
            restoreFilterState();
            
            document.body.removeChild(loadingEl);
            alert(`AS 현황 업로드 완료 (총 ${updateCount}건 업데이트)`);
          })
          .catch(err => {
            console.error("AS 현황 업로드 오류:", err);
            document.body.removeChild(loadingEl);
            alert("데이터 저장 중 오류가 발생했습니다.");
          });
      } catch (err) {
        console.error("AS 현황 파일 처리 오류:", err);
        document.body.removeChild(loadingEl);
        alert("AS 현황 파일 처리 중 오류가 발생했습니다.");
      }
    }, 100);
  };
  
  reader.readAsArrayBuffer(file);
}

// 날짜 문자열 파싱
function parseDateString(str) {
  if (!str) return '';
  let v = str.trim().replace(/[./]/g, '-');
  let d = new Date(v + "T00:00");
  if (!isNaN(d.getTime())) {
    const yy = d.getFullYear();
    const mm = ('0' + (d.getMonth() + 1)).slice(-2);
    const dd = ('0' + d.getDate()).slice(-2);
    return `${yy}-${mm}-${dd}`;
  }
  return '';
}

// 타임스탬프를 YYYY-MM-DD 형식으로 변환
function dateToYMD(ms) {
  if (!ms) return '';
  let d = new Date(ms);
  if (isNaN(d.getTime())) return '';
  let yy = d.getFullYear();
  let mm = ('0' + (d.getMonth() + 1)).slice(-2);
  let dd = ('0' + d.getDate()).slice(-2);
  return `${yy}-${mm}-${dd}`;
}

/** ==================================
 *  AI 요약 기능
 * ===================================*/
// (1) 행 단위 요약 - 성능 개선
async function summarizeAndUpdateRow(uid) {
  const row = asData.find(r => r.uid === uid);
  if (!row) {
    alert("대상 행 없음");
    return;
  }
  
  const basePrompt = g_aiConfig.promptRow || "접수내용과 조치결과를 간단히 요약해주세요.";
  const textOriginal = 
    `접수내용:\n${row.접수내용 || "없음"}\n\n` +
    `조치결과:\n${row.조치결과 || "없음"}\n`;

  const finalPrompt = basePrompt + "\n\n" + textOriginal;

  showAiProgressModal();
  clearAiProgressText();
  document.getElementById('aiProgressText').textContent = "[단일 행 요약 진행 중]\n\n";

  try {
    const summary = await callAiForSummary(finalPrompt);
    
    if (!summary) {
      alert("AI 요약 실패 (빈 값 반환)");
      return;
    }
    
    // 로컬 데이터 및 Firebase 업데이트
    row.현황 = summary;
    row.현황번역 = ""; // 현황이 변경되었으므로 번역 초기화
    await db.ref(`${asPath}/${uid}`).update({
      현황: summary,
      현황번역: ""
    });
    
    // 단일 행만 업데이트 (전체 렌더링 방지)
    updateSingleRowInTable(uid, { 현황: summary, 현황번역: "" });
    
    addHistory(`AI 요약 완료 - [${uid}] 현황 업데이트`);
    alert("AI 요약 결과가 '현황' 필드에 반영되었습니다.");
  } catch (err) {
    console.error("AI 요약 오류:", err);
    alert("AI 요약 처리 중 오류가 발생했습니다.");
  } finally {
    closeAiProgressModal();
  }
}

// 단일 행 UI 업데이트 함수
function updateSingleRowInTable(uid, updates) {
  const checkbox = document.querySelector(`.rowSelectChk[data-uid="${uid}"]`);
  if (!checkbox) return;
  
  const tr = checkbox.closest('tr');
  if (!tr) return;
  
  // 필요한 필드만 업데이트
  Object.entries(updates).forEach(([field, value]) => {
    const cell = tr.querySelector(`td[data-field="${field}"] input`);
    if (cell) {
      cell.value = value || '';
    }
  });
}

// (2) 히스토리 AI 요약
async function summarizeHistoryForProject(project) {
  if (!project) {
    alert("공번(수익프로젝트) 정보가 없습니다.");
    return;
  }
  
  try {
    const snapshot = await db.ref(aiHistoryPath).orderByChild("project").equalTo(project).once('value');
    const data = snapshot.val();
    
    if (!data) {
      alert("해당 공번에 해당하는 히스토리 데이터가 없습니다.");
      return;
    }
    
    const records = Object.values(data);
    let combinedText = `프로젝트(공번): ${project}\n\n`;
    
    records.forEach(rec => {
      combinedText += `[조치결과]\n${rec.조치결과 || '내용 없음'}\n\n`;
    });

    const basePrompt = g_aiConfig.promptHistory || "히스토리 조치결과를 간략 요약해주세요.";
    const promptText = basePrompt + "\n\n" + combinedText;

    showAiProgressModal();
    clearAiProgressText();
    document.getElementById('aiProgressText').textContent = "[히스토리 요약 진행 중]\n\n";

    const summary = await callAiForSummary(promptText);
    
    if (!summary) {
      alert("AI 요약 실패 (빈 값 반환)");
      return;
    }
    
    // 히스토리 요약 결과를 contentModal에서 전체보기
    openContentModal(summary);
  } catch (err) {
    console.error("히스토리 AI 요약 오류:", err);
    alert("히스토리 AI 요약 처리 중 오류가 발생했습니다.");
  } finally {
    closeAiProgressModal();
  }
}

// (3) 선사별 AI 요약
async function openOwnerAIModal() {
  const filterVal = document.getElementById('filterOwner').value.trim();
  if (!filterVal) {
    alert("SHIPOWNER 필터 먼저 입력/선택");
    return;
  }
  
  // 필터링된 데이터 찾기
  const targetRows = asData.filter(r => (r.shipowner || '').toLowerCase().includes(filterVal.toLowerCase()));
  
  if (!targetRows.length) {
    alert("해당 선사로 필터된 항목 없음");
    return;
  }
  
  // 정렬
  targetRows.sort((a, b) => a.uid > b.uid ? 1 : -1);

  // 데이터 조합
  let combinedText = `선사명: ${filterVal}\n\n총 ${targetRows.length}건\n\n`;
  
  // 배치 크기 정의 (한 번에 너무 많은 데이터를 처리하지 않도록)
  const batchSize = 20;
  const batches = [];
  
  for (let i = 0; i < targetRows.length; i += batchSize) {
    const batch = targetRows.slice(i, i + batchSize);
    let batchText = '';
    
    batch.forEach(r => {
      batchText += 
        `SHIPNAME: ${r.shipName || 'N/A'}\nAS접수일자: ${r["AS접수일자"] || 'N/A'}\n` +
        `[접수내용]\n${r.접수내용 || '내용 없음'}\n\n[조치결과]\n${r.조치결과 || '내용 없음'}\n\n----\n`;
    });
    
    batches.push(batchText);
  }
  
  const basePrompt = g_aiConfig.promptOwner || 
    "여러 호선의 AS접수일자/접수내용/조치결과가 주어집니다. 이를 요약해 주세요.";

  showAiProgressModal();
  clearAiProgressText();
  document.getElementById('aiProgressText').textContent = "[선사별 요약 진행 중]\n\n";
  
  try {
    // 배치 처리
    let allSummaries = '';
    
    for (let i = 0; i < batches.length; i++) {
      updateAiProgressText(`\n배치 ${i+1}/${batches.length} 처리 중...\n`);
      
      const batchPrompt = basePrompt + "\n\n" + combinedText + batches[i];
      const batchSummary = await callAiForSummary(batchPrompt);
      
      if (batchSummary) {
        if (allSummaries) allSummaries += "\n\n---\n\n";
        allSummaries += batchSummary;
      }
    }
    
    // 배치 요약 결과가 너무 길면 최종 통합 요약
    let finalSummary = allSummaries;
    
    if (batches.length > 1 && allSummaries.length > 2000) {
      updateAiProgressText("\n\n최종 요약 생성 중...\n");
      const finalPrompt = `${basePrompt}\n\n다음은 ${batches.length}개 배치로 나눈 요약 결과입니다. 이를 통합하여 최종 요약해주세요:\n\n${allSummaries}`;
      finalSummary = await callAiForSummary(finalPrompt);
    }
    
    if (!finalSummary) {
      alert("AI 요약 실패 (빈 값 반환)");
      return;
    }
    
    document.getElementById('ownerAISummaryText').innerHTML = convertMarkdownToHTML(finalSummary);
    document.getElementById('ownerAIModal').style.display = 'block';
  } catch (err) {
    console.error("선사별 AI 요약 오류:", err);
    alert("선사별 AI 요약 처리 중 오류가 발생했습니다.");
  } finally {
    closeAiProgressModal();
  }
}

// AI 호출 통합 함수 (OpenAI or Gemini)
async function callAiForSummary(userPrompt) {
  const apiKey = g_aiConfig.apiKey;
  const modelName = g_aiConfig.model || "";

  if (!apiKey) {
    updateAiProgressText("에러: 관리자 패널에 API Key가 설정되지 않음.\n");
    return "";
  }

  try {
    // 1) OpenAI (gpt-4o, gpt-4o-mini 등)
    if (modelName.toLowerCase().startsWith("gpt")) {
      return await callOpenAiForSummary(userPrompt, apiKey, modelName);
    } 
    // 2) Gemini
    else {
      return await callGeminiForSummary(userPrompt, apiKey, modelName);
    }
  } catch (err) {
    console.error("AI API 호출 오류:", err);
    updateAiProgressText(`\n[AI 호출 중 오류 발생]\n${err.message}`);
    return "";
  }
}

// OpenAI API 호출
async function callOpenAiForSummary(contentText, apiKey, modelName) {
  // 모델명 매핑 (기본값 설정)
  let openAiModel = modelName;
  if (!openAiModel || openAiModel === "gpt-4o-mini") {
    openAiModel = "gpt-3.5-turbo";
  }

  try {
    updateAiProgressText(`OpenAI 모델(${openAiModel}) 호출 중...\n`);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: openAiModel,
        messages: [
          {role: "user", content: contentText}
        ],
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenAI API 응답 오류:", data);
      updateAiProgressText("\n[오류]\n" + JSON.stringify(data));
      return "";
    }
    
    const result = data.choices?.[0]?.message?.content?.trim() || "";
    updateAiProgressText("\n[응답 완료]\n");
    return result;
  } catch (err) {
    console.error("OpenAI API 요청 오류:", err);
    updateAiProgressText("\n[에러 발생]\n" + err.message);
    return "";
  }
}

// Gemini API 호출
async function callGeminiForSummary(contentText, apiKey, modelName) {
  try {
    // 기본 모델명 설정
    const model = modelName || "gemini-1.5-pro-latest";
    updateAiProgressText(`Gemini 모델(${model}) 호출 중...\n`);
    
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {text: contentText}
            ]
          }
        ]
      })
    });

    const data = await response.json();
    
    if (response.ok && data.candidates) {
      const txt = data.candidates[0]?.content?.parts[0]?.text?.trim() || "";
      updateAiProgressText("[Gemini 응답 완료]\n");
      return txt;
    } else {
      console.error("Gemini API 오류:", data);
      updateAiProgressText("\n[에러] " + JSON.stringify(data, null, 2));
      return "";
    }
  } catch (err) {
    console.error("Gemini API 요청 오류:", err);
    updateAiProgressText("\n[에러 발생]\n" + err.message);
    return "";
  }
}

/** ==================================
 *  유틸리티 함수
 * ===================================*/
// 두 객체 비교 함수
function isEqual(obj1, obj2) {
  if (!obj1 || !obj2) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
}

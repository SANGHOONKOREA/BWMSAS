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

// 로그인 상태 감지
auth.onAuthStateChanged(user=>{
  if(user){
    // 로그인됨
    document.getElementById('loginModal').style.display='none';
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('mainContainer').classList.remove('hidden');
    testConnection();
    loadData();   // 데이터는 불러오되, renderTable()은 자동으로 호출하지 않음
    loadAiConfig(); 
  } else {
    // 미로그인
    document.getElementById('loginModal').style.display='block';
    document.getElementById('sidebar').classList.add('hidden');
    document.getElementById('mainContainer').classList.add('hidden');
  }
});

document.getElementById('loginConfirmBtn').addEventListener('click', ()=>{
  const email = document.getElementById('loginUser').value.trim();
  const pw    = document.getElementById('loginPw').value.trim();
  if(!email || !pw){
    document.getElementById('loginError').textContent="이메일/비밀번호를 입력하세요.";
    return;
  }
  auth.signInWithEmailAndPassword(email, pw)
    .then(()=>{
      // onAuthStateChanged에서 UI 전환
    })
    .catch(err=>{
      document.getElementById('loginError').textContent = "로그인 실패: "+err.message;
    });
});


// 사용자 관리 모달 관련
const userPath = 'as-service/users';
let userData = [];
let adminAuthorized = false; // 관리자 비번 확인용

document.getElementById('userManageBtn').addEventListener('click', openUserModal);
function openUserModal(){
  if(!adminAuthorized){
    const pw = prompt("관리자 비밀번호:");
    if(pw !== 'snsys1234'){
      alert("관리자 비밀번호가 다릅니다.");
      return;
    }
    adminAuthorized = true;
  }
  // 사용자 목록 불러오기
  db.ref(userPath).once('value').then(snap=>{
    const val = snap.val()||{};
    userData = Object.entries(val).map(([k,v])=>({uid:k, ...v}));
    renderUserList();
    document.getElementById('userModal').style.display='block';
  });
}
function closeUserModal(){
  document.getElementById('userModal').style.display='none';
}
function renderUserList(){
  const listDiv = document.getElementById('userList');
  listDiv.innerHTML = '';
  userData.forEach(u=>{
    const row = document.createElement('div');
    row.style.marginBottom='4px';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.dataset.uid = u.uid;
    chk.style.marginRight='6px';
    row.appendChild(chk);

    const txt = document.createElement('span');
    txt.textContent = `사용자명: ${u.username}, 비번: ${u.password}`;
    row.appendChild(txt);

    listDiv.appendChild(row);
  });
}
document.getElementById('deleteSelectedUsersBtn').addEventListener('click', ()=>{
  const cks = document.querySelectorAll('#userList input[type=checkbox]:checked');
  if(!cks.length){
    alert("삭제할 사용자를 선택하세요.");
    return;
  }
  if(!confirm("선택한 사용자들을 삭제하시겠습니까?")) return;

  cks.forEach(chk=>{
    const uid = chk.dataset.uid;
    db.ref(`${userPath}/${uid}`).remove();
  });
  // 재조회
  db.ref(userPath).once('value').then(snap=>{
    const val = snap.val()||{};
    userData = Object.entries(val).map(([k,v]) => ({uid:k, ...v}));
    renderUserList();
  });
});
document.getElementById('addUserConfirmBtn').addEventListener('click', ()=>{
  const uname = document.getElementById('newUserName').value.trim();
  const upw   = document.getElementById('newUserPw').value.trim();
  if(!uname || !upw){
    alert("사용자명/비번 필수 입력");
    return;
  }
  const key = db.ref(userPath).push().key;
  db.ref(`${userPath}/${key}`).set({username:uname, password:upw})
    .then(()=>{
      alert("사용자 등록 완료");
      document.getElementById('newUserName').value='';
      document.getElementById('newUserPw').value='';
      // 목록 갱신
      db.ref(userPath).once('value').then(snap=>{
        const val = snap.val()||{};
        userData = Object.entries(val).map(([k,v])=>({uid:k, ...v}));
        renderUserList();
      });
    });
});

/** ==================================
 *  AI 설정 관리 모달
 * ===================================*/
const aiConfigPath = "as-service/admin/aiConfig";
let g_aiConfig = {
  apiKey:"",
  model:"",
  promptRow:"",
  promptHistory:"",
  promptOwner:""
};

document.getElementById('aiConfigBtn').addEventListener('click', ()=>{
  if(!adminAuthorized){
    const pw = prompt("관리자 비밀번호:");
    if(pw !== 'snsys1234'){
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

  document.getElementById('aiConfigModal').style.display='block';
});

document.getElementById('saveAiConfigBtn').addEventListener('click', async ()=>{
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
  document.getElementById('aiConfigModal').style.display='none';
});

async function loadAiConfig(){
  const snap = await db.ref(aiConfigPath).once('value');
  if(snap.exists()){
    g_aiConfig = snap.val();
  }
}

/** ==================================
 *  AI 실시간 진행 모달
 * ===================================*/
function showAiProgressModal(){
  document.getElementById('aiProgressText').textContent = "요약 요청 중...";
  document.getElementById('aiProgressModal').style.display='block';
}
function updateAiProgressText(chunk){
  const div = document.getElementById('aiProgressText');
  div.textContent += chunk;
}
function clearAiProgressText(){
  document.getElementById('aiProgressText').textContent = "";
}
function closeAiProgressModal(){
  document.getElementById('aiProgressModal').style.display='none';
}


/** ==================================
 *  주요 기능
 * ===================================*/
let asData = [];
let currentMode = 'manager';  // 초기: 담당자
let sortField = '';
let sortAsc = true;

// 1) Firebase 연결 테스트
function testConnection(){
  db.ref('test').set({time:Date.now()})
    .then(()=>{
      document.getElementById('connectionStatus').textContent="연결 상태: Firebase 연결됨";
      document.getElementById('connectionStatus').style.color="green";
    })
    .catch(err=>{
      document.getElementById('connectionStatus').textContent="연결 오류:"+err.message;
      document.getElementById('connectionStatus').style.color="red";
    });
}

// 2) 불러오기
const asPath = 'as-service/data';
function loadData(){
  db.ref(asPath).once('value').then(snap=>{
    const val = snap.val()||{};
    const arr = Object.values(val);
    asData = arr.map(r=>{
      // 호환 처리
      if(r["현 담당"] && !r.manager) r.manager = r["현 담당"];
      if(r["SHIPOWNER"] && !r.shipowner) r.shipowner = r["SHIPOWNER"];
      if(r.group && typeof r.group!=='string') r.group = String(r.group);
      if(!("AS접수일자" in r)) r["AS접수일자"] = "";
      if(!("정상지연" in r)) r["정상지연"] = "";
      if(!("지연 사유" in r)) r["지연 사유"] = "";
      return r;
    });
    // 좌측 패널(담당자/선주사 목록) 표시
    updateSidebarList();
  });
}

// 3) 저장(전체)
document.getElementById('saveBtn').addEventListener('click', ()=>{
  if(!confirm("전체 데이터를 저장하시겠습니까?")) return;
  const updates = {};
  asData.forEach(r=> updates[r.uid] = r);
  db.ref(asPath).set(updates)
    .then(()=>{
      alert("전체 저장 완료");
      addHistory("전체 저장");
    });
});

// 4) 행 추가/삭제
document.getElementById('addRowBtn').addEventListener('click', ()=>{
  const uid = db.ref().push().key;
  const obj = {
    uid,
    공번:'', 공사:'', imo:'', hull:'', shipName:'', repMail:'',
    shipType:'', scale:'', 구분:'', shipowner:'', major:'', group:'',
    shipyard:'', contract:'', asType:'유상', delivery:'', warranty:'',
    prevManager:'', manager:'', 현황:'', 동작여부:'정상A',
    조치계획:'', 접수내용:'', 조치결과:'',
    "AS접수일자":'',
    "기술적종료일":'',
    "정상지연":'',
    "지연 사유":''
  };
  asData.unshift(obj);
  renderTable(true);  // 바로 보여주도록
});
document.getElementById('deleteRowBtn').addEventListener('click', ()=>{
  const cks = document.querySelectorAll('.rowSelectChk:checked');
  if(!cks.length){ alert("삭제할 행을 선택하세요."); return; }
  if(!confirm("정말 삭제?"))return;
  cks.forEach(chk=>{
    const uid = chk.dataset.uid;
    asData = asData.filter(x=>x.uid!==uid);
  });
  renderTable(true);
  document.getElementById('selectAll').checked=false;
});
document.getElementById('selectAll').addEventListener('change',(e)=>{
  const cks = document.querySelectorAll('.rowSelectChk');
  cks.forEach(c=> c.checked = e.target.checked);
});

// "전체조회" 버튼
document.getElementById('loadBtn').addEventListener('click', ()=>{
  // 아무 필터 없이 전체 표시
  renderTable(true);  // overrideAll = true
});

// 5) 정렬/필터/테이블 렌더
document.getElementById('asTable').addEventListener('click', (e)=>{
  if(e.target.tagName==='TH' && e.target.dataset.field){
    const f = e.target.dataset.field;
    if(sortField===f) sortAsc = !sortAsc;
    else { sortField=f; sortAsc=true; }
    renderTable();
  }
});

let resizingCol=null, startX=0, startW=0;
document.addEventListener('mousedown', (e)=>{
  if(e.target.classList.contains('col-resizer')){
    resizingCol = e.target.parentElement;
    startX = e.pageX;
    startW = resizingCol.offsetWidth;
    document.addEventListener('mousemove', colResizing);
    document.addEventListener('mouseup', stopColResize);
    e.preventDefault();
  }
});
function colResizing(e){
  if(!resizingCol) return;
  const dx = e.pageX - startX;
  resizingCol.style.width = (startW+dx)+'px';
}
function stopColResize(){
  document.removeEventListener('mousemove', colResizing);
  document.removeEventListener('mouseup', stopColResize);
  resizingCol=null;
}

// 행 높이
let resizingRow=null, startY=0, startH=0;
function startRowResize(e, tr){
  resizingRow=tr;
  startY=e.pageY;
  startH=tr.offsetHeight;
  document.addEventListener('mousemove', doRowResize);
  document.addEventListener('mouseup', stopRowResize);
  e.preventDefault();
}
function doRowResize(e){
  if(!resizingRow) return;
  const dy=e.pageY - startY;
  const newH=startH+dy;
  if(newH>20) resizingRow.style.height=newH+'px';
}
function stopRowResize(){
  document.removeEventListener('mousemove', doRowResize);
  document.removeEventListener('mouseup', stopRowResize);
  resizingRow=null;
}


/**
 * renderTable
 * @param {boolean} overrideAll - true면 필터가 전부 비어 있어도 전체데이터 표시
 */
function renderTable(overrideAll=false){
  if(!asData.length){
    // 아직 loadData 안끝났거나 데이터 없음
    document.getElementById('asBody').innerHTML='';
    return;
  }

  // 필터값
  const fIMO   = document.getElementById('filterIMO').value.trim().toLowerCase();
  const fHull  = document.getElementById('filterHull').value.trim().toLowerCase();
  const fName  = document.getElementById('filterName').value.trim().toLowerCase();
  const fOwner = document.getElementById('filterOwner').value.trim().toLowerCase();
  const fMajor = document.getElementById('filterMajor').value.trim().toLowerCase();
  const fGroup = document.getElementById('filterGroup').value;
  const fAsType= document.getElementById('filterAsType').value;
  const fMgr   = document.getElementById('filterManager').value.trim().toLowerCase();
  const fActive= document.getElementById('filterActive').value;

  const allEmpty = !fIMO && !fHull && !fName && !fOwner && !fMajor && !fGroup && !fAsType && !fMgr && !fActive;
  if(allEmpty && !overrideAll){
    document.getElementById('asBody').innerHTML='';
    updateSidebarList(); 
    // 상태 집계 초기화
    document.getElementById('count정상A').textContent='0';
    document.getElementById('count정상B').textContent='0';
    document.getElementById('count유상정상').textContent='0';
    document.getElementById('count부분동작').textContent='0';
    document.getElementById('count동작불가').textContent='0';
    return;
  }

  // 정렬
  if(sortField){
    asData.sort((a,b)=>{
      const aa = a[sortField]||'';
      const bb = b[sortField]||'';
      if(aa<bb) return sortAsc? -1:1;
      if(aa>bb) return sortAsc? 1:-1;
      return 0;
    });
  }

  let counts = {정상A:0, 정상B:0, 유상정상:0, 부분동작:0, 동작불가:0};

  const tbody = document.getElementById('asBody');
  tbody.innerHTML='';

  asData.forEach(row=>{
    const imoVal  = String(row.imo||'').toLowerCase();
    const hullVal = String(row.hull||'').toLowerCase();
    const nameVal = String(row.shipName||'').toLowerCase();
    const ownVal  = String(row.shipowner||'').toLowerCase();
    const majVal  = String(row.major||'').toLowerCase();
    const mgrVal  = String(row.manager||'').toLowerCase();
    const actVal  = String(row.동작여부||'');

    // 필터
    if(!overrideAll){
      if(fIMO && !imoVal.includes(fIMO)) return;
      if(fHull && !hullVal.includes(fHull)) return;
      if(fName && !nameVal.includes(fName)) return;
      if(fOwner && !ownVal.includes(fOwner)) return;
      if(fMajor && !majVal.includes(fMajor)) return;
      if(fGroup && row.group!==fGroup) return;
      if(fAsType && row.asType!==fAsType) return;
      if(fMgr && !mgrVal.includes(fMgr)) return;
      if(fActive && actVal!==fActive) return;
    }

    if(counts.hasOwnProperty(row.동작여부)) counts[row.동작여부]++;

    const tr = document.createElement('tr');
    // 체크박스
    let td = document.createElement('td');
    const chk = document.createElement('input');
    chk.type='checkbox';
    chk.classList.add('rowSelectChk');
    chk.dataset.uid=row.uid;
    td.appendChild(chk);
    tr.appendChild(td);

    function makeCell(val, fld){
      const c = document.createElement('td');
      c.dataset.field = fld;
      if(['delivery','warranty','기술적종료일','AS접수일자'].includes(fld)){
        const inp = document.createElement('input');
        inp.type='date';
        inp.value = val||'';
        inp.dataset.uid=row.uid;
        inp.dataset.field=fld;
        inp.addEventListener('change', onCellChange);
        c.appendChild(inp);
      }
      else if(fld==='asType'){
        const sel=document.createElement('select');
        ['유상','무상','위탁'].forEach(op=>{
          const o=document.createElement('option');
          o.value=op;
          o.textContent=op;
          sel.appendChild(o);
        });
        sel.value = val||'유상';
        sel.dataset.uid=row.uid;
        sel.dataset.field=fld;
        sel.addEventListener('change', onCellChange);
        c.appendChild(sel);
      }
      else if(fld==='동작여부'){
        const sel=document.createElement('select');
        ['정상A','정상B','유상정상','부분동작','동작불가'].forEach(op=>{
          const o=document.createElement('option');
          o.value=op;
          o.textContent=op;
          sel.appendChild(o);
        });
        sel.value = val||'정상A';
        sel.dataset.uid=row.uid;
        sel.dataset.field=fld;
        sel.addEventListener('change', onCellChange);
        c.appendChild(sel);
      }
      else if(fld==='imo'){
        const inp=document.createElement('input');
        inp.type='text';
        inp.value=val||'';
        inp.style.width='75%';
        inp.dataset.uid=row.uid;
        inp.dataset.field=fld;
        inp.addEventListener('change', onCellChange);
        c.appendChild(inp);

        const linkIcon = document.createElement('span');
        linkIcon.textContent=' 🔎';
        linkIcon.style.cursor='pointer';
        linkIcon.title='새 창에서 조회';
        linkIcon.addEventListener('click', ()=>{
          const imoVal = inp.value.trim();
          if(imoVal){
            window.open('https://www.vesselfinder.com/vessels/details/' + encodeURIComponent(imoVal), '_blank');
          }
        });
        c.appendChild(linkIcon);
      }
      else if(['조치계획','접수내용','조치결과'].includes(fld)){
        // 원본 내용 모달 보기
        const inp=document.createElement('input');
        inp.type='text';
        inp.value=val||'';
        inp.style.width='95%';
        inp.readOnly=true;
        inp.dataset.uid=row.uid;
        inp.dataset.field=fld;
        c.addEventListener('click', ()=>openContentModal(val||''));
        c.appendChild(inp);
      }
      else {
        const inp=document.createElement('input');
        inp.type='text';
        inp.value=val||'';
        inp.style.width='95%';
        inp.dataset.uid=row.uid;
        inp.dataset.field=fld;
        inp.addEventListener('change', onCellChange);
        c.appendChild(inp);
      }
      return c;
    }
    function makeElapsedCell(r){
      const c = document.createElement('td');
      c.dataset.field="경과일";
      if(r["기술적종료일"]){
        c.textContent="";
      } else {
        let asDate = r["AS접수일자"]||"";
        if(!asDate){
          c.textContent="";
        } else {
          const today=new Date();
          const asD=new Date(asDate+"T00:00");
          if(asD.toString()==='Invalid Date'){
            c.textContent="";
          } else {
            const diff=Math.floor((today - asD)/(1000*3600*24));
            if(diff<0){
              c.textContent="0일";
            } else {
              c.textContent = diff+"일";
              if(!row["정상지연"]){
                if(diff>=90){
                  c.style.backgroundColor='red';
                  c.style.color='#fff';
                } else if(diff>=60){
                  c.style.backgroundColor='orange';
                } else if(diff>=30){
                  c.style.backgroundColor='yellow';
                }
              }
            }
          }
        }
      }
      return c;
    }
    function makeNormalDelayCell(r){
      const c=document.createElement('td');
      c.dataset.field="정상지연";
      const check=document.createElement('input');
      check.type='checkbox';
      check.dataset.uid=row.uid;
      check.dataset.field="정상지연";
      check.checked = (r["정상지연"]==="Y");
      check.addEventListener('change', onCellChange);
      c.appendChild(check);
      return c;
    }
    function makeDelayReasonCell(r){
      const c=document.createElement('td');
      c.dataset.field="지연 사유";
      const inp=document.createElement('input');
      inp.type='text';
      inp.value=r["지연 사유"]||'';
      inp.style.width='95%';
      inp.dataset.uid=row.uid;
      inp.dataset.field="지연 사유";
      inp.addEventListener('change', onCellChange);
      c.appendChild(inp);
      return c;
    }

    tr.appendChild(makeCell(row.공번,'공번'));
    tr.appendChild(makeCell(row.공사,'공사'));
    tr.appendChild(makeCell(row.imo,'imo'));
    tr.appendChild(makeCell(row.hull,'hull'));
    tr.appendChild(makeCell(row.shipName,'shipName'));
    tr.appendChild(makeCell(row.repMail,'repMail'));
    tr.appendChild(makeCell(row.shipType,'shipType'));
    tr.appendChild(makeCell(row.scale,'scale'));
    tr.appendChild(makeCell(row.구분,'구분'));
    tr.appendChild(makeCell(row.shipowner,'shipowner'));
    tr.appendChild(makeCell(row.major,'major'));
    tr.appendChild(makeCell(row.group,'group'));
    tr.appendChild(makeCell(row.shipyard,'shipyard'));
    tr.appendChild(makeCell(row.contract,'contract'));
    tr.appendChild(makeCell(row.asType,'asType'));
    tr.appendChild(makeCell(row.delivery,'delivery'));
    tr.appendChild(makeCell(row.warranty,'warranty'));
    tr.appendChild(makeCell(row.prevManager,'prevManager'));
    tr.appendChild(makeCell(row.manager,'manager'));
    tr.appendChild(makeCell(row.현황,'현황'));

    // (1) AI 요약 버튼 (단일 행)
    const aiTd = document.createElement('td');
    const aiBtn = document.createElement('button');
    aiBtn.textContent = "AI 요약";
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
    tr.appendChild(makeCell(row.조치계획,'조치계획'));
    tr.appendChild(makeCell(row.접수내용,'접수내용'));
    tr.appendChild(makeCell(row.조치결과,'조치결과'));

    // (2) 히스토리 AI 요약
    const historyTd = document.createElement('td');
    const historyBtn = document.createElement('button');
    historyBtn.textContent = "AI 요약";
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
    if(row.warranty){
      const wDate = new Date(row.warranty + "T00:00");
      const today = new Date(new Date().toLocaleDateString());
      if(wDate < today && row.asType !== '유상'){
        tr.cells[17].style.backgroundColor = 'yellow';
      }
    }
    if(row.기술적종료일 && ["정상B","부분동작","동작불가"].includes(row.동작여부)){
      activeCell.style.backgroundColor = 'yellow';
    }
    if(row.접수내용 && !row.기술적종료일 && ["정상A","유상정상"].includes(row.동작여부)){
      activeCell.style.backgroundColor = 'lightgreen';
    }

    const rowRes = document.createElement('div');
    rowRes.className = 'row-resizer';
    rowRes.addEventListener('mousedown', (ev) => startRowResize(ev, tr));
    tr.appendChild(rowRes);

    tbody.appendChild(tr);
  });

  // 동작여부 집계
  document.getElementById('count정상A').textContent=counts.정상A;
  document.getElementById('count정상B').textContent=counts.정상B;
  document.getElementById('count유상정상').textContent=counts.유상정상;
  document.getElementById('count부분동작').textContent=counts.부분동작;
  document.getElementById('count동작불가').textContent=counts.동작불가;

  updateSidebarList();
}

function onCellChange(e){
  const uid = e.target.dataset.uid;
  const field= e.target.dataset.field;
  let newVal="";
  if(e.target.type==='checkbox'){
    newVal = e.target.checked ? "Y" : "";
  } else {
    newVal = e.target.value;
  }
  const row=asData.find(x=>x.uid===uid);
  if(!row) return;
  const oldVal = row[field]||'';
  if(oldVal===newVal) return;
  row[field]=newVal;

  if(field==="정상지연" || field==="AS접수일자" || field==="기술적종료일"){
    renderTable(true);
  }
}


// 6) 엑셀 다운로드/업로드
document.getElementById('downloadExcelBtn').addEventListener('click', downloadExcel);
function downloadExcel(){
  const arr=asData.map(d=>({
    공번:d.공번, 공사:d.공사, IMO:d.imo, HULL:d.hull, SHIPNAME:d.shipName,
    '호선 대표메일':d.repMail, 'SHIP TYPE':d.shipType, SCALE:d.scale, 구분:d.구분,
    SHIPOWNER:d.shipowner, 주요선사:d.major, 그룹:d.group, SHIPYARD:d.shipyard,
    계약:d.contract, 'AS 구분':d.asType, 인도일:d.delivery, 보증종료일:d.warranty,
    '전 담당':d.prevManager, '현 담당':d.manager, 현황:d.현황, 동작여부:d.동작여부,
    조치계획:d.조치계획, 접수내용:d.접수내용, 조치결과:d.조치결과,
    AS접수일자:d["AS접수일자"], 기술적종료일:d["기술적종료일"],
    정상지연:d["정상지연"], '지연 사유':d["지연 사유"]
  }));
  const ws = XLSX.utils.json_to_sheet(arr);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "AS_Data");
  XLSX.writeFile(wb, "AS_Data.xlsx");
}

// 엑셀 업로드
document.getElementById('uploadExcelBtn').addEventListener('click',()=>{
  document.getElementById('excelModal').style.display='block';
});
document.getElementById('excelReplaceBtn').addEventListener('click',()=>{
  document.getElementById('excelModal').style.display='none';
  proceedExcelUpload("replace");
});
document.getElementById('excelAppendBtn').addEventListener('click',()=>{
  document.getElementById('excelModal').style.display='none';
  proceedExcelUpload("append");
});
document.getElementById('excelCancelBtn').addEventListener('click',()=>{
  document.getElementById('excelModal').style.display='none';
});
function proceedExcelUpload(mode){
  document.getElementById('uploadExcelInput').click();
  document.getElementById('uploadExcelInput').onchange=e=>{
    const file=e.target.files[0];
    if(!file)return;
    readExcelFile(file, mode);
    e.target.value='';
  };
}
function readExcelFile(file, mode){
  const reader=new FileReader();
  reader.onload=function(evt){
    const data=new Uint8Array(evt.target.result);
    const wb=XLSX.read(data,{type:'array',cellDates:true,dateNF:"yyyy-mm-dd"});
    const sheet=wb.Sheets[wb.SheetNames[0]];
    const json=XLSX.utils.sheet_to_json(sheet,{defval:""});
    let newData=json.map(r=>{
      const uid = db.ref().push().key;
      function parseDate(v){
        if(typeof v==='object' && v instanceof Date){
          return toYMD(v);
        }
        if(typeof v==='string'){
          let s = v.trim().replace(/\//g,'-').replace(/\./g,'-');
          if(s==='#N/A' || s==='0' || s==='') return '';
          if(s.includes('-')){
            const parts=s.split('-');
            if(parts.length===3){
              let yy=parts[0].padStart(4,'0');
              let mm=parts[1].padStart(2,'0');
              let dd=parts[2].padStart(2,'0');
              return `${yy}-${mm}-${dd}`;
            }
          }
          return s;
        }
        return '';
      }
      function parseCell(v){
        if(typeof v==='number'){
          return String(v);
        }
        if(v==='#N/A') return '';
        return v;
      }
      const delivery = parseDate(r['인도일']||'');
      const warranty = parseDate(r['보증종료일']||'');
      const asReceipt= parseDate(r['AS접수일자']||'');
      const techEnd  = parseDate(r['기술적종료일']||'');
      const normalDelay = (r['정상지연']==='Y')?'Y':'';
      const delayReason = r['지연 사유']||'';
      return {
        uid,
        공번: parseCell(r['공번']),
        공사: parseCell(r['공사']),
        imo: parseCell(r['IMO']),
        hull: parseCell(r['HULL']),
        shipName: parseCell(r['SHIPNAME']),
        repMail: parseCell(r['호선 대표메일']),
        shipType: parseCell(r['SHIP TYPE']),
        scale: parseCell(r['SCALE']),
        구분: parseCell(r['구분']),
        shipowner: parseCell(r['SHIPOWNER']),
        major: parseCell(r['주요선사']),
        group: String(parseCell(r['그룹'])||''),
        shipyard: parseCell(r['SHIPYARD']),
        contract: parseCell(r['계약']),
        asType: parseCell(r['AS 구분'])||'유상',
        delivery, warranty,
        prevManager: parseCell(r['전 담당']),
        manager: parseCell(r['현 담당']),
        현황: parseCell(r['현황']),
        동작여부: parseCell(r['동작여부'])||'정상A',
        조치계획: parseCell(r['조치계획']),
        접수내용: parseCell(r['접수내용']),
        조치결과: parseCell(r['조치결과']),
        "AS접수일자": asReceipt,
        "기술적종료일": techEnd,
        "정상지연": normalDelay,
        "지연 사유": delayReason
      };
    });
    if(mode==='replace'){
      db.ref(asPath).remove().then(()=>{
        newData.forEach(obj=>{
          db.ref(`${asPath}/${obj.uid}`).set(obj);
        });
        asData=newData;
        renderTable(true);
        alert(`엑셀 업로드(교체) 완료 (총 ${json.length}건)`);
      });
    } else {
      newData.forEach(obj=>{
        db.ref(`${asPath}/${obj.uid}`).set(obj);
      });
      asData=asData.concat(newData);
      renderTable(true);
      alert(`엑셀 업로드(추가) 완료 (총 ${json.length}건)`);
    }
  };
  reader.readAsArrayBuffer(file);
}
function toYMD(dt){
  const y=dt.getFullYear();
  const m=('0'+(dt.getMonth()+1)).slice(-2);
  const d=('0'+dt.getDate()).slice(-2);
  return `${y}-${m}-${d}`;
}

// 7) AS 현황 업로드
document.getElementById('uploadAsStatusBtn').addEventListener('click', ()=>{
  document.getElementById('uploadAsStatusInput').click();
});
document.getElementById('uploadAsStatusInput').addEventListener('change', e=>{
  const file=e.target.files[0];
  if(!file)return;
  readAsStatusFile(file);
  e.target.value='';
});
const aiHistoryPath = 'as-service/ai_history';
function readAsStatusFile(file){
  const reader=new FileReader();
  reader.onload=function(evt){
    const data=new Uint8Array(evt.target.result);
    const wb=XLSX.read(data,{type:'array',cellDates:true,dateNF:"yyyy-mm-dd"});
    const sheet=wb.Sheets[wb.SheetNames[0]];
    const json=XLSX.utils.sheet_to_json(sheet,{defval:""});
    const map={};

    json.forEach(row=>{
      const asStatus = (row['AS진행상태']||'').trim();
      if(asStatus==='접수취소') return;
      const project = (row['수익프로젝트']||'').trim();
      if(!project) return;
      const aiRecord = {
        project: project,
        조치결과: (row['조치결과']||'').trim()
      };
      db.ref(aiHistoryPath).push(aiRecord);

      const asDateRaw = row['AS접수일자']||'';
      const asDateObj = new Date(asDateRaw.replace(/[./]/g,'-')+"T00:00");
      const asDateMS  = asDateObj.getTime();
      const plan = row['조치계획']||'';
      const rec  = row['접수내용']||'';
      const res  = row['조치결과']||'';
      const tEnd = row['기술적종료일자']||'';
      if(!map[project]){
        map[project] = { asDate:asDateMS, plan, rec, res, tEnd };
      } else {
        if(asDateMS>map[project].asDate){
          map[project] = { asDate:asDateMS, plan, rec, res, tEnd };
        }
      }
    });

    let projectCount = {};
    json.forEach(row=>{
      const asStatus = (row['AS진행상태']||'').trim();
      if(asStatus==='접수취소') return;
      const project = (row['수익프로젝트']||'').trim();
      if(!project) return;
      projectCount[project] = (projectCount[project]||0) + 1;
    });
    for(let proj in projectCount){
      db.ref(aiHistoryPath).orderByChild("project").equalTo(proj).once('value').then(snapshot=>{
        snapshot.forEach(child=>{
          child.ref.update({ 접수건수: projectCount[proj] });
        });
      });
    }

    let updateCount=0;
    for(let project in map){
      const item=map[project];
      const row=asData.find(x=>x.공번===project);
      if(row){
        row.조치계획 = item.plan;
        row.접수내용 = item.rec;
        row.조치결과 = item.res;
        row["기술적종료일"] = parseDateString(item.tEnd);
        row["AS접수일자"]   = dateToYMD(item.asDate);

        db.ref(`${asPath}/${row.uid}/조치계획`).set(row.조치계획);
        db.ref(`${asPath}/${row.uid}/접수내용`).set(row.접수내용);
        db.ref(`${asPath}/${row.uid}/조치결과`).set(row.조치결과);
        db.ref(`${asPath}/${row.uid}/기술적종료일`).set(row["기술적종료일"]);
        db.ref(`${asPath}/${row.uid}/AS접수일자`).set(row["AS접수일자"]);

        addHistory(`AS 현황 업로드 - [${row.uid}] (공번=${project}) 접수/조치정보 갱신`);
        updateCount++;
      }
    }
    renderTable(true);
    alert(`AS 현황 업로드 완료 (총 ${updateCount}건 업데이트)`);
  };
  reader.readAsArrayBuffer(file);
}
function parseDateString(str){
  if(!str) return '';
  let v=str.trim().replace(/[./]/g,'-');
  let d=new Date(v+"T00:00");
  if(!isNaN(d.getTime())){
    const yy=d.getFullYear();
    const mm=('0'+(d.getMonth()+1)).slice(-2);
    const dd=('0'+d.getDate()).slice(-2);
    return `${yy}-${mm}-${dd}`;
  }
  return '';
}
function dateToYMD(ms){
  if(!ms) return '';
  let d=new Date(ms);
  if(isNaN(d.getTime())) return '';
  let yy=d.getFullYear();
  let mm=('0'+(d.getMonth()+1)).slice(-2);
  let dd=('0'+d.getDate()).slice(-2);
  return `${yy}-${mm}-${dd}`;
}

// 8) 히스토리
const histPath = 'as-service/history';
document.getElementById('historyBtn').addEventListener('click', showHistoryModal);
document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
function addHistory(msg){
  const k=db.ref(histPath).push().key;
  const t=new Date().toISOString();
  db.ref(`${histPath}/${k}`).set({time:t,msg});
}
function showHistoryModal(){
  db.ref(histPath).once('value').then(snap=>{
    const val=snap.val()||{};
    let arr=Object.values(val).sort((a,b)=> new Date(b.time)-new Date(a.time));
    const hl=document.getElementById('historyList');
    hl.innerHTML='';
    arr.forEach(it=>{
      const li=document.createElement('li');
      li.textContent=`[${it.time}] ${it.msg}`;
      hl.appendChild(li);
    });
    document.getElementById('historyModal').style.display='block';
  });
}
function closeHistoryModal(){
  document.getElementById('historyModal').style.display='none';
}
function clearHistory(){
  if(!confirm("히스토리 전체 삭제?")) return;
  db.ref(histPath).remove().then(()=>{
    document.getElementById('historyList').innerHTML='';
    alert("히스토리 삭제 완료");
  });
}

// 9) 사이드바 (담당자 / 선주사)
document.getElementById('btnManager').addEventListener('click', ()=>switchSideMode('manager'));
document.getElementById('btnOwner').addEventListener('click', ()=>switchSideMode('owner'));
function switchSideMode(mode){
  currentMode=mode;
  document.getElementById('btnManager').classList.remove('active');
  document.getElementById('btnOwner').classList.remove('active');

  // 필터 초기화
  document.getElementById('filterIMO').value = "";
  document.getElementById('filterHull').value = "";
  document.getElementById('filterName').value = "";
  document.getElementById('filterOwner').value = "";
  document.getElementById('filterMajor').value = "";
  document.getElementById('filterGroup').value = "";
  document.getElementById('filterAsType').value = "";
  document.getElementById('filterManager').value = "";
  document.getElementById('filterActive').value = "";

  if(mode==='manager'){
    document.getElementById('btnManager').classList.add('active');
    document.getElementById('listTitle').textContent='담당자 목록';
  } else {
    document.getElementById('btnOwner').classList.add('active');
    document.getElementById('listTitle').textContent='선주사 목록';
  }
  updateSidebarList();
  renderTable(false);
}

function updateSidebarList(){
  const listDiv=document.getElementById('itemList');
  listDiv.innerHTML='';

  if(currentMode==='manager'){
    const mgrMap={};
    let allTotalCount=0, allProgressCount=0;
    asData.forEach(d=>{
      const mgr=d.manager||'';
      if(!mgr)return;
      if(!mgrMap[mgr]) mgrMap[mgr]={totalCount:0, progressCount:0};
      mgrMap[mgr].totalCount++;
      allTotalCount++;
      if(d.접수내용 && !d.기술적종료일){
        mgrMap[mgr].progressCount++;
        allProgressCount++;
      }
    });
    // 전체 버튼
    const allBtn = document.createElement('button');
    allBtn.style.display = 'flex';
    allBtn.style.justifyContent = 'space-between';
    const allLeft = document.createElement('span');
    allLeft.textContent = `전체(${allTotalCount})`;
    const allRight = document.createElement('span');
    allRight.textContent = `AS진행(${allProgressCount})`;
    allBtn.appendChild(allLeft);
    allBtn.appendChild(allRight);
    allBtn.onclick = () => {
      document.getElementById('filterIMO').value = '';
      document.getElementById('filterHull').value = '';
      document.getElementById('filterName').value = '';
      document.getElementById('filterOwner').value = '';
      document.getElementById('filterMajor').value = '';
      document.getElementById('filterGroup').value = '';
      document.getElementById('filterAsType').value = '';
      document.getElementById('filterManager').value = '';
      document.getElementById('filterActive').value = '';
      renderTable(true);
    };
    listDiv.appendChild(allBtn);

    let arr=Object.entries(mgrMap).map(([k,v])=>({mgr:k,...v}));
    arr.sort((a,b)=>b.totalCount-a.totalCount);

    arr.forEach(item=>{
      const btn=document.createElement('button');
      btn.style.display='flex';
      btn.style.justifyContent='space-between';
      const left=document.createElement('span');
      left.textContent=`${item.mgr}(${item.totalCount})`;
      const right=document.createElement('span');
      right.textContent=`AS진행(${item.progressCount})`;
      btn.appendChild(left);
      btn.appendChild(right);
      btn.onclick=()=>{
        document.getElementById('filterManager').value=item.mgr;
        renderTable();
      };
      listDiv.appendChild(btn);
    });
  } else {
    const owMap={};
    let allTotalCount=0, allProgressCount=0;
    asData.forEach(d=>{
      const ow=d.shipowner||'';
      if(!ow)return;
      if(!owMap[ow]) owMap[ow]={totalCount:0, progressCount:0};
      owMap[ow].totalCount++;
      allTotalCount++;
      if(d.접수내용 && !d.기술적종료일){
        owMap[ow].progressCount++;
        allProgressCount++;
      }
    });
    // 전체 버튼
    const allBtn=document.createElement('button');
    allBtn.style.display='flex';
    allBtn.style.justifyContent='space-between';
    const allLeft=document.createElement('span');
    allLeft.textContent=`전체(${allTotalCount})`;
    const allRight=document.createElement('span');
    allRight.textContent=`AS진행(${allProgressCount})`;
    allBtn.appendChild(allLeft);
    allBtn.appendChild(allRight);
    allBtn.onclick=()=>{
      document.getElementById('filterOwner').value='';
      renderTable(); 
    };
    listDiv.appendChild(allBtn);

    let arr=Object.entries(owMap).map(([k,v])=>({owner:k,...v}));
    arr.sort((a,b)=>b.totalCount-a.totalCount);

    arr.forEach(item=>{
      const btn=document.createElement('button');
      btn.style.display='flex';
      btn.style.justifyContent='space-between';
      const left=document.createElement('span');
      left.textContent=`${item.owner}(${item.totalCount})`;
      const right=document.createElement('span');
      right.textContent=`AS진행(${item.progressCount})`;
      btn.appendChild(left);
      btn.appendChild(right);
      btn.onclick=()=>{
        document.getElementById('filterOwner').value=item.owner;
        renderTable();
      };
      listDiv.appendChild(btn);
    });
  }
}

/** =======================================
 *  3가지 AI 요약 로직 (OpenAI + Gemini)
 * =======================================*/

// (1) 행 단위 요약
async function summarizeAndUpdateRow(uid){
  const row = asData.find(r=>r.uid===uid);
  if(!row){
    alert("대상 행 없음");
    return;
  }
  const basePrompt = g_aiConfig.promptRow || "접수내용과 조치결과를 간단히 요약해주세요.";
  const textOriginal = 
    `접수내용:\n${row.접수내용||"없음"}\n\n` +
    `조치결과:\n${row.조치결과||"없음"}\n`;

  const finalPrompt = basePrompt + "\n\n" + textOriginal;

  showAiProgressModal();
  clearAiProgressText();
  document.getElementById('aiProgressText').textContent = "[단일 행 요약 진행 중]\n\n";

  const summary = await callAiForSummary(finalPrompt);
  closeAiProgressModal();

  if(!summary){
    alert("AI 요약 실패 (빈 값 반환)");
    return;
  }
  row.현황 = summary;
  await db.ref(asPath+"/"+uid+"/현황").set(summary);
  addHistory(`AI 요약 완료 - [${uid}] 현황 업데이트`);
  renderTable(true);
  alert("AI 요약 결과가 '현황' 필드에 반영되었습니다.");
}

// (2) 히스토리 AI 요약
async function summarizeHistoryForProject(project){
  if(!project){
    alert("공번(수익프로젝트) 정보가 없습니다.");
    return;
  }
  const snapshot = await db.ref(aiHistoryPath).orderByChild("project").equalTo(project).once('value');
  const data = snapshot.val();
  if(!data){
    alert("해당 공번에 해당하는 히스토리 데이터가 없습니다.");
    return;
  }
  const records = Object.values(data);
  let combinedText = `프로젝트(공번): ${project}\n\n`;
  records.forEach(rec=>{
    combinedText += `[조치결과]\n${rec.조치결과}\n\n`;
  });

  const basePrompt = g_aiConfig.promptHistory || "히스토리 조치결과를 간략 요약해주세요.";
  const promptText = basePrompt + "\n\n" + combinedText;

  showAiProgressModal();
  clearAiProgressText();
  document.getElementById('aiProgressText').textContent = "[히스토리 요약 진행 중]\n\n";

  const summary = await callAiForSummary(promptText);
  closeAiProgressModal();

  if(!summary){
    alert("AI 요약 실패 (빈 값 반환)");
    return;
  }
  // 히스토리 요약 결과를 contentModal에서 전체보기
  openContentModal(summary);
}

// (3) 선사별 AI 요약
document.getElementById('ownerAISummaryBtn').addEventListener('click', openOwnerAIModal);
async function openOwnerAIModal(){
  const filterVal = document.getElementById('filterOwner').value.trim();
  if(!filterVal){
    alert("SHIPOWNER 필터 먼저 입력/선택");
    return;
  }
  const targetRows = asData.filter(r => (r.shipowner||'').toLowerCase().includes(filterVal.toLowerCase()));
  if(!targetRows.length){
    alert("해당 선사로 필터된 항목 없음");
    return;
  }
  targetRows.sort((a,b)=>(a.uid > b.uid ? 1 : -1));

  let combinedText = `선사명: ${filterVal}\n\n총 ${targetRows.length}건\n\n`;
  targetRows.forEach(r => {
    combinedText += 
      `SHIPNAME: ${r.shipName || 'N/A'}\nAS접수일자: ${r["AS접수일자"] || 'N/A'}\n` +
      `[접수내용]\n${r.접수내용}\n\n[조치결과]\n${r.조치결과}\n\n----\n`;
  });

  const basePrompt = g_aiConfig.promptOwner || 
    "여러 호선의 AS접수일자/접수내용/조치결과가 주어집니다. 이를 요약해 주세요.";
  const finalPrompt = basePrompt + "\n\n" + combinedText;

  showAiProgressModal();
  clearAiProgressText();
  document.getElementById('aiProgressText').textContent = "[선사별 요약 진행 중]\n\n";

  const finalSummary = await callAiForSummary(finalPrompt);
  closeAiProgressModal();

  if(!finalSummary){
    alert("AI 요약 실패 (빈 값 반환)");
    return;
  }
  document.getElementById('ownerAISummaryText').innerHTML = convertMarkdownToHTML(finalSummary);
  document.getElementById('ownerAIModal').style.display = 'block';
}

/** ==================================
 *  AI 호출 통합 (OpenAI or Gemini)
 * =================================**/
async function callAiForSummary(userPrompt){
  const apiKey = g_aiConfig.apiKey;
  const modelName = g_aiConfig.model || "";

  if(!apiKey){
    updateAiProgressText("에러: 관리자 패널에 API Key가 설정되지 않음.\n");
    return "";
  }

  // 1) OpenAI (gpt-4o, gpt-4o-mini 등)
  if(modelName.startsWith("gpt-4o")) {
    return await callOpenAiForSummary(userPrompt, apiKey, modelName);
  } 
  else {
    // 2) Gemini
    return await callGeminiForSummary(userPrompt, apiKey, modelName);
  }
}

/** ==================================
 *  OpenAI API 호출
 * =================================**/
async function callOpenAiForSummary(contentText, apiKey, modelName){
  let openAiModel = "gpt-4";
  if(modelName==="gpt-4o-mini") {
    openAiModel = "gpt-3.5-turbo";
  }

  try{
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: openAiModel,
        messages: [
          { role: "user", content: contentText }
        ],
        temperature: 0.7
      })
    });
    const data = await response.json();
    if(!response.ok){
      console.error("OpenAI API 응답 오류:", data);
      updateAiProgressText("\n[오류]\n"+JSON.stringify(data));
      return "";
    }
    const result = data.choices?.[0]?.message?.content?.trim() || "";
    return result;
  } catch(err){
    console.error("OpenAI API 요청 오류:", err);
    updateAiProgressText("\n[에러 발생]\n"+err.message);
    return "";
  }
}

/** ==================================
 *  Gemini API 호출
 * =================================**/
async function callGeminiForSummary(contentText, apiKey, modelName){
  try{
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: contentText }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    if(response.ok && data.candidates){
      const txt = data.candidates[0]?.content?.parts[0]?.text?.trim() || "";
      updateAiProgressText("[Gemini 응답 완료]\n");
      return txt;
    } else {
      console.error("Gemini API 오류:", data);
      updateAiProgressText("\n[에러] " + JSON.stringify(data, null, 2));
      return "";
    }
  } catch(err){
    console.error("Gemini API 요청 오류:", err);
    updateAiProgressText("\n[에러 발생]\n"+err.message);
    return "";
  }
}

/** ===============================
 *  마크다운 → HTML 변환
 * ===============================**/
function convertMarkdownToHTML(markdownText) {
  return marked.parse(markdownText);
}

/** ===============================
 *  내용 모달 ( + 전체화면 버튼 )
 * ===============================**/
function openContentModal(text) {
  const htmlText = convertMarkdownToHTML(text);
  document.getElementById('contentText').innerHTML = htmlText;
  document.getElementById('contentModal').style.display = 'block';
}
function closeContentModal(){
  document.getElementById('contentModal').style.display='none';
}
function toggleContentModalFullscreen(){
  const modal = document.getElementById('contentModal');
  if(modal.classList.contains('fullscreen')){
    modal.classList.remove('fullscreen');
  } else {
    modal.classList.add('fullscreen');
  }
}

/** ===============================
 *  선사별 AI 요약 모달 전체화면 토글
 * ===============================**/
function toggleOwnerAIModalFullscreen(){
  const modal = document.getElementById('ownerAIModal');
  if(modal.classList.contains('fullscreen')){
    modal.classList.remove('fullscreen');
  } else {
    modal.classList.add('fullscreen');
  }
}

// 테이블 가로 스크롤 대응
window.addEventListener('DOMContentLoaded', ()=>{
  const styleElem=document.createElement('style');
  styleElem.textContent=`
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
});

// 더블클릭 열 폭 자동맞춤
document.addEventListener('dblclick', (e)=>{
  const colRes = e.target.closest('.col-resizer');
  if(colRes){
    const th=colRes.parentElement;
    if(th) autoFitColumn(th);
  } else {
    const th=e.target.closest('th');
    if(th) autoFitColumn(th);
  }
});
function autoFitColumn(th){
  const table=document.getElementById('asTable');
  if(!table)return;
  const colIndex=Array.from(th.parentElement.children).indexOf(th);
  let maxWidth=0;
  const rows=table.rows;
  for(let i=0;i<rows.length;i++){
    const cell=rows[i].cells[colIndex];
    if(!cell) continue;
    let textContent='';
    const widget=cell.querySelector('input, select, span');
    if(widget){
      if(widget.tagName==='SELECT'){
        textContent=widget.options[widget.selectedIndex]?.text||'';
      } else if(widget.tagName==='INPUT'){
        textContent=widget.value||'';
      } else if(widget.tagName==='SPAN'){
        textContent=widget.textContent||'';
      }
    } else {
      textContent=cell.innerText||cell.textContent||'';
    }
    const span=document.createElement('span');
    span.style.position='absolute';
    span.style.visibility='hidden';
    span.style.whiteSpace='nowrap';
    span.style.font='14px sans-serif';
    span.textContent=textContent;
    document.body.appendChild(span);
    const w=span.offsetWidth+16;
    document.body.removeChild(span);
    if(w>maxWidth) maxWidth=w;
  }
  th.style.width=maxWidth+'px';
}

const ALL_COURSES=['วิชาไม้กวาด','วิชาคาถา','วิชาแปลงกาย','วิชาปรุงยา','วิชาสมุนไพร','วิชาการต่อสู้ด้วยเวทมนต์'];
const STORAGE_KEY='courseRegistrations';
const COMPLETED_MAGICS_KEY='completedSpecialMagics';
const SPECIAL_MAGICS_BY_YEAR={'ปี1':['Revelio','Lumos','Incedio','Protego','Aquamenti'],'ปี2':[],'ปี3':[],'ปี4':[],'ปี5':[]};
const SPECIAL_MAGICS=[].concat(...Object.values(SPECIAL_MAGICS_BY_YEAR).filter(a=>a.length));
const THAI_DAYS=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
const THAI_MONTHS=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

function loadRegistrations(){
    try{
        const d=localStorage.getItem(STORAGE_KEY);
        if(!d)return [];
        const parsed=JSON.parse(d);
        if(!Array.isArray(parsed))return [];
        return parsed.filter(r=>r&&typeof r==='object'&&typeof r.course==='string'&&r.course.trim()!=='');
    }catch(_){return []}
}
function saveRegistrations(r){localStorage.setItem(STORAGE_KEY,JSON.stringify(r))}
function loadCompletedMagics(){
    try{const d=localStorage.getItem(COMPLETED_MAGICS_KEY);if(!d)return [];const p=JSON.parse(d);return Array.isArray(p)?p.filter(m=>typeof m==='string'&&m.trim()):[]}
    catch(_){return []}
}
function saveCompletedMagics(arr){localStorage.setItem(COMPLETED_MAGICS_KEY,JSON.stringify(arr))}
function extractMagicName(course){if(!course||typeof course!=='string')return'';const m=course.match(/เวทย์พิเศษ:\s*(.+)/);return m?m[1].trim():''}
function extractClassName(course){if(!course||typeof course!=='string')return'';const m=course.match(/คลาสพิเศษ:\s*(.+)/);return m?m[1].trim():''}

function formatTime24(t){if(!t)return'';const p=t.split(':');return String(parseInt(p[0],10)).padStart(2,'0')+':'+String(parseInt(p[1]||0,10)).padStart(2,'0')}

function formatDateThai(s){if(!s||typeof s!=='string')return s||'';const d=new Date(s+'T12:00:00');if(isNaN(d.getTime()))return s;return THAI_DAYS[d.getDay()]+' '+d.getDate()+' '+THAI_MONTHS[d.getMonth()]}

function getDaysInMonth(month,year){
    const m=parseInt(month,10),y=year||new Date().getFullYear();
    if(isNaN(m)||m<1||m>12)return 31;
    const lastDay=new Date(y,m,0);
    return lastDay.getDate();
}
function buildDateFromDayMonth(day,month){
    const n=new Date(),y=n.getFullYear(),m=parseInt(month,10),d=parseInt(day,10);
    if(isNaN(m)||isNaN(d)||m<1||m>12||d<1)return null;
    const maxDays=getDaysInMonth(m,y);
    if(d>maxDays)return null;
    return y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}

function getTodayStr(){const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')}
function renderStats(){const regs=loadRegistrations(),completed=regs.filter(r=>r.status==='completed').length;const bar=document.getElementById('statsBar');if(!bar)return;const span=bar.querySelector('span');if(span)span.outerHTML='<span>เรียนแล้ว <span class="stat-completed">'+completed+'</span> / '+ALL_COURSES.length+' วิชา</span>';else bar.insertAdjacentHTML('afterbegin','<span>เรียนแล้ว <span class="stat-completed">'+completed+'</span> / '+ALL_COURSES.length+' วิชา</span>')}
function clearCalendar(){if(!confirm('ต้องการเคลียร์ตารางปฏิทินวิชาเรียนทั้งหมดใช่หรือไม่?'))return;saveRegistrations([]);updateCourseSelect();renderRegisteredList();renderRemainingList();renderStats();setDefaultFormValues();showToast('เคลียร์ตารางปฏิทินแล้ว','info')}
function showToast(msg,type){
    const c=document.getElementById('toastContainer');if(!c)return;
    const t=document.createElement('div');t.className='toast '+(type||'info');t.textContent=msg;
    c.appendChild(t);
    setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(-10px)';setTimeout(()=>t.remove(),300)},2500);
}

function renderRegisteredList(){
    let regs=loadRegistrations();
    const validDateStr=d=>d&&typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d);
    let needsSave=false;
    regs=regs.map(reg=>{
        if(!reg.status){reg.status=reg.completed?'completed':'pending';needsSave=true}
        if(reg.isSpecial===undefined&&reg.course&&(reg.course.startsWith('เวทย์พิเศษ:')||reg.course.startsWith('วิชา เวทย์พิเศษ:'))){reg.isSpecial=true;needsSave=true}
        if(reg.isSpecialClass===undefined&&reg.course&&(reg.course.startsWith('คลาสพิเศษ:')||reg.course.startsWith('วิชาคลาสพิเศษ:'))){reg.isSpecialClass=true;needsSave=true}
        if(reg.course&&reg.course.startsWith('วิชาคลาสพิเศษ:')){reg.course=reg.course.replace('วิชาคลาสพิเศษ:','คลาสพิเศษ:');needsSave=true}
        if(reg.course&&reg.course.startsWith('วิชา เวทย์พิเศษ:')){reg.course=reg.course.replace('วิชา เวทย์พิเศษ:','เวทย์พิเศษ:');needsSave=true}
        if(reg.course==='วิชาต่อสู้'||reg.course==='วิชาศิลปะการต่อสู้'){reg.course='วิชาการต่อสู้ด้วยเวทมนต์';needsSave=true}
        if(!validDateStr(reg.date)){needsSave=true;
            if(reg.day){const dm={'จันทร์':1,'อังคาร':2,'พุธ':3,'พฤหัสบดี':4,'ศุกร์':5,'เสาร์':6};const t=new Date(),td=dm[reg.day]||1;let diff=td-t.getDay();if(diff<=0)diff+=7;const d=new Date(t);d.setDate(t.getDate()+diff);return{...reg,date:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}}
            const t=new Date();return{...reg,date:t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0')}}
        return reg;
    });
    if(needsSave)saveRegistrations(regs);

    const wrapper=document.querySelector('.calendar-wrapper'),emptyMsg=document.getElementById('emptyRegistered'),thead=document.getElementById('calendarHeader'),tbody=document.getElementById('calendarBody');
    if(regs.length===0){wrapper.classList.remove('has-data');emptyMsg.style.display='block';return}

    wrapper.classList.add('has-data');
    const validDate=d=>d&&typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d);
    const uniqueDates=[...new Set(regs.map(r=>r.date).filter(validDate))].sort();
    if(uniqueDates.length===0){wrapper.classList.remove('has-data');emptyMsg.style.display='block';return}

    emptyMsg.style.display='none';
    const byDate={};uniqueDates.forEach(d=>byDate[d]=[]);
    regs.forEach((reg,i)=>{if(validDate(reg.date)&&reg.time&&byDate[reg.date])byDate[reg.date].push({course:reg.course,time:formatTime24(reg.time),index:i,status:reg.status||'pending',isSpecial:!!reg.isSpecial,isSpecialClass:!!reg.isSpecialClass})});
    uniqueDates.forEach(d=>byDate[d].sort((a,b)=>a.time.localeCompare(b.time)));

    const todayStr=getTodayStr();
    thead.innerHTML='';
    uniqueDates.forEach(d=>{const th=document.createElement('th');th.textContent=formatDateThai(d);if(d===todayStr)th.classList.add('today');thead.appendChild(th)});
    tbody.innerHTML='';
    const tr=document.createElement('tr');
    uniqueDates.forEach(date=>{
        const td=document.createElement('td');const items=byDate[date]||[];
        if(items.length>0){items.forEach(({course,time,index,status,isSpecial,isSpecialClass})=>{
            const st=status||'pending';
            const c=document.createElement('div');c.className='course-cell'+(isSpecial||isSpecialClass?' special':st==='preparing'?' preparing':st==='completed'?' completed':'');
            const displayName=isSpecial?extractMagicName(course)||course:isSpecialClass?extractClassName(course)||course:course.replace(/^วิชา\s*/,'');
            const nameSpan=document.createElement('span');nameSpan.className='course-name';nameSpan.textContent=displayName;nameSpan.title=course;
            const timeSpan=document.createElement('span');timeSpan.className='course-time';timeSpan.textContent=time;
            const btnWrap=document.createElement('div');btnWrap.className='cell-buttons';
            const removeBtn=document.createElement('button');removeBtn.type='button';removeBtn.className='remove-btn';removeBtn.setAttribute('data-index',String(index));removeBtn.setAttribute('aria-label','ลบวิชา '+course);removeBtn.textContent='×';
            removeBtn.onclick=e=>{e.stopPropagation();removeRegistration(parseInt(removeBtn.dataset.index))};
            if(!isSpecial&&!isSpecialClass){const statusLabels={pending:'รอลงเรียน',preparing:'เตรียมเรียน',completed:'✓'};const doneBtn=document.createElement('button');doneBtn.type='button';doneBtn.className='done-btn';doneBtn.setAttribute('data-index',String(index));doneBtn.setAttribute('aria-label','เปลี่ยนสถานะ '+course);doneBtn.textContent=statusLabels[st]||statusLabels.pending;doneBtn.title=st==='pending'?'รอลงเรียน':st==='preparing'?'เตรียมเรียน':'เรียนแล้ว';doneBtn.onclick=e=>{e.stopPropagation();cycleStatus(parseInt(doneBtn.dataset.index))};btnWrap.appendChild(doneBtn)}
            btnWrap.appendChild(removeBtn);c.appendChild(nameSpan);c.appendChild(timeSpan);c.appendChild(btnWrap);td.appendChild(c);
        })}
        else{td.classList.add('empty-cell');td.textContent='—'}
        tr.appendChild(td);
    });
    tbody.appendChild(tr);
}

function updateCourseSelect(){
    const regs=loadRegistrations(),registered=regs.map(r=>r.course),remaining=ALL_COURSES.filter(c=>!registered.includes(c));
    const select=document.getElementById('course'),fg=select?.closest('.form-group');
    if(!select)return;
    select.innerHTML='<option value="">-- เลือกวิชา --</option>'+remaining.map(c=>'<option value="'+c+'">'+c+'</option>').join('')+'<option value="คลาสพิเศษ">คลาสพิเศษ</option>'+'<option value="เวทย์พิเศษ">เวทย์พิเศษ</option>';
    select.value=remaining.includes(select.value)?select.value:(select.value==='คลาสพิเศษ'||select.value==='เวทย์พิเศษ'?select.value:'');
    let msg=fg?.querySelector('.all-registered-msg');
    if(remaining.length===0){if(!msg){msg=document.createElement('p');msg.className='all-registered-msg';msg.textContent='✓ ลงทะเบียนครบทุกวิชาแล้ว';fg?.appendChild(msg)}select.required=false}
    else{msg?.remove();select.required=true}
}

function renderRemainingList(){
    const regs=loadRegistrations(),registered=regs.map(r=>r.course),c=document.getElementById('remainingList');
    c.innerHTML='';
    ALL_COURSES.forEach(course=>{
        const i=document.createElement('div');i.className='remaining-item'+(registered.includes(course)?' registered':'');
        i.textContent=course;
        if(!registered.includes(course)){i.setAttribute('role','button');i.setAttribute('tabindex','0');i.setAttribute('aria-label','คลิกเพื่อเลือกวิชา '+course);const pickCourse=()=>{const sel=document.getElementById('course');if(sel&&ALL_COURSES.includes(course)){sel.value=course;sel.focus();showToast('เลือก '+course+' แล้ว','info')}};i.onclick=pickCourse;i.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pickCourse()}}}
        c.appendChild(i);
    });
}

function addRegistration(course,date,time){
    const regs=loadRegistrations();
    let finalCourse=course;
    let isSpecial=false;
    let isSpecialClass=false;
    if(course==='คลาสพิเศษ'){
        const customName=document.getElementById('specialClassName')?.value?.trim();
        if(!customName){showToast('กรุณาพิมพ์ชื่อคลาส','error');return}
        finalCourse='คลาสพิเศษ: '+customName;
        isSpecialClass=true;
    }else if(course==='เวทย์พิเศษ'){
        const customName=document.getElementById('specialMagicName')?.value?.trim();
        if(!customName){showToast('กรุณาเลือกเวทย์ที่จะไปเรียน','error');return}
        finalCourse='เวทย์พิเศษ: '+customName;
        isSpecial=true;
    }
    if(regs.some(r=>r.course===finalCourse)){showToast('วิชา '+finalCourse+' ลงทะเบียนไปแล้ว กรุณาเลือกวิชาอื่น','error');return}
    regs.push({course:finalCourse,date,time,status:'pending',isSpecial,isSpecialClass});saveRegistrations(regs);
    updateCourseSelect();renderRegisteredList();renderRemainingList();renderStats();
    showToast('ลงทะเบียน '+course+' สำเร็จ','success');
    const summary=document.querySelector('.summary-section');
    if(summary)summary.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
}

function cycleStatus(index){
    const regs=loadRegistrations();
    const reg=regs[index];
    if(!reg)return;
    const next={pending:'preparing',preparing:'completed',completed:'pending'};
    reg.status=next[reg.status||'pending']||'pending';
    saveRegistrations(regs);
    renderRegisteredList();renderStats();
    const msgs={pending:'รอลงเรียน',preparing:'เตรียมเรียน '+reg.course,completed:'✓ '+reg.course+' เรียนเสร็จแล้ว'};
    showToast(msgs[reg.status]||'','info');
}
function isMagicLearned(name){const completed=loadCompletedMagics();return completed.some(c=>c.toLowerCase()===String(name).toLowerCase())}
function toggleMagicLearned(name){
    const arr=loadCompletedMagics();const idx=arr.findIndex(c=>c.toLowerCase()===String(name).toLowerCase());
    const canonical=SPECIAL_MAGICS.find(m=>m.toLowerCase()===name.toLowerCase())||name;
    if(idx>=0){arr.splice(idx,1)}else{arr.push(canonical)}
    saveCompletedMagics(arr);renderCompletedMagics();initSpecialMagicSelect();showToast(idx>=0?'ยกเลิก '+canonical:'มีเวทย์ '+canonical+' แล้ว','info')
}
function renderCompletedMagics(){
    const list=document.getElementById('completedMagicList');if(!list)return;
    list.innerHTML='';
    Object.entries(SPECIAL_MAGICS_BY_YEAR).forEach(([year,magics])=>{
        const div=document.createElement('div');div.className='sidebar-magic-year';
        const h4=document.createElement('h4');h4.textContent=year;div.appendChild(h4);
        const ul=document.createElement('ul');ul.className='sidebar-magic-list';
        const learned=magics.filter(m=>isMagicLearned(m)),notLearned=magics.filter(m=>!isMagicLearned(m));
        [...learned,...notLearned].forEach(m=>{
            const li=document.createElement('li');li.textContent=m;li.className=isMagicLearned(m)?'learned':'not-learned';
            li.setAttribute('role','button');li.setAttribute('tabindex','0');li.setAttribute('aria-label','คลิกเพื่อสลับสถานะ '+m);
            li.onclick=()=>toggleMagicLearned(m);li.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleMagicLearned(m)}};
            ul.appendChild(li);
        });
        div.appendChild(ul);list.appendChild(div);
    });
}
function removeRegistration(index){
    const regs=loadRegistrations();
    const reg=regs[index];
    if(!reg)return;
    if(!confirm('ต้องการลบวิชา "'+reg.course+'" ใช่หรือไม่?'))return;
    regs.splice(index,1);saveRegistrations(regs);
    updateCourseSelect();renderRegisteredList();renderRemainingList();renderStats();
    showToast('ลบ '+reg.course+' แล้ว','info');
}

function updateDateDayOptions(){
    const daySelect=document.getElementById('dateDay'),monthSelect=document.getElementById('dateMonth');
    if(!daySelect||!monthSelect)return;
    const month=monthSelect.value,year=new Date().getFullYear(),currentDay=daySelect.value;
    const maxDays=month?getDaysInMonth(month,year):31;
    daySelect.innerHTML='';
    const opt0=document.createElement('option');opt0.value='';opt0.textContent='วัน';daySelect.appendChild(opt0);
    for(let d=1;d<=maxDays;d++){const o=document.createElement('option');o.value=String(d);o.textContent=String(d);daySelect.appendChild(o)}
    if(currentDay&&parseInt(currentDay,10)<=maxDays)daySelect.value=currentDay;
    else if(parseInt(currentDay,10)>maxDays)daySelect.value=String(maxDays);
}
function initDateDaySelect(){
    updateDateDayOptions();
    document.getElementById('dateMonth')?.addEventListener('change',updateDateDayOptions);
}
function setDefaultFormValues(){
    const n=new Date();
    const daySelect=document.getElementById('dateDay'),monthSelect=document.getElementById('dateMonth');
    const hourSelect=document.getElementById('timeHour'),minuteSelect=document.getElementById('timeMinute');
    if(monthSelect){monthSelect.value=String(n.getMonth()+1)}
    updateDateDayOptions();
    if(daySelect){daySelect.value=String(n.getDate())}
    if(hourSelect){hourSelect.value='09'}
    if(minuteSelect){minuteSelect.value='00'}
}

function initTimeSelects(){
    const h=document.getElementById('timeHour'),m=document.getElementById('timeMinute');if(!h||!m)return;
    h.innerHTML='<option value="">--</option>';for(let i=0;i<24;i++){const o=document.createElement('option');o.value=String(i).padStart(2,'0');o.textContent=String(i).padStart(2,'0');h.appendChild(o)}
    m.innerHTML='<option value="">--</option>';for(let i=0;i<60;i+=5){const o=document.createElement('option');o.value=String(i).padStart(2,'0');o.textContent=String(i).padStart(2,'0');m.appendChild(o)}
}

document.getElementById('registrationForm').onsubmit=e=>{
    e.preventDefault();
    const course=document.getElementById('course').value,day=document.getElementById('dateDay').value,month=document.getElementById('dateMonth').value;
    const hour=document.getElementById('timeHour').value,minute=document.getElementById('timeMinute').value,time=hour&&minute?hour+':'+minute:'';
    const date=buildDateFromDayMonth(day,month);
    if(!course||!time){showToast('กรุณากรอกข้อมูลให้ครบถ้วน','error');return}
    if(course==='คลาสพิเศษ'&&!document.getElementById('specialClassName')?.value?.trim()){showToast('กรุณาพิมพ์ชื่อคลาส','error');return}
    if(course==='เวทย์พิเศษ'&&!document.getElementById('specialMagicName')?.value?.trim()){showToast('กรุณาเลือกเวทย์ที่จะไปเรียน','error');return}
    if(!date){showToast('วันที่ไม่ถูกต้อง (เช่น ก.พ. มีได้แค่ 28 หรือ 29 วัน)','error');return}
    addRegistration(course,date,time);
    document.getElementById('course').value='';
    document.getElementById('specialMagicName').value='';
    document.getElementById('specialClassName').value='';
    document.getElementById('specialMagicGroup').style.display='none';
    document.getElementById('specialClassGroup').style.display='none';
    setDefaultFormValues();
};

document.getElementById('btnClearCalendar')?.addEventListener('click',clearCalendar);
function initSpecialMagicSelect(){
    const sel=document.getElementById('specialMagicName');if(!sel)return;
    const currentVal=sel.value;
    sel.innerHTML='<option value="">-- เลือกเวทย์พิเศษ --</option>';
    SPECIAL_MAGICS.filter(m=>!isMagicLearned(m)).forEach(m=>{const o=document.createElement('option');o.value=m;o.textContent=m;sel.appendChild(o)});
    if(currentVal&&!isMagicLearned(currentVal))sel.value=currentVal;
}
document.getElementById('course').addEventListener('change',function(){
    const g=document.getElementById('specialMagicGroup'),gc=document.getElementById('specialClassGroup');
    if(g)g.style.display=this.value==='เวทย์พิเศษ'?'block':'none';
    if(this.value==='เวทย์พิเศษ')initSpecialMagicSelect();
    if(gc)gc.style.display=this.value==='คลาสพิเศษ'?'block':'none';
});
initDateDaySelect();initTimeSelects();initSpecialMagicSelect();setDefaultFormValues();updateCourseSelect();renderRegisteredList();renderRemainingList();renderStats();renderCompletedMagics();

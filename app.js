// app.js - محرك الولوج وإدارة لوحة موظفي ومسؤولي KW STORE لعام 2026
function get(k, def) { 
    var val = localStorage.getItem(k); 
    if (!val) return def; 
    try { return JSON.parse(val); } catch(e) { return def; } 
}

function set(k, v) { 
    localStorage.setItem(k, JSON.stringify(v)); 
}

// دالة فحص وتدقيق بيانات الواجهة الأولى (المعرف والباسورد) للولوج
function handleStaffAuth(e) {
    e.preventDefault();
    
    var typedIdentity = document.getElementById("authIdentity").value.trim();
    var typedPassword = document.getElementById("authPassword").value;
    
    // 1. فحص جدار حماية المدير العام المباشر والصلب من الأكواد لعام 2026
    if ((typedIdentity === "100" || typedIdentity === "Youssef Developer") && 
        (typedPassword === "admin2026" || typedPassword === "youssef2026" || typedPassword === "youssef2025")) {
        
        localStorage.setItem("kw_isAdmin", "true");
        localStorage.setItem("kw_my_id", "100");
        localStorage.setItem("kw_my_name", "Youssef Developer");
        
        unlockDashboard("Youssef Developer (مدير العام)");
        return;
    }
    
    // 2. فحص بقية الرتب المتوفرة بالنظام والمخزنة بالـ LocalStorage المشترك
    var roles = get("kw_roles_v3", [
        { id: 1, name: "مدير العام", password: "admin2026" },
        { id: 2, name: "مسؤول شكاوى", password: "shakwa2026" },
        { id: 3, name: "دعم فني مستوى 1", password: "tech2026" }
    ]);
    
    var matchedRole = roles.find(function(r) { return r.password === typedPassword; });
    
    if (matchedRole) {
        var emps = get("kw_employees", []);
        var currentEmp = emps.find(function(emp) { 
            return emp.id.toString() === typedIdentity || emp.name === typedIdentity; 
        });
        
        var displayName = currentEmp ? currentEmp.name : typedIdentity;
        localStorage.setItem("kw_isAdmin", "false");
        
        unlockDashboard(displayName + " (" + matchedRole.name + ")");
    } else { 
        alert("خطأ: المعرف الشخصي أو كلمة المرور الخاصة بالرتبة غير صحيحة!"); 
    } 
}
// دالة إخفاء شاشة القفل وفتح لوحة الإدارة والتحكم الداخلية فوراً
function unlockDashboard(userTitle) {
    document.getElementById("lockScreenView").style.display = "none";
    document.getElementById("dashboardView").style.display = "block";
    document.getElementById("logoutBtn").style.display = "inline-block";
    document.getElementById("headerUserTitle").innerText = "👤 الموظف: " + userTitle;
    
    renderAll();
}

function logoutStaff() {
    localStorage.removeItem("kw_isAdmin");
    alert("تم تسجيل الخروج والعودة لشاشة القفل.");
    location.reload();
}

// دالة التعديل الفوري لبيانات دليل معرفات الزوار وحل مشكلة علامات التنصيص بالمتصفح
function editUserIdentity(oldId) {
    var dir = get("kw_visitors_directory", []);
    var userIndex = dir.findIndex(function(u) { return u.id.toString() === oldId.toString(); });
    if (userIndex === -1) { alert("المستخدم غير موجود!"); return; }

    var newName = prompt("أدخل الاسم الجديد هنا لتحديث الهوية:", dir[userIndex].name);
    var newId = prompt("أدخل المعرف (ID) الجديد هنا لتحديث الهوية:", dir[userIndex].id);

    if (!newName || !newName.trim() || !newId || !newId.trim()) { alert("عذراً، البيانات المدخلة غير صالحة!"); return; }
    
    var idExists = dir.find(function(u) { return u.id.toString() === newId.trim() && u.id.toString() !== oldId.toString(); });
    if (idExists) { alert("خطأ: هذا المعرف (ID) مستخدم بالفعل لشخص آخر!"); return; }

    // تحديث الهوية
    dir[userIndex].name = newName.trim();
    dir[userIndex].id = newId.trim();
    set("kw_visitors_directory", dir);
    
    alert("ممتاز! تم تعديل وتحديث بيانات المعرف بنجاح تام.");
    
    // إعادة رندر ودفع البيانات حية للواجهة فوراً بعد التعديل
    document.getElementById("usersDirectoryList").style.display = "none";
    toggleUsersDirectory();
}
function toggleUsersDirectory() { 
    var div = document.getElementById("usersDirectoryList"); 
    if (!div) return;
    if (div.style.display === "none" || div.style.display === "") { 
        div.style.display = "block"; div.innerHTML = ""; 
        var dir = get("kw_visitors_directory", []); 
        if (dir.length === 0) {
            div.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">دليل الزوار فارغ حالياً.</div>';
            return;
        }
        dir.forEach(function(u) {
            div.innerHTML += '<div class="data-item"><span>👤 ' + u.name + ' <strong style="color:var(--primary); margin-right:5px;">(ID: ' + u.id + ')</strong></span>' +
                '📝 تعديل الهوية</button></div>';
        });
    } else { div.style.display = "none"; } 
}

function addNewRole() { 
    var name = document.getElementById("roleInput").value.trim(); 
    if (!name) return; 
    var r = get("kw_roles_v3", []); 
    r.push({ id: "role_" + Date.now(), name: name, password: "pass" + Date.now().toString().slice(-4) }); 
    set("kw_roles_v3", r); 
    document.getElementById("roleInput").value = ""; 
    renderAll(); 
}
function renderAll() { 
    var rList = document.getElementById("rolesList"); var sel = document.getElementById("empRoleSelect"); var eList = document.getElementById("empList"); var compList = document.getElementById("adminComplaintsList"); 
    
    if (rList) { 
        rList.innerHTML = ""; var roles = get("kw_roles_v3", []); 
        roles.forEach(function(role) {
            rList.innerHTML += '<div class="data-item"><span>رتبة: <strong style="color:var(--primary)">' + role.name + '</strong></span><span>🔑 باسورد الدخول: <strong style="color:#cd9b32">' + role.password + '</strong></span></div>';
        });
    } 
    if (sel) { sel.innerHTML = '<option value="مدير العام">مدير العام</option>'; var r = get("kw_roles_v3", []); r.forEach(function(role) { sel.innerHTML += '<option value="' + role.name + '">' + r.name + '</option>'; }); } 
    if (eList) { eList.innerHTML = ""; var emps = get("kw_employees", []); emps.forEach(function(emp) { eList.innerHTML += '<div class="data-item"><span>👤 ' + emp.name + ' (ID: ' + emp.id + ')</span><span>الرتبة المعينة: <strong style="color:var(--primary)">' + emp.role + '</strong></span></div>'; }); } 
    if (compList) { compList.innerHTML = ""; var complaints = get("kw_complaints_v1", []); if (complaints.length === 0) { compList.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">لا توجد شكاوى مستلمة حالياً من موقع العملاء.</div>'; } else { complaints.forEach(function(c) { compList.innerHTML += '<div style="background:#122218; border:1px solid var(--border-color); padding:12px; margin-bottom:8px; border-radius:4px;"><div style="display:flex; justify-content:space-between; font-size:12px; color:var(--primary);"><span>👤 المرسل: ' + c.senderName + '</span><span>📅 ' + c.date + '</span></div><div style="color:#fff; margin-top:5px; font-size:14px;">📝 نص الشكوى: ' + c.message + '</div></div>'; }); } } 
}

function assignEmployee() { 
    var id = document.getElementById("empIdInput").value.trim(); 
    var role = document.getElementById("empRoleSelect").value; 
    if (!id) return; 
    var dir = get("kw_visitors_directory", []); 
    var user = dir.find(function(u) { return u.id.toString() === id.toString(); }); 
    if (!user) { alert("خطأ: هذا المعرف غير مسجل بدليل الزوار!"); return; } 
    var emps = get("kw_employees", []); var exist = emps.find(function(e) { return e.id.toString() === id.toString(); }); 
    if (exist) { exist.role = role; } else { emps.push({ id: id, name: user.name, role: role }); } 
    set("kw_employees", emps); document.getElementById("empIdInput").value = ""; renderAll(); alert("تم تفعيل قرار تعيين الموظف بنجاح."); 
}

// تحميل وتهيئة الرتب الافتراضية عند أول فتح لبوابة الموقع
document.addEventListener("DOMContentLoaded", function() { 
    if (!localStorage.getItem("kw_roles_v3")) { 
        set("kw_roles_v3", [ 
            { id: 1, name: "مدير العام", password: "admin2026" }, 
            { id: 2, name: "مسؤول شكاوى", password: "shakwa2026" }, 
            { id: 3, name: "دعم فني مستوى 1", password: "tech2026" } 
        ]); 
    } 
    if (!localStorage.getItem("kw_employees")) { set("kw_employees", [{ id: "100", name: "Youssef Developer", role: "مدير العام" }]); } 
});

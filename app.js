// app.js - محرك الرتب والتحقق الفوري لـ KW STORE ديسكورد ستايل
var selectedRoleId = null; // لحفظ الرتبة المفتوحة حالياً بلوحة ديسكورد

function get(k, def) { 
    var val = localStorage.getItem(k); 
    if (!val) return def; 
    try { return JSON.parse(val); } catch(e) { return def; } 
}

function set(k, v) { 
    localStorage.setItem(k, JSON.stringify(v)); 
}

// دالة فحص وتدقيق السهم والـ ID والباسورد
function handleStaffAuth(e) {
    e.preventDefault();
    
    var selectedRole = document.getElementById("loginRoleSelect").value;
    var typedIdentity = document.getElementById("authIdentity").value.trim();
    var typedPassword = document.getElementById("authPassword").value;
    
    // 1. فحص حماية المالك الأصلي والمدير العام الصلب لعام 2026
    if (selectedRole === "مدير العام" && (typedIdentity === "100" || typedIdentity === "Youssef Developer") && 
        (typedPassword === "admin2026" || typedPassword === "youssef2026")) {
        
        localStorage.setItem("kw_isAdmin", "true");
        localStorage.setItem("kw_my_id", "100");
        localStorage.setItem("kw_my_name", "Youssef Developer");
        
        unlockDashboard("Youssef Developer (مدير العام)");
        return;
    }
    
    // 2. فحص بقية الموظفين عبر الرتب والـ LocalStorage
    var roles = get("kw_roles_v3", []);
    var matchedRole = roles.find(function(r) { return r.name === selectedRole && r.password === typedPassword; });
    
    if (matchedRole) {
        var dir = get("kw_visitors_directory", []);
        var userExists = dir.find(function(u) { return u.id.toString() === typedIdentity; });
        
        var displayName = userExists ? userExists.name : "موظف معتمد";
        localStorage.setItem("kw_isAdmin", "false");
        localStorage.setItem("kw_my_id", typedIdentity);
        localStorage.setItem("kw_my_name", displayName);
        
        unlockDashboard(displayName + " (" + matchedRole.name + ")");
    } else { 
        alert("خطأ: كلمة المرور غير صحيحة للرتبة المحددة بسهم الخيارات!"); 
    } 
}

function unlockDashboard(userTitle) {
    document.getElementById("lockScreenView").style.display = "none";
    document.getElementById("dashboardView").style.display = "block";
    document.getElementById("logoutBtn").style.display = "inline-block";
    document.getElementById("headerUserTitle").innerText = "👤 الموظف: " + userTitle;
    
    renderAll();
    loadDiscordRolesSidebar();
}

function logoutStaff() {
    localStorage.removeItem("kw_isAdmin");
    alert("تم تسجيل الخروج.");
    location.reload();
}
// دالة بناء شريط الرتب الجانبي ديسكورد ستايل
function loadDiscordRolesSidebar() {
    var sidebar = document.getElementById("discordRolesSidebar");
    if (!sidebar) return;
    sidebar.innerHTML = "";
    
    var roles = get("kw_roles_v3", []);
    roles.forEach(function(role) {
        var isActive = selectedRoleId === role.id ? "active" : "";
        var dotColor = role.name === "مدير العام" ? "#e74c3c" : "#2ecc71"; // لون مميز للمدير
        
        sidebar.innerHTML += '<div class="discord-role-item ' + isActive + '" onclick="selectDiscordRole(\'' + role.id + '\')">' +
            '<span><span class="discord-role-color-dot" style="background:' + dotColor + '"></span>' + role.name + '</span>' +
            (role.name !== "مدير العام" ? '<span onclick="deleteRole(\'' + role.id + '\', event)" style="color:var(--danger); cursor:pointer; font-weight:bold; margin-right:5px;">×</span>' : '') +
            '</div>';
    });
}

// دالة فتح صلاحيات الرتبة المحددة وعرض حالتها (مفعلة / مغلقة)
function selectDiscordRole(roleId) {
    selectedRoleId = roleId;
    loadDiscordRolesSidebar();
    
    var roles = get("kw_roles_v3", []);
    var role = roles.find(function(r) { return r.id.toString() === roleId.toString(); });
    if (!role) return;
    
    document.getElementById("discordRolesMain").style.display = "block";
    document.getElementById("selectedRoleName").innerText = "🛡 رتبة: " + role.name;
    document.getElementById("selectedRolePass").innerText = "🔑 الباسورد الحالي: " + role.password;
    
    // شحن واجهة أزرار ديسكورد بالصلاحيات الحالية للرتبة
    document.getElementById("perm_viewComplaints").checked = role.permissions?.viewComplaints || false;
    document.getElementById("perm_editPrices").checked = role.permissions?.editPrices || false;
    document.getElementById("perm_fireAssign").checked = role.permissions?.fireAssign || false;
    document.getElementById("perm_manageDirectory").checked = role.permissions?.manageDirectory || false;
}

// تحديث وحفظ الصلاحيات فور تغيير المفتاح (On/Off) مثل ديسكورد تماماً
function updateSelectedRolePerm(permName, isChecked) {
    if (!selectedRoleId) return;
    var roles = get("kw_roles_v3", []);
    var role = roles.find(function(r) { return r.id.toString() === selectedRoleId.toString(); });
    if (role) {
        if (!role.permissions) role.permissions = {};
        role.permissions[permName] = isChecked;
        set("kw_roles_v3", roles);
    }
}

function changeSelectedRolePassword() {
    if (!selectedRoleId) return;
    var roles = get("kw_roles_v3", []);
    var role = roles.find(function(r) { return r.id.toString() === selectedRoleId.toString(); });
    if (role) {
        var newPass = prompt("أدخل كلمة المرور الجديدة لهذه الرتبة:", role.password);
        if (newPass && newPass.trim() !== "") {
            role.password = newPass.trim();
            set("kw_roles_v3", roles);
            selectDiscordRole(selectedRoleId);
        }
    }
}
function addNewRole() {
    var name = document.getElementById("roleInput").value.trim();
    if (!name) return;
    var r = get("kw_roles_v3", []);
    r.push({ 
        id: "role_" + Date.now(), 
        name: name, 
        password: "pass" + Date.now().toString().slice(-4),
        permissions: { viewComplaints: false, editPrices: false, fireAssign: false, manageDirectory: false }
    });
    set("kw_roles_v3", r);
    document.getElementById("roleInput").value = "";
    renderAll();
    loadDiscordRolesSidebar();
}

function deleteRole(roleId, event) {
    event.stopPropagation(); // منع فتح الرتبة عند حذفها
    var roles = get("kw_roles_v3", []);
    roles = roles.filter(function(r) { return r.id.toString() !== roleId.toString(); });
    set("kw_roles_v3", roles);
    document.getElementById("discordRolesMain").style.display = "none";
    renderAll();
    loadDiscordRolesSidebar();
}

function editUserIdentity(oldId) {
    var dir = get("kw_visitors_directory", []);
    var userIndex = dir.findIndex(function(u) { return u.id.toString() === oldId.toString(); });
    if (userIndex === -1) { alert("المستخدم غير موجود!"); return; }

    var newName = prompt("أدخل الاسم الجديد:", dir[userIndex].name);
    var newId = prompt("أدخل المعرف (ID) الجديد:", dir[userIndex].id);

    if (!newName || !newName.trim() || !newId || !newId.trim()) { alert("بيانات غير صالحة!"); return; }
    
    dir[userIndex].name = newName.trim(); dir[userIndex].id = newId.trim();
    set("kw_visitors_directory", dir);
    alert("تم التعديل بنجاح.");
    document.getElementById("usersDirectoryList").style.display = "none";
    toggleUsersDirectory();
}

function toggleUsersDirectory() { 
    var div = document.getElementById("usersDirectoryList"); 
    if (!div) return;
    if (div.style.display === "none" || div.style.display === "") { 
        div.style.display = "block"; div.innerHTML = ""; 
        var dir = get("kw_visitors_directory", []); 
        dir.forEach(function(u) {
            div.innerHTML += '<div class="data-item"><span>👤 ' + u.name + ' <strong>(ID: ' + u.id + ')</strong></span>' +
                '📝 تعديل</button></div>';
        });
    } else { div.style.display = "none"; } 
}

function renderAll() { 
    var sel = document.getElementById("empRoleSelect"); var eList = document.getElementById("empList"); var compList = document.getElementById("adminComplaintsList"); 
    if (sel) { sel.innerHTML = '<option value="مدير العام">مدير العام</option>'; var r = get("kw_roles_v3", []); r.forEach(function(role) { if (role.name !== "مدير العام") sel.innerHTML += '<option value="' + role.name + '">' + role.name + '</option>'; }); } 
    if (eList) { eList.innerHTML = ""; var emps = get("kw_employees", []); emps.forEach(function(emp) { eList.innerHTML += '<div class="data-item"><span>👤 ' + emp.name + ' (ID: ' + emp.id + ')</span><span>الرتبة: <strong style="color:var(--primary)">' + emp.role + '</strong></span></div>'; }); } 
    if (compList) { compList.innerHTML = ""; var complaints = get("kw_complaints_v1", []); if (complaints.length === 0) { compList.innerHTML = '<div>لا توجد شكاوى مستلمة حالياً.</div>'; } else { complaints.forEach(function(c) { compList.innerHTML += '<div style="background:#122218; padding:12px; margin-bottom:8px; border-radius:4px;"><div style="display:flex; justify-content:space-between; font-size:12px; color:var(--primary);"><span>👤 من: ' + c.senderName + '</span><span>📅 ' + c.date + '</span></div><div style="color:#fff; margin-top:5px;">📝 الشكوى: ' + c.message + '</div></div>'; }); } } 
}

function assignEmployee() { 
    var id = document.getElementById("empIdInput").value.trim(); var role = document.getElementById("empRoleSelect").value; if (!id) return; 
    var dir = get("kw_visitors_directory", []); var user = dir.find(function(u) { return u.id.toString() === id.toString(); }); 
    if (!user) { alert("المعرفة غير مسجل بالدليل!"); return; } 
    var emps = get("kw_employees", []); var exist = emps.find(function(e) { return e.id.toString() === id.toString(); }); 
    if (exist) { exist.role = role; } else { emps.push({ id: id, name: user.name, role: role }); } 
    set("kw_employees", emps); document.getElementById("empIdInput").value = ""; renderAll(); alert("تم التوظيف بنجاح."); 
}

// تعبئة سهم الواجهة الخارجية بالرتب المخزنة فور فتح الموقع
document.addEventListener("DOMContentLoaded", function() { 
    if (!localStorage.getItem("kw_roles_v3")) { 
        set("kw_roles_v3", [ 
            { id: 1, name: "مدير العام", password: "admin2026", permissions: { viewComplaints: true, editPrices: true, fireAssign: true, manageDirectory: true } }, 
            { id: 2, name: "مسؤول شكاوى", password: "shakwa2026", permissions: { viewComplaints: true, editPrices: false, fireAssign: false, manageDirectory: false } }, 
            { id: 3, name: "دعم فني مستوى 1", password: "tech2026", permissions: { viewComplaints: true, editPrices: false, fireAssign: false, manageDirectory: false } } 
        ]); 
    } 
    var select = document.getElementById("loginRoleSelect");
    if (select) {
        select.innerHTML = "";
        var roles = get("kw_roles_v3", []);
        roles.forEach(function(r) { select.innerHTML += '<option value="' + r.name + '">' + r.name + '</option>'; });
    }
    renderAll();
});

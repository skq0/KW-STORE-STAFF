// app.js - الجزء الأول
var selectedRoleId = null;

function get(k, def) { 
    var val = localStorage.getItem(k); 
    if (!val) return def; 
    try { return JSON.parse(val); } catch(e) { return def; } 
}

function set(k, v) { 
    localStorage.setItem(k, JSON.stringify(v)); 
}

// دالة توليد وعرض معرف الزائر الحالي أعلى الصفحة تلقائياً وثباته
function initVisitorIdentity() {
    var myId = localStorage.getItem("kw_my_id");
    var myName = localStorage.getItem("kw_my_name");
    
    if (!myId) {
        myId = Math.floor(Math.random() * (1000 - 100 + 1) + 100).toString();
        myName = "موظف_" + myId;
        localStorage.setItem("kw_my_id", myId);
        localStorage.setItem("kw_my_name", myName);
        
        var dir = get("kw_visitors_directory", []);
        dir.push({ id: myId, name: myName });
        set("kw_visitors_directory", dir);
    }
    
    var titleEl = document.getElementById("headerUserTitle");
    if (titleEl) {
        titleEl.innerText = "👤 معرفك الحالي: " + myId + " | الاسم: " + myName;
    }
}

function handleStaffAuth(e) {
    e.preventDefault();
    
    var selectedRole = document.getElementById("loginRoleSelect").value;
    var typedIdentity = document.getElementById("authIdentity").value.trim();
    var typedPassword = document.getElementById("authPassword").value;
    
    if (selectedRole === "مدير العام" && (typedIdentity === "100" || typedIdentity === localStorage.getItem("kw_my_id")) && 
        (typedPassword === "admin2026" || typedPassword === "youssef2026")) {
        
        localStorage.setItem("kw_isAdmin", "true");
        unlockDashboard("Youssef Developer (مدير العام)");
        return;
    }
    
    var roles = get("kw_roles_v3", []);
    var matchedRole = roles.find(function(r) { return r.name === selectedRole && r.password === typedPassword; });
    
    if (matchedRole) {
        localStorage.setItem("kw_isAdmin", "false");
        unlockDashboard(localStorage.getItem("kw_my_name") + " (" + matchedRole.name + ")");
    } else { 
        alert("خطأ: كلمة المرور أو المعرف غير صحيحة للرتبة المحددة!"); 
    } 
}

function unlockDashboard(userTitle) {
    document.getElementById("lockScreenView").style.display = "none";
    document.getElementById("dashboardView").style.display = "block";
    document.getElementById("logoutBtn").style.display = "inline-block";
    document.getElementById("headerUserTitle").innerText = "⚙ الموظف النشط: " + userTitle;
    
    renderAll();
    loadDiscordRolesSidebar();
}

function logoutStaff() {
    localStorage.removeItem("kw_isAdmin");
    location.reload();
}
// app.js - الجزء الثاني
function loadDiscordRolesSidebar() {
    var sidebar = document.getElementById("discordRolesSidebar");
    if (!sidebar) return;
    sidebar.innerHTML = "";
    var roles = get("kw_roles_v3", []);
    roles.forEach(function(role) {
        var isActive = selectedRoleId === role.id ? "active" : "";
        sidebar.innerHTML += '<div class="discord-role-item ' + isActive + '" onclick="selectDiscordRole(\'' + role.id + '\')">' +
            '<span><span class="discord-role-color-dot" style="background:#2ecc71"></span>' + role.name + '</span></div>';
    });
}

function selectDiscordRole(roleId) {
    selectedRoleId = roleId;
    loadDiscordRolesSidebar();
    var roles = get("kw_roles_v3", []);
    var role = roles.find(function(r) { return r.id.toString() === roleId.toString(); });
    if (!role) return;
    
    document.getElementById("discordRolesMain").style.display = "block";
    document.getElementById("selectedRoleName").innerText = "🛡 رتبة: " + role.name;
    document.getElementById("selectedRolePass").innerText = "🔑 الباسورد: " + role.password;
    
    document.getElementById("perm_viewComplaints").checked = role.permissions?.viewComplaints || false;
    document.getElementById("perm_editPrices").checked = role.permissions?.editPrices || false;
    document.getElementById("perm_fireAssign").checked = role.permissions?.fireAssign || false;
}

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
        var newPass = prompt("أدخل الباسورد الجديد للرتبة:", role.password);
        if (newPass && newPass.trim() !== "") {
            role.password = newPass.trim();
            set("kw_roles_v3", roles);
            selectDiscordRole(selectedRoleId);
        }
    }
}
// app.js - الجزء الثالث والأخير
function addNewRole() {
    var name = document.getElementById("roleInput").value.trim();
    if (!name) return;
    var r = get("kw_roles_v3", []);
    r.push({ id: "role_" + Date.now(), name: name, password: "pass" + Date.now().toString().slice(-4), permissions: { viewComplaints: false, editPrices: false, fireAssign: false } });
    set("kw_roles_v3", r);
    document.getElementById("roleInput").value = "";
    renderAll();
    loadDiscordRolesSidebar();
}

function editUserIdentity(oldId) {
    var dir = get("kw_visitors_directory", []);
    var idx = dir.findIndex(function(u) { return u.id.toString() === oldId.toString(); });
    if (idx === -1) return;
    var newName = prompt("الاسم الجديد لشحن الهوية:", dir[idx].name);
    var newId = prompt("ID الجديد لشحن الهوية:", dir[idx].id);
    if (newName && newId) {
        dir[idx].name = newName; dir[idx].id = newId;
        set("kw_visitors_directory", dir);
        document.getElementById("usersDirectoryList").style.display = "none";
        toggleUsersDirectory();
    }
}

function toggleUsersDirectory() {
    var div = document.getElementById("usersDirectoryList");
    if (!div) return;
    if (div.style.display === "none" || div.style.display === "") {
        div.style.display = "block"; div.innerHTML = "";
        var dir = get("kw_visitors_directory", []);
        dir.forEach(function(u) {
            div.innerHTML += '<div class="data-item"><span>👤 ' + u.name + ' (ID: ' + u.id + ')</span>' +
                '📝 تعديل</button></div>';
        });
    } else { div.style.display = "none"; }
}

function renderAll() {
    var sel = document.getElementById("empRoleSelect");
    var eList = document.getElementById("empList");
    var compList = document.getElementById("adminComplaintsList");
    if (sel) {
        sel.innerHTML = '<option value="مدير العام">مدير العام</option>';
        var r = get("kw_roles_v3", []);
        r.forEach(function(role) { if (role.name !== "مدير العام") sel.innerHTML += '<option value="' + role.name + '">' + role.name + '</option>'; });
    }
    if (eList) { eList.innerHTML = ""; var emps = get("kw_employees", []); emps.forEach(function(e) { eList.innerHTML += '<div class="data-item"><span>👤 ' + e.name + ' (ID: ' + e.id + ')</span><span>الرتبة: ' + e.role + '</span></div>'; }); }
    if (compList) { compList.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">لا توجد شكاوى حالياً.</div>'; }
}

function assignEmployee() {
    var id = document.getElementById("empIdInput").value.trim();
    var role = document.getElementById("empRoleSelect").value;
    if (!id) return;
    var dir = get("kw_visitors_directory", []);
    var user = dir.find(function(u) { return u.id.toString() === id.toString(); });
    if (!user) { alert("المعرف غير مسجل!"); return; }
    var emps = get("kw_employees", []);
    var exist = emps.find(function(e) { return e.id.toString() === id.toString(); });
    if (exist) { exist.role = role; } else { emps.push({ id: id, name: user.name, role: role }); }
    set("kw_employees", emps);
    document.getElementById("empIdInput").value = "";
    renderAll(); alert("تم التوظيف بنجاح.");
}

document.addEventListener("DOMContentLoaded", function() {
    initVisitorIdentity();
    if (!localStorage.getItem("kw_roles_v3")) {
        set("kw_roles_v3", [
            { id: 1, name: "مدير العام", password: "admin2026", permissions: { viewComplaints: true, editPrices: true, fireAssign: true } },
            { id: 2, name: "مسؤول شكاوى", password: "shakwa2026", permissions: { viewComplaints: true, editPrices: false, fireAssign: false } },
            { id: 3, name: "دعم فني مستوى 1", password: "tech2026", permissions: { viewComplaints: true, editPrices: false, fireAssign: false } }
        ]);
    }
    if (!localStorage.getItem("kw_employees")) { set("kw_employees", [{ id: "100", name: "Youssef Developer", role: "مدير العام" }]); }
    
    var select = document.getElementById("loginRoleSelect");
    if (select) {
        select.innerHTML = "";
        var roles = get("kw_roles_v3", []);
        roles.forEach(function(r) { select.innerHTML += '<option value="' + r.name + '">' + r.name + '</option>'; });
    }
    renderAll();
});

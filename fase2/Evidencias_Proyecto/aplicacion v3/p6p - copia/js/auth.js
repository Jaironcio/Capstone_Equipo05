// ==================== SISTEMA DE AUTENTICACIÓN ====================
// Al inicio del archivo, después de la definición de users
const permissions = {
    'Director': { 
        canEdit: true, 
        canDelete: true, 
        canViewCargos: true, 
        canViewSanciones: true, 
        canViewFinanzas: true, 
        canEditFinanzas: true 
    },
    'Secretario': { 
        canEdit: true, 
        canDelete: true, 
        canViewCargos: true, 
        canViewSanciones: true, 
        canViewFinanzas: true, 
        canEditFinanzas: false 
    },
    'Capitán': { 
        canEdit: true, 
        canDelete: false, 
        canViewCargos: true, 
        canViewSanciones: true, 
        canViewFinanzas: true, 
        canEditFinanzas: false 
    },
    'Tesorero': { 
        canEdit: false, 
        canDelete: false, 
        canViewCargos: false, 
        canViewSanciones: false, 
        canViewFinanzas: true, 
        canEditFinanzas: true 
    },
    'Ayudante': { 
        canEdit: true, 
        canDelete: false, 
        canViewCargos: true, 
        canViewSanciones: false, 
        canViewFinanzas: false, 
        canEditFinanzas: false 
    },
    'Super Administrador': { 
        canEdit: true, 
        canDelete: true, 
        canViewCargos: true, 
        canViewSanciones: true, 
        canViewFinanzas: true, 
        canEditFinanzas: true 
    }
};

// Función para obtener permisos del usuario actual
function getUserPermissions() {
    if (!currentUser) return null;
    return permissions[currentUser.role] || null;
}
const users = {
    'director': { password: 'dir2024', role: 'Director' },
    'secretario': { password: 'sec2024', role: 'Secretario' },
    'tesorero': { password: 'tes2024', role: 'Tesorero' },
    'capitan': { password: 'cap2024', role: 'Capitán' },
    'ayudante': { password: 'ayu2024', role: 'Ayudante' },
    'superadmin': { password: 'admin2024', role: 'Super Administrador' }
};

let currentUser = null;

// Crear partículas de fondo
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Verificar autenticación
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        return true;
    }
    return false;
}

// Redirigir si no está autenticado
function requireAuth() {
    if (!checkAuth()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Manejar login
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    // Limpiar mensajes
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
    
    // Estado de carga
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'VALIDANDO...';
    
    setTimeout(() => {
        if (users[username] && users[username].password === password) {
            currentUser = { 
                username: username, 
                role: users[username].role,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            successMessage.textContent = `¡Bienvenido, ${users[username].role}!`;
            successMessage.classList.add('show');
            
            setTimeout(() => {
                window.location.href = 'sistema.html';
            }, 1500);
        } else {
            errorMessage.textContent = 'Usuario o contraseña incorrectos';
            errorMessage.classList.add('show');
            
            document.querySelector('.login-container').style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                document.querySelector('.login-container').style.animation = '';
            }, 500);
        }
        
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'INICIAR SESIÓN';
    }, 1500);
}

// Logout
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.location.href = 'index.html';
}

// Inicializar auth
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('loginForm')) {
        createParticles();
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }
    
    // Console info
    console.log('=== SISTEMA DE LOGIN ===');
    console.log('Usuarios disponibles:');
    Object.keys(users).forEach(username => {
        console.log(`👤 ${username} | 🔑 ${users[username].password} | 🎭 ${users[username].role}`);
    });
});
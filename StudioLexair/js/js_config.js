/**
 * =====================================================
 * 🎮 STUDIO LEXAIR - CONFIGURATION
 * Configuración centralizada de proyectos Supabase
 * by Airien Yolexis Rojas Roque
 * =====================================================
 */

const AppConfig = {
    // Proyectos de usuarios (Round-Robin)
    userProjects: [
        {
            id: 1,
            name: 'Proyecto Usuario 1',
            url: 'https://evxvyarlmkhecwzbdqdb.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2eHZ5YXJsbWtoZWN3emJkcWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjU1MjIsImV4cCI6MjA3NzQwMTUyMn0.LKLgGIg6qxn48kvVJecjD7tcgS4prm_3Yk0-VjYy13U',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        },
        {
            id: 2,
            name: 'Proyecto Usuario 2',
            url: 'https://qzajijyrgfzvlbnkpkhk.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6YWppanlyZ2Z6dmxibmtwa2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjU0NjgsImV4cCI6MjA3NzQwMTQ2OH0.rcG1KbiSplu3Qhu2_CsVmxE4u0Ezw2KijZFKfYUezR0',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        },
        {
            id: 3,
            name: 'Proyecto Usuario 3',
            url: 'https://qnlbmfbtcziqzxmhzuah.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubGJtZmJ0Y3ppcXp4bWh6dWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzUzODAsImV4cCI6MjA3NzYxMTM4MH0.WuK1zZTSy5dhEM3Cw0QsU6eATqjDxBIuBBX9_oVWi-E',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        },
        {
            id: 4,
            name: 'Proyecto Usuario 4',
            url: 'https://qbkgpahjodefgknutudg.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFia2dwYWhqb2RlZmdrbnV0dWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1OTkzMjAsImV4cCI6MjA3NzE3NTMyMH0.TLb2Y0atpnV7zvLV5wHy_VLC-vRt8atTFvD4ssWi9jA',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        }
    ],
    
    // Proyecto de juegos (catalogo)
    gamesProject: {
        url: 'https://ukocadtkdpzfpjvgsxcr.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrb2NhZHRrZHB6ZnBqdmdzeGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjYyMTcsImV4cCI6MjA3NzQwMjIxN30.x0Z9RcdnDA5mc0dlW_xVtlWaWdJnntFmGDJq_pILL9Y'
    },
    
    // Proyecto de compras (user_games)
    purchasesProject: {
        url: 'https://xlknicysulvwoohvxodr.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsa25pY3lzdWx2d29vaHZ4b2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjY0MzIsImV4cCI6MjA3NzQwMjQzMn0.busO2SnOE72GhzrO4DBMHbt-KesCfylp5k2BdtmX2Zs'
    },
    
    // Límites y capacidades
    maxUsersPerProject: 100000,
    warningThreshold: 80000,
    criticalThreshold: 95000,
    
    // Round-Robin index
    currentProjectIndex: 0,
    
    // Clientes Supabase
    clients: {
        games: null,
        purchases: null
    }
};

/**
 * Inicializar todos los clientes de Supabase
 */
function initializeSupabaseClients() {
    console.log('🔧 Inicializando clientes Supabase...');
    
    // Inicializar proyectos de usuarios
    AppConfig.userProjects.forEach(project => {
        project.client = supabase.createClient(project.url, project.key);
        console.log(`✅ Cliente inicializado: ${project.name}`);
    });
    
    // Inicializar proyecto de juegos
    AppConfig.clients.games = supabase.createClient(
        AppConfig.gamesProject.url, 
        AppConfig.gamesProject.key
    );
    console.log('✅ Cliente de Juegos inicializado');
    
    // Inicializar proyecto de compras
    AppConfig.clients.purchases = supabase.createClient(
        AppConfig.purchasesProject.url, 
        AppConfig.purchasesProject.key
    );
    console.log('✅ Cliente de Compras inicializado');
    
    // Cargar índice de rotación desde localStorage
    const savedIndex = localStorage.getItem('projectRotationIndex');
    if (savedIndex) {
        AppConfig.currentProjectIndex = parseInt(savedIndex);
    }
    
    console.log('🎮 Todos los clientes Supabase listos!');
}

/**
 * Obtener el siguiente proyecto disponible (Round-Robin)
 */
function getNextAvailableProject() {
    const startIndex = AppConfig.currentProjectIndex;
    let attempts = 0;
    
    while (attempts < AppConfig.userProjects.length) {
        const project = AppConfig.userProjects[AppConfig.currentProjectIndex];
        
        // Verificar si el proyecto tiene espacio
        if (project.isHealthy && project.userCount < AppConfig.maxUsersPerProject) {
            const selected = project;
            
            // Mover al siguiente proyecto para el próximo registro
            AppConfig.currentProjectIndex = (AppConfig.currentProjectIndex + 1) % AppConfig.userProjects.length;
            localStorage.setItem('projectRotationIndex', AppConfig.currentProjectIndex);
            
            console.log(`🎯 Proyecto seleccionado: ${selected.name} (${selected.userCount} usuarios)`);
            return selected;
        }
        
        // Probar siguiente proyecto
        AppConfig.currentProjectIndex = (AppConfig.currentProjectIndex + 1) % AppConfig.userProjects.length;
        attempts++;
    }
    
    console.error('❌ Todos los proyectos están llenos');
    return null;
}

/**
 * Verificar capacidad de todos los proyectos
 */
async function checkAllProjectsCapacity() {
    console.log('📊 Verificando capacidad de proyectos...');
    
    const checks = AppConfig.userProjects.map(project => 
        checkProjectCapacity(project)
    );
    
    await Promise.all(checks);
    
    // Calcular estadísticas globales
    const totalUsers = AppConfig.userProjects.reduce((sum, p) => sum + p.userCount, 0);
    const totalCapacity = AppConfig.userProjects.length * AppConfig.maxUsersPerProject;
    const usagePercent = (totalUsers / totalCapacity) * 100;
    
    const stats = {
        totalUsers,
        totalCapacity,
        usagePercent,
        availableSlots: totalCapacity - totalUsers,
        status: getSystemStatus(usagePercent)
    };
    
    console.log(`📊 Usuarios totales: ${totalUsers.toLocaleString()} / ${totalCapacity.toLocaleString()} (${usagePercent.toFixed(2)}%)`);
    
    return stats;
}

/**
 * Verificar capacidad de un proyecto específico
 */
async function checkProjectCapacity(project) {
    try {
        const { count, error } = await project.client
            .from('user_profiles')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        
        project.userCount = count || 0;
        project.isHealthy = count < AppConfig.maxUsersPerProject;
        project.lastChecked = new Date();
        
        return project;
    } catch (error) {
        console.error(`❌ Error verificando ${project.name}:`, error);
        project.isHealthy = false;
        return project;
    }
}

/**
 * Obtener estado del sistema
 */
function getSystemStatus(usagePercent) {
    if (usagePercent < 80) {
        return {
            level: 'open',
            color: 'green',
            message: 'Registro abierto',
            icon: '🟢'
        };
    } else if (usagePercent < 95) {
        return {
            level: 'warning',
            color: 'yellow',
            message: 'Plazas limitadas disponibles',
            icon: '🟡'
        };
    } else {
        return {
            level: 'full',
            color: 'red',
            message: 'Registro cerrado temporalmente',
            icon: '🔴'
        };
    }
}

// Exportar funciones para uso global
window.AppConfig = AppConfig;
window.initializeSupabaseClients = initializeSupabaseClients;
window.getNextAvailableProject = getNextAvailableProject;
window.checkAllProjectsCapacity = checkAllProjectsCapacity;
window.checkProjectCapacity = checkProjectCapacity;
window.getSystemStatus = getSystemStatus;

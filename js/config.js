/**
 * =====================================================
 * 🎮 STUDIO LEXAIR - CONFIGURATION
 * Configuración centralizada de proyectos Supabase
 * by Airien Yolexis Rojas Roque
 * =====================================================
 */

const AppConfig = {
    // Proyectos de usuarios (Round-Robin / Sharding 1..12)
    // Cada proyecto tiene: auth.users, user_profiles, wallets, games,
    // user_games, eventos, misiones, recompensas, logros, etc.
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
            url: 'https://qbkgpahjodefgknutudg.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFia2dwYWhqb2RlZmdrbnV0dWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1OTkzMjAsImV4cCI6MjA3NzE3NTMyMH0.TLb2Y0atpnV7zvLV5wHy_VLC-vRt8atTFvD4ssWi9jA',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        },
        {
            id: 4,
            name: 'Proyecto Usuario 4',
            url: 'https://qnlbmfbtcziqzxmhzuah.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubGJtZmJ0Y3ppcXp4bWh6dWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzUzODAsImV4cCI6MjA3NzYxMTM4MH0.WuK1zZTSy5dhEM3Cw0QsU6eATqjDxBIuBBX9_oVWi-E',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        },
        {
            id: 5,
            name: 'Proyecto Usuario 5',
            url: 'https://xlknicysulvwoohvxodr.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsa25pY3lzdWx2d29vaHZ4b2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjY0MzIsImV4cCI6MjA3NzQwMjQzMn0.busO2SnOE72GhzrO4DBMHbt-KesCfylp5k2BdtmX2Zs',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        },
        {
            id: 6,
            name: 'Proyecto Usuario 6',
            url: 'https://ukocadtkdpzfpjvgsxcr.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrb2NhZHRrZHB6ZnBqdmdzeGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjYyMTcsImV4cCI6MjA3NzQwMjIxN30.x0Z9RcdnDA5mc0dlW_xVtlWaWdJnntFmGDJq_pILL9Y',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        },
        {
            id: 7,
            name: 'Proyecto Usuario 7',
            url: 'https://xblhowenhmtakmjcbkvi.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhibGhvd2VuaG10YWttamNia3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjA0ODQsImV4cCI6MjA3NzM5NjQ4NH0.ayCEkORgUVUzYTfA9gAO0C6b3fxRi2K4i1DGBPKY_cs',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        },
        {
            id: 8,
            name: 'Proyecto Usuario 8',
            url: 'https://aaymwcwelgaculzarqap.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFheW13Y3dlbGdhY3VsemFycWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjgxNDMsImV4cCI6MjA3NzQwNDE0M30.9M-8LGECK5sGLScEgZNGGKRmuAnBTiX29AEOChKRL7s',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        },
        {
            id: 9,
            name: 'Proyecto Usuario 9',
            url: 'https://ghxmmtxtzudtxybxuxqi.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoeG1tdHh0enVkdHh5Ynh1eHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MTgzMjQsImV4cCI6MjA3NzM5NDMyNH0.v_PCg5chX3SAAGLmpGmoLaFKLxbhD5AIYnaP-rtMzkk',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        },
        {
            id: 10,
            name: 'Proyecto Usuario 10',
            url: 'https://fbkctnqyuyccziqohdax.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZia2N0bnF5dXljY3ppcW9oZGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MTgwMTcsImV4cCI6MjA3NzM5NDAxN30.WFpqPC2fnwAEpArCePhvOvJ4K-VKpw1mTv1qPTBrzOY',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        },
        {
            id: 11,
            name: 'Proyecto Usuario 11',
            url: 'https://qxquiylgiylagotdynbo.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4cXVpeWxnaXlsYWdvdGR5bmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MTI2MTIsImV4cCI6MjA3NzM4ODYxMn0.kS-fx7c-GBPaXE0o8j2m7GC2vzK4Rjlek0_FKSXGEw0',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        },
        {
            id: 12,
            name: 'Proyecto Usuario 12',
            url: 'https://omjizhffowntxyboheyl.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taml6aGZmb3dudHh5Ym9oZXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MTE2MTgsImV4cCI6MjA3NzM4NzYxOH0.aX-hqNRJthxs7DwoyGVlFbWFWKsSt3UfayjqnIRPUFc',
            client: null,
            userCount: 0,
            isHealthy: true,
            lastChecked: null
        }
    ],
    
    // Límites y capacidades por proyecto
    maxUsersPerProject: 100000,
    warningThreshold: 80000,
    criticalThreshold: 95000,
    
    // Índice Round-Robin para asignar nuevos registros
    currentProjectIndex: 0
};

/**
 * Inicializar todos los clientes de Supabase para proyectos de usuarios
 */
function initializeSupabaseClients() {
    console.log('🔧 Inicializando clientes Supabase (proyectos de usuarios 1..12)...');
    
    // Inicializar proyectos de usuarios (cada uno tiene: auth, user_profiles, wallets, games, user_games, etc.)
    AppConfig.userProjects.forEach(project => {
        if (!project.url || !project.key) {
            console.warn(`⚠️ Proyecto sin configurar (id=${project.id}): ${project.name}. URL/KEY vacíos, se marcará como no disponible.`);
            project.client = null;
            project.isHealthy = false;
            return;
        }

        try {
            project.client = supabase.createClient(project.url, project.key);
            console.log(`✅ Cliente inicializado: ${project.name}`);
        } catch (e) {
            console.error(`❌ Error inicializando cliente Supabase para ${project.name}:`, e);
            project.client = null;
            project.isHealthy = false;
        }
    });
    
    // Cargar índice de rotación desde localStorage
    const savedIndex = localStorage.getItem('projectRotationIndex');
    if (savedIndex) {
        AppConfig.currentProjectIndex = parseInt(savedIndex);
    }
    
    console.log('🎮 Clientes de usuarios listos!');
}

/**
 * Obtener el siguiente proyecto disponible (Round-Robin)
 */
function getNextAvailableProject() {
    const startIndex = AppConfig.currentProjectIndex;
    let attempts = 0;
    
    while (attempts < AppConfig.userProjects.length) {
        const project = AppConfig.userProjects[AppConfig.currentProjectIndex];
        
        // Verificar si el proyecto está configurado y tiene espacio
        if (project.client && project.isHealthy && project.userCount < AppConfig.maxUsersPerProject) {
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
    
    console.error('❌ Todos los proyectos están llenos o no están configurados correctamente');
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
    const totalUsers = AppConfig.userProjects.reduce((sum, p) => sum + (p.userCount || 0), 0);
    const totalCapacity = AppConfig.userProjects.length * AppConfig.maxUsersPerProject;
    const usagePercent = totalCapacity > 0 ? (totalUsers / totalCapacity) * 100 : 0;
    
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
 *
 * Usamos la función SQL get_project_stats() (incluida en tu script SQL
 * unificado) para evitar problemas de RLS/permisos al contar usuarios.
 */
async function checkProjectCapacity(project) {
    try {
        if (!project.client) {
            project.userCount = 0;
            project.isHealthy = false;
            return project;
        }

        // Llamar a la función de estadísticas del proyecto
        const { data, error } = await project.client.rpc('get_project_stats');

        if (error) {
            throw error;
        }

        let users = 0;
        if (Array.isArray(data) && data.length > 0) {
            // total_users viene como BIGINT (string o number)
            users = parseInt(data[0].total_users, 10) || 0;
        }

        project.userCount = users;
        project.isHealthy = users < AppConfig.maxUsersPerProject;
        project.lastChecked = new Date();

        return project;
    } catch (error) {
        console.error(`❌ Error verificando ${project.name}:`, error);
        project.isHealthy = false;
        project.userCount = 0;
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
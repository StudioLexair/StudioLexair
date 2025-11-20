import json
import os
import webview

LAUNCHER_URL = "https://studiolexair.servegame.com/"  # URL de tu launcher web

CONFIG_FILENAME = "launcher_config.json"


def get_config_path():
    """Ruta del archivo de configuración (en la misma carpeta que launcher.py)."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, CONFIG_FILENAME)


class Api:
    """
    API expuesta al WebView de la herramienta local.
    Maneja:
      - Estado inicial (políticas aceptadas, modo de apertura, resolución)
      - Aceptar políticas
      - Abrir el launcher web con la configuración elegida
      - Cambiar modo (fullscreen/ventana) y resolución
      - Salir de la app
    """

    def __init__(self, config_path):
        self.config_path = config_path
        self.state = self._load_state()
        self.window = None  # Se asignará desde main()

    # ============ Configuración (leer/guardar) ============

    def _load_state(self):
        """Cargar configuración desde JSON. Si no existe, valores por defecto."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                # Si hay algún problema, crear un estado nuevo
                return {}
        return {}

    def _save_state(self):
        """Guardar configuración en JSON."""
        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(self.state, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print("Error guardando configuración:", e)

    # ============ Métodos expuestos a JS ============

    def get_initial_state(self):
        """
        Devuelve el estado inicial para el frontend:
        - Si políticas ya fueron aceptadas
        - Modo de lanzamiento y resolución actual
        """
        return {
            "policiesAccepted": bool(self.state.get("policies_accepted", False)),
            "launchMode": self.state.get("launch_mode"),  # "fullscreen" | "window" | None
            "windowWidth": int(self.state.get("window_width", 1280)),
            "windowHeight": int(self.state.get("window_height", 720)),
        }

    def accept_policies(self):
        """Marcar que el usuario aceptó las políticas y guardar."""
        self.state["policies_accepted"] = True
        self._save_state()
        return True

    def exit_app(self):
        """Cerrar la aplicación completamente."""
        try:
            if self.window:
                webview.destroy_window(self.window)
            else:
                webview.destroy_window()
        except Exception:
            # Fallback bruto si hiciera falta
            os._exit(0)

    def get_launch_mode(self):
        """Devolver modo de lanzamiento y resolución."""
        return {
            "mode": self.state.get("launch_mode"),
            "windowWidth": int(self.state.get("window_width", 1280)),
            "windowHeight": int(self.state.get("window_height", 720)),
        }

    def set_launch_mode(self, mode, width=None, height=None):
        """
        Actualizar modo de lanzamiento:
        mode: "fullscreen" | "window"
        width, height: resolución cuando es ventana.
        """
        if mode not in ("fullscreen", "window"):
            raise ValueError("Modo de lanzamiento inválido")

        self.state["launch_mode"] = mode

        if mode == "window":
            if width is not None and height is not None:
                self.state["window_width"] = int(width)
                self.state["window_height"] = int(height)
            else:
                # Valores por defecto si no se pasan
                self.state.setdefault("window_width", 1280)
                self.state.setdefault("window_height", 720)

        self._save_state()
        return True

    def open_launcher(self):
        """
        Abrir el launcher web en una nueva ventana, respetando:
        - fullscreen vs window
        - resolución configurada
        """
        mode = self.state.get("launch_mode", "fullscreen")
        width = int(self.state.get("window_width", 1280))
        height = int(self.state.get("window_height", 720))

        if mode == "window":
            webview.create_window(
                title="Studio Lexair Launcher",
                url=LAUNCHER_URL,
                width=width,
                height=height,
                resizable=True,
                zoomable=False,
                confirm_close=True,
            )
        else:
            # fullscreen
            webview.create_window(
                title="Studio Lexair Launcher",
                url=LAUNCHER_URL,
                fullscreen=True,
                zoomable=False,
                confirm_close=True,
            )
        return True


def main():
    """Punto de entrada de la herramienta de escritorio de Studio Lexair."""
    config_path = get_config_path()
    api = Api(config_path)

    # HTML embebido para la ventana principal (herramienta)
    html_tool = f"""<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Studio Lexair - Herramienta de Escritorio</title>
    <style>
        * {{ box-sizing: border-box; }}
        html, body {{
            margin: 0;
            padding: 0;
            height: 100%;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            color: #f9fafb;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }}
        .screen {{
            position: absolute;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }}
        .screen.active {{
            display: flex;
        }}

        /* Loading Screen */
        .loading-container {{
            text-align: center;
        }}
        .spinner {{
            width: 64px;
            height: 64px;
            border-radius: 9999px;
            border: 6px solid rgba(129, 140, 248, 0.2);
            border-top-color: #818cf8;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }}
        @keyframes spin {{
            to {{ transform: rotate(360deg); }}
        }}
        .loading-title {{
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 4px;
        }}
        .loading-subtitle {{
            font-size: 12px;
            color: #c4b5fd;
        }}

        /* Card genérico */
        .card {{
            background: rgba(15, 23, 42, 0.96);
            border-radius: 18px;
            padding: 22px 26px;
            box-shadow: 0 14px 45px rgba(15, 23, 42, 0.85);
            max-width: 520px;
            width: 100%;
            border: 1px solid rgba(148, 163, 184, 0.45);
        }}
        .header {{
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 14px;
        }}
        .logo {{
            width: 52px;
            height: 52px;
            border-radius: 18px;
            background: linear-gradient(135deg, #667eea, #a855f7);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 22px;
            color: white;
            box-shadow: 0 10px 25px rgba(88, 101, 242, 0.8);
        }}
        h1 {{
            margin: 0;
            font-size: 20px;
            font-weight: 800;
            background: linear-gradient(135deg, #a855f7, #f97316);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .subtitle {{
            margin: 2px 0 0;
            font-size: 12px;
            color: #9ca3af;
        }}
        .body-text {{
            margin: 16px 0 18px;
            font-size: 13px;
            line-height: 1.6;
            color: #e5e7eb;
        }}
        .section-title {{
            margin: 0 0 8px;
            font-size: 13px;
            font-weight: 600;
            color: #a5b4fc;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }}
        ul {{
            padding-left: 18px;
            margin: 0 0 14px;
            font-size: 13px;
            color: #d1d5db;
        }}
        li {{ margin-bottom: 4px; }}
        .button-primary {{
            border: none;
            border-radius: 9999px;
            padding: 10px 22px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            box-shadow: 0 10px 30px rgba(34, 197, 94, 0.6);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 10px;
            transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
        }}
        .button-primary:hover {{
            transform: translateY(-1px);
            box-shadow: 0 14px 34px rgba(34, 197, 94, 0.8);
            filter: brightness(1.05);
        }}
        .button-primary:active {{
            transform: translateY(1px);
            box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5);
        }}
        .button-secondary {{
            border: none;
            border-radius: 9999px;
            padding: 8px 18px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            background: rgba(148, 163, 184, 0.2);
            color: #e5e7eb;
            margin-top: 4px;
        }}
        .button-secondary:hover {{
            background: rgba(148, 163, 184, 0.35);
        }}
        .buttons-row {{
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 18px;
        }}
        .footer-text {{
            margin-top: 10px;
            font-size: 11px;
            color: #9ca3af;
        }}

        /* Dashboard */
        .top-row {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }}
        .gear-button {{
            border: none;
            background: transparent;
            cursor: pointer;
            color: #9ca3af;
            padding: 4px;
        }}
        .gear-button:hover {{
            color: #e5e7eb;
        }}
        .gear-icon {{
            width: 18px;
            height: 18px;
        }}
        .tagline {{
            font-size: 12px;
           	color: #e5e7eb;
            margin-top: 4px;
        }}

        /* Modal de ajustes */
        .settings-backdrop {{
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: none;
            align-items: center;
            justify-content: center;
        }}
        .settings-backdrop.active {{
            display: flex;
        }}
        .settings-card {{
            background: rgba(15, 23, 42, 0.98);
            border-radius: 16px;
            padding: 18px 20px;
            box-shadow: 0 10px 35px rgba(0, 0, 0, 0.8);
            width: 100%;
            max-width: 360px;
            border: 1px solid rgba(148, 163, 184, 0.4);
        }}
        .settings-title {{
            margin: 0 0 6px;
            font-size: 15px;
            font-weight: 700;
            color: #e5e7eb;
        }}
        .settings-subtitle {{
            margin: 0 0 10px;
            font-size: 12px;
            color: #9ca3af;
        }}
        .settings-group {{
            margin-bottom: 12px;
        }}
        .settings-group label {{
            font-size: 13px;
            color: #e5e7eb;
            display: block;
            margin-bottom: 4px;
        }}
        .settings-radio-row {{
            display: flex;
            gap: 10px;
            margin-top: 4px;
            font-size: 12px;
            color: #e5e7eb;
        }}
        .settings-radio-row input {{
            margin-right: 4px;
        }}
        select {{
            width: 100%;
            padding: 6px 8px;
            border-radius: 8px;
            border: 1px solid rgba(148, 163, 184, 0.7);
            background: rgba(15, 23, 42, 0.9);
           	color: #e5e7eb;
            font-size: 13px;
        }}
    </style>
</head>
<body>
    <!-- Pantalla de Loading -->
    <div id="screen-loading" class="screen active">
        <div class="loading-container">
            <div class="spinner"></div>
            <div class="loading-title">Studio Lexair Launcher</div>
            <div class="loading-subtitle">Preparando experiencia del launcher de la web...</div>
        </div>
    </div>

    <!-- Pantalla de Políticas -->
    <div id="screen-policies" class="screen">
        <div class="card">
            <div class="header">
                <div class="logo">SL</div>
                <div>
                    <h1>Términos del Programa</h1>
                    <p class="subtitle">Lee y acepta para continuar</p>
                </div>
            </div>
            <p class="body-text">
                Esta herramienta de escritorio actúa como un lanzador dedicado
                para el launcher web de Studio Lexair. No instala juegos ni
                aplicaciones por sí misma, sino que abre tu launcher web en modo
                aplicación, a pantalla completa y sin controles del navegador.
            </p>
            <p class="section-title">Políticas de Uso</p>
            <ul>
                <li>El contenido (juegos, apps y herramientas) se gestiona desde el launcher web.</li>
                <li>Las cuentas, inicio de sesión y registro se realizan directamente en la web de Studio Lexair.</li>
                <li>No compartas tu cuenta ni tus credenciales con terceros.</li>
                <li>El uso de este programa implica aceptar los términos y políticas de Studio Lexair.</li>
            </ul>
            <div class="buttons-row">
                <button id="btnDeclinePolicies" class="button-secondary">No acepto</button>
                <button id="btnAcceptPolicies" class="button-primary">Acepto y continuar</button>
            </div>
        </div>
    </div>

    <!-- Pantalla de Dashboard -->
    <div id="screen-dashboard" class="screen">
        <div class="card">
            <div class="top-row">
                <div class="header" style="margin-bottom: 4px;">
                    <div class="logo">SL</div>
                    <div>
                        <h1>Studio Lexair Launcher</h1>
                        <p class="subtitle">Herramienta de escritorio</p>
                    </div>
                </div>
                <button id="btnOpenSettings" class="gear-button" title="Opciones">
                    <svg class="gear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                            d="M10.325 4.317a1 1 0 011.35-.937l1.387.463a1 1 0 00.949-.174l1.1-.916a1 1 0 011.414.09l1.414 1.414a1 1 0 01.09 1.414l-.916 1.1a1 1 0 00-.174.949l.463 1.387a1 1 0 01-.937 1.35l-1.45.242a1 1 0 00-.832.832l-.242 1.45a1 1 0 01-1.35.937l-1.387-.463a1 1 0 00-.949.174l-1.1.916a1 1 0 01-1.414-.09l-1.414-1.414a1 1 0 01-.09-1.414l.916-1.1a1 1 0 00.174-.949l-.463-1.387a1 1 0 01.937-1.35l1.45-.242a1 1 0 00.832-.832l.242-1.45z" />
                        <circle cx="12" cy="12" r="3" stroke-width="1.8" />
                    </svg>
                </button>
            </div>
            <p class="body-text">
                Esta herramienta abre tu launcher web de Studio Lexair en modo
                aplicación. Es la forma recomendada de usar Studio Lexair en PC:
                sin barra de direcciones, sin zoom y con una integración fluida.
            </p>
            <p class="section-title">¿Qué puedes hacer?</p>
            <ul>
                <li>Abrir el launcher web en pantalla completa o en ventana.</li>
                <li>Usar el mismo sistema de registro e inicio de sesión de la web.</li>
                <li>Disfrutar de una experiencia similar a una app nativa.</li>
            </ul>
            <button id="btnOpenLauncher" class="button-primary">
                Abrir launcher de tienda
            </button>
            <p class="tagline">
                Todas las funciones avanzadas (tienda, biblioteca, eventos, tokens)
                se gestionan desde el launcher web.
            </p>
        </div>

        <!-- Modal de ajustes -->
        <div id="settingsBackdrop" class="settings-backdrop">
            <div class="settings-card">
                <h2 class="settings-title">Opciones de lanzamiento</h2>
                <p class="settings-subtitle">
                    Elige cómo quieres que se abra el launcher web y, si usas ventana,
                    selecciona la resolución.
                </p>
                <div class="settings-group">
                    <label>Modo de pantalla</label>
                    <div class="settings-radio-row">
                        <label><input type="radio" name="launchMode" value="fullscreen" checked /> Pantalla completa</label>
                        <label><input type="radio" name="launchMode" value="window" /> Ventana</label>
                    </div>
                </div>
                <div class="settings-group" id="resolutionGroup">
                    <label>Resolución (modo ventana)</label>
                    <select id="resolutionSelect">
                        <option value="1280x720">1280 x 720 (HD)</option>
                        <option value="1600x900">1600 x 900</option>
                        <option value="1920x1080">1920 x 1080 (Full HD)</option>
                    </select>
                </div>
                <div class="buttons-row">
                    <button id="btnCloseSettings" class="button-secondary">Cancelar</button>
                    <button id="btnSaveSettings" class="button-primary">Guardar</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        (function() {{
            const screenLoading = document.getElementById('screen-loading');
            const screenPolicies = document.getElementById('screen-policies');
            const screenDashboard = document.getElementById('screen-dashboard');

            const settingsBackdrop = document.getElementById('settingsBackdrop');
            const resolutionGroup = document.getElementById('resolutionGroup');
            const resolutionSelect = document.getElementById('resolutionSelect');

            const btnAcceptPolicies = document.getElementById('btnAcceptPolicies');
            const btnDeclinePolicies = document.getElementById('btnDeclinePolicies');
            const btnOpenLauncher = document.getElementById('btnOpenLauncher');
            const btnOpenSettings = document.getElementById('btnOpenSettings');
            const btnCloseSettings = document.getElementById('btnCloseSettings');
            const btnSaveSettings = document.getElementById('btnSaveSettings');

            function showScreen(name) {{
                screenLoading.classList.remove('active');
                screenPolicies.classList.remove('active');
                screenDashboard.classList.remove('active');

                if (name === 'loading') screenLoading.classList.add('active');
                if (name === 'policies') screenPolicies.classList.add('active');
                if (name === 'dashboard') screenDashboard.classList.add('active');
            }}

            function showSettingsModal() {{
                settingsBackdrop.classList.add('active');
            }}

            function hideSettingsModal() {{
                settingsBackdrop.classList.remove('active');
            }}

            function updateResolutionVisibility(mode) {{
                if (mode === 'window') {{
                    resolutionGroup.style.display = 'block';
                }} else {{
                    resolutionGroup.style.display = 'none';
                }}
            }}

            async function init() {{
                try {{
                    showScreen('loading');

                    const state = await pywebview.api.get_initial_state();

                    // Pequeña pausa para "animar" el loading
                    setTimeout(() => {{
                        if (state.policiesAccepted) {{
                            showScreen('dashboard');
                        }} else {{
                            showScreen('policies');
                        }}

                        // Cargar modo de lanzamiento en ajustes
                        const mode = state.launchMode || 'fullscreen';
                        const radios = document.querySelectorAll('input[name="launchMode"]');
                        radios.forEach(r => {{
                            r.checked = (r.value === mode);
                        }});
                        updateResolutionVisibility(mode);
                    }}, 1200);
                }} catch (e) {{
                    console.error('Error en init:', e);
                    showScreen('dashboard');
                }}
            }}

            // Eventos de políticas
            btnAcceptPolicies.addEventListener('click', async () => {{
                try {{
                    await pywebview.api.accept_policies();
                    showScreen('dashboard');
                }} catch (e) {{
                    console.error('Error al aceptar políticas:', e);
                }}
            }});

            btnDeclinePolicies.addEventListener('click', () => {{
                // Cerrar la app si no acepta
                pywebview.api.exit_app();
            }});

            // Abrir launcher
            btnOpenLauncher.addEventListener('click', async () => {{
                try {{
                    const launchInfo = await pywebview.api.get_launch_mode();
                    if (!launchInfo || !launchInfo.mode) {{
                        // No hay modo guardado: primero mostrar ajustes
                        showSettingsModal();
                    }} else {{
                        await pywebview.api.open_launcher();
                    }}
                }} catch (e) {{
                    console.error('Error al abrir launcher:', e);
                }}
            }});

            // Ajustes (engranaje)
            btnOpenSettings.addEventListener('click', () => {{
                showSettingsModal();
            }});

            btnCloseSettings.addEventListener('click', () => {{
                hideSettingsModal();
            }});

            // Cambiar visibilidad de resolución según radio
            document.querySelectorAll('input[name="launchMode"]').forEach(radio => {{
                radio.addEventListener('change', (e) => {{
                    updateResolutionVisibility(e.target.value);
                }});
            }});

            // Guardar ajustes
            btnSaveSettings.addEventListener('click', async () => {{
                try {{
                    const mode = document.querySelector('input[name="launchMode"]:checked').value;
                    let width = null;
                    let height = null;

                    if (mode === 'window') {{
                        const value = resolutionSelect.value; // "1280x720"
                        const parts = value.split('x');
                        width = parseInt(parts[0], 10) || 1280;
                        height = parseInt(parts[1], 10) || 720;
                    }}

                    await pywebview.api.set_launch_mode(mode, width, height);
                    hideSettingsModal();

                    // Si se abrió desde "Abrir launcher" sin modo, ahora lanzar
                    await pywebview.api.open_launcher();
                }} catch (e) {{
                    console.error('Error al guardar ajustes:', e);
                }}
            }});

            // Iniciar
            document.addEventListener('DOMContentLoaded', init);
            // Para pywebview, llamamos init directamente (DOMContentLoaded ya ha ocurrido)
            init();
        }})();
    </script>
</body>
</html>
"""

    # Crear ventana principal
    window = webview.create_window(
        title="Studio Lexair - Herramienta de Escritorio",
        html=html_tool,
        width=520,
        height=420,
        resizable=False,
        zoomable=False,
        js_api=api,  # API expuesta al HTML
    )

    api.window = window

    # Iniciar el loop de la app
    webview.start()


if __name__ == "__main__":
    main()
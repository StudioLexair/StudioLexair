import json
import os
import time
import logging
import webview

# Silenciar logs ruidosos de pywebview
logging.getLogger('pywebview').setLevel(logging.ERROR)

LAUNCHER_URL = "https://studiolexair.servegame.com/"
CONFIG_FILENAME = "launcher_config.json"


def get_config_path():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, CONFIG_FILENAME)


class Api:
    """
    API expuesta al WebView de la herramienta local.

    Maneja:
      - Configuración (políticas, modo, resolución, idioma)
      - Abrir/cerrar launcher web
      - Cerrar/minimizar la app
      - Temporizador de tiempo en launcher
    """

    def __init__(self, config_path):
        self.config_path = config_path
        self.state = self._load_state()
        self.window = None              # Ventana principal
        self.launcher_window = None     # Ventana del launcher web
        self.launch_start_time = None   # Inicio del tiempo del launcher

    # ========= Configuración =========

    def _load_state(self):
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_state(self):
        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(self.state, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print("Error guardando configuración:", e)

    # ========= API para JS =========

    def get_initial_state(self):
        """Estado inicial para JS (políticas, modo, resolución, idioma)."""
        return {
            "policiesAccepted": bool(self.state.get("policies_accepted", False)),
            "launchMode": self.state.get("launch_mode"),  # fullscreen | window | None
            "windowWidth": int(self.state.get("window_width", 1280)),
            "windowHeight": int(self.state.get("window_height", 720)),
            "language": self.state.get("language", "es"),
        }

    def accept_policies(self):
        self.state["policies_accepted"] = True
        self._save_state()
        return True

    def exit_app(self):
        try:
            if self.window:
                webview.destroy_window(self.window)
            else:
                webview.destroy_window()
        except Exception:
            os._exit(0)

    def minimize_app(self):
        try:
            if self.window:
                self.window.minimize()
        except Exception as e:
            print("Error minimizando:", e)

    def get_launch_mode(self):
        return {
            "mode": self.state.get("launch_mode"),
            "windowWidth": int(self.state.get("window_width", 1280)),
            "windowHeight": int(self.state.get("window_height", 720)),
        }

    def set_launch_mode(self, mode, width=None, height=None):
        if mode not in ("fullscreen", "window"):
            raise ValueError("Modo de lanzamiento inválido")

        self.state["launch_mode"] = mode

        if mode == "window":
            if width is not None and height is not None:
                self.state["window_width"] = int(width)
                self.state["window_height"] = int(height)
            else:
                self.state.setdefault("window_width", 1280)
                self.state.setdefault("window_height", 720)

        self._save_state()
        return True

    def set_language(self, lang_code):
        """Guardar idioma preferido (es, en, fr, de, pt)."""
        if lang_code not in ("es", "en", "fr", "de", "pt"):
            lang_code = "es"
        self.state["language"] = lang_code
        self._save_state()
        return True

    def open_launcher(self):
        """Abrir launcher según el modo/ resolución guardados y arrancar contador."""
        mode = self.state.get("launch_mode", "fullscreen")
        width = int(self.state.get("window_width", 1280))
        height = int(self.state.get("window_height", 720))

        # Si ya hay un launcher abierto, no abrir otro
        if self.launcher_window:
            return True

        if mode == "window":
            w = webview.create_window(
                title="Studio Lexair Launcher",
                url=LAUNCHER_URL,
                width=width,
                height=height,
                resizable=True,
                zoomable=False,
                confirm_close=True,
            )
        else:
            w = webview.create_window(
                title="Studio Lexair Launcher",
                url=LAUNCHER_URL,
                fullscreen=True,
                zoomable=False,
                confirm_close=True,
            )

        self.launcher_window = w
        self.launch_start_time = time.time()

        # Suscribir a evento de cierre para resetear temporizador
        try:
            w.events.closed += self._on_launcher_closed
        except Exception:
            pass

        return True

    def _on_launcher_closed(self, *args, **kwargs):
        self.launch_start_time = None
        self.launcher_window = None

    def close_launcher(self):
        """Cerrar la ventana del launcher web si está abierta."""
        if self.launcher_window:
            try:
                try:
                    self.launcher_window.destroy()
                except Exception:
                    webview.destroy_window(self.launcher_window)
            except Exception:
                pass
        self.launch_start_time = None
        self.launcher_window = None
        return True

    def get_elapsed_time(self):
        """Devolver segundos desde que se abrió el launcher (o 0 si está cerrado)."""
        if self.launch_start_time is None:
            return 0
        return int(time.time() - self.launch_start_time)


def main():
    config_path = get_config_path()
    api = Api(config_path)

    # HTML embebido para la herramienta
    html_tool = r"""<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Studio Lexair - Herramienta de Escritorio</title>
    <style>
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            color: #f9fafb;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* Barra de título personalizada */
        #titlebar {
            height: 32px;
            background: rgba(15, 23, 42, 0.98);
            border-bottom: 1px solid rgba(148, 163, 184, 0.4);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            -webkit-app-region: drag;
        }
        #titlebar-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        #titlebar-logo {
            width: 18px;
            height: 18px;
            border-radius: 6px;
            background: linear-gradient(135deg, #667eea, #a855f7);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 11px;
            color: white;
        }
        #titlebar-title {
            font-size: 12px;
            font-weight: 600;
            color: #e5e7eb;
        }
        #titlebar-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .titlebar-btn {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            -webkit-app-region: no-drag;
            background: transparent;
            color: #9ca3af;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        }
        .titlebar-btn:hover {
            background: rgba(148, 163, 184, 0.15);
            color: #e5e7eb;
        }
        .titlebar-btn-close:hover {
            background: rgba(239, 68, 68, 0.9);
            color: white;
        }
        #langSelect {
            -webkit-app-region: no-drag;
            background: rgba(15, 23, 42, 0.9);
            color: #e5e7eb;
            border-radius: 6px;
            border: 1px solid rgba(148, 163, 184, 0.6);
            padding: 2px 6px;
            font-size: 11px;
        }

        /* Contenido principal */
        #content {
            flex: 1;
            position: relative;
        }
        .screen {
            position: absolute;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .screen.active {
            display: flex;
        }

        /* Loading */
        .loading-container {
            text-align: center;
        }
        .spinner {
            width: 64px;
            height: 64px;
            border-radius: 9999px;
            border: 6px solid rgba(129, 140, 248, 0.2);
            border-top-color: #818cf8;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .loading-title {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .loading-subtitle {
            font-size: 11px;
            color: #c4b5fd;
        }

        /* Card */
        .card {
            background: rgba(15, 23, 42, 0.96);
            border-radius: 18px;
            padding: 20px 24px;
            box-shadow: 0 14px 45px rgba(15, 23, 42, 0.85);
            max-width: 540px;
            width: 100%;
            border: 1px solid rgba(148, 163, 184, 0.45);
        }
        .header {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 14px;
        }
        .logo {
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
        }
        h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
            background: linear-gradient(135deg, #a855f7, #f97316);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            margin: 2px 0 0;
            font-size: 12px;
            color: #9ca3af;
        }
        .body-text {
            margin: 14px 0 16px;
            font-size: 13px;
            line-height: 1.6;
            color: #e5e7eb;
        }
        .section-title {
            margin: 0 0 8px;
            font-size: 13px;
            font-weight: 600;
            color: #a5b4fc;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }
        ul {
            padding-left: 18px;
            margin: 0 0 12px;
            font-size: 13px;
            color: #d1d5db;
        }
        li { margin-bottom: 4px; }
        .button-primary {
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
        }
        .button-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 34px rgba(34, 197, 94, 0.8);
            filter: brightness(1.05);
        }
        .button-primary:active {
            transform: translateY(1px);
            box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5);
        }
        .button-secondary {
            border: none;
            border-radius: 9999px;
            padding: 8px 18px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            background: rgba(148, 163, 184, 0.2);
            color: #e5e7eb;
            margin-top: 4px;
        }
        .button-secondary:hover {
            background: rgba(148, 163, 184, 0.35);
        }
        .buttons-row {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 18px;
        }
        .footer-text {
            margin-top: 10px;
            font-size: 11px;
            color: #9ca3af;
        }
        .tagline {
            font-size: 12px;
            color: #e5e7eb;
            margin-top: 4px;
        }
        .top-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .elapsed-label {
            font-size: 11px;
            color: #a5b4fc;
            margin-top: 6px;
        }

        /* Modal opciones */
        .settings-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: none;
            align-items: center;
            justify-content: center;
        }
        .settings-backdrop.active {
            display: flex;
        }
        .settings-card {
            background: rgba(15, 23, 42, 0.98);
            border-radius: 16px;
            padding: 18px 20px;
            box-shadow: 0 10px 35px rgba(0, 0, 0, 0.8);
            width: 100%;
            max-width: 360px;
            border: 1px solid rgba(148, 163, 184, 0.4);
        }
        .settings-title {
            margin: 0 0 6px;
            font-size: 15px;
            font-weight: 700;
            color: #e5e7eb;
        }
        .settings-subtitle {
            margin: 0 0 10px;
            font-size: 12px;
            color: #9ca3af;
        }
        .settings-group {
            margin-bottom: 12px;
        }
        .settings-group label {
            font-size: 13px;
            color: #e5e7eb;
            display: block;
            margin-bottom: 4px;
        }
        .settings-radio-row {
            display: flex;
            gap: 10px;
            margin-top: 4px;
            font-size: 12px;
            color: #e5e7eb;
        }
        .settings-radio-row input {
            margin-right: 4px;
        }
        select {
            width: 100%;
            padding: 6px 8px;
            border-radius: 8px;
            border: 1px solid rgba(148, 163, 184, 0.7);
            background: rgba(15, 23, 42, 0.9);
            color: #e5e7eb;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div id="titlebar">
        <div id="titlebar-left">
            <div id="titlebar-logo">SL</div>
            <div id="titlebar-title">Studio Lexair Launcher</div>
        </div>
        <div id="titlebar-right">
            <select id="langSelect">
                <option value="es">ES</option>
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="de">DE</option>
                <option value="pt">PT</option>
            </select>
            <button class="titlebar-btn" id="btnMinimize" title="Minimizar">&#8211;</button>
            <button class="titlebar-btn titlebar-btn-close" id="btnClose" title="Cerrar">&#10005;</button>
        </div>
    </div>

    <div id="content">
        <!-- Loading -->
        <div id="screen-loading" class="screen active">
            <div class="loading-container">
                <div class="spinner"></div>
                <div class="loading-title" data-i18n="loadingTitle">Cargando Studio Lexair...</div>
                <div class="loading-subtitle" data-i18n="loadingSubtitle">Preparando experiencia del launcher de la web...</div>
            </div>
        </div>

        <!-- Políticas -->
        <div id="screen-policies" class="screen">
            <div class="card">
                <div class="header">
                    <div class="logo">SL</div>
                    <div>
                        <h1 data-i18n="policiesTitle">Términos del Programa</h1>
                        <p class="subtitle" data-i18n="policiesSubtitle">Lee y acepta para continuar</p>
                    </div>
                </div>
                <p class="body-text" data-i18n="policiesBody">
                    Esta herramienta de escritorio actúa como un lanzador dedicado
                    para el launcher web de Studio Lexair. No instala juegos ni
                    aplicaciones por sí misma, sino que abre tu launcher web en modo
                    aplicación, a pantalla completa y sin controles del navegador.
                </p>
                <p class="section-title" data-i18n="policiesSectionTitle">Políticas de Uso</p>
                <ul>
                    <li data-i18n="policiesItem1">El contenido (juegos, apps y herramientas) se gestiona desde el launcher web.</li>
                    <li data-i18n="policiesItem2">Las cuentas, inicio de sesión y registro se realizan directamente en la web de Studio Lexair.</li>
                    <li data-i18n="policiesItem3">No compartas tu cuenta ni tus credenciales con terceros.</li>
                    <li data-i18n="policiesItem4">El uso de este programa implica aceptar los términos y políticas de Studio Lexair.</li>
                </ul>
                <div class="buttons-row">
                    <button id="btnDeclinePolicies" class="button-secondary" data-i18n="btnDecline">No acepto</button>
                    <button id="btnAcceptPolicies" class="button-primary" data-i18n="btnAccept">Acepto y continuar</button>
                </div>
            </div>
        </div>

        <!-- Dashboard -->
        <div id="screen-dashboard" class="screen">
            <div class="card">
                <div class="top-row">
                    <div class="header" style="margin-bottom: 4px;">
                        <div class="logo">SL</div>
                        <div>
                            <h1 data-i18n="dashboardTitle">Studio Lexair Launcher</h1>
                            <p class="subtitle" data-i18n="dashboardSubtitle">Herramienta de escritorio</p>
                        </div>
                    </div>
                    <button id="btnOpenSettings" class="titlebar-btn" title="Opciones">
                        <svg viewBox="0 0 24 24" class="gear-icon" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                                  d="M10.325 4.317a1 1 0 011.35-.937l1.387.463a1 1 0 00.949-.174l1.1-.916a1 1 0 011.414.09l1.414 1.414a1 1 0 01.09 1.414l-.916 1.1a1 1 0 00-.174.949l.463 1.387a1 1 0 01-.937 1.35l-1.45.242a1 1 0 00-.832.832l-.242 1.45a1 1 0 01-1.35.937l-1.387-.463a1 1 0 00-.949.174l-1.1.916a1 1 0 01-1.414-.09l-1.414-1.414a1 1 0 01-.09-1.414l.916-1.1a1 1 0 00.174-.949l-.463-1.387a1 1 0 01.937-1.35l1.45-.242a1 1 0 00.832-.832l.242-1.45z"/>
                            <circle cx="12" cy="12" r="3" stroke-width="1.8"/>
                        </svg>
                    </button>
                </div>
                <p class="body-text" data-i18n="dashboardBody">
                    Esta herramienta abre tu launcher web de Studio Lexair en modo
                    aplicación. Es la forma recomendada de usar Studio Lexair en PC:
                    sin barra de direcciones, sin zoom y con una integración fluida.
                </p>
                <p class="section-title" data-i18n="dashboardSectionTitle">¿Qué puedes hacer?</p>
                <ul>
                    <li data-i18n="dashboardItem1">Abrir el launcher web en pantalla completa o en ventana.</li>
                    <li data-i18n="dashboardItem2">Usar el mismo sistema de registro e inicio de sesión de la web.</li>
                    <li data-i18n="dashboardItem3">Disfrutar de una experiencia similar a una app nativa.</li>
                </ul>
                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <button id="btnOpenLauncher" class="button-primary" data-i18n="btnOpenLauncher">
                        Abrir launcher de tienda
                    </button>
                    <button id="btnCloseLauncher" class="button-secondary">
                        Cerrar launcher web
                    </button>
                </div>
                <p class="tagline" data-i18n="dashboardTagline">
                    Todas las funciones avanzadas (tienda, biblioteca, eventos, tokens)
                    se gestionan desde el launcher web.
                </p>
                <p class="elapsed-label" id="elapsedLabel" data-i18n-elapsed-prefix="elapsedPrefix">
                    Tiempo con el launcher abierto: 00:00:00
                </p>
            </div>

            <!-- Modal opciones -->
            <div id="settingsBackdrop" class="settings-backdrop">
                <div class="settings-card">
                    <h2 class="settings-title" data-i18n="settingsTitle">Opciones de lanzamiento</h2>
                    <p class="settings-subtitle" data-i18n="settingsSubtitle">
                        Elige cómo quieres que se abra el launcher web y, si usas ventana,
                        selecciona la resolución.
                    </p>
                    <div class="settings-group">
                        <label data-i18n="settingsModeLabel">Modo de pantalla</label>
                        <div class="settings-radio-row">
                            <label><input type="radio" name="launchMode" value="fullscreen" checked /> <span data-i18n="settingsModeFullscreen">Pantalla completa</span></label>
                            <label><input type="radio" name="launchMode" value="window" /> <span data-i18n="settingsModeWindow">Ventana</span></label>
                        </div>
                    </div>
                    <div class="settings-group" id="resolutionGroup">
                        <label data-i18n="settingsResolutionLabel">Resolución (modo ventana)</label>
                        <select id="resolutionSelect">
                            <option value="1024x576">1024 x 576</option>
                            <option value="1280x720" selected>1280 x 720 (HD)</option>
                            <option value="1366x768">1366 x 768</option>
                            <option value="1600x900">1600 x 900</option>
                            <option value="1920x1080">1920 x 1080 (Full HD)</option>
                        </select>
                    </div>
                    <div class="buttons-row">
                        <button id="btnCloseSettings" class="button-secondary" data-i18n="btnCancel">Cancelar</button>
                        <button id="btnSaveSettings" class="button-primary" data-i18n="btnSave">Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
    (function() {
        const screenLoading = document.getElementById('screen-loading');
        const screenPolicies = document.getElementById('screen-policies');
        const screenDashboard = document.getElementById('screen-dashboard');

        const settingsBackdrop = document.getElementById('settingsBackdrop');
        const resolutionGroup = document.getElementById('resolutionGroup');
        const resolutionSelect = document.getElementById('resolutionSelect');

        const btnAcceptPolicies = document.getElementById('btnAcceptPolicies');
        const btnDeclinePolicies = document.getElementById('btnDeclinePolicies');
        const btnOpenLauncher = document.getElementById('btnOpenLauncher');
        const btnCloseLauncher = document.getElementById('btnCloseLauncher');
        const btnOpenSettings = document.getElementById('btnOpenSettings');
        const btnCloseSettings = document.getElementById('btnCloseSettings');
        const btnSaveSettings = document.getElementById('btnSaveSettings');

        const btnMinimize = document.getElementById('btnMinimize');
        const btnClose = document.getElementById('btnClose');
        const langSelect = document.getElementById('langSelect');

        const elapsedLabel = document.getElementById('elapsedLabel');

        let currentLang = 'es';
        let elapsedTimer = null;

        const translations = {
            es: {
                loadingTitle: "Cargando Studio Lexair...",
                loadingSubtitle: "Preparando experiencia del launcher de la web...",
                policiesTitle: "Términos del Programa",
                policiesSubtitle: "Lee y acepta para continuar",
                policiesBody: "Esta herramienta de escritorio actúa como un lanzador dedicado para el launcher web de Studio Lexair. No instala juegos ni aplicaciones por sí misma, sino que abre tu launcher web en modo aplicación, a pantalla completa y sin controles del navegador.",
                policiesSectionTitle: "Políticas de Uso",
                policiesItem1: "El contenido (juegos, apps y herramientas) se gestiona desde el launcher web.",
                policiesItem2: "Las cuentas, inicio de sesión y registro se realizan directamente en la web de Studio Lexair.",
                policiesItem3: "No compartas tu cuenta ni tus credenciales con terceros.",
                policiesItem4: "El uso de este programa implica aceptar los términos y políticas de Studio Lexair.",
                btnDecline: "No acepto",
                btnAccept: "Acepto y continuar",
                dashboardTitle: "Studio Lexair Launcher",
                dashboardSubtitle: "Herramienta de escritorio",
                dashboardBody: "Esta herramienta abre tu launcher web de Studio Lexair en modo aplicación. Es la forma recomendada de usar Studio Lexair en PC: sin barra de direcciones, sin zoom y con una integración fluida.",
                dashboardSectionTitle: "¿Qué puedes hacer?",
                dashboardItem1: "Abrir el launcher web en pantalla completa o en ventana.",
                dashboardItem2: "Usar el mismo sistema de registro e inicio de sesión de la web.",
                dashboardItem3: "Disfrutar de una experiencia similar a una app nativa.",
                btnOpenLauncher: "Abrir launcher de tienda",
                dashboardTagline: "Todas las funciones avanzadas (tienda, biblioteca, eventos, tokens) se gestionan desde el launcher web.",
                settingsTitle: "Opciones de lanzamiento",
                settingsSubtitle: "Elige cómo quieres que se abra el launcher web y, si usas ventana, selecciona la resolución.",
                settingsModeLabel: "Modo de pantalla",
                settingsModeFullscreen: "Pantalla completa",
                settingsModeWindow: "Ventana",
                settingsResolutionLabel: "Resolución (modo ventana)",
                btnCancel: "Cancelar",
                btnSave: "Guardar",
                elapsedPrefix: "Tiempo con el launcher abierto:"
            },
            en: {
                loadingTitle: "Loading Studio Lexair...",
                loadingSubtitle: "Preparing the web launcher experience...",
                policiesTitle: "Program Terms",
                policiesSubtitle: "Read and accept to continue",
                policiesBody: "This desktop tool acts as a dedicated launcher for the Studio Lexair web launcher. It does not install games or apps by itself, but opens your web launcher in app mode, fullscreen and without browser controls.",
                policiesSectionTitle: "Usage Policies",
                policiesItem1: "Content (games, apps and tools) is managed from the web launcher.",
                policiesItem2: "Accounts, sign in and sign up are handled directly on the Studio Lexair website.",
                policiesItem3: "Do not share your account or credentials with third parties.",
                policiesItem4: "Using this program implies accepting the Studio Lexair terms and policies.",
                btnDecline: "I do not accept",
                btnAccept: "Accept and continue",
                dashboardTitle: "Studio Lexair Launcher",
                dashboardSubtitle: "Desktop tool",
                dashboardBody: "This tool opens your Studio Lexair web launcher in app mode. It is the recommended way to use Studio Lexair on PC: no address bar, no zoom and a smooth integration.",
                dashboardSectionTitle: "What can you do?",
                dashboardItem1: "Open the web launcher in fullscreen or windowed mode.",
                dashboardItem2: "Use the same sign in and sign up system as the website.",
                dashboardItem3: "Enjoy an experience similar to a native app.",
                btnOpenLauncher: "Open store launcher",
                dashboardTagline: "All advanced features (store, library, events, tokens) are managed from the web launcher.",
                settingsTitle: "Launch options",
                settingsSubtitle: "Choose how the web launcher should open and, if you use a window, select the resolution.",
                settingsModeLabel: "Screen mode",
                settingsModeFullscreen: "Fullscreen",
                settingsModeWindow: "Window",
                settingsResolutionLabel: "Resolution (window mode)",
                btnCancel: "Cancel",
                btnSave: "Save",
                elapsedPrefix: "Time with the launcher open:"
            },
            fr: {
                loadingTitle: "Chargement de Studio Lexair...",
                loadingSubtitle: "Préparation de l'expérience du lanceur web...",
                policiesTitle: "Conditions du programme",
                policiesSubtitle: "Lisez et acceptez pour continuer",
                policiesBody: "Cet outil de bureau agit comme un lanceur dédié pour le lanceur web de Studio Lexair. Il n'installe pas de jeux ou d'applications lui-même, mais ouvre votre lanceur web en mode application, en plein écran et sans contrôles du navigateur.",
                policiesSectionTitle: "Politiques d'utilisation",
                policiesItem1: "Le contenu (jeux, applications et outils) est géré depuis le lanceur web.",
                policiesItem2: "Les comptes, la connexion et l'inscription se font directement sur le site de Studio Lexair.",
                policiesItem3: "Ne partagez pas votre compte ni vos identifiants avec des tiers.",
                policiesItem4: "L'utilisation de ce programme implique l'acceptation des conditions et politiques de Studio Lexair.",
                btnDecline: "Je n'accepte pas",
                btnAccept: "Accepter et continuer",
                dashboardTitle: "Studio Lexair Launcher",
                dashboardSubtitle: "Outil de bureau",
                dashboardBody: "Cet outil ouvre votre lanceur web Studio Lexair en mode application. C'est la façon recommandée d'utiliser Studio Lexair sur PC : sans barre d'adresse, sans zoom et avec une intégration fluide.",
                dashboardSectionTitle: "Que pouvez-vous faire ?",
                dashboardItem1: "Ouvrir le lanceur web en plein écran ou en fenêtre.",
                dashboardItem2: "Utiliser le même système de connexion et d'inscription que le site.",
                dashboardItem3: "Profiter d'une expérience proche d'une application native.",
                btnOpenLauncher: "Ouvrir le lanceur de boutique",
                dashboardTagline: "Toutes les fonctionnalités avancées (boutique, bibliothèque, événements, tokens) sont gérées depuis le lanceur web.",
                settingsTitle: "Options de lancement",
                settingsSubtitle: "Choisissez comment le lanceur web doit s'ouvrir et, en mode fenêtre, sélectionnez la résolution.",
                settingsModeLabel: "Mode d'écran",
                settingsModeFullscreen: "Plein écran",
                settingsModeWindow: "Fenêtre",
                settingsResolutionLabel: "Résolution (mode fenêtre)",
                btnCancel: "Annuler",
                btnSave: "Enregistrer",
                elapsedPrefix: "Temps avec le lanceur ouvert :"
            },
            de: {
                loadingTitle: "Studio Lexair wird geladen...",
                loadingSubtitle: "Vorbereiten der Web-Launcher-Erfahrung...",
                policiesTitle: "Programmbedingungen",
                policiesSubtitle: "Lesen und akzeptieren, um fortzufahren",
                policiesBody: "Dieses Desktop-Tool fungiert als dedizierter Launcher für den Studio-Lexair-Weblauncher. Es installiert keine Spiele oder Apps selbst, sondern öffnet Ihren Weblauncher im App-Modus, im Vollbild und ohne Browser-Steuerelemente.",
                policiesSectionTitle: "Nutzungsrichtlinien",
                policiesItem1: "Inhalte (Spiele, Apps und Tools) werden über den Weblauncher verwaltet.",
                policiesItem2: "Konten, Anmeldung und Registrierung erfolgen direkt auf der Studio-Lexair-Website.",
                policiesItem3: "Teilen Sie Ihr Konto oder Ihre Zugangsdaten nicht mit Dritten.",
                policiesItem4: "Die Nutzung dieses Programms impliziert die Zustimmung zu den Studio-Lexair-Bedingungen und -Richtlinien.",
                btnDecline: "Ich akzeptiere nicht",
                btnAccept: "Akzeptieren und fortfahren",
                dashboardTitle: "Studio Lexair Launcher",
                dashboardSubtitle: "Desktop-Tool",
                dashboardBody: "Dieses Tool öffnet Ihren Studio-Lexair-Weblauncher im App-Modus. Es ist die empfohlene Art, Studio Lexair auf dem PC zu verwenden: keine Adressleiste, kein Zoom und eine flüssige Integration.",
                dashboardSectionTitle: "Was können Sie tun?",
                dashboardItem1: "Den Weblauncher im Vollbild- oder Fenstermodus öffnen.",
                dashboardItem2: "Dasselbe Anmelde- und Registrierungssystem wie die Website nutzen.",
                dashboardItem3: "Eine Erfahrung ähnlich einer nativen App genießen.",
                btnOpenLauncher: "Store-Launcher öffnen",
                dashboardTagline: "Alle erweiterten Funktionen (Store, Bibliothek, Events, Tokens) werden über den Weblauncher verwaltet.",
                settingsTitle: "Startoptionen",
                settingsSubtitle: "Wählen Sie, wie der Weblauncher geöffnet werden soll, und wählen Sie im Fenstermodus die Auflösung.",
                settingsModeLabel: "Bildschirmmodus",
                settingsModeFullscreen: "Vollbild",
                settingsModeWindow: "Fenster",
                settingsResolutionLabel: "Auflösung (Fenstermodus)",
                btnCancel: "Abbrechen",
                btnSave: "Speichern",
                elapsedPrefix: "Zeit mit geöffnetem Launcher:"
            },
            pt: {
                loadingTitle: "Carregando Studio Lexair...",
                loadingSubtitle: "Preparando a experiência do launcher web...",
                policiesTitle: "Termos do Programa",
                policiesSubtitle: "Leia e aceite para continuar",
                policiesBody: "Esta ferramenta de desktop atua como um launcher dedicado para o launcher web do Studio Lexair. Ela não instala jogos ou aplicativos sozinha, mas abre seu launcher web em modo de aplicativo, em tela cheia e sem controles do navegador.",
                policiesSectionTitle: "Políticas de Uso",
                policiesItem1: "O conteúdo (jogos, apps e ferramentas) é gerenciado a partir do launcher web.",
                policiesItem2: "Contas, login e registro são feitos diretamente no site do Studio Lexair.",
                policiesItem3: "Não compartilhe sua conta ou credenciais com terceiros.",
                policiesItem4: "O uso deste programa implica aceitar os termos e políticas do Studio Lexair.",
                btnDecline: "Não aceito",
                btnAccept: "Aceitar e continuar",
                dashboardTitle: "Studio Lexair Launcher",
                dashboardSubtitle: "Ferramenta de desktop",
                dashboardBody: "Esta ferramenta abre o seu launcher web do Studio Lexair em modo aplicativo. É a forma recomendada de usar o Studio Lexair no PC: sem barra de endereços, sem zoom e com integração fluida.",
                dashboardSectionTitle: "O que você pode fazer?",
                dashboardItem1: "Abrir o launcher web em tela cheia ou em janela.",
                dashboardItem2: "Usar o mesmo sistema de login e registro do site.",
                dashboardItem3: "Aproveitar uma experiência próxima de um app nativo.",
                btnOpenLauncher: "Abrir launcher da loja",
                dashboardTagline: "Todas as funções avançadas (loja, biblioteca, eventos, tokens) são gerenciadas a partir do launcher web.",
                settingsTitle: "Opções de lançamento",
                settingsSubtitle: "Escolha como o launcher web deve abrir e, no modo janela, selecione a resolução.",
                settingsModeLabel: "Modo de tela",
                settingsModeFullscreen: "Tela cheia",
                settingsModeWindow: "Janela",
                settingsResolutionLabel: "Resolução (modo janela)",
                btnCancel: "Cancelar",
                btnSave: "Salvar",
                elapsedPrefix: "Tempo com o launcher aberto:"
            }
        };

        function setText(key, value) {
            document.querySelectorAll('[data-i18n="' + key + '"]').forEach(el => {
                el.textContent = value;
            });
        }

        function applyLanguage(lang) {
            const dict = translations[lang] || translations['es'];
            currentLang = lang;

            for (const key in dict) {
                if (key === 'elapsedPrefix') continue;
                setText(key, dict[key]);
            }

            const prefix = dict['elapsedPrefix'] || translations['es']['elapsedPrefix'];
            if (elapsedLabel) {
                const current = elapsedLabel.textContent;
                const parts = current.split(':');
                const timePart = parts.slice(1).join(':').trim() || '00:00:00';
                elapsedLabel.textContent = prefix + ' ' + timePart;
            }
        }

        function showScreen(name) {
            screenLoading.classList.remove('active');
            screenPolicies.classList.remove('active');
            screenDashboard.classList.remove('active');

            if (name === 'loading') screenLoading.classList.add('active');
            if (name === 'policies') screenPolicies.classList.add('active');
            if (name === 'dashboard') screenDashboard.classList.add('active');
        }

        function showSettingsModal() {
            settingsBackdrop.classList.add('active');
        }

        function hideSettingsModal() {
            settingsBackdrop.classList.remove('active');
        }

        function updateResolutionVisibility(mode) {
            if (mode === 'window') {
                resolutionGroup.style.display = 'block';
            } else {
                resolutionGroup.style.display = 'none';
            }
        }

        function formatTime(sec) {
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = sec % 60;
            const hh = String(h).padStart(2, '0');
            const mm = String(m).padStart(2, '0');
            const ss = String(s).padStart(2, '0');
            return hh + ':' + mm + ':' + ss;
        }

        function startElapsedTimer() {
            if (elapsedTimer) clearInterval(elapsedTimer);
            elapsedTimer = setInterval(async () => {
                try {
                    const seconds = await pywebview.api.get_elapsed_time();
                    const dict = translations[currentLang] || translations['es'];
                    const prefix = dict['elapsedPrefix'] || translations['es']['elapsedPrefix'];
                    if (elapsedLabel) {
                        elapsedLabel.textContent = prefix + ' ' + formatTime(seconds);
                    }
                } catch (e) {
                    console.error('Error obteniendo tiempo:', e);
                }
            }, 1000);
        }

        async function init() {
            try {
                showScreen('loading');
                const state = await pywebview.api.get_initial_state();

                langSelect.value = state.language || 'es';
                applyLanguage(langSelect.value);

                setTimeout(() => {
                    if (state.policiesAccepted) {
                        showScreen('dashboard');
                    } else {
                        showScreen('policies');
                    }

                    const mode = state.launchMode || 'fullscreen';
                    document.querySelectorAll('input[name="launchMode"]').forEach(r => {
                        r.checked = (r.value === mode);
                    });
                    updateResolutionVisibility(mode);
                }, 1000);
            } catch (e) {
                console.error('Error en init:', e);
                showScreen('dashboard');
            }
        }

        btnAcceptPolicies.addEventListener('click', async () => {
            try {
                await pywebview.api.accept_policies();
                showScreen('dashboard');
            } catch (e) {
                console.error('Error al aceptar políticas:', e);
            }
        });

        btnDeclinePolicies.addEventListener('click', () => {
            pywebview.api.exit_app();
        });

        btnOpenLauncher.addEventListener('click', async () => {
            try {
                const launchInfo = await pywebview.api.get_launch_mode();
                if (!launchInfo || !launchInfo.mode) {
                    showSettingsModal();
                } else {
                    await pywebview.api.open_launcher();
                    startElapsedTimer();
                }
            } catch (e) {
                console.error('Error al abrir launcher:', e);
            }
        });

        btnCloseLauncher.addEventListener('click', async () => {
            try {
                await pywebview.api.close_launcher();
                if (elapsedTimer) {
                    clearInterval(elapsedTimer);
                    elapsedTimer = null;
                }
                const dict = translations[currentLang] || translations['es'];
                const prefix = dict['elapsedPrefix'] || translations['es']['elapsedPrefix'];
                if (elapsedLabel) {
                    elapsedLabel.textContent = prefix + ' 00:00:00';
                }
            } catch (e) {
                console.error('Error al cerrar launcher:', e);
            }
        });

        btnOpenSettings.addEventListener('click', () => {
            showSettingsModal();
        });

        btnCloseSettings.addEventListener('click', () => {
            hideSettingsModal();
        });

        document.querySelectorAll('input[name="launchMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateResolutionVisibility(e.target.value);
            });
        });

        btnSaveSettings.addEventListener('click', async () => {
            try {
                const mode = document.querySelector('input[name="launchMode"]:checked').value;
                let width = null;
                let height = null;

                if (mode === 'window') {
                    const value = resolutionSelect.value;
                    const parts = value.split('x');
                    width = parseInt(parts[0], 10) || 1280;
                    height = parseInt(parts[1], 10) || 720;
                }

                await pywebview.api.set_launch_mode(mode, width, height);
                hideSettingsModal();
            } catch (e) {
                console.error('Error al guardar ajustes:', e);
            }
        });

        btnMinimize.addEventListener('click', () => {
            pywebview.api.minimize_app();
        });
        btnClose.addEventListener('click', () => {
            pywebview.api.exit_app();
        });

        langSelect.addEventListener('change', async (e) => {
            const lang = e.target.value;
            applyLanguage(lang);
            try {
                await pywebview.api.set_language(lang);
            } catch (e) {
                console.error('Error guardando idioma:', e);
            }
        });

        document.addEventListener('DOMContentLoaded', init);
        init();
    })();
    </script>
</body>
</html>
"""

    # Crear ventana principal
    window = webview.create_window(
        title="Studio Lexair - Herramienta de Escritorio",
        html=html_tool,
        width=640,
        height=480,
        resizable=True,
        zoomable=False,
        frameless=True,
        js_api=api,
    )

    api.window = window
    webview.start()


if __name__ == "__main__":
    main()
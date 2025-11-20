import webview

LAUNCHER_URL = "https://studiolexair.servegame.com/"  # URL pública de tu launcher web


class Api:
    """API expuesta al WebView de la herramienta local.

    De momento solo abre el launcher web en una nueva ventana a pantalla completa.
    Más adelante aquí se puede integrar login/registro con Supabase vía Python.
    """

    def open_launcher(self):
        """Abrir el launcher web en una nueva ventana a pantalla completa."""
        webview.create_window(
            title="Studio Lexair Launcher",
            url=LAUNCHER_URL,
            fullscreen=True,
            zoomable=False,
            confirm_close=True,
        )


def main():
    """Punto de entrada de la herramienta de escritorio de Studio Lexair."""

    # HTML embebido para la ventana principal (herramienta)
    html_tool = f"""<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='utf-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <title>Studio Lexair - Herramienta de Escritorio</title>
    <style>
        * {{ box-sizing: border-box; }}
        body {{
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            color: #f9fafb;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }}
        .card {{
            background: rgba(15, 23, 42, 0.96);
            border-radius: 18px;
            padding: 22px 26px;
            box-shadow: 0 14px 45px rgba(15, 23, 42, 0.85);
            max-width: 480px;
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
        .launch-button {{
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
        .launch-button:hover {{
            transform: translateY(-1px);
            box-shadow: 0 14px 34px rgba(34, 197, 94, 0.8);
            filter: brightness(1.05);
        }}
        .launch-button:active {{
            transform: translateY(1px);
            box-shadow: 0 6px 20px rgba(34, 197, 94, 0.5);
        }}
        .launch-icon {{
            width: 16px;
            height: 16px;
        }}
        .footer-text {{
            margin-top: 10px;
            font-size: 11px;
            color: #9ca3af;
        }}
        .tagline {{
            font-size: 12px;
            color: #e5e7eb;
            margin-top: 4px;
        }}
    </style>
</head>
<body>
    <div class='card'>
        <div class='header'>
            <div class='logo'>SL</div>
            <div>
                <h1>Studio Lexair Launcher</h1>
                <p class='subtitle'>Juegos, apps y herramientas en un solo lugar</p>
            </div>
        </div>
        <p class='body-text'>
            Esta herramienta de escritorio abre tu launcher web de Studio Lexair
            en modo aplicación, a pantalla completa y sin controles del navegador.
            Es la forma recomendada de usar el launcher en PC.
        </p>
        <p class='section-title'>¿Qué puedes hacer desde aquí?</p>
        <ul>
            <li>Abrir el launcher web en modo pantalla completa.</li>
            <li>Usar el mismo sistema de registro e inicio de sesión de la web.</li>
            <li>Disfrutar de una experiencia más cercana a una app nativa.</li>
        </ul>
        <button class='launch-button' onclick='pywebview.api.open_launcher()'>
            <svg class='launch-icon' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                <path d='M5 12h14'></path>
                <path d='M12 5l7 7-7 7'></path>
            </svg>
            Abrir launcher de tienda
        </button>
        <p class='footer-text'>
            El inicio de sesión y registro se realizan directamente en el launcher web,
            usando Supabase y la misma cuenta que ya tienes.
        </p>
    </div>
</body>
</html>
"""

    api = Api()

    # Crear la ventana principal de la herramienta
    window = webview.create_window(
        title="Studio Lexair - Herramienta de Escritorio",
        html=html_tool,
        width=520,
        height=420,
        resizable=False,
        zoomable=False,
        js_api=api,   # 👈 API expuesta al HTML
    )

    # Iniciar el loop de la app
    webview.start()


if __name__ == "__main__":
    main()
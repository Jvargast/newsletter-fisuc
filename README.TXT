FISUC Newsletter

Modo web local:

Windows:
1) Abrir "Start.bat"
2) El navegador se abrirá en http://127.0.0.1:3000/admin.html

macOS:
1) Doble clic en "Start.command"
   - Si no abre: clic derecho -> Abrir (primera vez por Gatekeeper)
2) El navegador se abrirá en http://127.0.0.1:3000/admin.html

Modo app de escritorio:

1) Instalar dependencias:
   npm install

2) Abrir la app en desarrollo:
   npm run desktop:dev

3) Generar app empaquetada local:
   npm run desktop:package

4) Generar artefacto distribuible:
   npm run desktop:make

Distribucion macOS:

1) Instalar dependencias del proyecto:
   npm install

2) Generar la app macOS empaquetada:
   npm run desktop:package:mac

3) Generar artefactos para distribuir en macOS:
   npm run desktop:make:mac

4) Resultado esperado:
   - Si el maker DMG esta instalado, Forge generara un .dmg para macOS.
   - Ademas puede generar un .zip como respaldo.

5) Donde quedaran:
   - app empaquetada: out/
   - artefactos distribuibles: out/make/

6) Recomendado antes de repartir:
   - probar la app en otro Mac
   - definir un icono .icns propio
   - firmar y notarizar la app para evitar alertas de Gatekeeper

Notas:
- En modo web local, el envio sigue leyendo SMTP desde .env.
- En modo app de escritorio, la primera vez se abre una configuracion guiada para SMTP y remitente. Esa configuracion se guarda solo en el equipo del usuario.
- En modo escritorio empaquetado, las imagenes subidas se guardan fuera del bundle, en la carpeta de datos del usuario.
- El paquete generado depende de la plataforma donde se construye. Para crear un paquete nativo de Windows, compilar en Windows; para macOS, compilar en macOS.
- Si aun no se instala @electron-forge/maker-dmg, la configuracion seguira funcionando con ZIP y el DMG no se generara hasta correr npm install nuevamente.

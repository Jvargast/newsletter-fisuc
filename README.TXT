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

Notas:
- Configurar SMTP en .env.
- En modo escritorio empaquetado, las imagenes subidas se guardan fuera del bundle, en la carpeta de datos del usuario.
- El paquete generado depende de la plataforma donde se construye. Para crear un paquete nativo de Windows, compilar en Windows; para macOS, compilar en macOS.

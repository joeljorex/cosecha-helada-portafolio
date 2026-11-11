# Documento técnico · Requerimientos de hardware y software para el desarrollo de videojuegos y animación

**Caso práctico:** *Cosecha Helada*, un juego de plataformas 2D para navegador desarrollado por un equipo de 2 personas.
**Equipo:** UTH · IDGS 8-2 · ver integrantes en el [GDD](GDD.md#integrantes).
**Fecha:** noviembre 2026.

---

## 1. Objetivo y alcance

Definir qué equipo de cómputo y qué herramientas de software se necesitan para tres perfiles de trabajo:

| Perfil | Ejemplos de tareas |
|---|---|
| **A. Videojuego 2D / web** | Programar en JavaScript (Phaser), pixel art, mapas en Tiled y audio chiptune. *Es el caso práctico.* |
| **B. Animación 2D y arte digital** | Animación cuadro por cuadro o con huesos, ilustración, edición de video |
| **C. 3D y motores pesados** | Modelado y animación 3D (Blender), Unity o Unreal Engine, *render* |

Los valores de hardware son **de referencia**: antes de comprar o instalar, hay que revisar los requisitos oficiales de la versión vigente de cada programa.

---

## 2. Requerimientos de hardware

### 2.1 Equipo de cómputo

| Componente | Mínimo (perfil A) | Recomendado (perfiles A + B) | Avanzado (perfil C) |
|---|---|---|---|
| **Procesador** | 4 núcleos (Intel Core i3 / Ryzen 3, 8.ª generación o más nuevo) | 6 a 8 núcleos (Core i5/i7 o Ryzen 5/7) | 8 núcleos o más con alta frecuencia (Core i7/i9 o Ryzen 7/9) |
| **Memoria RAM** | 8 GB | 16 GB | 32 GB o más |
| **Tarjeta de video** | Integrada (Intel Iris Xe / Radeon Vega) con WebGL 2 | Dedicada de 4 GB de VRAM (GTX 1650 / RX 6500 o mejor) | Dedicada de 8 a 12 GB de VRAM (RTX 3060/4060 o mejor), compatible con DirectX 12 y Vulkan |
| **Almacenamiento** | SSD de 256 GB | SSD NVMe de 512 GB | SSD NVMe de 1 TB + disco de 2 TB para respaldos y *renders* |
| **Pantalla** | 1920×1080 | 1920×1080 IPS con buena fidelidad de color (≈100 % sRGB) | Dos monitores, o uno de 1440p o más |
| **Sistema operativo** | Windows 10/11, macOS o Linux de 64 bits | Windows 11 / macOS reciente | Windows 11 de 64 bits (lo más compatible con Unreal) |
| **Internet** | 10 Mbps | 20 Mbps o más | 50 Mbps o más (descargas de motores y recursos de varios GB) |

> **Referencias:** Blender pide como mínimo 8 GB de RAM y una tarjeta con 2 GB de VRAM, y recomienda 32 GB y 8 GB de VRAM. Unreal Engine 5 recomienda 32 GB de RAM y una tarjeta con 8 GB de VRAM. Un juego en Phaser corre bien en cualquier equipo con un navegador moderno.

### 2.2 Periféricos

| Periférico | Para qué | Prioridad |
|---|---|---|
| Tableta gráfica (tipo Wacom, XP-Pen o Huion) | Dibujar *sprites*, fondos y animación cuadro por cuadro | Alta para arte y animación |
| Audífonos cerrados de estudio | Mezclar música y efectos sin "colorear" el sonido | Alta para audio |
| Micrófono USB | Grabar voces, efectos y el video de presentación | Media |
| Control (Xbox o compatible) | Probar la jugabilidad con control | Media |
| Celular Android o iPhone | Probar los controles táctiles y el rendimiento en móvil | Alta (el juego también es para celular) |
| Disco externo o almacenamiento en la nube | Respaldo de los archivos fuente | Alta |
| No-break (UPS) | Evitar perder trabajo o dañar el equipo si se va la luz | Recomendado |

### 2.3 Equipo del caso práctico

Para *Cosecha Helada* basta el nivel **Recomendado (A + B)**: laptops con 16 GB de RAM y SSD, una tableta gráfica para quien hace el arte, audífonos para quien hace el audio y al menos un celular de pruebas.

---

## 3. Herramientas de software

Licencia: **Libre** = código abierto y gratis · **Gratis** = sin costo, pero propietario · **Pago** = licencia o suscripción.

### 3.1 Motores y *frameworks*

| Herramienta | Uso | Licencia | Plataformas |
|---|---|---|---|
| **Phaser 3** | *Framework* 2D en JavaScript para juegos de navegador | Libre (MIT) | Web |
| **Godot 4** | Motor 2D/3D ligero, con su propio lenguaje GDScript o C# | Libre (MIT) | Windows, macOS, Linux; exporta a web y móvil |
| **Unity 6** | Motor 2D/3D con C# y una tienda de recursos enorme | Gratis (Personal, con límite de ingresos) / Pago | Windows, macOS, Linux |
| **Unreal Engine 5** | Motor 3D de alta fidelidad, con Blueprints y C++ | Gratis, con regalías a partir de cierto nivel de ingresos | Windows, macOS, Linux |
| **GDevelop / Construct** | Motores sin código, buenos para prototipos rápidos | Libre / Gratis con límites y Pago | Web y escritorio |

### 3.2 Programación, control de versiones y gestión

| Herramienta | Uso | Licencia |
|---|---|---|
| **Visual Studio Code** | Editor de código con extensiones para JavaScript, Git y Live Server | Gratis |
| **Node.js + npm** | Servidor local, empaquetado (Vite) y librerías | Libre |
| **Git** | Control de versiones | Libre |
| **GitHub** | Repositorio remoto, *issues*, *pull requests*, Projects (tarjetas) y Pages (publicación) | Gratis (planes de pago opcionales) |
| **GitHub Desktop** | Cliente gráfico de Git para quien no use la terminal | Gratis |
| **Navegadores (Chrome, Firefox, Edge)** | Pruebas y depuración con las DevTools | Gratis |

### 3.3 Arte 2D, pixel art e interfaz

| Herramienta | Uso | Licencia |
|---|---|---|
| **Aseprite** | Pixel art y animación de *sprites* | Pago único (el código fuente se puede compilar gratis) |
| **LibreSprite / Piskel** | Alternativas gratuitas a Aseprite | Libre |
| **Krita** | Ilustración y pintura digital, fondos, animación sencilla | Libre |
| **GIMP** | Edición de imágenes | Libre |
| **Inkscape** | Gráficos vectoriales: logos, interfaz, iconos | Libre |
| **Figma** | Bocetos de interfaz y menús | Gratis (con límites) / Pago |
| **Adobe Photoshop / Illustrator** | Estándar de la industria para edición y vectores | Pago (suscripción) |

### 3.4 Animación 2D y 3D

| Herramienta | Uso | Licencia |
|---|---|---|
| **Blender** | Modelado, *rigging*, animación 3D, *render*, edición de video y animación 2D con Grease Pencil | Libre |
| **OpenToonz** | Animación 2D tradicional y *cut-out* | Libre |
| **Pencil2D** | Animación cuadro por cuadro sencilla | Libre |
| **Synfig Studio** | Animación vectorial con interpolación | Libre |
| **Spine / DragonBones** | Animación 2D con huesos para juegos | Pago / Gratis |
| **Autodesk Maya / 3ds Max** | Animación y modelado 3D profesional | Pago (hay licencia educativa gratuita) |
| **Toon Boom Harmony** | Animación 2D profesional | Pago |

### 3.5 Audio y música

| Herramienta | Uso | Licencia |
|---|---|---|
| **BeepBox / JummBox** | Música chiptune en el navegador | Libre |
| **LMMS** | Estación de trabajo de audio (DAW) para componer | Libre |
| **Audacity** | Grabar, recortar y normalizar audio | Libre |
| **jsfxr / ChipTone / Bfxr** | Generadores de efectos de sonido estilo retro | Gratis |
| **Reaper** | DAW profesional y ligero | Pago (con periodo de prueba) |
| **Freesound / OpenGameArt** | Bancos de sonidos y música con licencias CC0 o CC-BY | Gratis (respetando cada licencia) |

### 3.6 Diseño de niveles, video y publicación

| Herramienta | Uso | Licencia |
|---|---|---|
| **Tiled** | Editor de mapas por *tiles*; exporta JSON que lee Phaser | Libre |
| **LDtk** | Editor de niveles 2D moderno | Libre |
| **OBS Studio** | Grabar el video del juego y del código | Libre |
| **DaVinci Resolve / Shotcut** | Editar el video de presentación | Gratis / Libre |
| **GitHub Pages / itch.io** | Publicar el juego web | Gratis |

---

## 4. Stack elegido para el caso práctico

| Necesidad | Herramienta elegida | Por qué |
|---|---|---|
| Motor | **Phaser 3** | Es JavaScript (lo que ya sabe el equipo), pesa poco y se publica gratis en GitHub Pages |
| Código | **VS Code + Git + GitHub** | Gratis y con integración directa con *issues* y *pull requests* |
| Mapas | **Tiled** | Exporta JSON que Phaser carga directamente |
| *Sprites* | **Aseprite** (o **LibreSprite**, sin costo) | Pixel art y animación en un solo programa |
| Fondos e interfaz | **Krita + Inkscape** | Libres y suficientes para el estilo del juego |
| Música | **BeepBox** | Chiptune original sin problemas de licencia |
| Efectos | **jsfxr + Audacity** | Efectos retro en segundos y edición sencilla |
| Gestión | **GitHub Projects** | Las tarjetas viven junto al código |
| Video | **OBS Studio + Shotcut** | Grabar y editar sin costo |

**Costo de software del caso práctico:** **$0** usando LibreSprite en lugar de Aseprite. Aseprite es el único pago opcional.

---

## 5. Riesgos técnicos y cómo se atienden

| Riesgo | Mitigación |
|---|---|
| Equipos de los integrantes con poca RAM | El perfil A funciona con 8 GB. Las tareas pesadas (video) se hacen en el mejor equipo |
| Conflictos de Git en archivos binarios (arte, audio) | Un responsable por archivo, exportar a `.png`/`.ogg` y Git LFS para los fuentes |
| Música o arte con licencia dudosa | Solo recursos propios, CC0 o CC-BY con crédito en los Créditos |
| Mal rendimiento en celular | Pruebas semanales en un celular real; *sprites* en atlas; 60 FPS como meta |
| Pérdida de archivos | Todo en GitHub, más un respaldo semanal en la nube |

## 6. Referencias

- Phaser: https://phaser.io · Godot: https://godotengine.org · Unity: https://unity.com · Unreal Engine: https://www.unrealengine.com
- Blender, requisitos: https://www.blender.org/download/requirements/
- Tiled: https://www.mapeditor.org · Aseprite: https://www.aseprite.org · LibreSprite: https://libresprite.github.io
- Krita: https://krita.org · Inkscape: https://inkscape.org · GIMP: https://www.gimp.org
- BeepBox: https://www.beepbox.co · jsfxr: https://sfxr.me · Audacity: https://www.audacityteam.org · LMMS: https://lmms.io
- OBS Studio: https://obsproject.com · GitHub Docs (Projects y Pages): https://docs.github.com

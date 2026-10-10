<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contador de Insectos - Versión 2.0 Meticulosa</title>
    <link rel="stylesheet" href="style.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background-color: #f4f6f7;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        /* Forzar que la imagen no sea gigante y se ajuste a la pantalla */
        #canvas-insectos {
            width: 100% !important;
            height: auto !important;
            max-height: 700px;
            object-fit: contain;
            border: 2px solid #ccc;
            background: #000;
            display: block;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Contador de Insectos Ver 2.0 🪲</h1>
        <p>Sube tu foto de la trampa para realizar un conteo ultra meticuloso por categorías.</p>
        
        <input type="file" id="subir-imagen" accept="image/*">
        <br>
        
        <canvas id="canvas-insectos"></canvas>
        
        <div id="resumen-conteo"></div>
    </div>

    <script src="script2.js"></script>
    <script>
        document.getElementById('subir-imagen').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.onload = function() {
                        procesarImagenConResumen('canvas-insectos', img);
                    }
                    img.src = event.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    </script>
</body>
</html>
Haz clic en "Commit changes".

Paso 2: Actualizar script2.js para un conteo preciso y sin dejar moscas fuera
Entra a tu archivo script2.js en GitHub y haz clic en el lápiz para editarlo.

Borra todo lo anterior y pega este código equilibrado:

JavaScript
// Función principal optimizada para conteo preciso de moscas sin omitir zonas
function procesarImagenConResumen(canvasId, imgElement) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    
    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;
    
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    
    let conteoMoscas = 0;
    let conteoPolillasBlancas = 0;
    let conteoFragmentosClaros = 0;

    const width = canvas.width;
    const height = canvas.height;
    const visited = new Uint8Array(width * height);

    for (let y = 3; y < height - 3; y += 2) {
        for (let x = 3; x < width - 3; x += 2) {
            const idx = (y * width + x);
            if (visited[idx]) continue;

            const pIdx = idx * 4;
            const r = pixels[pIdx];
            const g = pixels[pIdx + 1];
            const b = pixels[pIdx + 2];

            const esOscuro = (r < 75 && g < 75 && b < 75 && (g - r) < 18);
            const esClaro = (r > 170 && g > 170 && b > 150 && Math.abs(r - g) < 20);

            if (esClaro || esOscuro) {
                let areaSize = 0;
                let minX = x, maxX = x, minY = y, maxY = y;
                let queue = [[x, y]];
                visited[idx] = 1;

                while (queue.length > 0) {
                    const [currX, currY] = queue.pop();
                    areaSize++;

                    if (currX < minX) minX = currX;
                    if (currX > maxX) maxX = currX;
                    if (currY < minY) minY = currY;
                    if (currY > maxY) maxY = currY;

                    const vecinos = [
                        [currX + 2, currY], [currX - 2, currY],
                        [currX, currY + 2], [currX, currY - 2]
                    ];

                    for (let [vx, vy] of vecinos) {
                        if (vx >= 0 && vx < width && vy >= 0 && vy < height) {
                            const vIdx = (vy * width + vx);
                            if (!visited[vIdx]) {
                                const vpIdx = vIdx * 4;
                                const vr = pixels[vpIdx];
                                const vg = pixels[vpIdx + 1];
                                const vb = pixels[vpIdx + 2];

                                const matchClaro = esClaro && (vr > 150 && vg > 150 && vb > 130);
                                const matchOscuro = esOscuro && (vr < 85 && vg < 85 && vb < 85);

                                if (matchClaro || matchOscuro) {
                                    visited[vIdx] = 1;
                                    queue.push([vx, vy]);
                                }
                            }
                        }
                    }
                }

                const anchoObjeto = maxX - minX;
                const altoObjeto = maxY - minY;
                const relacionAspecto = Math.max(anchoObjeto, altoObjeto) / (Math.min(anchoObjeto, altoObjeto) || 1);
                
                // Ignorar líneas exageradamente alargadas (letras o bordes rectos)
                const esUnaLinea = relacionAspecto > 3.5 && areaSize > 40;

                if (!esUnaLinea) {
                    const centroX = Math.floor((minX + maxX) / 2);
                    const centroY = Math.floor((minY + maxY) / 2);

                    if (esClaro) {
                        if (areaSize >= 15 && areaSize < 70) {
                            conteoFragmentosClaros++;
                            marcarPuntoConNumero(ctx, centroX, centroY, '#FFFF00', '');
                        } else if (areaSize >= 70 && areaSize < 600) {
                            conteoPolillasBlancas++;
                            marcarPuntoConNumero(ctx, centroX, centroY, '#00FFFF', '');
                        }
                    } else if (esOscuro) {
                        // Rango equilibrado para capturar todas las moscas reales sin fragmentarlas
                        if (areaSize >= 40 && areaSize < 500) {
                            conteoMoscas++;
                            marcarPuntoWithNumber(ctx, centroX, centroY, '#FF0000', conteoMoscas);
                        }
                    }
                }
            }
        }
    }

    mostrarResumenDetallado({
        "🪰 Moscas y Cuerpos Oscuros": conteoMoscas,
        "🦋 Polillas y Mariposas Blancas": conteoPolillasBlancas,
        "✨ Fragmentos y Alas Claras": conteoFragmentosClaros,
        "📌 Total Elementos Claros Detectados": conteoPolillasBlancas + conteoFragmentosClaros,
        "🔍 GRAN TOTAL DE ELEMENTOS DETECTADOS": conteoMoscas + conteoPolillasBlancas + conteoFragmentosClaros
    });
}

function marcarPuntoWithNumber(ctx, x, y, color, numero) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    if (numero) {
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(numero, x + 5, y + 4);
    }
}

function marcarPuntoConNumero(ctx, x, y, color, numero) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
}

function mostrarResumenDetallado(resumenData) {
    let contenedor = document.getElementById('resumen-conteo');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'resumen-conteo';
        contenedor.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background-color: #ffffff;
            border: 2px solid #2c3e50;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            max-width: 450px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(contenedor);
    }

    let htmlHTML = `<h3 style="margin-top:0; color:#2c3e50; border-bottom:1px solid #ccc; padding-bottom:5px;">📊 Resumen del Conteo Meticuloso</h3><ul style="list-style:none; padding:0;">`;
    
    for (const [especie, cantidad] of Object.entries(resumenData)) {
        const esTotal = especie.includes("TOTAL");
        htmlHTML += `
            <li style="display:flex; justify-content:space-between; padding: 6px 0; border-bottom: 1px dashed #eee; ${esTotal ? 'font-weight:bold; color:#16a085; font-size:1.05em;' : ''}">
                <span>${especie}:</span>
                <span style="font-weight:bold; margin-left: 15px;">${cantidad}</span>
            </li>`;
    }
    htmlHTML += `</ul>`;
    contenedor.innerHTML = htmlHTML;
}

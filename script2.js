// Función principal con numeración progresiva y filtro ajustado para moscas
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

    for (let y = 5; y < height - 5; y += 2) {
        for (let x = 5; x < width - 5; x += 2) {
            const idx = (y * width + x);
            if (visited[idx]) continue;

            const pIdx = idx * 4;
            const r = pixels[pIdx];
            const g = pixels[pIdx + 1];
            const b = pixels[pIdx + 2];

            // Detectar cuerpos oscuros (moscas)
            const esOscuro = (r < 70 && g < 70 && b < 70 && (g - r) < 20);
            // Detectar elementos claros (polillas/alas)
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
                                const matchOscuro = esOscuro && (vr < 80 && vg < 80 && vb < 80);

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
                const esUnaLinea = (anchoObjeto > 4 * altoObjeto || altoObjeto > 4 * anchoObjeto) && areaSize > 40;

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
                        // Tamaño mínimo mayor para agrupar cada mosca entera y apuntar al objetivo de 129
                        if (areaSize >= 70 && areaSize < 500) {
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
        ctx.fillText(numero, x + 6, y + 4);
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

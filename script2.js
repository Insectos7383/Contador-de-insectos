// Función principal optimizada para procesar al instante sin congelar el navegador
function procesarImagenConResumen(canvasId, imgElement) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    
    // Limitar la resolución máxima de análisis para evitar que el navegador se congele
    let targetWidth = imgElement.naturalWidth || imgElement.width;
    let targetHeight = imgElement.naturalHeight || imgElement.height;
    const maxDim = 1000;
    
    if (targetWidth > maxDim || targetHeight > maxDim) {
        if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
            targetWidth = maxDim;
        } else {
            targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
            targetHeight = maxDim;
        }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    ctx.drawImage(imgElement, 0, 0, targetWidth, targetHeight);
    
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const pixels = imgData.data;
    
    let conteoMoscas = 0;
    let conteoPolillasBlancas = 0;
    let conteoFragmentosClaros = 0;

    const visited = new Uint8Array(targetWidth * targetHeight);
    const step = 3;

    for (let y = 5; y < targetHeight - 5; y += step) {
        for (let x = 5; x < targetWidth - 5; x += step) {
            const idx = (y * targetWidth + x);
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

                // Cola optimizada para procesar al instante
                let head = 0;
                while (head < queue.length && queue.length < 1500) {
                    const [currX, currY] = queue[head++];
                    areaSize++;

                    if (currX < minX) minX = currX;
                    if (currX > maxX) maxX = currX;
                    if (currY < minY) minY = currY;
                    if (currY > maxY) maxY = currY;

                    const vecinos = [
                        [currX + step, currY], [currX - step, currY],
                        [currX, currY + step], [currX, currY - step]
                    ];

                    for (let [vx, vy] of vecinos) {
                        if (vx >= 0 && vx < targetWidth && vy >= 0 && vy < targetHeight) {
                            const vIdx = (vy * targetWidth + vx);
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
                const esUnaLinea = relacionAspecto > 3.5 && areaSize > 25;

                if (!esUnaLinea) {
                    const centroX = Math.floor((minX + maxX) / 2);
                    const centroY = Math.floor((minY + maxY) / 2);

                    if (esClaro) {
                        if (areaSize >= 5 && areaSize < 30) {
                            conteoFragmentosClaros++;
                            marcarPuntoConNumero(ctx, centroX, centroY, '#FFFF00', '');
                        } else if (areaSize >= 30 && areaSize < 300) {
                            conteoPolillasBlancas++;
                            marcarPuntoConNumero(ctx, centroX, centroY, '#00FFFF', '');
                        }
                    } else if (esOscuro) {
                        if (areaSize >= 8 && areaSize < 250) {
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

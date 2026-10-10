// Función principal con umbrales equilibrados para detectar insectos sobre la trampa
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

    for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
            const idx = (y * width + x);
            if (visited[idx]) continue;

            const pIdx = idx * 4;
            const r = pixels[pIdx];
            const g = pixels[pIdx + 1];
            const b = pixels[pIdx + 2];

            // Umbrales directos de insectos (claros y oscuros)
            const esClaro = (r > 150 && g > 150 && b > 130);
            const esOscuro = (r < 80 && g < 80 && b < 80);

            if (esClaro || esOscuro) {
                let areaSize = 0;
                let queue = [[x, y]];
                visited[idx] = 1;

                while (queue.length > 0) {
                    const [currX, currY] = queue.pop();
                    areaSize++;

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

                                const matchClaro = esClaro && (vr > 140 && vg > 140 && vb > 120);
                                const matchOscuro = esOscuro && (vr < 90 && vg < 90 && vb < 90);

                                if (matchClaro || matchOscuro) {
                                    visited[vIdx] = 1;
                                    queue.push([vx, vy]);
                                }
                            }
                        }
                    }
                }

                if (esClaro) {
                    if (areaSize >= 10 && areaSize < 50) {
                        conteoFragmentosClaros++;
                        marcarPunto(ctx, x, y, '#FFFF00', conteoFragmentosClaros);
                    } else if (areaSize >= 50) {
                        conteoPolillasBlancas++;
                        marcarPunto(ctx, x, y, '#00FFFF', conteoPolillasBlancas);
                    }
                } else if (esOscuro) {
                    if (areaSize >= 15 && areaSize < 200) {
                        conteoMoscas++;
                        marcarPunto(ctx, x, y, '#FF0000', conteoMoscas);
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

function marcarPunto(ctx, x, y, color, numero) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
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

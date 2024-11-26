let insectCount = 0;
let canvas, ctx;
let image = null; // To store the uploaded image for future use
let redSpots = []; // Array to store the positions of red spots

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate if the uploaded file is an image
    if (!file.type.startsWith("image/")) {
        alert("Por favor, sube un archivo de imagen válido.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        image = new Image();
        image.src = e.target.result;
        image.onload = function () {
            processImage(image);
        };
    };
    reader.readAsDataURL(file);
}

// Function to process the image and display it on canvas
function processImage(img) {
    canvas = document.getElementById('imageCanvas');
    ctx = canvas.getContext('2d');

    // Scale the image to fit within the canvas limits
    const maxCanvasWidth = 800; // Ancho máximo
    const maxCanvasHeight = 600; // Alto máximo
    const scale = Math.min(maxCanvasWidth / img.width, maxCanvasHeight / img.height, 1);

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Reset the insect count and update the display
    insectCount = 0;
    redSpots = []; // Reset red spots when a new image is uploaded
    document.getElementById('insect-count').textContent = insectCount;

    // Enable manual counting by setting up a click event listener
    enableManualCounting();
}

// Enable manual counting by mouse click
function enableManualCounting() {
    // Ensure the click event is only attached once to avoid multiple listeners
    canvas.removeEventListener('click', handleCanvasClick);
    canvas.addEventListener('click', handleCanvasClick);
}

// Handle click event on the canvas
function handleCanvasClick(event) {
    // Get the coordinates of the mouse click relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Draw a small red circle at the clicked position to mark the insect
    const radius = 15;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fillStyle = 'red';
    ctx.fill();

    // Store the position of the red spot
    redSpots.push({ x, y, radius });

    // Increment insect count and update display
    insectCount++;
    document.getElementById('insect-count').textContent = insectCount;

    // Draw the count number inside the red circle in black
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    const textWidth = ctx.measureText(insectCount).width;
    const textX = x - textWidth / 2; // Center the text horizontally
    const textY = y + 6; // Adjust text position vertically inside the circle
    ctx.fillText(insectCount, textX, textY);
}

// Reset the insect count and remove the red spots (but keep the image)
function resetInsectCount() {
    insectCount = 0;
    document.getElementById('insect-count').textContent = insectCount;

    // Clear red spots from the canvas (keep the image)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (image) {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height); // Redraw the uploaded image
    }

    redSpots = []; // Reset the red spots array
}

// Download the insect count data
function downloadCountData() {
    const count = document.getElementById('insect-count').textContent;

    let fileName = document.getElementById('file-name').value.trim();
    if (fileName === "") {
        fileName = "insect_count";
    }
    fileName += ".txt";

    const fileContent = `Insect Counter Results:\n\nFile Name: ${fileName}\nCount: ${count}\nDate: ${new Date().toLocaleString()}`;

    const blob = new Blob([fileContent], { type: 'text/plain' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;

    link.click();
    URL.revokeObjectURL(link.href);
}

// Send insect count data to the server
function sendCountToServer() {
    const count = parseInt(document.getElementById('insect-count').textContent);

    if (isNaN(count) || count < 0) {
        alert("El conteo no es válido. Inténtalo de nuevo.");
        return;
    }

    const data = {
        date: new Date().toISOString(),
        insectCount: count,
    };

    const serverUrl = "https://mi-servidor.com/api/insectos";

    const sendButton = document.getElementById("send-button");
    sendButton.disabled = true;
    sendButton.textContent = "Enviando...";

    fetch(serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((result) => {
            console.log("Datos enviados exitosamente:", result);
            alert("Los datos fueron enviados al servidor.");
        })
        .catch((error) => {
            console.error("Error al enviar los datos:", error);
            alert("Hubo un problema al enviar los datos.");
        })
        .finally(() => {
            sendButton.disabled = false;
            sendButton.textContent = "Enviar";
        });
}
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then((registration) => {
            console.log('Service Worker registrado:', registration);
        })
        .catch((error) => {
            console.error('Error al registrar el Service Worker:', error);
        });
}
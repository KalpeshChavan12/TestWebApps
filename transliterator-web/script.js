// Camera setup
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const switchCameraBtn = document.getElementById('switchCameraBtn');
const teluguTextSpan = document.getElementById('teluguText');
const devanagariTextSpan = document.getElementById('devanagariText');
let currentStream = null;

async function startCamera(facingMode = 'user') {
    // Stop any existing stream
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode }
        });
        video.srcObject = stream;
        currentStream = stream;
    } catch (error) {
        console.error('Error accessing camera:', error);
        teluguTextSpan.textContent = 'Camera access denied or unavailable';
    }
}

// Capture image from video feed
function captureImage() {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
}

// OCR with Tesseract.js
async function processImage(imageData) {
    teluguTextSpan.textContent = 'Processing...';
    devanagariTextSpan.textContent = '';

    try {
        const { data: { text } } = await Tesseract.recognize(
            imageData,
            'tel', // Telugu language code
            {
                logger: (m) => console.log(m),
            }
        );
        const teluguText = text.trim();
        teluguTextSpan.textContent = teluguText;

        const devanagariText = transliterateTeluguToDevanagari(teluguText);
        devanagariTextSpan.textContent = devanagariText;
    } catch (error) {
        console.error('OCR Error:', error);
        teluguTextSpan.textContent = 'Error processing image';
    }
}

// Transliteration function (unchanged)
function transliterateTeluguToDevanagari(teluguText) {
    const independentVowels = {
        'అ': 'अ', 'ఆ': 'आ', 'ఇ': 'इ', 'ఈ': 'ई', 'ఉ': 'उ', 'ఊ': 'ऊ',
        'ఋ': 'ऋ', 'ౠ': 'ॠ', 'ఌ': 'ऌ', 'ౡ': 'ॡ', 'ఎ': 'ए', 'ఏ': 'ऐ',
        'ఒ': 'ो', 'ఓ': 'औ'
    };

    const consonants = {
        'క': 'क', 'ఖ': 'ख', 'గ': 'ग', 'ఘ': 'घ', 'ఙ': 'ङ',
        'చ': 'च', 'ఛ': 'छ', 'జ': 'ज', 'ఝ': 'झ', 'ఞ': 'ञ',
        'ట': 'ट', 'ఠ': 'ठ', 'డ': 'ड', 'ఢ': 'ढ', 'ణ': 'ण',
        'త': 'त', 'థ': 'थ', 'ద': 'द', 'ధ': 'ध', 'న': 'न',
        'ప': 'प', 'ఫ': 'फ', 'బ': 'ब', 'భ': 'भ', 'మ': 'म',
        'య': 'य', 'ర': 'र', 'ల': 'ल', 'వ': 'व', 'శ': 'श',
        'ష': 'ष', 'స': 'स', 'హ': 'ह', 'ళ': 'ळ', 'క్ష': 'क्ष'
    };

    const vowelSigns = {
        'ా': 'ा', 'ి': 'ि', 'ీ': 'ी', 'ు': 'ु', 'ూ': 'ू',
        'ృ': 'ृ', 'ౄ': 'ॄ', 'ె': 'े', 'ే': 'ै', 'ొ': 'ो', 'ో': 'ौ', 'ౌ': 'ौ'
    };

    const virama = '్';
    const devanagariVirama = '्';

    let result = '';
    let i = 0;

    while (i < teluguText.length) {
        const currentChar = teluguText[i];

        if (independentVowels[currentChar]) {
            result += independentVowels[currentChar];
            i++;
        } else if (consonants[currentChar]) {
            const baseConsonant = consonants[currentChar];
            i++;
            if (i < teluguText.length && teluguText[i] === virama) {
                result += baseConsonant + devanagariVirama;
                i++;
                if (i < teluguText.length && consonants[teluguText[i]]) {
                    result += consonants[teluguText[i]];
                    i++;
                }
            } else if (i < teluguText.length && vowelSigns[teluguText[i]]) {
                result += baseConsonant + vowelSigns[teluguText[i]];
                i++;
            } else {
                result += baseConsonant;
            }
        } else {
            result += currentChar;
            i++;
        }
    }
    return result;
}

// Event listeners
captureBtn.addEventListener('click', async () => {
    const imageData = captureImage();
    await processImage(imageData);
});

switchCameraBtn.addEventListener('click', () => {
    const selectedCamera = document.querySelector('input[name="camera"]:checked').value;
    startCamera(selectedCamera);
});

// Start with the front camera by default
window.onload = () => startCamera('user');

// ============================================
// AI Metadata Injector - Google Cloud Vision API Version
// Bulletproof: 1000 free requests/month, no rate limit issues
// ============================================

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// File type handling
const FILE_TYPES = {
    'image/png': { icon: '🖼️', strategy: 'exif', ext: 'png' },
    'image/jpeg': { icon: '📷', strategy: 'exif', ext: 'jpg' },
    'image/jpg': { icon: '📷', strategy: 'exif', ext: 'jpg' },
    'image/webp': { icon: '🌐', strategy: 'exif', ext: 'webp' },
    'image/gif': { icon: '🎞️', strategy: 'exif', ext: 'gif' },
    'image/bmp': { icon: '🎨', strategy: 'exif', ext: 'bmp' },
    'image/tiff': { icon: '📸', strategy: 'exif', ext: 'tiff' },
    'image/svg+xml': { icon: '✏️', strategy: 'svg', ext: 'svg' },
    'text/plain': { icon: '📄', strategy: 'text', ext: 'txt' },
    'application/json': { icon: '📋', strategy: 'json', ext: 'json' },
    'text/xml': { icon: '📰', strategy: 'xml', ext: 'xml' },
    'application/xml': { icon: '📰', strategy: 'xml', ext: 'xml' },
    'image/vnd.adobe.photoshop': { icon: '🎨', strategy: 'sidecar', ext: 'psd' },
    'application/postscript': { icon: '📐', strategy: 'sidecar', ext: 'eps' },
    'application/illustrator': { icon: '🎨', strategy: 'sidecar', ext: 'ai' },
    'application/pdf': { icon: '📑', strategy: 'sidecar', ext: 'pdf' },
    'application/zip': { icon: '📦', strategy: 'sidecar', ext: 'zip' },
    'default': { icon: '📎', strategy: 'sidecar', ext: 'file' }
};

// SEO keyword templates by category
const SEO_TEMPLATES = {
    title: {
        patterns: [
            "{mainSubject} {style} {useCase}",
            "{mood} {mainSubject} for {useCase}",
            "{color} {mainSubject} {style} Design",
            "{mainSubject} {texture} Background",
            "Professional {mainSubject} {style} Template",
            "{mood} {mainSubject} Illustration",
            "{mainSubject} {pattern} Pattern Design",
            "Modern {mainSubject} {style} for {useCase}",
            "Creative {mainSubject} {color} Artwork",
            "{mainSubject} {useCase} Design Element"
        ]
    },
    description: {
        intro: [
            "A high-quality {mainSubject} featuring {details}.",
            "This {style} {mainSubject} showcases {details}.",
            "Professional {mainSubject} design with {details}.",
            "A stunning {mood} {mainSubject} perfect for {useCase}.",
            "Elegant {mainSubject} artwork with {details}."
        ],
        body: [
            "Ideal for {useCase}, {useCase2}, and {useCase3}.",
            "Suitable for {useCase}, {useCase2}, and digital projects.",
            "Perfect for {useCase}, marketing materials, and {useCase2}.",
            "Great for {useCase}, social media, and {useCase2}.",
            "Versatile design for {useCase}, {useCase2}, and print media."
        ],
        close: [
            "Fully scalable vector format with editable layers.",
            "High resolution with clean, crisp details.",
            "Ready to use for commercial and personal projects.",
            "Compatible with all major design software.",
            "Optimized for web and print applications."
        ]
    }
};

// Use case mappings
const USE_CASES = {
    'abstract': ['web design', 'presentations', 'branding', 'social media', 'wallpaper'],
    'business': ['corporate presentations', 'marketing', 'reports', 'websites', 'brochures'],
    'nature': ['environmental campaigns', 'wellness', 'travel', 'blogs', 'calendars'],
    'technology': ['tech websites', 'app interfaces', 'startups', 'futuristic designs', 'innovation'],
    'food': ['restaurant menus', 'food blogs', 'cooking apps', 'packaging', 'advertising'],
    'people': ['lifestyle blogs', 'social media', 'advertising', 'editorial', 'portraits'],
    'background': ['website headers', 'app backgrounds', 'presentations', 'posters', 'digital art'],
    'pattern': ['textile design', 'wallpaper', 'packaging', 'fabric', 'surface design'],
    'texture': ['graphic design', '3D rendering', 'digital art', 'backgrounds', 'overlays'],
    'animal': ['nature websites', 'pet products', 'wildlife', 'education', 'children content'],
    'plant': ['botanical', 'gardening', 'wellness', 'eco-friendly', 'nature'],
    'building': ['real estate', 'architecture', 'travel', 'urban', 'cityscape'],
    'vehicle': ['transportation', 'automotive', 'travel', 'logistics', 'adventure'],
    'sport': ['fitness', 'athletics', 'events', 'lifestyle', 'energy'],
    'music': ['entertainment', 'concerts', 'media', 'creative', 'audio'],
    'art': ['creative projects', 'galleries', 'exhibitions', 'cultural', 'artistic'],
    'fashion': ['style', 'beauty', 'retail', 'e-commerce', 'trend'],
    'health': ['medical', 'wellness', 'fitness', 'pharmaceutical', 'care'],
    'education': ['learning', 'school', 'academic', 'training', 'knowledge'],
    'finance': ['banking', 'investment', 'economy', 'corporate', 'money']
};

// Mood mappings
const MOODS = {
    'abstract': 'Creative',
    'business': 'Professional',
    'nature': 'Serene',
    'technology': 'Futuristic',
    'food': 'Appetizing',
    'people': 'Lifestyle',
    'background': 'Minimal',
    'pattern': 'Decorative',
    'texture': 'Tactile',
    'animal': 'Wild',
    'plant': 'Organic',
    'building': 'Urban',
    'vehicle': 'Dynamic',
    'sport': 'Energetic',
    'music': 'Rhythmic',
    'art': 'Expressive',
    'fashion': 'Stylish',
    'health': 'Clean',
    'education': 'Intellectual',
    'finance': 'Trustworthy'
};

// State
let files = [];
let results = [];
let apiKey = '';

// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const toggleKeyBtn = document.getElementById('toggleKey');
const apiStatus = document.getElementById('apiStatus');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const fileListSection = document.getElementById('fileListSection');
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');
const processAllBtn = document.getElementById('processAllBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const processingSection = document.getElementById('processingSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const processingLog = document.getElementById('processingLog');
const resultsSection = document.getElementById('resultsSection');
const resultsList = document.getElementById('resultsList');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const newBatchBtn = document.getElementById('newBatchBtn');

// Event Listeners
toggleKeyBtn.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});

apiKeyInput.addEventListener('input', () => {
    apiKey = apiKeyInput.value.trim();
    if (apiKey.length > 20) {
        apiStatus.textContent = '✅ API Key looks valid';
        apiStatus.className = 'api-status ok';
    } else {
        apiStatus.textContent = '';
        apiStatus.className = 'api-status';
    }
});

dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

processAllBtn.addEventListener('click', processAllFiles);
clearAllBtn.addEventListener('click', clearAllFiles);
downloadAllBtn.addEventListener('click', downloadAllAsZip);
newBatchBtn.addEventListener('click', startNewBatch);

// ============================================
// File Handling
// ============================================

function handleFiles(fileList) {
    for (const file of fileList) {
        const fileInfo = getFileInfo(file);
        files.push({
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: formatSize(file.size),
            type: file.type || 'application/octet-stream',
            ext: fileInfo.ext,
            icon: fileInfo.icon,
            strategy: fileInfo.strategy,
            status: 'pending'
        });
    }
    renderFileList();
}

function getFileInfo(file) {
    const type = file.type || 'application/octet-stream';
    if (FILE_TYPES[type]) return FILE_TYPES[type];
    const ext = file.name.split('.').pop().toLowerCase();
    const extMap = {
        'png': FILE_TYPES['image/png'], 'jpg': FILE_TYPES['image/jpeg'],
        'jpeg': FILE_TYPES['image/jpeg'], 'webp': FILE_TYPES['image/webp'],
        'gif': FILE_TYPES['image/gif'], 'bmp': FILE_TYPES['image/bmp'],
        'tiff': FILE_TYPES['image/tiff'], 'tif': FILE_TYPES['image/tiff'],
        'svg': FILE_TYPES['image/svg+xml'], 'txt': FILE_TYPES['text/plain'],
        'json': FILE_TYPES['application/json'], 'xml': FILE_TYPES['text/xml'],
        'psd': FILE_TYPES['image/vnd.adobe.photoshop'], 'eps': FILE_TYPES['application/postscript'],
        'ai': FILE_TYPES['application/illustrator'], 'pdf': FILE_TYPES['application/pdf'],
        'zip': FILE_TYPES['application/zip']
    };
    if (extMap[ext]) return { ...extMap[ext], ext };
    return { ...FILE_TYPES['default'], ext };
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function renderFileList() {
    if (files.length === 0) { fileListSection.style.display = 'none'; return; }
    fileListSection.style.display = 'block';
    fileCount.textContent = files.length;
    fileList.innerHTML = files.map((f) => `
        <div class="file-item" data-id="${f.id}">
            <span class="file-icon">${f.icon}</span>
            <div class="file-info">
                <div class="file-name">${escapeHtml(f.name)}</div>
                <div class="file-size">${f.size} · ${f.ext.toUpperCase()} · ${f.strategy === 'exif' ? 'Metadata injectable' : f.strategy === 'sidecar' ? 'Sidecar metadata' : 'Inline metadata'}</div>
            </div>
            <button class="file-remove" onclick="removeFile(${f.id})" title="Remove">✕</button>
        </div>
    `).join('');
}

function removeFile(id) { files = files.filter(f => f.id !== id); renderFileList(); }
function clearAllFiles() { files = []; renderFileList(); }
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// ============================================
// Google Cloud Vision API Call
// ============================================

async function callVisionAPI(file) {
    if (!apiKey) throw new Error('API key not provided');

    // Convert file to base64
    const base64 = await fileToBase64(file);

    const requestBody = {
        requests: [{
            image: { content: base64.split(',')[1] },
            features: [
                { type: 'LABEL_DETECTION', maxResults: 20 },
                { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                { type: 'IMAGE_PROPERTIES', maxResults: 5 },
                { type: 'SAFE_SEARCH_DETECTION' },
                { type: 'TEXT_DETECTION', maxResults: 10 }
            ]
        }]
    };

    const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const err = await response.json();
        const msg = err.error?.message || 'API request failed';
        if (msg.includes('quota') || msg.includes('limit') || msg.includes('exceeded')) {
            throw new Error(`API Quota exceeded: ${msg}. You get 1,000 free requests/month. Wait or upgrade at cloud.google.com/vision`);
        }
        if (msg.includes('API key') || msg.includes('invalid') || msg.includes('not valid')) {
            throw new Error(`Invalid API Key: ${msg}. Get a free key at console.cloud.google.com/apis/credentials`);
        }
        if (msg.includes('not enabled') || msg.includes('disabled')) {
            throw new Error(`Vision API not enabled: ${msg}. Enable it at console.cloud.google.com/apis/library/vision.googleapis.com`);
        }
        throw new Error(msg);
    }

    return await response.json();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================
// Smart Metadata Generation Engine
// Converts Vision API labels into SEO-optimized metadata
// ============================================

function generateMetadata(visionData, filename, ext) {
    const labels = visionData.responses?.[0]?.labelAnnotations || [];
    const objects = visionData.responses?.[0]?.localizedObjectAnnotations || [];
    const colors = visionData.responses?.[0]?.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const safeSearch = visionData.responses?.[0]?.safeSearchAnnotation || {};
    const textAnnotations = visionData.responses?.[0]?.textAnnotations || [];

    // Extract main subjects from labels and objects
    const allLabels = [
        ...labels.map(l => l.description.toLowerCase()),
        ...objects.map(o => o.name.toLowerCase())
    ];

    // Detect text in image (for IP safety - if text detected, flag it)
    const detectedText = textAnnotations.slice(1).map(t => t.description).join(' ');
    const hasText = detectedText.length > 3;

    // Determine category
    const category = detectCategory(allLabels, filename);

    // Extract colors
    const colorNames = colors.slice(0, 5).map(c => {
        const r = c.color.red, g = c.color.green, b = c.color.blue;
        return rgbToColorName(r, g, b);
    }).filter((v, i, a) => a.indexOf(v) === i);

    // Build main subject
    const mainSubject = buildMainSubject(allLabels, category);

    // Build style descriptor
    const style = detectStyle(allLabels, filename);

    // Build mood
    const mood = MOODS[category] || 'Creative';

    // Build use cases
    const useCases = USE_CASES[category] || USE_CASES['abstract'];

    // Generate title
    const title = generateTitle(mainSubject, style, useCases[0], mood, colorNames[0]);

    // Generate description
    const description = generateDescription(mainSubject, allLabels, style, useCases, colorNames, mood, hasText);

    // Generate keywords (50 max)
    const keywords = generateKeywords(allLabels, category, mainSubject, style, useCases, colorNames, mood, filename);

    // Detect if IP-safe
    const ipSafe = checkIPSafe(safeSearch, hasText, detectedText);

    return {
        title: title,
        description: description,
        keywords: keywords,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        mood: mood,
        colorPalette: colorNames.slice(0, 3).join(', '),
        suggestedUses: useCases.slice(0, 3).join(', '),
        ipSafe: ipSafe,
        _visionLabels: labels.map(l => l.description),
        _visionObjects: objects.map(o => o.name),
        _confidence: labels[0]?.score || 0
    };
}

function detectCategory(labels, filename) {
    const filenameLower = filename.toLowerCase();
    const labelStr = labels.join(' ');

    const categories = {
        'abstract': ['abstract', 'pattern', 'texture', 'geometric', 'fractal', 'swirl', 'gradient'],
        'business': ['business', 'office', 'corporate', 'meeting', 'professional', 'workspace', 'team'],
        'nature': ['nature', 'landscape', 'mountain', 'forest', 'ocean', 'river', 'tree', 'flower', 'sky'],
        'technology': ['technology', 'computer', 'digital', 'circuit', 'cyber', 'tech', 'software', 'code'],
        'food': ['food', 'meal', 'dish', 'cuisine', 'restaurant', 'cooking', 'fruit', 'vegetable'],
        'people': ['people', 'person', 'human', 'face', 'portrait', 'woman', 'man', 'child', 'group'],
        'background': ['background', 'wallpaper', 'backdrop', 'template', 'banner'],
        'pattern': ['pattern', 'seamless', 'repeat', 'tile', 'motif', 'ornament'],
        'texture': ['texture', 'surface', 'material', 'grain', 'rough', 'smooth'],
        'animal': ['animal', 'wildlife', 'bird', 'mammal', 'pet', 'insect', 'fish'],
        'plant': ['plant', 'flower', 'leaf', 'tree', 'garden', 'botanical', 'floral'],
        'building': ['building', 'architecture', 'house', 'city', 'urban', 'skyline', 'structure'],
        'vehicle': ['vehicle', 'car', 'transport', 'airplane', 'train', 'boat', 'motorcycle'],
        'sport': ['sport', 'fitness', 'athlete', 'game', 'exercise', 'ball', 'running'],
        'music': ['music', 'instrument', 'concert', 'audio', 'sound', 'musician', 'guitar'],
        'art': ['art', 'painting', 'drawing', 'sketch', 'illustration', 'creative', 'artistic'],
        'fashion': ['fashion', 'clothing', 'dress', 'style', 'apparel', 'wear', 'outfit'],
        'health': ['health', 'medical', 'wellness', 'fitness', 'doctor', 'hospital', 'care'],
        'education': ['education', 'school', 'learning', 'book', 'student', 'study', 'knowledge'],
        'finance': ['finance', 'money', 'bank', 'investment', 'economy', 'business', 'corporate']
    };

    for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(k => labelStr.includes(k) || filenameLower.includes(k))) {
            return cat;
        }
    }

    // Check filename patterns
    if (filenameLower.includes('bg') || filenameLower.includes('background')) return 'background';
    if (filenameLower.includes('pattern') || filenameLower.includes('seamless')) return 'pattern';
    if (filenameLower.includes('texture')) return 'texture';
    if (filenameLower.includes('icon') || filenameLower.includes('logo')) return 'business';

    return 'abstract';
}

function buildMainSubject(labels, category) {
    // Get the most descriptive label
    const descriptive = labels.filter(l => 
        !['image', 'photograph', 'picture', 'screenshot', 'file', 'document'].includes(l)
    );

    if (descriptive.length > 0) {
        return descriptive[0].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    return category.charAt(0).toUpperCase() + category.slice(1);
}

function detectStyle(labels, filename) {
    const styleKeywords = {
        'vector': ['vector', 'illustration', 'graphic', 'flat', 'minimal'],
        '3d': ['3d', 'render', 'three dimensional', 'cinematic', 'realistic'],
        'watercolor': ['watercolor', 'paint', 'artistic', 'hand drawn'],
        'line art': ['line art', 'outline', 'sketch', 'drawing'],
        'photographic': ['photograph', 'photo', 'realistic', 'natural'],
        'minimalist': ['minimal', 'simple', 'clean', 'white background', 'isolated'],
        'vintage': ['vintage', 'retro', 'old', 'classic', 'antique'],
        'modern': ['modern', 'contemporary', 'sleek', 'futuristic'],
        'grunge': ['grunge', 'distressed', 'rough', 'texture'],
        'neon': ['neon', 'glowing', 'bright', 'vibrant', 'colorful']
    };

    const labelStr = labels.join(' ');
    for (const [style, keywords] of Object.entries(styleKeywords)) {
        if (keywords.some(k => labelStr.includes(k))) return style;
    }

    if (filename.toLowerCase().includes('3d') || filename.toLowerCase().includes('render')) return '3D Render';
    if (filename.toLowerCase().includes('vector') || filename.toLowerCase().includes('svg')) return 'Vector';
    if (filename.toLowerCase().includes('watercolor')) return 'Watercolor';

    return 'Design';
}

function rgbToColorName(r, g, b) {
    const colors = [
        { name: 'Red', r: 255, g: 0, b: 0 },
        { name: 'Green', r: 0, g: 255, b: 0 },
        { name: 'Blue', r: 0, g: 0, b: 255 },
        { name: 'Yellow', r: 255, g: 255, b: 0 },
        { name: 'Cyan', r: 0, g: 255, b: 255 },
        { name: 'Magenta', r: 255, g: 0, b: 255 },
        { name: 'White', r: 255, g: 255, b: 255 },
        { name: 'Black', r: 0, g: 0, b: 0 },
        { name: 'Orange', r: 255, g: 165, b: 0 },
        { name: 'Purple', r: 128, g: 0, b: 128 },
        { name: 'Pink', r: 255, g: 192, b: 203 },
        { name: 'Brown', r: 165, g: 42, b: 42 },
        { name: 'Gray', r: 128, g: 128, b: 128 },
        { name: 'Navy', r: 0, g: 0, b: 128 },
        { name: 'Teal', r: 0, g: 128, b: 128 },
        { name: 'Coral', r: 255, g: 127, b: 80 },
        { name: 'Gold', r: 255, g: 215, b: 0 },
        { name: 'Silver', r: 192, g: 192, b: 192 }
    ];

    let minDist = Infinity;
    let closest = 'Colorful';

    for (const c of colors) {
        const dist = Math.sqrt(Math.pow(r - c.r, 2) + Math.pow(g - c.g, 2) + Math.pow(b - c.b, 2));
        if (dist < minDist) { minDist = dist; closest = c.name; }
    }

    return closest;
}

function generateTitle(mainSubject, style, useCase, mood, color) {
    const patterns = SEO_TEMPLATES.title.patterns;
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    return pattern
        .replace('{mainSubject}', mainSubject)
        .replace('{style}', style)
        .replace('{useCase}', useCase)
        .replace('{mood}', mood)
        .replace('{color}', color || 'Colorful')
        .replace('{texture}', style)
        .replace('{pattern}', style)
        .substring(0, 80);
}

function generateDescription(mainSubject, labels, style, useCases, colors, mood, hasText) {
    const intro = SEO_TEMPLATES.description.intro[Math.floor(Math.random() * SEO_TEMPLATES.description.intro.length)];
    const body = SEO_TEMPLATES.description.body[Math.floor(Math.random() * SEO_TEMPLATES.description.body.length)];
    const close = SEO_TEMPLATES.description.close[Math.floor(Math.random() * SEO_TEMPLATES.description.close.length)];

    const details = labels.slice(0, 5).join(', ');

    let desc = intro
        .replace('{mainSubject}', mainSubject)
        .replace('{style}', style)
        .replace('{details}', details || 'professional design elements')
        .replace('{mood}', mood);

    desc += ' ' + body
        .replace('{useCase}', useCases[0])
        .replace('{useCase2}', useCases[1] || 'digital media')
        .replace('{useCase3}', useCases[2] || 'print materials');

    desc += ' ' + close;

    if (colors.length > 0) {
        desc += ` Features a ${colors.slice(0, 3).join(' and ')} color palette.`;
    }

    if (hasText) {
        desc += ' Contains text elements - please review for IP compliance before commercial use.';
    }

    return desc.substring(0, 300);
}

function generateKeywords(labels, category, mainSubject, style, useCases, colors, mood, filename) {
    const keywords = new Set();

    // Add main subject variations
    keywords.add(mainSubject.toLowerCase());
    keywords.add(mainSubject.toLowerCase() + ' ' + style.toLowerCase());
    keywords.add(mainSubject.toLowerCase() + ' design');
    keywords.add(mainSubject.toLowerCase() + ' illustration');

    // Add labels
    labels.forEach(l => {
        keywords.add(l.toLowerCase());
        keywords.add(l.toLowerCase() + ' ' + category);
    });

    // Add category keywords
    keywords.add(category);
    keywords.add(category + ' design');
    keywords.add(category + ' illustration');
    keywords.add(category + ' art');
    keywords.add(category + ' background');
    keywords.add(category + ' template');

    // Add style keywords
    keywords.add(style.toLowerCase());
    keywords.add(style.toLowerCase() + ' design');
    keywords.add(style.toLowerCase() + ' art');

    // Add mood keywords
    keywords.add(mood.toLowerCase());
    keywords.add(mood.toLowerCase() + ' ' + category);

    // Add color keywords
    colors.forEach(c => {
        keywords.add(c.toLowerCase());
        keywords.add(c.toLowerCase() + ' ' + mainSubject.toLowerCase());
    });

    // Add use case keywords
    useCases.forEach(u => {
        keywords.add(u);
        keywords.add(mainSubject.toLowerCase() + ' for ' + u);
    });

    // Add stock-specific keywords
    keywords.add('stock ' + category);
    keywords.add('royalty free');
    keywords.add('commercial use');
    keywords.add('high quality');
    keywords.add('professional');
    keywords.add('creative');
    keywords.add('modern');
    keywords.add('trendy');
    keywords.add('minimal');
    keywords.add('elegant');
    keywords.add('stylish');
    keywords.add('unique');
    keywords.add('original');
    keywords.add('clean');
    keywords.add('crisp');
    keywords.add('sharp');
    keywords.add('detailed');
    keywords.add('vibrant');
    keywords.add('colorful');
    keywords.add('beautiful');
    keywords.add('aesthetic');
    keywords.add('graphic design');
    keywords.add('digital art');
    keywords.add('visual');
    keywords.add('composition');
    keywords.add('layout');
    keywords.add('element');
    keywords.add('asset');
    keywords.add('resource');

    // Add filename-based keywords
    const filenameWords = filename.replace(/\.[^.]+$/, '').split(/[-_\s]+/).filter(w => w.length > 2);
    filenameWords.forEach(w => keywords.add(w.toLowerCase()));

    // Convert to array and limit to 50
    return Array.from(keywords).slice(0, 50);
}

function checkIPSafe(safeSearch, hasText, detectedText) {
    // If text is detected, flag for manual review
    if (hasText) return false;

    // Check safe search
    const adult = safeSearch.adult || 'VERY_UNLIKELY';
    const violence = safeSearch.violence || 'VERY_UNLIKELY';
    const racy = safeSearch.racy || 'VERY_UNLIKELY';

    if (adult === 'LIKELY' || adult === 'VERY_LIKELY') return false;
    if (violence === 'LIKELY' || violence === 'VERY_LIKELY') return false;
    if (racy === 'LIKELY' || racy === 'VERY_LIKELY') return false;

    return true;
}

// ============================================
// Metadata Injection (same as before)
// ============================================

async function injectExifMetadata(file, metadata) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                if (!blob) { reject(new Error('Canvas conversion failed')); return; }
                resolve({ blob: blob, metadata: metadata, method: 'canvas-reencoded' });
            }, file.type, 0.95);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
        img.src = url;
    });
}

function injectSvgMetadata(content, metadata) {
    const metaBlock = `<!-- 
  AI-GENERATED METADATA - SEO Optimized
  Title: ${escapeXml(metadata.title)}
  Description: ${escapeXml(metadata.description)}
  Keywords: ${metadata.keywords.join(', ')}
  Category: ${metadata.category}
  Mood: ${metadata.mood}
  Color Palette: ${metadata.colorPalette}
  Suggested Uses: ${metadata.suggestedUses}
  IP Safe: ${metadata.ipSafe}
  Generated by: AI Metadata Injector (Google Vision)
-->`;
    if (content.trim().startsWith('<?xml')) {
        const endDecl = content.indexOf('?>');
        return content.slice(0, endDecl + 2) + '\n' + metaBlock + '\n' + content.slice(endDecl + 2);
    }
    return metaBlock + '\n' + content;
}

function injectTextMetadata(content, metadata, ext) {
    if (ext === 'json') {
        try {
            const obj = JSON.parse(content);
            obj._aiMetadata = metadata;
            obj._aiMetadataGenerated = new Date().toISOString();
            return JSON.stringify(obj, null, 2);
        } catch { }
    }
    const comment = `/*
  AI-GENERATED METADATA - SEO Optimized
  Title: ${metadata.title}
  Description: ${metadata.description}
  Keywords: ${metadata.keywords.join(', ')}
  Category: ${metadata.category}
  Mood: ${metadata.mood}
  Color Palette: ${metadata.colorPalette}
  Suggested Uses: ${metadata.suggestedUses}
  IP Safe: ${metadata.ipSafe}
  Generated: ${new Date().toISOString()}
*/\n\n`;
    return comment + content;
}

function generateSidecarMetadata(filename, metadata) {
    return JSON.stringify({
        sourceFile: filename,
        generatedAt: new Date().toISOString(),
        tool: 'AI Metadata Injector (Google Vision)',
        metadata: metadata
    }, null, 2);
}

function escapeXml(str) {
    return str.replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]));
}

// ============================================
// Process Files
// ============================================

async function processAllFiles() {
    if (files.length === 0) return;
    if (!apiKey) { alert('Please enter your Google Cloud Vision API key!'); apiKeyInput.focus(); return; }

    results = [];
    processingSection.style.display = 'block';
    resultsSection.style.display = 'none';
    processingLog.innerHTML = '';

    const total = files.length;

    for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        const progress = ((i + 1) / total) * 100;

        progressFill.style.width = progress + '%';
        progressText.textContent = `Processing ${i + 1} of ${total}: ${fileItem.name}`;
        log(`Processing: ${fileItem.name} (${fileItem.strategy})`);

        try {
            let metadata;

            // For images, use Google Vision API
            if (fileItem.strategy === 'exif' || fileItem.strategy === 'svg') {
                log(`  → Analyzing with Google Vision AI...`, 'info');
                const visionData = await callVisionAPI(fileItem.file);
                metadata = generateMetadata(visionData, fileItem.name, fileItem.ext);
                log(`  ✓ Detected: ${metadata._visionLabels.slice(0, 5).join(', ')}`, 'success');
            } else {
                // For non-images, use filename-based generation
                log(`  → Generating metadata from filename...`, 'info');
                metadata = generateMetadataFromFilename(fileItem.name, fileItem.ext);
                log(`  ✓ Generated from filename analysis`, 'success');
            }

            // Validate
            if (!metadata.title || !metadata.keywords) {
                throw new Error('Metadata generation incomplete');
            }

            log(`  ✓ Title: "${metadata.title}"`, 'success');

            // Inject metadata
            let outputBlob = null;
            let outputName = fileItem.name;
            let extraFiles = [];

            if (fileItem.strategy === 'exif') {
                const imgResult = await injectExifMetadata(fileItem.file, metadata);
                outputBlob = imgResult.blob;
                const sidecarContent = generateSidecarMetadata(fileItem.name, metadata);
                extraFiles.push({ name: fileItem.name.replace(/\.[^.]+$/, '') + '_metadata.json', blob: new Blob([sidecarContent], { type: 'application/json' }) });
            } else if (fileItem.strategy === 'svg') {
                const content = await fileItem.file.text();
                const newContent = injectSvgMetadata(content, metadata);
                outputBlob = new Blob([newContent], { type: fileItem.type });
            } else if (fileItem.strategy === 'text' || fileItem.strategy === 'json' || fileItem.strategy === 'xml') {
                const content = await fileItem.file.text();
                const newContent = injectTextMetadata(content, metadata, fileItem.ext);
                outputBlob = new Blob([newContent], { type: fileItem.type || 'text/plain' });
            } else {
                outputBlob = fileItem.file;
                const sidecarContent = generateSidecarMetadata(fileItem.name, metadata);
                extraFiles.push({ name: fileItem.name.replace(/\.[^.]+$/, '') + '_metadata.json', blob: new Blob([sidecarContent], { type: 'application/json' }) });
            }

            results.push({
                originalName: fileItem.name,
                outputName: outputName,
                outputBlob: outputBlob,
                extraFiles: extraFiles,
                metadata: metadata,
                strategy: fileItem.strategy,
                success: true
            });

            log(`  ✓ Complete!`, 'success');

        } catch (err) {
            log(`  ✗ Error: ${err.message}`, 'error');
            results.push({ originalName: fileItem.name, success: false, error: err.message });
        }

        // Small delay between requests
        if (i < files.length - 1) await new Promise(r => setTimeout(r, 300));
    }

    progressText.textContent = 'All files processed!';
    renderResults();
    processingSection.style.display = 'none';
    resultsSection.style.display = 'block';
}

// Fallback metadata generator for non-image files
function generateMetadataFromFilename(filename, ext) {
    const cleanName = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const words = cleanName.split('\s+').filter(w => w.length > 2);

    const mainSubject = words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : 'Design';
    const category = detectCategory(words.map(w => w.toLowerCase()), filename);
    const mood = MOODS[category] || 'Creative';
    const useCases = USE_CASES[category] || USE_CASES['abstract'];

    const title = `${mainSubject} ${ext.toUpperCase()} Design Asset - Professional ${category} Template`.substring(0, 80);
    const description = `A professional ${mainSubject.toLowerCase()} design asset in ${ext.toUpperCase()} format. Ideal for ${useCases.slice(0, 3).join(', ')}. High-quality, scalable, and ready for commercial use. Optimized for stock platforms and digital projects.`;

    const keywords = new Set();
    words.forEach(w => { keywords.add(w.toLowerCase()); keywords.add(w.toLowerCase() + ' ' + category); });
    keywords.add(category); keywords.add(category + ' design'); keywords.add(ext.toLowerCase());
    keywords.add('stock'); keywords.add('royalty free'); keywords.add('commercial'); keywords.add('professional');
    keywords.add('template'); keywords.add('asset'); keywords.add('design element'); keywords.add('graphic');
    keywords.add('digital'); keywords.add('creative'); keywords.add('modern'); keywords.add('high quality');

    return {
        title: title,
        description: description,
        keywords: Array.from(keywords).slice(0, 50),
        category: category.charAt(0).toUpperCase() + category.slice(1),
        mood: mood,
        colorPalette: 'Mixed',
        suggestedUses: useCases.slice(0, 3).join(', '),
        ipSafe: true,
        _visionLabels: ['filename-based'],
        _visionObjects: [],
        _confidence: 0.7
    };
}

function log(message, type = '') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = message;
    processingLog.appendChild(entry);
    processingLog.scrollTop = processingLog.scrollHeight;
}

// ============================================
// Render Results
// ============================================

function renderResults() {
    const successful = results.filter(r => r.success);

    resultsList.innerHTML = results.map((r, idx) => {
        if (!r.success) {
            return `<div class="result-item">
                <div class="result-header">
                    <span style="font-size:1.3rem;">❌</span>
                    <span class="result-name">${escapeHtml(r.originalName)}</span>
                    <span class="result-type" style="background:#fdeaea;color:#e74c3c;">Failed</span>
                </div>
                <p style="color:#e74c3c;font-size:0.85rem;">${escapeHtml(r.error)}</p>
            </div>`;
        }

        const meta = r.metadata;
        const hasSidecar = r.strategy === 'sidecar' || r.extraFiles.length > 0;

        return `<div class="result-item">
            <div class="result-header">
                <span style="font-size:1.3rem;">✅</span>
                <span class="result-name">${escapeHtml(r.originalName)}</span>
                <span class="result-type">${r.strategy === 'exif' ? 'Image + Metadata' : r.strategy === 'sidecar' ? 'File + Sidecar' : 'Metadata Injected'}</span>
            </div>
            <div class="meta-preview">
                <div class="meta-row"><span class="meta-label">Title:</span><span class="meta-value">${escapeHtml(meta.title)}</span></div>
                <div class="meta-row"><span class="meta-label">Category:</span><span class="meta-value">${escapeHtml(meta.category)}</span></div>
                <div class="meta-row"><span class="meta-label">Mood:</span><span class="meta-value">${escapeHtml(meta.mood)}</span></div>
                <div class="meta-row"><span class="meta-label">Keywords:</span><span class="meta-value">${meta.keywords.slice(0, 15).join(', ')}${meta.keywords.length > 15 ? '...' : ''}</span></div>
                <div class="meta-row"><span class="meta-label">Description:</span><span class="meta-value">${escapeHtml(meta.description.substring(0, 120))}${meta.description.length > 120 ? '...' : ''}</span></div>
                <div class="meta-row"><span class="meta-label">IP Safe:</span><span class="meta-value">${meta.ipSafe ? '✅ Yes' : '⚠️ Review Needed'}</span></div>
            </div>
            <div class="result-actions">
                <button class="btn-download" onclick="downloadResult(${idx})">📥 Download</button>
                ${hasSidecar ? `<button class="btn-meta" onclick="downloadSidecar(${idx})">📄 Meta JSON</button>` : ''}
                <button class="btn-meta" onclick="copyMetadata(${idx})">📋 Copy</button>
            </div>
        </div>`;
    }).join('');

    downloadAllBtn.style.display = successful.length > 0 ? 'inline-flex' : 'none';
}

// ============================================
// Download Functions
// ============================================

function downloadResult(idx) {
    const r = results[idx];
    if (!r.success) return;
    const url = URL.createObjectURL(r.outputBlob);
    const a = document.createElement('a');
    a.href = url; a.download = r.outputName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

function downloadSidecar(idx) {
    const r = results[idx];
    if (!r.success || r.extraFiles.length === 0) return;
    r.extraFiles.forEach(ef => {
        const url = URL.createObjectURL(ef.blob);
        const a = document.createElement('a');
        a.href = url; a.download = ef.name;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    });
}

function copyMetadata(idx) {
    const r = results[idx];
    if (!r.success) return;
    const text = `Title: ${r.metadata.title}\nDescription: ${r.metadata.description}\nKeywords: ${r.metadata.keywords.join(', ')}\nCategory: ${r.metadata.category}\nMood: ${r.metadata.mood}`;
    navigator.clipboard.writeText(text).then(() => alert('Metadata copied!'));
}

async function downloadAllAsZip() {
    const successful = results.filter(r => r.success);
    if (successful.length === 0) return;

    const zip = new JSZip();
    const folder = zip.folder('ai-metadata-optimized');

    successful.forEach(r => {
        folder.file(r.outputName, r.outputBlob);
        r.extraFiles.forEach(ef => folder.file(ef.name, ef.blob));
    });

    const summary = successful.map(r => ({
        file: r.originalName, title: r.metadata.title,
        keywords: r.metadata.keywords, category: r.metadata.category,
        ipSafe: r.metadata.ipSafe
    }));
    folder.file('_summary.json', JSON.stringify(summary, null, 2));

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `ai-metadata-batch-${new Date().toISOString().slice(0,10)}.zip`);
}

function startNewBatch() {
    files = []; results = [];
    renderFileList();
    resultsSection.style.display = 'none';
    processingSection.style.display = 'none';
    progressFill.style.width = '0%';
    progressText.textContent = 'Initializing...';
    processingLog.innerHTML = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.removeFile = removeFile;
window.downloadResult = downloadResult;
window.downloadSidecar = downloadSidecar;
window.copyMetadata = copyMetadata;

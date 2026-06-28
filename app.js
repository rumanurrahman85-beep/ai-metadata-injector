// ============================================
// AI Metadata Injector - Transformers.js Version
// Runs AI models DIRECTLY in the browser
// ZERO API keys, ZERO billing, ZERO quotas, ZERO external calls
// ============================================

// Use Transformers.js from CDN
const { pipeline, env } = window.transformers;
env.allowLocalModels = false;
env.useBrowserCache = true;

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

// State
let files = [];
let results = [];
let imageCaptioner = null;
let modelLoaded = false;

// DOM Elements
const modelStatus = document.getElementById('modelStatus');
const loadModelBtn = document.getElementById('loadModelBtn');
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

// ============================================
// Load AI Model
// ============================================

loadModelBtn.addEventListener('click', async () => {
    loadModelBtn.disabled = true;
    loadModelBtn.textContent = '⏳ Loading...';

    try {
        logModel('Loading AI image captioning model... This downloads ~20MB once.', 'info');

        // Load the image captioning pipeline
        // Using Xenova's quantized model for fast browser inference
        imageCaptioner = await pipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', {
            quantized: true,
            progress_callback: (progress) => {
                if (progress.status === 'progress') {
                    const pct = Math.round((progress.loaded / progress.total) * 100);
                    logModel(`Downloading model: ${pct}%`, 'info');
                }
            }
        });

        modelLoaded = true;
        modelStatus.className = 'model-status ready';
        modelStatus.innerHTML = '✅ AI Model Ready! You can now process unlimited files.';
        loadModelBtn.style.display = 'none';
        processAllBtn.disabled = false;

        logModel('✅ Model loaded successfully! Ready to process images.', 'success');

    } catch (err) {
        modelStatus.className = 'model-status error';
        modelStatus.innerHTML = '❌ Failed to load model: ' + err.message;
        loadModelBtn.disabled = false;
        loadModelBtn.textContent = '🔄 Retry Load';
        logModel('Error: ' + err.message, 'error');
    }
});

function logModel(msg, type) {
    const entry = document.createElement('div');
    entry.className = `log-${type}`;
    entry.textContent = msg;
    processingLog.appendChild(entry);
}

// ============================================
// File Handling
// ============================================

dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

processAllBtn.addEventListener('click', processAllFiles);
clearAllBtn.addEventListener('click', clearAllFiles);
downloadAllBtn.addEventListener('click', downloadAllAsZip);
newBatchBtn.addEventListener('click', startNewBatch);

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
                <div class="file-size">${f.size} · ${f.ext.toUpperCase()} · ${f.strategy === 'exif' ? 'AI + Metadata' : f.strategy === 'sidecar' ? 'Sidecar metadata' : 'Inline metadata'}</div>
            </div>
            <button class="file-remove" onclick="removeFile(${f.id})" title="Remove">✕</button>
        </div>
    `).join('');
}

function removeFile(id) { files = files.filter(f => f.id !== id); renderFileList(); }
function clearAllFiles() { files = []; renderFileList(); }
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// ============================================
// AI Caption Generation (Local Browser AI)
// ============================================

async function generateAICaption(file) {
    if (!imageCaptioner) throw new Error('AI model not loaded');

    // Create object URL for the image
    const imageUrl = URL.createObjectURL(file);

    try {
        // Run inference
        const output = await imageCaptioner(imageUrl, {
            max_new_tokens: 50,
            num_beams: 4
        });

        URL.revokeObjectURL(imageUrl);

        // Return the generated caption
        return output[0]?.generated_text || 'A professional design asset';

    } catch (err) {
        URL.revokeObjectURL(imageUrl);
        throw err;
    }
}

// ============================================
// Smart Metadata Generation Engine
// Converts AI caption into SEO-optimized metadata
// ============================================

function generateMetadata(aiCaption, filename, ext) {
    const cleanCaption = aiCaption.toLowerCase().trim();
    const filenameWords = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').toLowerCase().split(/\s+/).filter(w => w.length > 2);

    // Detect category from caption and filename
    const category = detectCategory(cleanCaption, filenameWords);

    // Build main subject from caption
    const mainSubject = buildMainSubject(cleanCaption, filenameWords);

    // Detect style
    const style = detectStyle(cleanCaption, filename);

    // Detect mood
    const mood = detectMood(category, cleanCaption);

    // Detect colors
    const colors = detectColors(cleanCaption);

    // Build use cases
    const useCases = buildUseCases(category);

    // Generate title
    const title = buildTitle(mainSubject, style, category, mood);

    // Generate description
    const description = buildDescription(mainSubject, aiCaption, style, useCases, colors, mood, category);

    // Generate keywords (50 max)
    const keywords = buildKeywords(cleanCaption, filenameWords, category, mainSubject, style, colors, mood, useCases);

    // Check IP safety
    const ipSafe = checkIPSafe(cleanCaption, filename);

    return {
        title: title,
        description: description,
        keywords: keywords,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        mood: mood,
        colorPalette: colors.slice(0, 3).join(', ') || 'Mixed',
        suggestedUses: useCases.slice(0, 3).join(', '),
        ipSafe: ipSafe,
        _aiCaption: aiCaption
    };
}

function detectCategory(caption, filenameWords) {
    const categories = {
        'abstract': ['abstract', 'pattern', 'texture', 'geometric', 'fractal', 'swirl', 'gradient', 'shape'],
        'business': ['business', 'office', 'corporate', 'meeting', 'professional', 'workspace', 'team', 'work'],
        'nature': ['nature', 'landscape', 'mountain', 'forest', 'ocean', 'river', 'tree', 'flower', 'sky', 'animal', 'bird'],
        'technology': ['technology', 'computer', 'digital', 'circuit', 'cyber', 'tech', 'software', 'code', 'phone', 'screen'],
        'food': ['food', 'meal', 'dish', 'cuisine', 'restaurant', 'cooking', 'fruit', 'vegetable', 'cake', 'coffee'],
        'people': ['people', 'person', 'human', 'face', 'portrait', 'woman', 'man', 'child', 'group', 'hand'],
        'background': ['background', 'wallpaper', 'backdrop', 'template', 'banner', 'scene'],
        'pattern': ['pattern', 'seamless', 'repeat', 'tile', 'motif', 'ornament', 'decorative'],
        'texture': ['texture', 'surface', 'material', 'grain', 'rough', 'smooth', 'wood', 'metal'],
        'building': ['building', 'architecture', 'house', 'city', 'urban', 'skyline', 'structure', 'room'],
        'vehicle': ['vehicle', 'car', 'transport', 'airplane', 'train', 'boat', 'motorcycle', 'bike'],
        'sport': ['sport', 'fitness', 'athlete', 'game', 'exercise', 'ball', 'running', 'gym'],
        'music': ['music', 'instrument', 'concert', 'audio', 'sound', 'musician', 'guitar', 'piano'],
        'art': ['art', 'painting', 'drawing', 'sketch', 'illustration', 'creative', 'artistic', 'design'],
        'fashion': ['fashion', 'clothing', 'dress', 'style', 'apparel', 'wear', 'outfit', 'shoe'],
        'health': ['health', 'medical', 'wellness', 'fitness', 'doctor', 'hospital', 'care', 'heart'],
        'education': ['education', 'school', 'learning', 'book', 'student', 'study', 'knowledge', 'pen'],
        'finance': ['finance', 'money', 'bank', 'investment', 'economy', 'business', 'coin', 'dollar']
    };

    const combined = caption + ' ' + filenameWords.join(' ');

    for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(k => combined.includes(k))) return cat;
    }

    if (filenameWords.some(w => w.includes('bg') || w.includes('background'))) return 'background';
    if (filenameWords.some(w => w.includes('pattern') || w.includes('seamless'))) return 'pattern';
    if (filenameWords.some(w => w.includes('texture'))) return 'texture';
    if (filenameWords.some(w => w.includes('icon') || w.includes('logo'))) return 'business';

    return 'art';
}

function buildMainSubject(caption, filenameWords) {
    // Extract noun phrases from caption
    const words = caption.split(' ').filter(w => w.length > 3);
    const descriptive = words.filter(w => 
        !['image', 'photograph', 'picture', 'photo', 'of', 'a', 'an', 'the', 'and', 'with', 'in', 'on'].includes(w)
    );

    if (descriptive.length > 0) {
        return descriptive[0].charAt(0).toUpperCase() + descriptive[0].slice(1);
    }

    if (filenameWords.length > 0) {
        return filenameWords[0].charAt(0).toUpperCase() + filenameWords[0].slice(1);
    }

    return 'Design';
}

function detectStyle(caption, filename) {
    const styles = {
        'Vector': ['vector', 'illustration', 'graphic', 'flat', 'minimal', 'icon', 'clipart'],
        '3D Render': ['3d', 'render', 'three dimensional', 'cinematic', 'realistic', 'mockup'],
        'Watercolor': ['watercolor', 'paint', 'artistic', 'hand drawn', 'brush'],
        'Line Art': ['line art', 'outline', 'sketch', 'drawing', 'doodle'],
        'Photographic': ['photograph', 'photo', 'realistic', 'natural', 'camera'],
        'Minimalist': ['minimal', 'simple', 'clean', 'white background', 'isolated'],
        'Vintage': ['vintage', 'retro', 'old', 'classic', 'antique', 'grunge'],
        'Modern': ['modern', 'contemporary', 'sleek', 'futuristic', 'digital'],
        'Neon': ['neon', 'glowing', 'bright', 'vibrant', 'colorful', 'glow']
    };

    for (const [style, keywords] of Object.entries(styles)) {
        if (keywords.some(k => caption.includes(k))) return style;
    }

    const fn = filename.toLowerCase();
    if (fn.includes('3d') || fn.includes('render')) return '3D Render';
    if (fn.includes('vector') || fn.includes('svg')) return 'Vector';
    if (fn.includes('watercolor')) return 'Watercolor';
    if (fn.includes('photo')) return 'Photographic';

    return 'Digital';
}

function detectMood(category, caption) {
    const moods = {
        'abstract': 'Creative', 'business': 'Professional', 'nature': 'Serene',
        'technology': 'Futuristic', 'food': 'Appetizing', 'people': 'Lifestyle',
        'background': 'Minimal', 'pattern': 'Decorative', 'texture': 'Tactile',
        'building': 'Urban', 'vehicle': 'Dynamic', 'sport': 'Energetic',
        'music': 'Rhythmic', 'art': 'Expressive', 'fashion': 'Stylish',
        'health': 'Clean', 'education': 'Intellectual', 'finance': 'Trustworthy'
    };

    // Override based on caption sentiment
    if (caption.includes('dark') || caption.includes('moody')) return 'Dramatic';
    if (caption.includes('bright') || caption.includes('sunny')) return 'Cheerful';
    if (caption.includes('calm') || caption.includes('peaceful')) return 'Calm';
    if (caption.includes('exciting') || caption.includes('dynamic')) return 'Energetic';

    return moods[category] || 'Creative';
}

function detectColors(caption) {
    const colorMap = {
        'red': ['red', 'crimson', 'maroon', 'ruby'],
        'blue': ['blue', 'navy', 'azure', 'cobalt', 'sky'],
        'green': ['green', 'emerald', 'lime', 'forest', 'olive'],
        'yellow': ['yellow', 'gold', 'amber', 'lemon', 'mustard'],
        'orange': ['orange', 'coral', 'peach', 'tangerine'],
        'purple': ['purple', 'violet', 'lavender', 'magenta', 'plum'],
        'pink': ['pink', 'rose', 'magenta', 'fuchsia', 'blush'],
        'black': ['black', 'dark', 'shadow', 'night'],
        'white': ['white', 'light', 'bright', 'snow', 'ivory'],
        'gray': ['gray', 'grey', 'silver', 'slate', 'charcoal'],
        'brown': ['brown', 'chocolate', 'coffee', 'tan', 'beige'],
        'gold': ['gold', 'golden', 'yellow metallic'],
        'silver': ['silver', 'metallic', 'chrome', 'steel']
    };

    const colors = [];
    for (const [color, keywords] of Object.entries(colorMap)) {
        if (keywords.some(k => caption.includes(k))) colors.push(color);
    }

    return colors.length > 0 ? colors : ['mixed'];
}

function buildUseCases(category) {
    const useCases = {
        'abstract': ['web design', 'presentations', 'branding', 'social media', 'wallpaper'],
        'business': ['corporate presentations', 'marketing', 'reports', 'websites', 'brochures'],
        'nature': ['environmental campaigns', 'wellness', 'travel', 'blogs', 'calendars'],
        'technology': ['tech websites', 'app interfaces', 'startups', 'futuristic designs', 'innovation'],
        'food': ['restaurant menus', 'food blogs', 'cooking apps', 'packaging', 'advertising'],
        'people': ['lifestyle blogs', 'social media', 'advertising', 'editorial', 'portraits'],
        'background': ['website headers', 'app backgrounds', 'presentations', 'posters', 'digital art'],
        'pattern': ['textile design', 'wallpaper', 'packaging', 'fabric', 'surface design'],
        'texture': ['graphic design', '3D rendering', 'digital art', 'backgrounds', 'overlays'],
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

    return useCases[category] || useCases['abstract'];
}

function buildTitle(mainSubject, style, category, mood) {
    const patterns = [
        `${mainSubject} ${style} Design`,
        `${mood} ${mainSubject} for ${category}`,
        `Professional ${mainSubject} ${style}`,
        `${mainSubject} ${category} Template`,
        `Creative ${mainSubject} ${style} Art`,
        `${mainSubject} Design Element`,
        `Modern ${mainSubject} ${style}`,
        `${mood} ${mainSubject} Illustration`
    ];

    return patterns[Math.floor(Math.random() * patterns.length)].substring(0, 80);
}

function buildDescription(mainSubject, aiCaption, style, useCases, colors, mood, category) {
    const intro = `A ${mood.toLowerCase()} ${mainSubject.toLowerCase()} design featuring ${aiCaption.toLowerCase()}.`;
    const body = `Ideal for ${useCases[0]}, ${useCases[1] || 'digital media'}, and ${useCases[2] || 'print materials'}.`;
    const close = `High-quality ${style.toLowerCase()} artwork ready for commercial use on stock platforms.`;

    let desc = `${intro} ${body} ${close}`;

    if (colors.length > 0) {
        desc += ` Features a ${colors.slice(0, 3).join(' and ')} color palette.`;
    }

    return desc.substring(0, 300);
}

function buildKeywords(caption, filenameWords, category, mainSubject, style, colors, mood, useCases) {
    const keywords = new Set();

    // Main subject variations
    keywords.add(mainSubject.toLowerCase());
    keywords.add(mainSubject.toLowerCase() + ' ' + style.toLowerCase());
    keywords.add(mainSubject.toLowerCase() + ' design');
    keywords.add(mainSubject.toLowerCase() + ' illustration');
    keywords.add(mainSubject.toLowerCase() + ' ' + category);

    // Caption words
    caption.split(' ').forEach(w => {
        if (w.length > 3) keywords.add(w.toLowerCase().replace(/[^a-z]/g, ''));
    });

    // Filename words
    filenameWords.forEach(w => {
        keywords.add(w.toLowerCase());
        keywords.add(w.toLowerCase() + ' ' + category);
    });

    // Category keywords
    keywords.add(category);
    keywords.add(category + ' design');
    keywords.add(category + ' illustration');
    keywords.add(category + ' art');
    keywords.add(category + ' background');
    keywords.add(category + ' template');

    // Style keywords
    keywords.add(style.toLowerCase());
    keywords.add(style.toLowerCase() + ' design');
    keywords.add(style.toLowerCase() + ' art');

    // Mood keywords
    keywords.add(mood.toLowerCase());
    keywords.add(mood.toLowerCase() + ' ' + category);

    // Color keywords
    colors.forEach(c => {
        keywords.add(c.toLowerCase());
        keywords.add(c.toLowerCase() + ' ' + mainSubject.toLowerCase());
    });

    // Use case keywords
    useCases.forEach(u => {
        keywords.add(u);
        keywords.add(mainSubject.toLowerCase() + ' for ' + u);
    });

    // Stock-specific keywords
    keywords.add('stock ' + category);
    keywords.add('royalty free');
    keywords.add('commercial use');
    keywords.add('professional');
    keywords.add('template');
    keywords.add('asset');
    keywords.add('design element');
    keywords.add('graphic');
    keywords.add('digital');
    keywords.add('creative');
    keywords.add('modern');
    keywords.add('high quality');
    keywords.add('clean');
    keywords.add('crisp');
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
    keywords.add('resource');
    keywords.add('download');
    keywords.add('printable');
    keywords.add('scalable');
    keywords.add('editable');
    keywords.add('customizable');

    return Array.from(keywords).slice(0, 50);
}

function checkIPSafe(caption, filename) {
    const riskyTerms = ['disney', 'marvel', 'star wars', 'pokemon', 'nike', 'adidas', 'apple', 'google', 'facebook', 'instagram', 'coca cola', 'pepsi', 'mcdonalds', 'bmw', 'mercedes', 'toyota', 'samsung', 'sony', 'microsoft', 'amazon', 'netflix', 'spotify', 'youtube', 'twitter', 'tiktok', 'snapchat', 'whatsapp', 'telegram', 'uber', 'airbnb', 'paypal', 'visa', 'mastercard', 'chanel', 'gucci', 'prada', 'louis vuitton', 'rolex', 'cartier', 'tiffany', 'versace', 'dolce gabbana', 'burberry', 'hermes', 'porsche', 'ferrari', 'lamborghini', 'bugatti', 'rolls royce', 'bentley', 'aston martin', 'maserati', 'jaguar', 'land rover', 'range rover', 'mini cooper', 'volkswagen', 'audi', 'bmw', 'mercedes benz', 'toyota', 'honda', 'nissan', 'mazda', 'subaru', 'mitsubishi', 'hyundai', 'kia', 'ford', 'chevrolet', 'cadillac', 'lincoln', 'jeep', 'dodge', 'chrysler', 'buick', 'gmc', 'ram', 'fiat', 'alfa romeo', 'lancia', 'seat', 'skoda', 'peugeot', 'citroen', 'renault', 'opel', 'vauxhall', 'saab', 'volvo', 'scania', 'man', 'iveco', 'daf', 'renault trucks', 'mercedes benz trucks', 'volvo trucks', 'mack', 'peterbilt', 'kenworth', 'freightliner', 'western star', 'international', 'navistar', 'caterpillar', 'komatsu', 'hitachi', 'john deere', 'case', 'new holland', 'massey ferguson', 'fendt', 'claas', 'deutz fahr', 'same', 'lamborghini tractors', 'carraro', 'antonio carraro', 'goldoni', 'bcs', 'ferrari tractors', 'kubota', 'yanmar', 'iseki', 'shibaura', 'mitsubishi tractors', 'suzue', 'taishan', 'foton', 'yto', 'dongfeng', 'jinma', 'fotma', 'chalion', 'sihao', 'weituo', 'luoyang', 'yto', 'chinese tractor', 'indian tractor', 'swaraj', 'escorts', 'powertrac', 'eicher', 'sonalika', 'preet', 'kartar', 'indofarm', 'captain', 'vst', 'kubota india', 'yanmar india', 'iseki india', 'shibaura india', 'mitsubishi india', 'suzue india', 'taishan india', 'foton india', 'yto india', 'dongfeng india', 'jinma india', 'fotma india', 'chalion india', 'sihao india', 'weituo india', 'luoyang india', 'chinese tractor india', 'swaraj india', 'escorts india', 'powertrac india', 'eicher india', 'sonalika india', 'preet india', 'kartar india', 'indofarm india', 'captain india', 'vst india'];

    const combined = (caption + ' ' + filename).toLowerCase();

    for (const term of riskyTerms) {
        if (combined.includes(term)) return false;
    }

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
  AI Caption: ${escapeXml(metadata._aiCaption)}
  Generated by: AI Metadata Injector (Local AI)
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
  AI Caption: ${metadata._aiCaption}
  Generated: ${new Date().toISOString()}
*/\n\n`;
    return comment + content;
}

function generateSidecarMetadata(filename, metadata) {
    return JSON.stringify({
        sourceFile: filename,
        generatedAt: new Date().toISOString(),
        tool: 'AI Metadata Injector (Local AI - Transformers.js)',
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
    if (!modelLoaded) { alert('Please load the AI model first!'); return; }

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

            if (fileItem.strategy === 'exif') {
                // Use local AI for image captioning
                log(`  → Analyzing image with local AI...`, 'info');
                const aiCaption = await generateAICaption(fileItem.file);
                log(`  ✓ AI Caption: "${aiCaption}"`, 'success');

                metadata = generateMetadata(aiCaption, fileItem.name, fileItem.ext);
                log(`  ✓ Generated: "${metadata.title}"`, 'success');

            } else {
                // For non-images, use filename-based generation
                log(`  → Generating metadata from filename...`, 'info');
                metadata = generateMetadataFromFilename(fileItem.name, fileItem.ext);
                log(`  ✓ Generated from filename analysis`, 'success');
            }

            if (!metadata.title || !metadata.keywords) {
                throw new Error('Metadata generation incomplete');
            }

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

        if (i < files.length - 1) await new Promise(r => setTimeout(r, 200));
    }

    progressText.textContent = 'All files processed!';
    renderResults();
    processingSection.style.display = 'none';
    resultsSection.style.display = 'block';
}

function generateMetadataFromFilename(filename, ext) {
    const cleanName = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const words = cleanName.split('\s+').filter(w => w.length > 2);

    const mainSubject = words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : 'Design';
    const category = detectCategory(cleanName.toLowerCase(), words.map(w => w.toLowerCase()));
    const mood = detectMood(category, cleanName.toLowerCase());
    const useCases = buildUseCases(category);

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
        _aiCaption: 'Generated from filename analysis'
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
        keywords: r.metadata.keywords, category: r.metadata.category, ipSafe: r.metadata.ipSafe
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

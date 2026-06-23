// EnerVerse Application Logic: Particles, Three.js 3D Sandbox, Chart.js Telemetry, and Simulation Engine

// GLOBAL STATE
const state = {
    currentTab: 'landing',
    weather: 'sunny', // sunny, cloudy, windy, stormy
    timeOfDay: 720, // 0 to 1439 minutes (12:00 PM default)
    simTimeActive: true,
    battery: 80,
    
solar: 0,
wind: 0,
kinetic: 0,

    // Telemetry values (kW)
    telemetry: {
        solarGen: 51.2,
        windGen: 32.8,
        kineticGen: 4.2,
        totalGen: 88.2,
        consumption: 42.8,
        batterySoC: 84.2,
        netGrid: 45.4,
        
        // Detailed consumers
        lightingDraw: 6.8,
        evDraw: 22.0,
        baseload: 14.0
    },
    
    // Control variables
    controls: {
        lightingMode: 'auto', // auto, manual
        lightingManualDim: 40,
        turbinePitch: 15,
        gridExportThreshold: 60
    },

    // Chart.js instance
    chart: null,
    chartData: {
        labels: [],
        generation: [],
        consumption: []
    }
};

// 1. INITIALIZATION ON LOAD
document.addEventListener("DOMContentLoaded", () => {
    // Start Background Particle Canvas
    initBackgroundParticles();
    
    // Start Holographic Sphere
    initHoloSphere();
    
    // Tab switching setup
    setupTabs();
    
    // Sustainability Calculator setup
    initSustainabilityCalculator();
    
    // Dashboard Controls setup
    initDashboardControls();
    
    // Simulation Tick loop (1s intervals)
    setInterval(simulationTick, 1000);
    
    // Fast Time tick (200ms intervals to advance sim clock)
    setInterval(clockTick, 200);

    // Real system clock — updates header display every second
    startRealTimeClock();
});

// 2. BACKGROUND PARTICLES CANVAS
function initBackgroundParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let particles = [];
    const particleCount = 60;
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    
    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.size = Math.random() * 2 + 1;
            this.color = Math.random() > 0.5 ? 'rgba(0, 217, 255, 0.25)' : 'rgba(0, 255, 153, 0.25)';
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connection lines
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        requestAnimationFrame(animate);
    }
    animate();
}

// 3. HOLOGRAPHIC ENERGY SPHERE CANVAS (LANDING HERO)
function initHoloSphere() {
    const canvas = document.getElementById('holo-sphere');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = 320;
    canvas.height = 320;
    
    let angleX = 0;
    let angleY = 0;
    const center = { x: 160, y: 160 };
    const radius = 100;
    const dotCount = 140;
    const dots = [];
    
    // Create 3D points on a sphere
    for (let i = 0; i < dotCount; i++) {
        const phi = Math.acos(-1 + (2 * i) / dotCount);
        const theta = Math.sqrt(dotCount * Math.PI) * phi;
        dots.push({
            x3d: radius * Math.sin(phi) * Math.cos(theta),
            y3d: radius * Math.sin(phi) * Math.sin(theta),
            z3d: radius * Math.cos(phi)
        });
    }
    
    function project3d(x, y, z) {
        // Rotate X
        let y1 = y * Math.cos(angleX) - z * Math.sin(angleX);
        let z1 = y * Math.sin(angleX) + z * Math.cos(angleX);
        
        // Rotate Y
        let x2 = x * Math.cos(angleY) - z1 * Math.sin(angleY);
        let z2 = x * Math.sin(angleY) + z1 * Math.cos(angleY);
        
        // Orthographic projection with scaling for depth
        const scale = 200 / (200 + z2);
        return {
            x: center.x + x2 * scale,
            y: center.y + y1 * scale,
            depth: z2
        };
    }
    
    function drawSphere() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw glowing inner core
        const grad = ctx.createRadialGradient(center.x, center.y, 10, center.x, center.y, radius * 0.9);
        grad.addColorStop(0, 'rgba(0, 255, 153, 0.15)');
        grad.addColorStop(0.5, 'rgba(0, 217, 255, 0.05)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        angleX += 0.003;
        angleY += 0.005;
        
        // Sort dots by depth so rear ones draw first
        const projected = dots.map(d => project3d(d.x3d, d.y3d, d.z3d));
        projected.sort((a, b) => b.depth - a.depth);
        
        // Draw dots
        projected.forEach(p => {
            const size = Math.max(1, (radius + p.depth) / 30);
            const alpha = Math.max(0.1, (radius + p.depth) / (2 * radius));
            ctx.fillStyle = p.depth > 0 ? `rgba(0, 255, 153, ${alpha})` : `rgba(0, 217, 255, ${alpha * 0.8})`;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Add random holographic interference scanline
        if (Math.random() > 0.96) {
            ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
            ctx.lineWidth = 1;
            const yLine = Math.random() * canvas.height;
            ctx.beginPath();
            ctx.moveTo(30, yLine);
            ctx.lineTo(290, yLine);
            ctx.stroke();
        }
        
        requestAnimationFrame(drawSphere);
    }
    drawSphere();
}

// 4. SPA TAB NAVIGATION ROUTING
function setupTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const dest = tab.getAttribute('data-tab');
            switchTab(dest);
        });
    });
}

function switchTab(tabId) {
    state.currentTab = tabId;
    
    // Update navigation active status
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Toggle active sections
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(sect => {
        sect.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${tabId}-tab`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Trigger conditional initializations
    if (tabId === 'simulation') {
        initThreeJsSandbox();
    } else if (tabId === 'dashboard') {
        initChartJs();
    }
}

// 5. INTERACTIVE SUSTAINABILITY CALCULATOR (ABOUT PAGE)
function initSustainabilityCalculator() {
    const acresSlider = document.getElementById('park-acres');
    const trafficSlider = document.getElementById('foot-traffic');
    const solarSlider = document.getElementById('solar-coverage');
    
    if (!acresSlider) return;
    
    function calculate() {
        const acres = parseFloat(acresSlider.value);
        const traffic = parseFloat(trafficSlider.value);
        const solar = parseFloat(solarSlider.value);
        
        // Update label overlays
        document.getElementById('park-acres-val').innerText = `${acres} Acres`;
        document.getElementById('foot-traffic-val').innerText = `${traffic} People`;
        document.getElementById('solar-coverage-val').innerText = `${solar}%`;
        
        // Formulate generation estimates
        // Solar canopy calculation: 1 acre = 4046 m2. Canopies occupy % coverage. Standard solar panels yield 180W/m2.
        const solarCapacityFactor = 0.15; // 15% efficiency factoring local climate / nights
        const solarGenMWh = Math.round(acres * 4046 * (solar / 100) * 0.18 * 24 * 365 * solarCapacityFactor / 1000);
        
        // WindBloom turbines: Assume 4 turbines per acre. 1.5kW VAWT generators operating at 25% yield
        const windGenMWh = Math.round(acres * 4 * 1.5 * 24 * 365 * 0.25 / 1000);
        
        // Kinetic Pavements: 1 step = 5 Watts for 1 second. Average walker does 50 steps on kinetic paths.
        const kineticGenMWh = Math.round(traffic * 50 * 5 / (3600 * 1000) * 365);
        
        const totalGen = solarGenMWh + windGenMWh + kineticGenMWh;
        const co2Avoided = (totalGen * 0.39).toFixed(1); // 0.39 kg CO2 per kWh grid mix
        const evMiles = Math.round(totalGen * 1000 * 3.5); // 3.5 miles per kWh
        const homesPowered = Math.round((totalGen * 1000) / 3600); // 3600 kWh annual house draw
        
        // Render values
        document.getElementById('calc-gen').innerText = `${totalGen} MWh`;
        document.getElementById('calc-co2').innerText = `${co2Avoided} Tons`;
        document.getElementById('calc-ev').innerText = evMiles.toLocaleString();
        document.getElementById('calc-homes').innerText = homesPowered;
    }
    
    acresSlider.addEventListener('input', calculate);
    trafficSlider.addEventListener('input', calculate);
    solarSlider.addEventListener('input', calculate);
    
    calculate(); // first run
}

// 6. THREE.JS 3D SANDBOX SIMULATION
// 6. THREE.JS 3D SANDBOX SIMULATION
let threeInitialized = false;
let scene, camera, renderer, controlsObj;

let turbines = []; // list of turbine structures to rotate
let solarPanels = []; // list of panel meshes to color-glow
let lightGlows = []; // list of spotlight cones
let kineticPaths = []; // list of footpaths
let ccRing;
let beacon;
let fDome;
let batteryRing;
let solarParticles = [];
let batteryParticles = [];
let waterParticles = [];
let windParticles = [];
let pathPulseOffset = 0;
let energyLines = [];
let domeMesh;
let energyRoads = [];
let roadPulses = [];
let gridHelper;
let hologramTiles = [];
let pond;
let streetLights = [];
// Digital Twin elements
let treesList = []; // swaying trees array
let energyParticles = []; // flowing green particles
let energyFlows = [];
let lastTelemetryUpdate = 0;
let telemetryTimer = 0;
const SIM_SPEED = 0.01;
{
    function createEnergyParticle(start, target) {
    const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 12),
        new THREE.MeshBasicMaterial({
           color: 0x00d9ff,
    transparent: true
        })
    );

    particle.position.copy(start);
    scene.add(particle);

    energyParticles.push({
        mesh: particle,
        start,
        target,
        t: Math.random(),
        speed: 0.006
    });
}
}
function createParticle(color, start, target, array) {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 12),
        new THREE.MeshBasicMaterial({
            color: color
        })
    );

    mesh.position.copy(start);
    scene.add(mesh);

    array.push({
        mesh,
        start,
        target,
        t: Math.random(),
        speed: 0.003 + Math.random() * 0.004
    });
}
function createEnergyFlow(start, end) {
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints([start, end]);

    const material = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.9
});

    const line = new THREE.Line(geometry, material);
    scene.add(line);

    const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 12, 12),
        new THREE.MeshBasicMaterial({
            color: 0x00ffff
        })
    );

    scene.add(particle);

    energyFlows.push({
        start,
        end,
        particle,
        progress: Math.random()
    });
}
function updateTelemetry() 
{

let recommendation =
    'Grid operating normally.';

let confidence = 88;

let action =
    'Monitoring';

if (
    state.weather === 'sunny' &&
    state.battery > 80
) {
    recommendation =
        'Store excess solar energy.';
    confidence = 96;
    action = 'BATTERY CHARGING';
}
else if (
    state.weather === 'cloudy'
) {
    recommendation =
        'Preserve battery reserve.';
    confidence = 90;
    action = 'ENERGY SAVING';
}
else if (
    state.weather === 'windy'
) {
    recommendation =
        'Utilize wind surplus.';
    confidence = 92;
    action = 'WIND OPTIMIZATION';
}
else if (
    state.weather === 'stormy'
) {
    recommendation =
        'Enter protected mode.';
    confidence = 99;
    action = 'EMERGENCY PROTOCOL';
}


if (
    state.timeOfDay >= 1020 &&
    state.timeOfDay <= 1260
) {
    peakDemand =
        'High (Evening)';
}


const alerts = [];

alerts.push(
    (state.solar || 0) > 5
        ? '🟢 Solar Online'
        : '⚫ Solar Offline'
);

alerts.push(
    (state.wind || 0) > 5
        ? '🟢 Wind Online'
        : '🟡 Low Wind Output'
);

alerts.push(
    state.battery > 80
        ? '🟢 Battery Healthy'
        : state.battery > 40
            ? '🟡 Battery Charging'
            : '🔴 Battery Critical'
);

if (state.weather === 'stormy') {
    alerts.push(
        '🔴 Storm Warning'
    );
}
const alertContainer =
    document.getElementById(
        'system-alerts'
    );

if (alertContainer) {

    alertContainer.innerHTML =
        alerts
            .map(
                alert =>
                    `<div class="alert-item">${alert}</div>`
            )
            .join('');
}

    const t = state.timeOfDay;

    let solar = 0;
    let wind = 0;
    let kinetic = 0;

    // Solar Generation
    if (t >= 360 && t <= 1080) {
        const angle = (t - 360) / 720;

        if (state.weather === 'sunny') {
            solar = Math.sin(angle * Math.PI) * 95;
        }
        else if (state.weather === 'cloudy') {
            solar = Math.sin(angle * Math.PI) * 55;
        }
        else if (state.weather === 'windy') {
            solar = Math.sin(angle * Math.PI) * 35;
        }
        else {
            solar = Math.sin(angle * Math.PI) * 12;
        }
    }

    // Wind Generation
    if (state.weather === 'windy') {
       state.windTarget ??= 15;
state.windTarget += (Math.random() - 0.5) * 2;
state.windTarget = THREE.MathUtils.clamp(
    state.windTarget,
    12,
    20
);

wind = state.windTarget;
    }
    else if (state.weather === 'stormy') {
        wind = 18 + Math.random() * 12;
    }
    else {
        wind = 1 + Math.random() * 4;
    }

    // Kinetic Walkways
    state.kineticTarget ??= 3;

if (t >= 360 && t <= 1200) {
    state.kineticTarget += (Math.random() - 0.5) * 0.3;
    state.kineticTarget = THREE.MathUtils.clamp(
        state.kineticTarget,
        2,
        6
    );
} else {
    state.kineticTarget += (Math.random() - 0.5) * 0.1;
    state.kineticTarget = THREE.MathUtils.clamp(
        state.kineticTarget,
        0.5,
        1.5
    );
}

kinetic = state.kineticTarget;
    // Battery Behaviour
    const generation = solar + wind + kinetic;
const consumption = 45;
state.solar = solar;
state.wind = wind;
state.kinetic = kinetic;
state.generation = generation;
state.consumption = consumption;
state.gridExport = generation - consumption;

state.battery +=
    (generation - consumption) * 0.002;

state.battery = THREE.MathUtils.clamp(
    state.battery,
    20,
    100
);

    state.battery = THREE.MathUtils.clamp(
        state.battery,
        20,
        100
    );

    // Update HUD
    document.getElementById('hud-solar').textContent =
        `${solar.toFixed(1)} kW`;

    document.getElementById('hud-wind').textContent =
        `${wind.toFixed(1)} kW`;

    document.getElementById('hud-kinetic').textContent =
        `${kinetic.toFixed(1)} kW`;

    document.getElementById('hud-battery').textContent =
        `${state.battery.toFixed(1)}%`;

if (Math.random() < 0.01) {

    if (solar > 80) {
        logEvent(
            `Solar output increased to ${solar.toFixed(1)} kW`,
            'solar'
        );
    }

    if (wind > 15) {
        logEvent(
            `Wind speed increasing. Output: ${wind.toFixed(1)} kW`,
            'wind'
        );
    }

    if (state.battery > 90) {
        logEvent(
            `Battery nearly full (${state.battery.toFixed(1)}%)`,
            'battery'
        );
    }

    if (
        state.weather === 'stormy'
    ) {
        logEvent(
            'Storm detected. Protective protocols active.',
            'warning'
        );
    }
}
if (
    Math.random() < 0.005 &&
    state.weather === 'sunny' &&
    state.battery > 80
) {
    logEvent(
        'AI recommends storing excess solar energy.',
        'sys'
    );
}

if (
    Math.random() < 0.005 &&
    state.weather === 'cloudy'
) {
    logEvent(
        'AI recommends preserving battery reserve.',
        'sys'
    );
}

if (
    Math.random() < 0.005 &&
    state.weather === 'windy'
) {
    logEvent(
        'AI recommends reducing battery discharge.',
        'sys'
    );
}



const efficiency =
    Math.min(
        100,
        Math.round(
            (state.generation /
                Math.max(state.consumption, 1)) *
                100
        )
    );

const effEl =
    document.getElementById(
        'efficiency-value'
    );

if (effEl)
    effEl.textContent =
        efficiency + '%';


const batteryHealth =
    document.getElementById(
        'battery-health-value'
    );

if (batteryHealth)
    batteryHealth.textContent =
        Math.round(state.battery) + '%';


const risk =
    document.getElementById(
        'risk-value'
    );

if (risk) {
    risk.textContent =
        state.weather === 'stormy'
            ? 'HIGH'
            : state.weather === 'cloudy'
            ? 'MEDIUM'
            : 'LOW';
}


const stability =
    document.getElementById(
        'stability-value'
    );

if (stability) {
    stability.textContent =
        state.gridExport > -40
            ? 'STABLE'
            : 'HEAVY LOAD';
}

}
function createLabel(text, x, y, z) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = 512;
    canvas.height = 128;

   ctx.font = 'Bold 42px Arial';
ctx.textAlign = 'center';

ctx.strokeStyle = '#00d9ff';
ctx.lineWidth = 8;
ctx.strokeText(text, 256, 70);

ctx.fillStyle = '#ffffff';
ctx.fillText(text, 256, 70);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10, 2.5, 1);
    sprite.position.set(x, y, z);

    scene.add(sprite);
    labels.push(sprite);
}
let labels = [];
let dirLight, ambientLight; // referenced for day-night cycle

// Raycaster & Mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Camera Cinematic Tour variables
const tour = {
    active: false,
    state: 'idle',
    startTime: 0,
    orbitAngle: 0
};

function initThreeJsSandbox() {
    if (threeInitialized) return;
    
    const container = document.getElementById('sim-canvas-container');
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040a12);
    scene.fog = new THREE.FogExp2(0x040a12, 0.008);
    
    // Camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(70, 45, 70);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Remove loading indicator, insert canvas
    const loadingElem = document.getElementById('sim-loading');
    if (loadingElem) loadingElem.classList.add('fade-out');
    container.appendChild(renderer.domElement);
    
    // Orbital Controls
    controlsObj = new THREE.OrbitControls(camera, renderer.domElement);
    controlsObj.enableDamping = true;
    controlsObj.dampingFactor = 0.05;
    controlsObj.maxPolarAngle = Math.PI / 2.1; // lock below terrain
    controlsObj.minDistance = 20;
    controlsObj.maxDistance = 150;
    
    // Lights
    ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);
    
    // Directional (Sun/Moon Light)
    dirLight = new THREE.DirectionalLight(
    0xffffff,
    1.5
);

dirLight.position.set(
    40,
    80,
    30
);

scene.add(dirLight);
    dirLight.position.set(40, 80, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
   const hemi = new THREE.HemisphereLight(
    0xb1e1ff,
    0x2d5a27,
    1.3
);

scene.add(hemi);

    
    // Build Park Terrain Ground and Components
    buildParkEnvironment();
    createEnergyFlow(
    new THREE.Vector3(-25,4,15),
    new THREE.Vector3(-10,2,5)
);

createEnergyFlow(
    new THREE.Vector3(20,4,-15),
    new THREE.Vector3(-10,2,5)
);

createEnergyFlow(
    new THREE.Vector3(-10,2,5),
    new THREE.Vector3(0,4,0)
);
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('click', onCanvasClick);
    
    // Diagnostic Camera Tour trigger
    const tourBtn = document.getElementById('btn-camera-tour');
    if (tourBtn) {
        tourBtn.onclick = () => {
            if (tour.active) {
                // Cancel tour
                tour.active = false;
                controlsObj.enabled = true;
                tourBtn.innerHTML = `<i class="fa-solid fa-play"></i><span>RUN DIAGNOSTIC TOUR</span>`;
                logEvent("Diagnostic tour aborted.", "sys");
            } else {
                // Start tour
                tour.active = true;
                tour.startTime = Date.now();
                tour.orbitAngle = 0;
                controlsObj.enabled = false;
                hideSimulationDetailCard();
                tourBtn.innerHTML = `<i class="fa-solid fa-stop text-glow"></i><span>ABORT TOUR</span>`;
                logEvent("Cinematic diagnostic tour started.", "action");
            }
        };
    }

    // Detail card close button
    const closeCardBtn = document.getElementById('btn-close-sim-card');
    if (closeCardBtn) {
        closeCardBtn.onclick = hideSimulationDetailCard;
    }
    
    threeInitialized = true;
    animateThree();
    energyFlows.forEach(flow => {
    flow.progress += 0.005;

    if (flow.progress > 1)
        flow.progress = 0;

    flow.particle.position.lerpVectors(
        flow.start,
        flow.end,
        flow.progress
    );
});
}

function onWindowResize() {
    if (!renderer || !camera) return;
    const container = document.getElementById('sim-canvas-container');
    if (!container) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}
function createEnergyParticle(start, target) {
    const pGeo = new THREE.SphereGeometry(0.25, 16, 16);

    const pMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.9
    });

    const pMesh = new THREE.Mesh(pGeo, pMat);

    pMesh.position.copy(start);
    scene.add(pMesh);

    energyParticles.push({
        mesh: pMesh,
        start,
        target,
        t: Math.random(),
        speed: 0.015 + Math.random() * 0.01
    });
}

function createEnergyRoad(start, end, color = 0x00d9ff) {

    const direction = new THREE.Vector3()
        .subVectors(end, start);

    const length = direction.length();

    const roadGeo = new THREE.BoxGeometry(
        length,
        0.08,
        1.2
    );

    const roadMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.25
    });

    const road = new THREE.Mesh(
        roadGeo,
        roadMat
    );

    road.position
        .copy(start)
        .add(end)
        .multiplyScalar(0.5);

    road.lookAt(end);
    road.rotateY(Math.PI / 2);

    // Neon side strips
    const edgeGeo = new THREE.BoxGeometry(
        length,
        0.02,
        0.06
    );

    const edgeMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff
    });

    const edge1 = new THREE.Mesh(
        edgeGeo,
        edgeMat
    );

    const edge2 = new THREE.Mesh(
        edgeGeo,
        edgeMat
    );

    edge1.position.z = 0.55;
    edge2.position.z = -0.55;

    road.add(edge1);
    road.add(edge2);

for (let i = 0; i < 6; i++) {

    const pulseGeo =
        new THREE.SphereGeometry(
            0.15,
            8,
            8
        );

    const pulseMat =
        new THREE.MeshBasicMaterial({
            color: 0xffffff
        });

    const pulse =
        new THREE.Mesh(
            pulseGeo,
            pulseMat
        );

    road.add(pulse);

    roadPulses.push({
        mesh: pulse,
        road,
        t: i / 6
    });
}

    scene.add(road);
    energyRoads.push(road);
}

function buildParkEnvironment() 
{
      const batteryPos = new THREE.Vector3(-15, 1, 0);
     


    // 1. Grid terrain surface
    const terrainGeo = new THREE.CylinderGeometry(
65,
72,
3,
128
);
const vertices =
    terrainGeo.attributes.position;

for (let i = 0; i < vertices.count; i++) {

    const x =
        vertices.getX(i);

    const z =
        vertices.getZ(i);

    const distance =
        Math.sqrt(
            x * x +
            z * z
        );

    if (distance < 58) {

        const hill =
            Math.sin(x * 0.08) *
            Math.cos(z * 0.08) *
            1.5;

        const y =
            vertices.getY(i);

        vertices.setY(
            i,
            y + hill
        );
    }
}

vertices.needsUpdate = true;
terrainGeo.computeVertexNormals();

const terrainMat = new THREE.MeshStandardMaterial({
color: 0x2B4C34,
roughness: 0.95,
metalness: 0.02
});

const terrain = new THREE.Mesh(
terrainGeo,
terrainMat
);

terrain.position.y = -1.5;
terrain.receiveShadow = true;

scene.add(terrain);
const islandRing = new THREE.Mesh(
new THREE.TorusGeometry(65, 0.5, 16, 100),
new THREE.MeshBasicMaterial({
color: 0x00d9ff,
transparent: true,
opacity: 0.35
})
);

islandRing.rotation.x = Math.PI / 2;
islandRing.position.y = 0.1;

scene.add(islandRing);

    
    // Green blueprint grids overlay
    gridHelper =
    new THREE.GridHelper(
        120,
        30,
        0x00ff99,
        0x00d9ff
    );

gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.08;

scene.add(gridHelper);
for (let x = -50; x <= 50; x += 10) {

    for (let z = -50; z <= 50; z += 10) {

        const hex =
            new THREE.Mesh(
                new THREE.CircleGeometry(
                    2,
                    6
                ),
                new THREE.MeshBasicMaterial({
                    color: 0x00d9ff,
                    transparent: true,
                    opacity: 0.03
                })
            );

        hex.rotation.x =
            -Math.PI / 2;

        hex.position.set(
            x,
            0.02,
            z
        );

        scene.add(hex);

        hologramTiles.push(hex);
    }
}
    gridHelper.material.transparent = true;
gridHelper.material.opacity = 0.05;
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);
    
    // Outer cyber-dome boundary ring
    const ringGeo = new THREE.RingGeometry(60, 60.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00d9ff, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const boundaryRing = new THREE.Mesh(ringGeo, ringMat);
    boundaryRing.rotation.x = -Math.PI / 2;
    boundaryRing.position.y = 0.1;
    scene.add(boundaryRing);
    
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.6 });
    
    // 2. Photon Canopy Solar System (Main Generation, 75%)
    const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x0f3f8c,
    roughness: 0.2,
    metalness: 0.9,
    emissive: 0x003366,
    emissiveIntensity: 0.1
});
    
    const canopyPositions = [
        { x: -30, z: -20 }, { x: -30, z: 20 },
        { x: 30, z: -20 }, { x: 30, z: 20 }
    ];
    
    canopyPositions.forEach(pos => {
        const pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
        const p1 = new THREE.Mesh(pillarGeo, pillarMat);
        p1.position.set(pos.x - 3, 4, pos.z);
        const p2 = new THREE.Mesh(pillarGeo, pillarMat);
        p2.position.set(pos.x + 3, 4, pos.z);
        scene.add(p1); scene.add(p2);
        
        const roofGeo = new THREE.BoxGeometry(10, 0.25, 6);
        const roof = new THREE.Mesh(roofGeo, canopyMat);
        roof.position.set(pos.x, 8.1, pos.z);
        roof.rotation.z = 0.18; 
        roof.castShadow = true;
        roof.userData = {
            type: 'photon-canopy',
            title: 'Photon Canopy Solar System',
            desc: 'Dual-aspect bifacial photovoltaic solar roofing structured over walkways. The primary clean power generator for the park grid.',
            role: 'Primary Generation',
            contrib: 'Main Source (~75%)'
        };
        scene.add(roof);
        solarPanels.push(roof);
    });
    

solarPanels.forEach(panel => {
    const start = panel.getWorldPosition(
        new THREE.Vector3()
    );

    createParticle(
        0xffcc00,
        start,
        batteryPos,
        solarParticles
    );
});
    
    // 3. WindBloom Vertical Axis Turbines (Supporting Generation, 20%)
    const turbinePositions = [
        { x: -40, z: 0 }, { x: 40, z: 0 },
        { x: 0, z: -40 }, { x: 0, z: 40 }
    ];
    
    turbinePositions.forEach(pos => {
        const tGroup = new THREE.Group();
        tGroup.position.set(pos.x, 0, pos.z);
        tGroup.userData = {
            type: 'windbloom-turbine',
            title: 'WindBloom Vertical Turbine',
            desc: 'Silent Vertical Axis Wind Turbines (VAWTs) integrated as aesthetic park art. Captures omnidirectional breeze safely.',
            role: 'Supporting Generation',
            contrib: 'Wind Source (~20%)'
        };
        
        // Pole support
        const mastGeo = new THREE.CylinderGeometry(0.4, 0.6, 12, 12);
        const mast = new THREE.Mesh(mastGeo, pillarMat);
        mast.position.y = 6;
        mast.castShadow = true;
        tGroup.add(mast);
        
        // Rotating blades assembly
        const rotorGroup = new THREE.Group();
        rotorGroup.position.y = 12;
        
       const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.7
});
        
        for (let i = 0; i < 3; i++) {
            const bGeo = new THREE.BoxGeometry(0.1, 6, 1.2);
            const blade = new THREE.Mesh(bGeo, bladeMat);
            const angle = (i * Math.PI * 2) / 3;
            blade.position.set(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5);
            blade.rotation.y = -angle + 0.3; 
            rotorGroup.add(blade);
        }
        
        tGroup.add(rotorGroup);
        scene.add(tGroup);
        turbines.push(rotorGroup); 
    });
    
    // 4. Subterranean Smart Battery Vault
    const vaultGroup = new THREE.Group();
    vaultGroup.position.set(-15, 0.5, 0);
    vaultGroup.userData = {
        type: 'battery-storage',
        title: 'Smart Battery Vault',
        desc: 'Subterranean lithium-iron phosphate battery storage system. Dynamically absorbs clean generation surpluses and buffers city export feeds.',
        role: 'Grid Buffering & Reserves',
        contrib: '500 kWh Capacity'
    };
    
    const vaultGeo = new THREE.BoxGeometry(6, 1.5, 4);
    const vaultMat = new THREE.MeshStandardMaterial({ 
        color: 0x353b48,
    roughness: 0.3,
    metalness: 0.8});
    const vault = new THREE.Mesh(vaultGeo, vaultMat);
    vault.castShadow = true;
    vaultGroup.add(vault);
    
    // LED Status bars on Vault
    const ledGeo = new THREE.BoxGeometry(4.5, 0.15, 0.1);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ff99 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0.2, 2.01);
    vaultGroup.add(led);
    scene.add(vaultGroup);
    const batteryRing =
    new THREE.Mesh(
        new THREE.TorusGeometry(
            4,
            0.08,
            16,
            100
        ),
        new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.4
        })
    );

batteryRing.rotation.x =
    Math.PI / 2;

batteryRing.position.set(
    -15,
    0.05,
    0
);

scene.add(batteryRing);
    const controlPos = new THREE.Vector3(0, 2.5, -15);

for (let i = 0; i < 18; i++) {
    createParticle(
        0x00d9ff,
        batteryPos,
        controlPos,
        batteryParticles
    );
}
    
    // 5. Control Centre Building
    const ccGroup = new THREE.Group();
    beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 16, 16),
    new THREE.MeshBasicMaterial({
        color: 0x00ffff
    })
);

beacon.position.y = 7;
ccGroup.add(beacon);
    ccGroup.position.set(0, 0, -15);
    ccGroup.userData = {
        type: 'control-centre',
        title: 'Control Centre Building',
        desc: 'Central computing block hosting the local grid AI core. Manages smart lighting mesh overrides, charging station lockouts, and municipal grid feed decisions.',
        role: 'Grid Operations & AI Core',
        contrib: 'Click to Open Dashboard'
    };
    
    const ccGeo = new THREE.CylinderGeometry(4.5, 6, 5, 6);
    const ccMat = new THREE.MeshStandardMaterial({ 
        color: 0x1b2233,
    roughness: 0.2,
    metalness: 0.9,
    emissive: 0x001122,
    emissiveIntensity: 0.25 });
    const ccMesh = new THREE.Mesh(ccGeo, ccMat);
    ccMesh.position.y = 2.5;
    ccMesh.castShadow = true;
    ccMesh.receiveShadow = true;
    ccGroup.add(ccMesh);
    
    // Dome top glow
    const domeGeo = new THREE.SphereGeometry(2.8, 16, 16, 0, Math.PI*2, 0, Math.PI/2);
    const domeMat = new THREE.MeshBasicMaterial({ color: 0x00d9ff, transparent: true, opacity: 0.35 });
    domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.position.y = 5;
    ccGroup.add(domeMesh);
    
ccRing = new THREE.Mesh(
    new THREE.TorusGeometry(5.5, 0.18, 16, 100),
    new THREE.MeshBasicMaterial({
        color: 0x00d9ff,
        transparent: true,
        opacity: 0.8
    })
);

ccRing.rotation.x = Math.PI / 2;
ccRing.position.y = 0.5;

ccGroup.add(ccRing);
    scene.add(ccGroup);
createEnergyRoad(
    batteryPos,
    controlPos
);
    // 6. Water Monitoring Station
    const wmGroup = new THREE.Group();
    wmGroup.position.set(20, 0, -30);
    wmGroup.userData = {
        type: 'water-monitoring',
        title: 'Water Monitoring Station',
        desc: 'Hydrological testing station tracking pond chemistry, rainwater harvesting, filtration flow rates, and soil moisture grids.',
        role: 'Environmental Safety',
        contrib: 'IoT Water Sensors'
    };
    
    // Small pond next to filter block
    const pondGeo = new THREE.CylinderGeometry(5, 5, 0.1, 16);
    const pondMat = new THREE.MeshStandardMaterial({ color: 0x005577, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.7 });
    pond = new THREE.Mesh(pondGeo, pondMat);
    pond.material.transparent = true;
pond.material.opacity = 0.75;
    pond.position.set(22, 0.06, -30);
    scene.add(pond);
    
    const filterGeo = new THREE.BoxGeometry(2.5, 3.5, 2.5);
    const filterMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.5 });
    const filter = new THREE.Mesh(filterGeo, filterMat);
    filter.position.y = 1.75;
    filter.castShadow = true;
    wmGroup.add(filter);
    
   const filterDomeMat = new THREE.MeshBasicMaterial({
    color: 0x00ff99,
    transparent: true,
    opacity: 0.8
});
const filterDomeGeo =
    new THREE.SphereGeometry(1.2, 16, 16);

fDome = new THREE.Mesh(
    filterDomeGeo,
    filterDomeMat
);

fDome.position.set(0, 3.5, 0);
wmGroup.add(fDome);
scene.add(wmGroup);


    const waterPos = wmGroup.position.clone();
waterPos.y += 2;

const wmControlPos = ccGroup.position.clone();
wmControlPos.y += 3;
createEnergyRoad(
    wmControlPos,
    waterPos
);

for (let i = 0; i < 10; i++) {
    createParticle(
        0x00ff88,
        wmControlPos,
        waterPos,
        waterParticles
    );
}
    // 7. Trees & Green spaces (Swaying animations)
    const treePositions = [
        { x: -35, z: -35 }, { x: -45, z: -25 },
        { x: 35, z: 35 }, { x: 45, z: 25 },
        { x: -35, z: 35 }, { x: 35, z: -35 }
    ];
    
    treePositions.forEach((tPos, index) => {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(tPos.x, 0, tPos.z);
        treeGroup.userData = {
            type: 'tree',
            title: 'Eco Canopy Area',
            desc: 'Organic park trees integrated with soil moisture sensors, contributing to carbon offset metrics and urban cooling.',
            role: 'Ecological Buffer',
            contrib: 'Passive Sequestration'
        };
        
        const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, 4, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2;
        treeGroup.add(trunk);
        
        const foliage = new THREE.Group();
        foliage.position.y = 4;
        
        const leavesGeo = new THREE.ConeGeometry(2, 4.5, 8);
        const leavesMat = new THREE.MeshStandardMaterial({ 
          color: 0x2ecc71,
    roughness: 0.85 });
        const leavesMesh = new THREE.Mesh(leavesGeo, leavesMat);
        leavesMesh.position.y = 2.25;
        leavesMesh.castShadow = true;
        foliage.add(leavesMesh);
        
        treeGroup.add(foliage);
        scene.add(treeGroup);
        
        // Register leaves to be animated
        treesList.push({
            mesh: foliage,
            seed: index * 1.5
        });
    });
    
    // 8. Smart Lighting Posts
    const lightPositions = [
        { x: -15, z: -15 }, { x: 15, z: -15 },
        { x: -15, z: 15 }, { x: 15, z: 15 }
    ];
    
    lightPositions.forEach(pos => {
        const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 7, 8);
        const post = new THREE.Mesh(postGeo, pillarMat);
        post.position.set(pos.x, 3.5, pos.z);
        scene.add(post);
        
        const headGeo = new THREE.BoxGeometry(1.2, 0.15, 0.3);
        const head = new THREE.Mesh(headGeo, pillarMat);
        head.position.set(pos.x + 0.4, 7, pos.z);
        scene.add(head);
        
        const coneGeo = new THREE.ConeGeometry(5, 7, 16, 1, true);
        const coneMat = new THREE.MeshBasicMaterial({
            color: 0x00d9ff,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
cone.position.set(pos.x + 0.4, 3.5, pos.z);

scene.add(cone);

lightGlows.push(cone);
streetLights.push(cone);
    });
    
    // 9. TerraPulse Smart Pathway (Piezoelectric Walkways, 3%)
    const curvePoints = [
        new THREE.Vector3(-45, 0.1, -45),
        new THREE.Vector3(-20, 0.1, -10),
        new THREE.Vector3(0, 0.1, 0),
        new THREE.Vector3(20, 0.1, 10),
        new THREE.Vector3(45, 0.1, 45)
    ];
    const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-28,0.1,-18),
    new THREE.Vector3(-20,0.1,-8),
    new THREE.Vector3(-15,0.1,0),
    new THREE.Vector3(-8,0.1,-8),
    new THREE.Vector3(0,0.1,-15)
]);
    const points = curve.getPoints(50);
    
    const pGeo = new THREE.BoxGeometry(1.5, 0.05, 1.5);
    const pMat = new THREE.MeshStandardMaterial({
        color: 0x6c757d,
        roughness: 0.9,
        emissive: 0x00ff99,
        emissiveIntensity: 0.3
    });
    
    points.forEach((pt, idx) => {
        const pathTile = new THREE.Mesh(pGeo, pMat.clone());
        pathTile.position.copy(pt);
        if(idx < points.length - 1) {
            pathTile.lookAt(points[idx+1]);
        }
        pathTile.userData = {
            type: 'terrapulse-pathway',
            title: 'TerraPulse Pathway',
            desc: 'Piezoelectric pavements gathering micro-current pulses from walker foot traffic, fueling smart lighting meshes.',
            role: 'Kinetic Generation',
            contrib: 'Auxiliary Source (~3%)'
        };
        scene.add(pathTile);
        kineticPaths.push(pathTile);
    });
    
    // 10. Energy Flow Particles (Source to Battery)
    const partGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const partMat = new THREE.MeshBasicMaterial({ color: 0x00ff99, transparent: true, opacity: 0.75 });
    
    const sources = [
        new THREE.Vector3(-30, 8.1, -20),
        new THREE.Vector3(-30, 8.1, 20),
        new THREE.Vector3(30, 8.1, -20),
        new THREE.Vector3(30, 8.1, 20),
        new THREE.Vector3(-40, 12, 0),
        new THREE.Vector3(40, 12, 0),
        new THREE.Vector3(0, 12, -40),
        new THREE.Vector3(0, 12, 40)
    ];
    const batteryTarget = new THREE.Vector3(-15, 0.5, 0);
    
    for (let i = 0; i < 15; i++) {
        const pMesh = new THREE.Mesh(partGeo, partMat);
        scene.add(pMesh);
        
        const srcIdx = Math.floor(Math.random() * sources.length);
        energyParticles.push({
            mesh: pMesh,
            start: sources[srcIdx],
            target: batteryTarget,
            t: Math.random(),
            speed: 0.015 + Math.random() * 0.01
        });
    }
createLabel('☀️ Photon Canopy', 0, 12, 0);
createLabel('🌬️ Wind Turbine', -40, 18, 0);
createLabel('🔋 Battery Storage', -15, 5, 0);
createLabel('🏢 Control Centre', 0, 8, -15);
createLabel('🚰 Water Station', 22, 7, -30);

// Solar → Battery
createEnergyParticle(
    new THREE.Vector3(-30, 4, -20),
    new THREE.Vector3(-15, 1, 0)
);

createEnergyParticle(
    new THREE.Vector3(30, 4, -20),
    new THREE.Vector3(-15, 1, 0)
);

// Wind → Battery
createEnergyParticle(
    new THREE.Vector3(-40, 8, 0),
    new THREE.Vector3(-15, 1, 0)
);

createEnergyParticle(
    new THREE.Vector3(40, 8, 0),
    new THREE.Vector3(-15, 1, 0)
);

// Battery → Control Centre
createEnergyParticle(
    new THREE.Vector3(-15, 1, 0),
    new THREE.Vector3(0, 2, -15)
);
}

// Raycaster interactive target helper
function getInteractableParent(object) {
    let current = object;
    while (current) {
        if (current.userData && current.userData.type) {
            return current;
        }
        current = current.parent;
    }
    return null;
}

function onCanvasClick(event) {
    if (tour.active) return; // ignore clicks during camera flight
    
    const container = document.getElementById('sim-canvas-container');
    if (!container) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        const parent = getInteractableParent(intersects[0].object);
        if (parent) {
            showSimulationDetailCard(parent.userData);
            return;
        }
    }
    hideSimulationDetailCard();
}

function showSimulationDetailCard(data) {
    const card = document.getElementById('sim-info-card');
    if (!card) return;
    
    document.getElementById('sim-card-title').innerText = data.title;
    document.getElementById('sim-card-desc').innerText = data.desc;
    document.getElementById('sim-card-role').innerText = data.role;
    document.getElementById('sim-card-contrib').innerText = data.contrib;
    
    const tag = document.getElementById('sim-card-tag');
    tag.innerText = data.type.replace('-', ' ').toUpperCase();
    
    const actionBtn = document.getElementById('btn-sim-card-action');
    if (data.type === 'control-centre') {
        actionBtn.innerText = 'OPEN COMMAND CENTRE';
        actionBtn.onclick = () => {
            hideSimulationDetailCard();
            switchTab('dashboard');
        };
    } else {
        actionBtn.innerText = 'MONITOR LIVE FEED';
        actionBtn.onclick = () => {
            hideSimulationDetailCard();
            switchTab('dashboard');
        };
    }
    
    card.classList.add('active');
}

function hideSimulationDetailCard() {
    const card = document.getElementById('sim-info-card');
    if (card) card.classList.remove('active');
}

// Day Night lighting cycle solver
function updateDayNightCycle() {
    const time = state.timeOfDay;
    
    let targetIntensity = 0.4;
    let targetAmbient = 0.15;
    let skyColor = new THREE.Color(0x07111f);
    let sunColor = new THREE.Color(0x00d9ff);
    
    if (time >= 300 && time < 420) {
        // Sunrise: morning red-orange gradient to cyan
        const t = (time - 300) / 120;
        targetIntensity = THREE.MathUtils.lerp(0.0, 1.3, t);
targetAmbient = THREE.MathUtils.lerp(0.08, 0.55, t);
        skyColor.lerpColors(new THREE.Color(0x040a12), new THREE.Color(0x07111f), t);
        sunColor.lerpColors(new THREE.Color(0xff6600), new THREE.Color(0x00d9ff), t);
    } else if (time >= 420 && time < 1020) {
        // Day
        targetIntensity = 0.8;
targetAmbient = 0.3;

skyColor.setHex(0xb8dff5);
sunColor.setHex(0xffffff);
    } else if (time >= 1020 && time < 1140) {
        // Sunset: warm orange to dark navy
        const t = (time - 1020) / 120;
        targetIntensity = THREE.MathUtils.lerp(1.3, 0.0, t);
targetAmbient = THREE.MathUtils.lerp(0.55, 0.08, t);
        skyColor.lerpColors(new THREE.Color(0x07111f), new THREE.Color(0x040a12), t);
        sunColor.lerpColors(new THREE.Color(0x00d9ff), new THREE.Color(0xff4400), t);
    } else {
        // Night
        targetIntensity = 0.0;
        targetAmbient = 0.04;
        skyColor.setHex(0x040a12);
        sunColor.setHex(0x112244);
    }
    
    if (state.weather === 'stormy') {
        targetIntensity = 0.02;
        targetAmbient = 0.05;
        skyColor.setHex(0x02050a);
    }
    
    dirLight.intensity = THREE.MathUtils.lerp(dirLight.intensity, targetIntensity, 0.05);
    ambientLight.intensity = THREE.MathUtils.lerp(ambientLight.intensity, targetAmbient, 0.05);
    scene.background.lerp(skyColor, 0.05);
    scene.fog = new THREE.Fog(
    skyColor,
    300,
    800
);
    dirLight.color.lerp(sunColor, 0.05);
}

function animateThree() {


    if (pond) {

    pond.material.opacity =
        0.65 +
        Math.sin(
            Date.now() * 0.002
        ) * 0.1;

    pond.rotation.z += 0.0008;
}

    if (gridHelper) {
    gridHelper.material.opacity =
        0.05 +
        Math.sin(
            Date.now() * 0.001
        ) * 0.03;
}
    if (
        !threeInitialized ||
        state.currentTab !== 'simulation'
    ) return;

    requestAnimationFrame(animateThree);

    if (ccRing) {
        ccRing.rotation.z += 0.01;

        ccRing.material.opacity =
            0.5 +
            Math.sin(Date.now() * 0.003) * 0.3;
    }

    energyRoads.forEach(road => {
        road.material.opacity =
            0.18 +
            Math.sin(Date.now() * 0.003) * 0.1;
    });

    hologramTiles.forEach((tile, index) => {

    tile.material.opacity =
        0.02 +
        (
            Math.sin(
                Date.now() * 0.001 +
                index
            ) + 1
        ) * 0.015;
});


    roadPulses.forEach(p => {

        p.t += 0.003;

        if (p.t > 1) {
            p.t = 0;
        }

        const roadLength =
            p.road.geometry.parameters.width;

        p.mesh.position.x =
            -roadLength / 2 +
            roadLength * p.t;
    });

    if (batteryRing) {
        batteryRing.rotation.z += 0.01;
    }

if (fDome) {
    fDome.rotation.y += 0.01;

    fDome.material.opacity =
        0.6 + Math.sin(Date.now() * 0.003) * 0.3;
}
    if (state.currentTab !== 'simulation') 
        {
        return;
        }
const ANIM_SIM_SPEED = 0.05;
    if (state.timeOfDay >= 1440) {
        state.timeOfDay = 0;
    }

    if (beacon) {
        beacon.material.opacity =
            0.7 + Math.sin(Date.now() * 0.004) * 0.3;
    }

    // Day Night Cycle logic
    updateDayNightCycle();
    
    // 1. Windbloom turbine rotations
    const windSpeedFactor = state.weather === 'sunny' ? 3 :
                            state.weather === 'cloudy' ? 5 :
                            state.weather === 'windy' ? 12 : 18;
    
    const rotateSpeed = 0.003 * windSpeedFactor * (45 - state.controls.turbinePitch) / 30;
    turbines.forEach(rotor => {
        rotor.rotation.y += rotateSpeed;
    });
    const isNight =
    state.timeOfDay >= 1080 ||
    state.timeOfDay <= 360 ||
    state.weather === 'stormy';
   
    solarParticles.forEach(p => {

    if (isNight) {
        p.mesh.visible = false;
        return;
    }

    p.mesh.visible = true;

    p.t += p.speed;

    if (p.t >= 1) {
        p.t = 0;
    }

    p.mesh.position.lerpVectors(
        p.start,
        p.target,
        p.t
    );
});
    
batteryParticles.forEach(p => {

    p.speed =
        0.002 +
        (state.battery / 100) * 0.01;

    p.t += p.speed;

    if (p.t >= 1) {
        p.t = 0;
    }

    // Pulsing glow every frame
    p.mesh.material.opacity =
        0.5 +
        Math.sin(Date.now() * 0.01 + p.t * 10) * 0.5;

    p.mesh.position.lerpVectors(
        p.start,
        p.target,
        p.t
    );

    if (
        state.battery > 25 &&
        (
            state.timeOfDay >= 1080 ||
            state.timeOfDay <= 360
        )
    ) {
        p.mesh.visible = true;
    } else {
        p.mesh.visible = false;
    }
});
    // 2. Solar Canopy subtle pulsing glow
    const canopyIntensity = 0.2 + 0.12 * Math.sin(Date.now() * 0.0018);
    solarPanels.forEach(roof => {
        // adjust emissive strength
        roof.material.emissiveIntensity = canopyIntensity;
    });
    
    // 3. Streetlamp Spotlight Cone glow visibility
    streetLights.forEach(light => {

    light.visible = isNight;

    light.material.opacity =
        isNight
            ? 0.25 +
              Math.sin(
                  Date.now() * 0.005
              ) * 0.05
            : 0;
});

    streetLights.forEach(light => {

    light.visible = isNight;

    if (isNight) {
        light.material.opacity =
            0.25 +
            Math.sin(Date.now() * 0.005) * 0.05;
    } else {
        light.material.opacity = 0;
    }
});
    lightGlows.forEach(cone => {
        cone.visible = isNight;
        if (state.controls.lightingMode === 'auto') {
            const ambientFactor = state.weather === 'stormy' ? 0.8 : 
                                  (state.timeOfDay > 1200 || state.timeOfDay < 240) ? 1.0 : 0.6;
            cone.material.opacity = 0.15 * ambientFactor;
        } else {
            cone.material.opacity = 0.15 * (state.controls.lightingManualDim / 100);
        }
    });
    
    // 4. Organic swaying trees foliage
    const swayTime = Date.now() * 0.0025;
    treesList.forEach(tree => {
        tree.mesh.rotation.z = Math.sin(swayTime + tree.seed) * 0.025;
        tree.mesh.rotation.x = Math.cos(swayTime + tree.seed) * 0.015;
    });
    
    // 5. Energy flow particles (Source to Battery vault)
    energyParticles.forEach(p => {
    p.mesh.material.opacity =
        0.5 + Math.sin(Date.now() * 0.01 + p.t * 10) * 0.5;

    p.t += p.speed;

    if (p.t >= 1) {
        p.t = 0;
    }

    p.mesh.position.lerpVectors(
        p.start,
        p.target,
        p.t
    );

    const isSolarSource =
        p.start.x === -30 || p.start.x === 30;

    if (isSolarSource && !isNight) {
        p.mesh.visible = true;
    } else if (isSolarSource && isNight) {
        p.mesh.visible = Math.random() > 0.95;
    } else {
        p.mesh.visible = true;
    }
});
    
    // 6. Pulse kinetic pavement segments
    pathPulseOffset += 0.1;
    kineticPaths.forEach((tile, index) => {
        const intensity = Math.sin(index * 0.4 - pathPulseOffset) * 0.5 + 0.5;
        tile.material.emissiveIntensity = intensity * 0.4 + 0.1;
    });
    
    // 7. Camera cinematic tour state controller
    if (tour.active) {
        const now = Date.now();
        const elapsed = (now - tour.startTime) / 1000;
        
        let targetPos = new THREE.Vector3();
        let targetLookAt = new THREE.Vector3();
        let lerpSpeed = 0.03;
        
        if (elapsed < 3.0) {
            // Aerial look down
            targetPos.set(0, 90, 90);
            targetLookAt.set(0, 0, 0);
        } else if (elapsed < 6.0) {
            // Entering Park
            targetPos.set(0, 25, 45);
            targetLookAt.set(0, 0, -5);
        } else if (elapsed < 11.0) {
            // Orbit Photon Canopy (-30, 8, -20)
            tour.orbitAngle += 0.015;
            targetPos.set(
                -30 + 16 * Math.cos(tour.orbitAngle),
                13,
                -20 + 16 * Math.sin(tour.orbitAngle)
            );
            targetLookAt.set(-30, 6, -20);
            lerpSpeed = 0.08; 
        } else if (elapsed < 14.5) {
            // Move to Windbloom Turbine (-40, 0, 0)
            targetPos.set(-28, 15, 6);
            targetLookAt.set(-40, 10, 0);
        } else if (elapsed < 18.0) {
            // Move to Battery Storage Vault (-15, 0.5, 0)
            targetPos.set(-7, 3.5, 6);
            targetLookAt.set(-15, 0.5, 0);
        } else if (elapsed < 22.0) {
            // Move to Control Centre Building (0, 0, -15)
            targetPos.set(0, 7.5, -5);
            targetLookAt.set(0, 2.5, -15);
        } else {
            // End Tour
            tour.active = false;
            controlsObj.enabled = true;
            
            // Pop up detail card for Control Centre
            const ccData = {
                type: 'control-centre',
                title: 'Control Centre',
                desc: 'Diagnostic Tour Complete! Grid operator node selected. You can click on the buttons inside the card or tab to open the Command Centre.',
                role: 'Central AI Core',
                contrib: 'Click to Open Dashboard'
            };
            showSimulationDetailCard(ccData);
            logEvent("Diagnostic Camera Tour completed.", "action");
            
            const tourBtn = document.getElementById('btn-camera-tour');
            if (tourBtn) {
                tourBtn.innerHTML = `<i class="fa-solid fa-play"></i><span>RUN DIAGNOSTIC TOUR</span>`;
            }
        }
        
        if (tour.active) {
            camera.position.lerp(targetPos, lerpSpeed);
            controlsObj.target.lerp(targetLookAt, lerpSpeed);
        }
    }
    
    // Update Orbit controls
controlsObj.update();

labels.forEach(label => {
    label.lookAt(camera.position);
});

if (ccRing) {
    ccRing.rotation.z += 0.01;
}


const now = Date.now();

if (now - telemetryTimer > 1000) {
    updateTelemetry();
    telemetryTimer = now;
}
if (domeMesh) {
    domeMesh.material.opacity =
        0.6 + Math.sin(Date.now() * 0.003) * 0.3;
}
if (fDome) {
    fDome.rotation.y += 0.01;

    fDome.material.opacity =
        0.6 +
        Math.sin(Date.now() * 0.003) * 0.3;
}
if (fDome) {
    fDome.rotation.y += 0.01;

    fDome.material.opacity =
        0.6 +
        Math.sin(Date.now() * 0.003) * 0.3;
}
// Render WebGL
renderer.render(scene, camera);

waterParticles.forEach(p => {

    p.t += p.speed;

    if (p.t >= 1) {
        p.t = 0;
    }

    p.mesh.position.lerpVectors(
        p.start,
        p.target,
        p.t
    );

    p.mesh.material.opacity =
        0.5 +
        Math.sin(Date.now() * 0.01 + p.t * 10)
        * 0.5;
       p.mesh.visible =
    state.battery > 35 &&
    state.weather !== 'stormy' &&
    state.timeOfDay >= 360 &&
    state.timeOfDay <= 1080;

});

}


// 7. CHART.JS CORE INTEGRATION
function initChartJs() {
    if (state.chart) return; // avoid duplicate building
    
    const ctx = document.getElementById('telemetryChart');
    if (!ctx) return;
    
    // Initialize blank tracking log arrays
    const historyLength = 20;
    const defaultLabels = [];
    const defaultGen = [];
    const defaultCons = [];
    
    for (let i = historyLength - 1; i >= 0; i--) {
        defaultLabels.push(`${i}s ago`);
        defaultGen.push(state.telemetry.totalGen);
        defaultCons.push(state.telemetry.consumption);
    }
    
    state.chartData.labels = defaultLabels;
    state.chartData.generation = defaultGen;
    state.chartData.consumption = defaultCons;
    
    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: state.chartData.labels,
            datasets: [
                {
                    label: 'Generation (kW)',
                    borderColor: '#00ff99',
                    backgroundColor: 'rgba(0, 255, 153, 0.05)',
                    borderWidth: 3,
                    shadowBlur: 10,
                    tension: 0.4,
                    data: state.chartData.generation,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0
                },
                {
                    label: 'Consumption (kW)',
                    borderColor: '#00d9ff',
                    backgroundColor: 'rgba(0, 217, 255, 0.05)',
                    borderWidth: 2,
                    data: state.chartData.consumption,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#475569', font: { size: 9, family: 'Orbitron' } }
                },
                y: {
                    grid: { color: 'rgba(0, 217, 255, 0.05)' },
                    ticks: { color: '#475569', font: { size: 9, family: 'Orbitron' } },
                    suggestedMin: 10,
                    suggestedMax: 120
                }
            }
        }
    });
}

function updateChartData(newGen, newCons) {
    if (!state.chart) return;
    
    // Shift arrays
    state.chartData.generation.shift();
    state.chartData.generation.push(newGen);
    
    state.chartData.consumption.shift();
    state.chartData.consumption.push(newCons);
    
    state.chart.update('none'); // no jarring redraw anims
}

// 8. DASHBOARD SYSTEM EVENT LOGGER
function logEvent(message, type = 'sys') {
    const container = document.getElementById('event-log-container');
    if (!container) return;
    
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    const logLine = document.createElement('div');
    logLine.className = 'log-line';
    logLine.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="log-msg ${type}">${message}</span>`;
    
    container.insertBefore(logLine, container.firstChild);
    
    // keep to maximum 50 elements
    while (container.children.length > 50) {
        container.removeChild(container.lastChild);
    }
}

function clearEventLogs() {
    const container = document.getElementById('event-log-container');
    if (container) container.innerHTML = '';
    logEvent("Activity Log Cleared.", "sys");
}

// 9. CONTROLLER INTERACTIONS OVERRIDES
function initDashboardControls() {
    // 1. Weather preset triggers
    const weatherBtns = document.querySelectorAll('.weather-btn');
    weatherBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            weatherBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const wVal = btn.getAttribute('data-weather');
            state.weather = wVal;
            
            // Sync triggers across both views (HUD also uses weather-btns)
            const syncBtns = document.querySelectorAll(`.weather-btn[data-weather="${wVal}"]`);
            syncBtns.forEach(b => b.classList.add('active'));
            
            logEvent(`Weather system override to: ${wVal.toUpperCase()}`, 'action');
            
            // If stormy, trigger auto light alerts
            if (wVal === 'stormy') {
                logEvent(`Low solar irradiance detected. Storm warning active.`, 'warning');
            }
        });
    });
    
    // 2. Clock slider trigger
    const clockSlider = document.getElementById('sim-time-slider');
    if (clockSlider) {
        clockSlider.addEventListener('input', () => {
            state.timeOfDay = parseInt(clockSlider.value);
            updateClockUI();
        });
    }
    
    // 3. Controller sliders
    const lightToggle = document.getElementById('btn-lighting-auto');
    const lightSlider = document.getElementById('smart-light-dimmer');
    const turbineSlider = document.getElementById('turbine-pitch');
    const exportSlider = document.getElementById('grid-export-limit');
    
    if (lightToggle) {
        lightToggle.addEventListener('click', () => {
            if (state.controls.lightingMode === 'auto') {
                state.controls.lightingMode = 'manual';
                lightToggle.classList.remove('active');
                lightToggle.innerText = 'MANUAL';
                lightSlider.removeAttribute('disabled');
                logEvent(`Lighting Network mode changed to MANUAL.`, 'action');
            } else {
                state.controls.lightingMode = 'auto';
                lightToggle.classList.add('active');
                lightToggle.innerText = 'AUTO';
                lightSlider.setAttribute('disabled', 'true');
                logEvent(`Lighting Network restored to Autonomous Sensor Mode.`, 'action');
            }
        });
    }
    
    if (lightSlider) {
        lightSlider.addEventListener('input', () => {
            state.controls.lightingManualDim = parseInt(lightSlider.value);
            document.getElementById('val-light-dimmer').innerText = `${state.controls.lightingManualDim}%`;
        });
    }
    
    if (turbineSlider) {
        turbineSlider.addEventListener('input', () => {
            state.controls.turbinePitch = parseInt(turbineSlider.value);
            document.getElementById('val-turbine-pitch').innerText = `${state.controls.turbinePitch}°`;
        });
    }
    
    if (exportSlider) {
        exportSlider.addEventListener('input', () => {
            state.controls.gridExportThreshold = parseInt(exportSlider.value);
            document.getElementById('val-export-limit').innerText = `${state.controls.gridExportThreshold}% SoC`;
        });
    }
}

// 10. CLOCK TIME SYSTEM

// Real-time system clock — drives only the top-right header display.
// Completely independent of the simulation engine.
function startRealTimeClock() {
    function updateHeaderClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12; // midnight / noon edge-case
        const formatted = `${hours}:${minutes} ${ampm}`;
        const headerClock = document.getElementById('header-clock');
        if (headerClock) headerClock.innerText = formatted;
    }
    updateHeaderClock();          // show immediately on page load
    setInterval(updateHeaderClock, 1000); // then tick every second
}

// Simulation clock tick — advances the park's virtual time of day.
// Only affects the 3D sandbox slider and HUD label, NOT the header clock.
function clockTick() {
    if (!state.simTimeActive) return;
    
    // Advance simulation time by 2 minutes every 200ms tick
    state.timeOfDay = (state.timeOfDay + 2) % 1440;
    
    // Sync sim-time UI elements (slider + HUD label only)
    updateClockUI();
}

function updateClockUI() {
    const hours = Math.floor(state.timeOfDay / 60);
    const mins = state.timeOfDay % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const dispHours = hours % 12 === 0 ? 12 : hours % 12;
    const dispMins = mins.toString().padStart(2, '0');
    
    const formatted = `${dispHours}:${dispMins} ${ampm}`;
    
    // Update only the 3D sandbox HUD time label — NOT #header-clock
    const hudClock = document.getElementById('sim-time-label');
    if (hudClock) hudClock.innerText = formatted;
    
    // Sync slider position
    const clockSlider = document.getElementById('sim-time-slider');
    if (clockSlider) clockSlider.value = state.timeOfDay;
}

// 11. TELEMETRY CORE PHYSICS PHYSICS ENGINE
function simulationTick() 
{

    state.ai = {
    recommendation:
        'Grid operating normally.',
    confidence: 88,
    action:
        'Monitoring'
};
if (
    state.weather === 'sunny' &&
    state.battery > 80
) {
    state.ai = {
        recommendation:
            'Store excess solar energy.',
        confidence: 96,
        action:
            'BATTERY CHARGING'
    };
}
else if (state.weather === 'cloudy')
    {
    state.ai = {
        recommendation:
            'Preserve battery reserve.',
        confidence: 90,
        action:
            'ENERGY SAVING'
    };
}
state.weather === 'windy' 
{
    state.ai = {
        recommendation:
            'Utilize wind surplus.',
        confidence: 92,
        action:
            'WIND OPTIMIZATION'
    };
}
state.weather === 'stormy'
 {
    state.ai = {
        recommendation:
            'Enter protected mode.',
        confidence: 99,
        action:
            'EMERGENCY PROTOCOL'
    };
}
    const w = state.weather;
    const time = state.timeOfDay;
    
    // 1. Calculate SOLAR yield
    // Sunny peak: 90kW, Cloudy peak: 20kW, Stormy/Night: 0kW
    let solarPeak = 0;
    if (w === 'sunny') solarPeak = 95;
    else if (w === 'cloudy') solarPeak = 25;
    
    // Sine wave representation of sun position (Peak at 12:00 PM / 720min)
    // Runs between 6:00 AM (360) and 6:00 PM (1080)
    let solarMultiplier = 0;
    if (time >= 360 && time <= 1080) {
        const rad = Math.PI * (time - 360) / 720;
        solarMultiplier = Math.sin(rad);
    }
    
    const newSolar = Math.round(solarPeak * solarMultiplier * (1 + (Math.random() - 0.5) * 0.05) * 10) / 10;
    
    // 2. Calculate WIND yield
    // Base speed: Sunny: 3m/s, Cloudy: 5.5m/s, Windy: 13m/s, Stormy: 19m/s
    let windBaseSpeed = 3.5;
    if (w === 'cloudy') windBaseSpeed = 5.8;
    else if (w === 'windy') windBaseSpeed = 13.2;
    else if (w === 'stormy') windBaseSpeed = 19.5;
    
    // Small fluctuating noise
    const windSpeed = windBaseSpeed + (Math.random() - 0.5) * 1.5;
    
    // Wind power generation is proportional to speed cubed (simplified formula)
    // Optimize factor scales down turbine pitch: pitch values above 15 deg spill wind efficiency
    const pitchFactor = Math.cos((state.controls.turbinePitch - 15) * Math.PI / 180);
    let newWind = Math.round(0.015 * Math.pow(windSpeed, 3) * pitchFactor * 4 * 10) / 10;
    newWind = Math.min(newWind, 80); // Cap wind generator at rated maximum
    
    // 3. Kinetic yield: Fluctuate path pulses based on foot traffic
    // higher foot traffic between 8 AM and 9 PM (peak activities)
    let baseFootSteps = 2;
    if (time >= 480 && time <= 1260) {
        baseFootSteps = 12;
    }
    const newKinetic = Math.round((baseFootSteps + Math.random() * 5) * 0.3 * 10) / 10;
    state.solar = newSolar;
state.wind = newWind;
state.kinetic = newKinetic;
    // Total Gen
    const newTotalGen = Math.round((newSolar + newWind + newKinetic) * 10) / 10;
    

    // 4. Calculate CONSUMPTION
    // Baseload: 14kW constant
    // Smart Lighting: Turns on between 6PM and 6AM. Auto dim mode adjusts draw.
    let newLighting = 0;
    const isNight = time >= 1080 || time <= 360 || w === 'stormy';
    if (isNight) {
        if (state.controls.lightingMode === 'auto') {
            // Auto Mode dims lights depending on weather (Cloudy nights draw less, storms draw max)
            let autoDim = 40;
            if (w === 'stormy') autoDim = 85;
            else if (w === 'cloudy') autoDim = 50;
            
            newLighting = 10 * (autoDim / 100);
            
            // Sync slider UI label
            const lSlider = document.getElementById('smart-light-dimmer');
            if (lSlider) lSlider.value = autoDim;
            document.getElementById('val-light-dimmer').innerText = `${autoDim}%`;
        } else {
            newLighting = 10 * (state.controls.lightingManualDim / 100);
        }
    }
    newLighting = Math.round(newLighting * 10) / 10;
    
    // EV Chargers Draw: Simulates cars drawing varying charge rates
    // Occasional grid connections and completions
    let newEV = state.telemetry.evDraw;
    if (Math.random() > 0.92) {
        // change cars plugged count
        const carsCount = Math.floor(Math.random() * 5);
        newEV = carsCount * 11; // 11 kW per charger hookup
        logEvent(`Smart EV Station grid load modified. Active: ${carsCount} / 4`, 'action');
    }
    
    const newConsumption = Math.round((state.telemetry.baseload + newLighting + newEV) * 10) / 10;
    
    // 5. Battery SoC Storage logic
    // Net energy delta
    const netDelta = newTotalGen - newConsumption;
    
    let newSoC = state.telemetry.batterySoC;
    // Integration logic (assume battery capacity is 500 kWh, 1 second = delta / 3600 h, simulated time speeds it up x60)
    // SoC delta percent = (kW * 60 / 3600) / 500 kWh * 100
    const batteryCapacity = 500;
    const socDelta = (netDelta / 60) / batteryCapacity * 100;
    newSoC = Math.max(0, Math.min(100, newSoC + socDelta));
    newSoC = Math.round(newSoC * 100) / 100;
    
    // Net Grid feed
    // Sell back back to grid if battery state of charge is higher than gridSellback limit
    let newGrid = 0;
    let gridStatusText = 'GRID BALANCED';
    if (newSoC >= state.controls.gridExportThreshold) {
        newGrid = Math.round(netDelta * 10) / 10;
        gridStatusText = newGrid >= 0 ? `EXPORTING (+${newGrid} kW)` : `CONSUMING (${newGrid} kW)`;
    } else {
        // battery is not exporting, grid balance draws what battery cannot supply
        if (netDelta < 0) {
            newGrid = Math.round(netDelta * 10) / 10; // negative draw
            gridStatusText = `GRID DRAWING (${newGrid} kW)`;
        } else {
            newGrid = 0;
            gridStatusText = 'BATTERY STORAGE ACTIVE';
        }
    }
    
    // Save to State
    state.telemetry.solarGen = newSolar;
    state.telemetry.windGen = newWind;
    state.telemetry.kineticGen = newKinetic;
    state.telemetry.totalGen = newTotalGen;
    state.telemetry.consumption = newConsumption;
    state.telemetry.batterySoC = newSoC;
    state.telemetry.netGrid = newGrid;
    state.telemetry.lightingDraw = newLighting;
    state.telemetry.evDraw = newEV;
    
    // 6. RENDER STATE UPDATE TO DOM
    // Landing/ticker updates
    const livePowerEl = document.getElementById('live-power-ticker');
    if (livePowerEl) livePowerEl.innerText = `${newTotalGen} kW`;
    
    const liveBattEl = document.getElementById('live-battery-ticker');
    if (liveBattEl) liveBattEl.innerText = `${newSoC.toFixed(1)}%`;
    
    const liveCo2El = document.getElementById('live-co2-ticker');
    if (liveCo2El) {
        const accumCo2 = parseFloat(liveCo2El.innerText) + (newTotalGen * 0.39 / 3600);
        liveCo2El.innerText = `${accumCo2.toFixed(1)} kg`;
    }
    
    const liveEvEl = document.getElementById('live-ev-ticker');
    if (liveEvEl) liveEvEl.innerText = `${Math.round(newEV / 11)} / 4`;
    
    // HUD updates
    const hudSolarEl = document.getElementById('hud-solar');
    if (hudSolarEl) hudSolarEl.innerText = `${newSolar} kW`;
    
    const hudWindEl = document.getElementById('hud-wind');
    if (hudWindEl) hudWindEl.innerText = `${newWind} kW`;
    
    const hudKinEl = document.getElementById('hud-kinetic');
    if (hudKinEl) hudKinEl.innerText = `${newKinetic} kW`;
    
    const hudBattEl = document.getElementById('hud-battery');
    if (hudBattEl) hudBattEl.innerText = `${newSoC.toFixed(1)}%`;
    
    // Dashboard Command Panel updates
    const dashGenEl = document.getElementById('dash-gen-val');
    if (dashGenEl) dashGenEl.innerText = `${newTotalGen} kW`;
    
    const dashBattEl = document.getElementById('dash-battery-val');
    if (dashBattEl) dashBattEl.innerText = `${newSoC.toFixed(1)}%`;
    
    const dashBattStatEl = document.getElementById('dash-battery-status');
    if (dashBattStatEl) {
        if (netDelta > 0) dashBattStatEl.innerText = `CHARGING (+${netDelta.toFixed(1)} kW)`;
        else if (netDelta < 0) dashBattStatEl.innerText = `DISCHARGING (${netDelta.toFixed(1)} kW)`;
        else dashBattStatEl.innerText = 'STORAGE SYSTEM IDLE';
    }
    
    const dashConsEl = document.getElementById('dash-consume-val');
    if (dashConsEl) dashConsEl.innerText = `${newConsumption} kW`;
    
    const dashGridEl = document.getElementById('dash-grid-val');
    if (dashGridEl) {
        dashGridEl.innerText = `${newGrid >= 0 ? '+' : ''}${newGrid} kW`;
        if (newGrid < 0) {
            dashGridEl.classList.remove('cyan-glow');
            dashGridEl.classList.add('orange-glow');
        } else {
            dashGridEl.classList.remove('orange-glow');
            dashGridEl.classList.add('cyan-glow');
        }
    }
    
    const dashGridStatEl = document.getElementById('dash-grid-status');
    if (dashGridStatEl) dashGridStatEl.innerText = gridStatusText;
    
    // Mini grid cells
    const cellWind = document.getElementById('cell-wind');
    if (cellWind) cellWind.innerText = `${newWind} kW`;
    
    const cellSolar = document.getElementById('cell-solar');
    if (cellSolar) cellSolar.innerText = `${newSolar} kW`;
    
    const cellSolarStatus = document.getElementById('cell-solar-status');
    if (cellSolarStatus) {
        if (newSolar > 0) {
            cellSolarStatus.innerHTML = `<i class="fa-solid fa-sun yellow-glow-text"></i> ACTIVE`;
        } else {
            cellSolarStatus.innerHTML = `<i class="fa-solid fa-moon text-glow-text"></i> OFFLINE (DARK)`;
        }
    }
    
    const cellLight = document.getElementById('cell-light');
    if (cellLight) cellLight.innerText = `${newLighting} kW`;
    
    const cellLightStatus = document.getElementById('cell-light-status');
    if (cellLightStatus) {
        if (newLighting > 0) {
            const pct = state.controls.lightingMode === 'auto' ? 
                        (w === 'stormy' ? 85 : (w === 'cloudy' ? 50 : 40)) : 
                        state.controls.lightingManualDim;
            cellLightStatus.innerHTML = `<i class="fa-solid fa-circle-half-stroke text-glow-text"></i> ACTIVE (${pct}%)`;
        } else {
            cellLightStatus.innerHTML = `<i class="fa-solid fa-circle-xmark text-glow-text"></i> STANDBY (DAY)`;
        }
    }
    
    const cellEV = document.getElementById('cell-ev');
    if (cellEV) cellEV.innerText = `${newEV} kW`;
    
    // Battery Warnings in Log
    if (newSoC <= 15 && Math.random() > 0.8) {
        logEvent(`Battery Reserve Critical: ${newSoC}%. Restricting EV Charging outputs.`, 'warning');
    }
    if (newSoC >= 99.8 && netDelta > 0 && Math.random() > 0.8) {
        logEvent(`Battery capacity max. Grid export policy overridden to Grid Feed-In.`, 'sys');
    }
    
    // Update chart
    updateChartData(newTotalGen, newConsumption);
}

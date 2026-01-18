import quizData from './quiz_data.js';

const quizState = {
    currentQuestionIndex: 0,
    answers: [],
};

const questionText = document.getElementById('question-text');
const questionCategory = document.getElementById('question-category');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const archetypeLevel = document.getElementById('archetype-level');
const archetypeName = document.getElementById('archetype-name');
const totalScoreEl = document.getElementById('total-score');
const subscribeForm = document.getElementById('subscribe-form');
const emailInput = document.getElementById('email-input');
const subscribeMessage = document.getElementById('subscribe-message');

// UI CONSTANTS
const categoryIcons = {
    "Agency": "⚡",
    "Environment": "🏠",
    "Psychology": "🧠",
    "Systems": "⚙️",
    "Focus": "🎯",
    "Social": "👥",
    "Creation": "🎨",
    "Impact": "🌍"
};

// ARCHETYPE DATA (Content & Assets)
const archetypeDetails = {
    1: {
        name: 'Zombie Clickslave',
        range: [15, 29],
        desc: 'Driven by compulsion. Technology dictates your schedule, mood, and attention span. Immediate intervention recommended.',
        color: 'text-red-500',
        bg: 'bg-red-500',
        img: '/images/level-1.png'
    },
    2: {
        name: 'Unconscious Doomscroller',
        range: [30, 44],
        desc: 'High regret, low friction. You lose hours to screens without meaning to, but you are aware of the pain.',
        color: 'text-orange-500',
        bg: 'bg-orange-500',
        img: '/images/level-2.png'
    },
    3: {
        name: 'Digital Drifter',
        range: [45, 55],
        desc: 'Reactive and distracted. You function okay, but your attention is constantly fragmented by pings and buzzes.',
        color: 'text-yellow-400',
        bg: 'bg-yellow-400',
        img: '/images/level-3.png'
    },
    4: {
        name: 'Intentional Architect',
        range: [56, 68],
        desc: 'Systematized and proactive. You use tools to block distractions, though you still fight the occasional battle.',
        color: 'text-blue-400',
        bg: 'bg-blue-400',
        img: '/images/level-4.png'
    },
    5: {
        name: 'Digital Sovereign',
        range: [69, 75],
        desc: 'The master level. Technology is a precision instrument that serves you. You are fully present offline.',
        color: 'text-purple-400',
        bg: 'bg-purple-400',
        img: '/images/level-5.png'
    }
};

// INITIALIZATION & THEME
function initApp() {
    // Apply Dark Mode / Gamified Theme to Body
    document.body.classList.add('bg-slate-900', 'text-slate-100', 'font-sans', 'antialiased');
    
    // Style Containers
    const containerClasses = ['bg-slate-800', 'p-8', 'rounded-xl', 'shadow-2xl', 'border', 'border-slate-700', 'max-w-2xl', 'w-full', 'mx-auto', 'mt-10'];
    quizContainer.classList.add(...containerClasses);
    resultContainer.classList.add(...containerClasses);

    // Create and Show Splash Screen
    createSplashScreen();
}

function createSplashScreen() {
    const splash = document.createElement('div');
    splash.id = 'splash-screen';
    splash.className = 'fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50';
    splash.innerHTML = `
        <div class="max-w-md w-full text-center p-6">
            <div class="mb-8 relative">
                <div class="w-24 h-24 bg-blue-500 rounded-full mx-auto opacity-20 animate-pulse absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                <div class="text-6xl relative z-10">🧬</div>
            </div>
            <h1 class="text-4xl font-bold mb-2 text-white tracking-tight">Digital Wellbeing<br><span class="text-blue-400">Scorecard</span></h1>
            <p class="text-slate-400 mb-8 text-lg">Initialize system scan. Analyze your relationship with technology.</p>
            
            <div class="grid grid-cols-2 gap-4 mb-8 text-left bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div class="flex items-center text-slate-300"><span class="mr-2">🧠</span> Psychology</div>
                <div class="flex items-center text-slate-300"><span class="mr-2">🏠</span> Environment</div>
                <div class="flex items-center text-slate-300"><span class="mr-2">⚡</span> Agency</div>
                <div class="flex items-center text-slate-300"><span class="mr-2">⚙️</span> Systems</div>
            </div>

            <button id="start-btn" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-900/50 uppercase tracking-widest">
                Begin Assessment
            </button>
        </div>
    `;
    document.body.appendChild(splash);
    
    // Hide main containers initially
    quizContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');

    document.getElementById('start-btn').addEventListener('click', () => {
        splash.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => {
            splash.remove();
            quizContainer.classList.remove('hidden');
            renderQuestion();
        }, 500);
    });
}

function renderQuestion() {
    const question = quizData[quizState.currentQuestionIndex];
    const icon = categoryIcons[question.category] || '❓';
    
    // Update Progress Bar (Inject if missing)
    updateProgressBar();

    questionText.textContent = question.question;
    questionText.className = 'text-2xl font-bold mb-6 text-white';
    
    questionCategory.innerHTML = `<span class="text-2xl mr-2">${icon}</span> ${question.category} Scan`;
    questionCategory.className = 'text-blue-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center';
    
    optionsContainer.innerHTML = '';

    question.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        // Dark mode styling for options
        button.className = 'w-full text-left p-4 border rounded-lg mb-3 transition-all duration-200 group';
        button.classList.add('bg-slate-700', 'border-slate-600', 'text-slate-200', 'hover:bg-slate-600', 'hover:border-blue-400');
        
        button.onclick = () => selectAnswer(option.score);
        if (quizState.answers[quizState.currentQuestionIndex] === option.score) {
            button.classList.remove('bg-slate-700', 'border-slate-600');
            button.classList.add('bg-blue-900', 'border-blue-500', 'text-white', 'ring-1', 'ring-blue-500');
        }
        optionsContainer.appendChild(button);
    });

    prevBtn.disabled = quizState.currentQuestionIndex === 0;
    
    // Style Navigation Buttons
    prevBtn.className = `px-6 py-2 rounded-lg font-medium ${prevBtn.disabled ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`;
    nextBtn.textContent = quizState.currentQuestionIndex === quizData.length - 1 ? 'Finish' : 'Next';
    nextBtn.className = 'bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-colors';
}

function updateProgressBar() {
    let progressContainer = document.getElementById('progress-container');
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.id = 'progress-container';
        progressContainer.className = 'w-full bg-slate-700 h-2 rounded-full mb-8 overflow-hidden';
        quizContainer.insertBefore(progressContainer, quizContainer.firstChild);
        
        const bar = document.createElement('div');
        bar.id = 'progress-bar';
        bar.className = 'bg-blue-500 h-full transition-all duration-300 ease-out';
        bar.style.width = '0%';
        progressContainer.appendChild(bar);
    }
    
    const progress = ((quizState.currentQuestionIndex + 1) / quizData.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
}

function selectAnswer(score) {
    quizState.answers[quizState.currentQuestionIndex] = score;
    renderQuestion();
}

function nextQuestion() {
    if (quizState.currentQuestionIndex < quizData.length - 1) {
        quizState.currentQuestionIndex++;
        renderQuestion();
    } else {
        finishQuiz();
    }
}

function prevQuestion() {
    if (quizState.currentQuestionIndex > 0) {
        quizState.currentQuestionIndex--;
        renderQuestion();
    }
}

function getArchetype(score) {
    if (score >= 15 && score <= 29) return { level: 1, name: 'Zombie Clickslave' };
    if (score >= 30 && score <= 44) return { level: 2, name: 'Unconscious Doomscroller' };
    if (score >= 45 && score <= 55) return { level: 3, name: 'Digital Drifter' };
    if (score >= 56 && score <= 68) return { level: 4, name: 'Intentional Architect' };
    if (score >= 69 && score <= 75) return { level: 5, name: 'Digital Sovereign' };
    return { level: 0, name: 'Unknown' };
}

async function finishQuiz() {
    const totalScore = quizState.answers.reduce((acc, score) => acc + score, 0);
    const archetype = getArchetype(totalScore);

    // Show loading state
    nextBtn.textContent = 'Calculating...';
    nextBtn.disabled = true;

    try {
        const response = await fetch('/.netlify/functions/submit-score', {
            method: 'POST',
            body: JSON.stringify({ answers: quizState.answers })
        });
        
        if (!response.ok) throw new Error('Submission failed');

        const result = await response.json();
        displayResults(result.archetype, result.totalScore);
    } catch (error) {
        console.error("Error submitting score:", error);
        // Fallback: Show local results so the user isn't stuck
        displayResults(archetype, totalScore);
    } finally {
        nextBtn.textContent = 'Finish';
        nextBtn.disabled = false;
    }
}

function displayResults(archetype, totalScore) {
    quizContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    
    // Inject Gauge Visualization
    const gaugeHTML = `
        <div class="mb-8 pt-4">
            <div class="flex justify-between text-xs text-slate-400 mb-2 uppercase tracking-wider">
                <span>Zombie</span>
                <span>Sovereign</span>
            </div>
            <div class="relative h-4 bg-slate-700 rounded-full w-full">
                <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full opacity-50 w-full"></div>
                <!-- Marker for User Score (15-75 range mapped to 0-100%) -->
                <div class="absolute top-0 w-1 h-6 bg-white border-2 border-slate-900 -mt-1 transform -translate-x-1/2 transition-all duration-1000" 
                     style="left: ${((totalScore - 15) / (75 - 15)) * 100}%"></div>
            </div>
            <div class="text-center mt-2 font-mono text-blue-400">${totalScore} / 75</div>
        </div>
    `;
    
    // Insert Gauge before the archetype name
    const header = resultContainer.querySelector('h2') || resultContainer.firstElementChild;
    if(!document.getElementById('score-gauge')) {
        const gaugeContainer = document.createElement('div');
        gaugeContainer.id = 'score-gauge';
        gaugeContainer.innerHTML = gaugeHTML;
        resultContainer.insertBefore(gaugeContainer, header.nextSibling);
    }
}

// Expose function to window so HTML onclick can find it
window.updateProfileView = function(level) {
    // We pass null for score to indicate this is just a view update, not the user's actual result
    updateProfileCard(level, null, false);
};

function updateProfileCard(level, userScore, isUserResult) {
    const data = archetypeDetails[level];
    
    // Clear previous content if needed, or just update text
    archetypeLevel.innerHTML = `
        <div class="flex flex-col items-center animate-fade-in">
            <img src="${data.img}" class="w-32 h-32 rounded-full border-4 border-slate-700 shadow-2xl mb-4 bg-slate-800 object-cover">
            <span class="${data.color} text-sm font-bold tracking-widest uppercase mb-1">LEVEL ${level}</span>
        </div>
    `;
    
    archetypeName.textContent = data.name;
    archetypeName.className = `text-3xl font-bold text-white mb-2 ${data.color}`;
    
    // Use the description from data
    totalScoreEl.textContent = data.desc;
    totalScoreEl.className = 'text-slate-300 text-lg mb-6 leading-relaxed';
    totalScoreEl.classList.remove('hidden');
    
    // If viewing a different level, show a "Back to my result" hint? 
    // For MVP, we just let them explore.
}


async function handleSubscription(event) {
    event.preventDefault();
    const email = emailInput.value;
    const totalScore = quizState.answers.reduce((acc, score) => acc + score, 0);
    const archetype = getArchetype(totalScore);

    const submitBtn = subscribeForm.querySelector('button');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = '...';
    submitBtn.disabled = true;
    subscribeMessage.textContent = '';
    subscribeMessage.className = 'text-sm mt-2'; // Reset classes

    try {
        const response = await fetch('/.netlify/functions/subscribe', {
            method: 'POST',
            body: JSON.stringify({
                email,
                archetype_segment: archetype.level
            })
        });
        
        const data = await response.json();

        if(response.ok) {
            subscribeMessage.textContent = 'Thank you for subscribing!';
            subscribeMessage.classList.add('text-green-600');
            emailInput.value = '';
        } else {
            subscribeMessage.textContent = data.message || 'Something went wrong. Please try again.';
            subscribeMessage.classList.add('text-red-600');
        }
    } catch (error) {
        console.error("Error subscribing:", error);
        subscribeMessage.textContent = 'Something went wrong. Please try again.';
        subscribeMessage.classList.add('text-red-600');
    } finally {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}


nextBtn.addEventListener('click', nextQuestion);
prevBtn.addEventListener('click', prevQuestion);
subscribeForm.addEventListener('submit', handleSubscription);

// Initial render
initApp();

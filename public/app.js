import quizData from './quiz_data.js';
import uiText from './ui_text.js';

const archetypeDetails = uiText.archetypes;

const quizState = {
    currentQuestionIndex: 0,
    answers: new Array(quizData.length).fill(0), // Initialize with 0s to maintain data alignment
    researchId: null, 
};

let autoAdvanceTimer = null;
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
// -------------------------------------------------------------------------
// EDIT THIS SECTION to change Archetype Names, Descriptions, Images, and CTAs
// -------------------------------------------------------------------------

// STORAGE
const QUIZ_STORAGE_KEY = 'digitalWellbeingQuizState';

function saveState() {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizState));
}

function loadState() {
    const savedState = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (savedState) {
        Object.assign(quizState, JSON.parse(savedState));
        return true;
    }
    return false;
}

function clearStateAndReload() {
    localStorage.removeItem(QUIZ_STORAGE_KEY);
    window.location.reload();
}


function populateText() {
    document.title = "Digital Wellbeing Scorecard"; // Assuming this is static from settings
    questionText.textContent = uiText.quiz.question_placeholder;
    questionCategory.textContent = uiText.quiz.category_placeholder;
    prevBtn.textContent = uiText.quiz.previous_button;
    nextBtn.textContent = uiText.quiz.next_button;

    resultContainer.querySelector('h2').textContent = uiText.results.title;
    const primaryCta = document.getElementById('primary-cta');
    primaryCta.querySelector('p:first-of-type').innerHTML = uiText.results.subscribe_cta_main;
    primaryCta.querySelector('p:nth-of-type(2)').innerHTML = uiText.results.subscribe_cta_details;
    emailInput.placeholder = uiText.results.email_placeholder;
    subscribeForm.querySelector('button').textContent = uiText.results.subscribe_button;
    primaryCta.querySelector('p:last-of-type').innerHTML = `<i>${uiText.results.unsubscribe_info}</i>`;
}

// INITIALIZATION & THEME
function initApp() {
    loadState();
    populateText();
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
    const hasSavedData = localStorage.getItem(QUIZ_STORAGE_KEY) !== null;

    const splash = document.createElement('div');
    splash.id = 'splash-screen';
    splash.className = 'fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50';
    splash.innerHTML = `
        <div class="max-w-md w-full text-center p-6">
            <div class="mb-8 relative flex justify-center items-center">
                <div class="w-32 h-32 bg-blue-500 rounded-full opacity-20 animate-pulse absolute"></div>
                <img src="/images/dws-welcome.jpg" class="welcome-image object-contain relative z-10" alt="Digital Wellbeing">
            </div>
            <h1 class="text-4xl font-bold mb-2 text-white tracking-tight">${uiText.splash.title}</h1>
            <p class="text-slate-400 mb-8 text-lg">${uiText.splash.subtitle}</p>
            
            <div class="grid grid-cols-2 gap-4 mb-8 text-left bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div class="flex items-center text-slate-300"><span class="mr-2">🧠</span> Psychology</div>
                <div class="flex items-center text-slate-300"><span class="mr-2">🏠</span> Environment</div>
                <div class="flex items-center text-slate-300"><span class="mr-2">⚡</span> Agency</div>
                <div class="flex items-center text-slate-300"><span class="mr-2">⚙️</span> Systems</div>
            </div>

            <div id="splash-screen-actions" class="w-full">
                <button id="start-btn" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-900/50 uppercase tracking-widest animate-pulse">
                    ${hasSavedData ? uiText.splash.resume_button : uiText.splash.assessment_button}
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(splash);

    if (hasSavedData) {
        const actionsContainer = document.getElementById('splash-screen-actions');
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clear-progress-btn';
        clearBtn.textContent = uiText.splash.clear_progress_button;
        clearBtn.className = 'w-full mt-4 text-slate-400 hover:text-white text-sm py-2 px-4 rounded-lg transition-colors';
        clearBtn.onclick = clearStateAndReload;
        actionsContainer.appendChild(clearBtn);
    }
    
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

    questionText.textContent = `${question.id}. ${question.question}`;
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
    
    // Button Text Logic: "Skip" if unanswered, "Next" (or Finish) if answered
    const isLast = quizState.currentQuestionIndex === quizData.length - 1;
    const hasAnswer = quizState.answers[quizState.currentQuestionIndex] !== 0;
    
    nextBtn.textContent = isLast ? uiText.quiz.finish_button : (hasAnswer ? uiText.quiz.next_button : uiText.quiz.skip_button);
    // Reset click handler to default (clears any countdown overrides)
    nextBtn.onclick = nextQuestion;
    nextBtn.className = 'bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-colors';
}

function updateProgressBar() {
    let progressContainer = document.getElementById('progress-container');
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.id = 'progress-container';
        progressContainer.className = 'w-full bg-slate-700 h-2 rounded-full mb-8 overflow-hidden flex items-center';
        quizContainer.insertBefore(progressContainer, quizContainer.firstChild);
        
        const bar = document.createElement('div');
        bar.id = 'progress-bar';
        bar.className = 'bg-blue-500 h-full transition-all duration-300 ease-out';
        bar.style.width = '0%';
        progressContainer.appendChild(bar);

        const total = document.createElement('div');
        total.id = 'progress-total';
        total.className = 'ml-2 bg-slate-600 text-xs font-bold text-white rounded-full h-6 w-6 flex items-center justify-center';
        total.textContent = quizData.length;
        progressContainer.appendChild(total);
    }
    
    const progress = (quizState.currentQuestionIndex / (quizData.length -1)) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
}

function selectAnswer(score) {
    quizState.answers[quizState.currentQuestionIndex] = score;
    saveState();
    renderQuestion();
    startAutoAdvance();
}

function startAutoAdvance() {
    if (autoAdvanceTimer) clearInterval(autoAdvanceTimer);
    
    let count = 3;
    const updateBtn = () => nextBtn.textContent = `${uiText.quiz.next_button} in ${count}`;
    
    updateBtn();
    
    // Allow user to click to advance immediately
    nextBtn.onclick = () => {
        clearInterval(autoAdvanceTimer);
        nextQuestion();
    };

    autoAdvanceTimer = setInterval(() => {
        count--;
        if (count > 0) {
            updateBtn();
        } else {
            clearInterval(autoAdvanceTimer);
            nextQuestion();
        }
    }, 500); // 0.5 second intervals
}

function nextQuestion() {
    if (autoAdvanceTimer) clearInterval(autoAdvanceTimer);
    if (quizState.currentQuestionIndex < quizData.length - 1) {
        quizState.currentQuestionIndex++;
        renderQuestion();
    } else {
        // Check for unanswered questions (scored as 0)
        const unansweredCount = quizState.answers.filter(score => score === 0).length;
        
        if (unansweredCount > 0) {
            const proceed = confirm(uiText.results.unanswered_warning.replace('{{count}}', unansweredCount));
            if (!proceed) {
                // Jump to the first unanswered question
                const firstMissedIndex = quizState.answers.findIndex(score => score === 0);
                if (firstMissedIndex !== -1) {
                    quizState.currentQuestionIndex = firstMissedIndex;
                    renderQuestion();
                }
                return;
            }
        }
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
    nextBtn.textContent = uiText.quiz.calculating_button;
    nextBtn.disabled = true;

    // Clear saved state
    localStorage.removeItem(QUIZ_STORAGE_KEY);

    try {
        const response = await fetch('/.netlify/functions/submit-score', {
            method: 'POST',
            body: JSON.stringify({ answers: quizState.answers })
        });
        
        if (!response.ok) throw new Error('Submission failed');

        const result = await response.json();
        quizState.researchId = result.researchId;
        displayResults(result.archetype, result.totalScore);
    } catch (error) {
        console.error("Error submitting score:", error);
        // Fallback: Show local results so the user isn't stuck
        displayResults(archetype, totalScore);
    } finally {
        nextBtn.textContent = uiText.quiz.finish_button;
        nextBtn.disabled = false;
    }
}

function displayResults(archetype, totalScore) {
    window.scrollTo(0, 0); 
    console.log('Displaying results:', { archetype, totalScore });
    quizContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    
    // 1. Render the Interactive Gauge
    renderGauge(totalScore, archetype.level);

    // 2. Inject Persistent "Your Result" Header
    // This ensures the user always knows their actual score while exploring
    const gauge = document.getElementById('score-gauge');
    let userBlock = document.getElementById('user-result-block');
    if (!userBlock) {
        userBlock = document.createElement('div');
        userBlock.id = 'user-result-block';
        userBlock.className = 'bg-slate-700/50 rounded-lg p-6 mb-8 border border-blue-500/30 animate-fade-in shadow-lg';
        userBlock.innerHTML = `
            <div class="flex items-start mb-4">
                <img src="${archetypeDetails[archetype.level].img}" class="w-20 h-20 rounded-full border-2 border-blue-400 mr-5 object-cover flex-shrink-0 shadow-md">
                <div>
                    <div class="text-xs text-blue-400 uppercase tracking-widest font-bold">${uiText.results.title}</div>
                    <div class="text-white font-bold text-2xl leading-tight mb-2">${archetype.name}</div>
                    <p class="text-slate-300 text-sm leading-relaxed">${archetypeDetails[archetype.level].desc}</p>
                </div>
            </div>
            <div class="bg-slate-800/80 rounded p-3 text-center border border-slate-600 mt-2">
                <span class="text-slate-400 text-xs uppercase tracking-widest mr-2">${uiText.results.score_label}</span>
                <span class="text-white font-bold text-xl font-mono">${totalScore} / 75</span>
            </div>
        `;
        // Insert above the gauge
        gauge.parentNode.insertBefore(userBlock, gauge);
    }

    // 3. Render the Main Profile Card (Defaults to user's result)
    updateProfileCard(archetype.level, totalScore, true);
    
    // 4. Add Social Share Buttons
    addShareButtons(archetype, totalScore);

    const submitBtn = subscribeForm.querySelector('button');
    submitBtn.textContent = uiText.results.claim_badge_button;
    submitBtn.className = "w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-green-900/20 transition-all";
}

function renderGauge(userScore, userLevel) {
    const minScore = 15;
    const maxScore = 75;
    const userPercent = ((userScore - minScore) / (maxScore - minScore)) * 100;

    // Generate markers for each archetype
    let markersHTML = '';
    for (let level = 1; level <= 5; level++) {
        const data = archetypeDetails[level];
        const midPoint = (data.range[0] + data.range[1]) / 2;
        const percent = ((midPoint - minScore) / (maxScore - minScore)) * 100;
        const isUserLevel = level === userLevel;
        const borderClass = isUserLevel ? 'border-white ring-2 ring-blue-400 scale-125 z-10' : 'border-slate-600 opacity-70 hover:opacity-100 hover:scale-110';

        markersHTML += `
            <div class="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 cursor-pointer transition-all duration-300 group"
                 style="left: ${percent}%"
                 onclick="window.updateProfileView(${level})">
                <img src="${data.img}" class="w-8 h-8 rounded-full border-2 ${borderClass} bg-slate-800 object-cover shadow-lg">
            </div>
        `;
    }

    // Inject Gauge Visualization
    const gaugeHTML = `
        <div class="mb-10 pt-6 relative select-none">
            <div class="relative h-3 bg-slate-700 rounded-full w-full shadow-inner">
                <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-red-900 via-yellow-900 to-blue-900 rounded-full opacity-60 w-full"></div>
                ${markersHTML}
                <div class="absolute top-1/2 w-1 h-8 bg-white border-2 border-slate-900 -mt-4 transform -translate-x-1/2 transition-all duration-1000 z-20 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style="left: ${userPercent}%"></div>
            </div>
            <div class="text-center mt-4 font-mono text-xs text-slate-500">${uiText.results.score_label.toUpperCase()}: <span class="text-white font-bold text-lg">${userScore}</span> / 75</div>
        </div>
    `;
    
    const header = resultContainer.querySelector('h2') || resultContainer.firstElementChild;
    const existingGauge = document.getElementById('score-gauge');
    if(existingGauge) existingGauge.remove();
    const gaugeContainer = document.createElement('div');
    gaugeContainer.id = 'score-gauge';
    gaugeContainer.innerHTML = gaugeHTML;
    resultContainer.insertBefore(gaugeContainer, header.nextSibling);
}

// Expose function to window so HTML onclick can find it
window.updateProfileView = function(level) {
    // We pass null for score to indicate this is just a view update, not the user's actual result
    updateProfileCard(level, null, false);
};

function updateProfileCard(level, userScore, isUserResult) {
    const data = archetypeDetails[level];
    
    // Calculate position for the call-out arrow
    const minScore = 15;
    const maxScore = 75;
    const midPoint = (data.range[0] + data.range[1]) / 2;
    const percent = ((midPoint - minScore) / (maxScore - minScore)) * 100;

    // If exploring, show a small "Viewing" label
    const label = isUserResult ? "" : `<div class="text-xs text-slate-500 uppercase tracking-widest mb-2">${uiText.results.viewing_profile_label}</div>`;
    
    // Update the container style to be a "Call-out Box"
    archetypeLevel.className = 'relative bg-slate-800 p-6 rounded-lg border border-slate-600 shadow-xl mt-4 transition-all duration-300';
    
    // Inject content including the arrow
    archetypeLevel.innerHTML = `
        <!-- Arrow pointing up to gauge -->
        <div class="absolute -top-2 w-4 h-4 bg-slate-800 border-t border-l border-slate-600 transform rotate-45 transition-all duration-300"
             style="left: calc(${percent}% - 8px);"></div>
             
        <div class="flex flex-col items-center animate-fade-in">
            ${label}
            <img src="${data.img}" class="w-24 h-24 rounded-full border-4 border-slate-700 shadow-2xl mb-3 bg-slate-800 object-cover">
            <span class="${data.color} text-sm font-bold tracking-widest uppercase mb-1">LEVEL ${level}</span>
            <h3 class="text-2xl font-bold text-white mb-2 ${data.color}">${data.name}</h3>
            <p class="text-slate-300 text-base leading-relaxed">${data.desc}</p>
        </div>
    `;
    
    // Hide the old separate elements since we merged them into the box
    archetypeName.classList.add('hidden');
    totalScoreEl.classList.add('hidden');
    
    // Add "Get Full Report" Button (Payment Placeholder)
    const secondaryCtas = document.getElementById('secondary-ctas');
    if (secondaryCtas && !document.getElementById('payment-btn')) {
        const btn = document.createElement('a');
        btn.id = 'payment-btn';
        btn.href = `payment.html?level=${level}`;
        btn.className = 'block w-full text-center bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg mt-6 transition-all transform hover:scale-105 uppercase tracking-widest border border-yellow-400';
        btn.innerHTML = uiText.results.unlock_report_button;
        secondaryCtas.appendChild(btn);
    }

    // If viewing a different level, show a "Back to my result" hint? 
    // For MVP, we just let them explore.
}

function addShareButtons(archetype, score) {
    const containerId = 'share-buttons-container';
    if (document.getElementById(containerId)) return;

    const shareContainer = document.createElement('div');
    shareContainer.id = containerId;
    shareContainer.className = 'mt-8 mb-4 text-left';
    
    const shareMessage = uiText.results.share_message_template
        .replace('{{score}}', score)
        .replace('{{archetype}}', archetype.name);

    shareContainer.innerHTML = `
        <h3 class="text-lg font-bold mb-2">${uiText.results.share_title}</h3>
        <textarea id="share-message" class="w-full p-2 border rounded-md bg-slate-700 text-slate-200" rows="3" readonly>${shareMessage}</textarea>
        <button id="copy-btn" class="w-full mt-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold py-3 px-4 rounded-lg transition-colors text-center shadow-lg">${uiText.results.copy_button}</button>
        <p class="text-center text-xs text-slate-400 mt-1"><i>${uiText.results.share_via}</i></p>
    `;
    
    const secondaryCtas = document.getElementById('secondary-ctas');
    secondaryCtas.appendChild(shareContainer);

    const copyBtn = document.getElementById('copy-btn');

    copyBtn.onclick = () => {
        navigator.clipboard.writeText(shareMessage).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = uiText.results.copied_button;
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };
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
                archetype_segment: archetype.level,
                total_score: totalScore,
                researchId: quizState.researchId
            })
        });
        
        const data = await response.json();

        if(response.ok) {
            // Handle Returning User Progress Message
            if (data.status === 'updated' && data.score_diff !== undefined) {
                let msg = data.message;
                if (data.score_diff > 0) msg = uiText.results.subscription.welcome_back_improved.replace('{{score_diff}}', data.score_diff);
                else if (data.score_diff < 0) msg = uiText.results.subscription.welcome_back_declined.replace('{{score_diff}}', Math.abs(data.score_diff));
                else msg = uiText.results.subscription.welcome_back_unchanged;
                subscribeMessage.textContent = msg;
            } else {
                subscribeMessage.textContent = data.message;
            }
            subscribeMessage.classList.add('text-green-600');
            emailInput.value = '';

            // Hide primary CTA and show secondary CTAs
            document.getElementById('primary-cta').classList.add('hidden');
            document.getElementById('secondary-ctas').classList.remove('hidden');

        } else {
            subscribeMessage.textContent = data.message || uiText.results.subscription.error;
            subscribeMessage.classList.add('text-red-600');
        }
    } catch (error) {
        console.error("Error subscribing:", error);
        subscribeMessage.textContent = uiText.results.subscription.error;
        subscribeMessage.classList.add('text-red-600');
    } finally {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}


// nextBtn listener is now handled dynamically in renderQuestion/startAutoAdvance
prevBtn.addEventListener('click', prevQuestion);
subscribeForm.addEventListener('submit', handleSubscription);

// Initial render
initApp();

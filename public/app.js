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

function renderQuestion() {
    const question = quizData[quizState.currentQuestionIndex];
    questionText.textContent = question.question;
    questionCategory.textContent = question.category;
    optionsContainer.innerHTML = '';

    question.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.classList.add('w-full', 'text-left', 'p-4', 'border', 'rounded-md', 'hover:bg-gray-100');
        button.onclick = () => selectAnswer(option.score);
        if (quizState.answers[quizState.currentQuestionIndex] === option.score) {
            button.classList.add('bg-blue-100', 'border-blue-500');
        }
        optionsContainer.appendChild(button);
    });

    prevBtn.disabled = quizState.currentQuestionIndex === 0;
    nextBtn.textContent = quizState.currentQuestionIndex === quizData.length - 1 ? 'Finish' : 'Next';
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

    // TODO: Replace with Netlify function call
    console.log('Submitting score to Netlify function...');
    console.log({
        answers: quizState.answers,
        totalScore,
        archetype
    });
    
    // Mock response
    displayResults(archetype, totalScore);

    // try {
    //     const response = await fetch('/.netlify/functions/submit-score', {
    //         method: 'POST',
    //         body: JSON.stringify({ answers: quizState.answers })
    //     });
    //     const result = await response.json();
    //     displayResults(result.archetype, result.totalScore);
    // } catch (error) {
    //     console.error("Error submitting score:", error);
    // }
}

function displayResults(archetype, totalScore) {
    quizContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    archetypeLevel.textContent = `Level ${archetype.level}`;
    archetypeName.textContent = archetype.name;
    totalScoreEl.textContent = `Your score: ${totalScore}`;
}


async function handleSubscription(event) {
    event.preventDefault();
    const email = emailInput.value;
    const totalScore = quizState.answers.reduce((acc, score) => acc + score, 0);
    const archetype = getArchetype(totalScore);


    // TODO: Replace with Netlify function call
    console.log(`Subscribing ${email} with archetype segment ${archetype.level}`);
    subscribeMessage.textContent = 'Thank you for subscribing!';
    emailInput.value = '';

    // try {
    //     const response = await fetch('/.netlify/functions/subscribe', {
    //         method: 'POST',
    //         body: JSON.stringify({
    //             email,
    //             archetype_segment: archetype.level
    //         })
    //     });
    //     if(response.ok) {
    //         subscribeMessage.textContent = 'Thank you for subscribing!';
    //         emailInput.value = '';
    //     } else {
    //         subscribeMessage.textContent = 'Something went wrong. Please try again.';
    //     }
    // } catch (error) {
    //     console.error("Error subscribing:", error);
    //     subscribeMessage.textContent = 'Something went wrong. Please try again.';
    // }
}


nextBtn.addEventListener('click', nextQuestion);
prevBtn.addEventListener('click', prevQuestion);
subscribeForm.addEventListener('submit', handleSubscription);

// Initial render
renderQuestion();

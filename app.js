// 📌 app.js: 5000 kelime, 10 kelimelik 500 bölüm + Sayfalı görünüm + Aynı soru/şık engellendi + 4 farklı şık garantisi (revize: şıklar eşsiz)

let allWords = [];
let currentLevel = 1;
let totalLevels = 1;
const QUESTIONS_PER_QUIZ = 10;
const WORDS_PER_LEVEL = 10;
let maxUnlockedLevel = 1;

let currentQuestions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let totalQuestionsThisQuiz = 0;
let userAnswers = {};
let answeredCorrectlyInitially = {};

let currentPage = 1;
const levelsPerPage = 20;

window.onload = () => {
  const savedLevel = parseInt(localStorage.getItem("currentLevel"));
  currentLevel = isNaN(savedLevel) ? 1 : savedLevel;
  maxUnlockedLevel = currentLevel;

  fetch("kelimeler.json")
    .then(res => res.json())
    .then(data => {
      allWords = data;
      totalLevels = Math.ceil(allWords.length / WORDS_PER_LEVEL);
      renderLevelSelector();
      addResetButton();
      startQuiz(currentLevel);
    });
};

function addResetButton() {
  const resetContainer = document.getElementById("reset-container") || document.createElement("div");
  resetContainer.id = "reset-container";
  resetContainer.innerHTML = `<button class="styled-button" onclick="resetProgress()">🔄 Sıfırla ve Baştan Başla</button>`;
  document.getElementById("app").prepend(resetContainer);
}

function resetProgress() {
  localStorage.clear();
  location.reload();
}

function renderLevelSelector() {
  let levelSelector = document.getElementById("level-selector");
  if (!levelSelector) {
    levelSelector = document.createElement("div");
    levelSelector.id = "level-selector";
    document.getElementById("app").prepend(levelSelector);
  }

  levelSelector.innerHTML = `<h3>Geçtiğiniz Bölümler:</h3>`;

  const start = (currentPage - 1) * levelsPerPage + 1;
  const end = Math.min(start + levelsPerPage - 1, totalLevels);

  for (let i = start; i <= end; i++) {
    const btn = document.createElement("button");
    btn.innerText = `Bölüm ${i}`;
    btn.className = "level-btn styled-button";
    btn.disabled = i > maxUnlockedLevel;
    btn.onclick = () => startQuiz(i);
    levelSelector.appendChild(btn);
  }

  const navContainer = document.createElement("div");
  navContainer.className = "pagination";

  if (currentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.innerText = "← Önceki Sayfa";
    prevBtn.className = "styled-button";
    prevBtn.onclick = () => {
      currentPage--;
      renderLevelSelector();
    };
    navContainer.appendChild(prevBtn);
  }

  if (end < totalLevels) {
    const nextBtn = document.createElement("button");
    nextBtn.innerText = "Sonraki Sayfa →";
    nextBtn.className = "styled-button";
    nextBtn.onclick = () => {
      currentPage++;
      renderLevelSelector();
    };
    navContainer.appendChild(nextBtn);
  }

  levelSelector.appendChild(navContainer);
}

function startQuiz(level) {
  currentLevel = level;
  correctAnswers = 0;
  currentQuestionIndex = 0;
  userAnswers = {};
  answeredCorrectlyInitially = {};

  const info = document.getElementById("info");
  info.innerText = `Seviye ${currentLevel} | %80 başarı ile bir sonraki bölüme geçebilirsin.`;

  const startIdx = (currentLevel - 1) * WORDS_PER_LEVEL;
  let quizPool = allWords.slice(startIdx, startIdx + WORDS_PER_LEVEL);

  const seenQuestions = new Set();
  currentQuestions = quizPool.filter(q => {
    const key = q.english_word + "|" + q.turkish_word;
    if (seenQuestions.has(key)) return false;
    seenQuestions.add(key);
    return true;
  });

  localStorage.setItem(`quiz_${currentLevel}`, JSON.stringify(currentQuestions));
  totalQuestionsThisQuiz = currentQuestions.length;
  showQuestion();
}

function cleanWord(word) {
  return word.replace(/_[0-9]+$/, "");
}

function getRandomWrongAnswers(correct, count = 3) {
  const wrongs = allWords
    .map(w => w.turkish_word)
    .filter(w => w !== correct);

  const uniqueWrongs = Array.from(new Set(wrongs));
  const selected = [];

  while (selected.length < count && uniqueWrongs.length > 0) {
    const idx = Math.floor(Math.random() * uniqueWrongs.length);
    const candidate = uniqueWrongs.splice(idx, 1)[0];
    if (!selected.includes(candidate)) {
      selected.push(candidate);
    }
  }

  return selected;
}

function showQuestion() {
  const question = currentQuestions[currentQuestionIndex];
  const container = document.getElementById("question-container");
  const options = document.getElementById("options");

  container.innerHTML = `<div class="card" style="font-size: 20px;"><strong>${currentQuestionIndex + 1}. Soru:</strong><br><span class="word">"${cleanWord(question.english_word)}"</span> kelimesinin Türkçesi nedir?</div>`;

  const wrongAnswers = getRandomWrongAnswers(question.turkish_word);
  const allChoices = shuffle([question.turkish_word, ...wrongAnswers]);
  const uniqueChoices = Array.from(new Set(allChoices)).slice(0, 4); // Maksimum 4 farklı şık

  options.innerHTML = "";
  const choiceContainer = document.createElement("div");
  choiceContainer.style.display = "flex";
  choiceContainer.style.flexWrap = "wrap";
  choiceContainer.style.justifyContent = "center";
  choiceContainer.style.gap = "10px";

  uniqueChoices.forEach(choice => {
    const displayChoice = cleanWord(choice);
    const btn = document.createElement("button");
    btn.innerText = displayChoice;
    btn.className = "option-btn styled-button";
    btn.style.fontSize = "18px";
    btn.onclick = () => checkAnswer(btn, choice, question.turkish_word);

    if (userAnswers[currentQuestionIndex] !== undefined) {
      if (userAnswers[currentQuestionIndex] === choice) {
        btn.style.backgroundColor = (choice === question.turkish_word) ? "#4CAF50" : "#f44336";
      }
    }

    choiceContainer.appendChild(btn);
  });

  options.appendChild(choiceContainer);

  const navContainer = document.createElement("div");
  navContainer.style.marginTop = "20px";
  navContainer.style.display = "flex";
  navContainer.style.justifyContent = "space-between";

  if (currentQuestionIndex > 0) {
    const prevBtn = document.createElement("button");
    prevBtn.innerText = "← Önceki Soru";
    prevBtn.className = "styled-button";
    prevBtn.onclick = () => {
      currentQuestionIndex--;
      showQuestion();
    };
    navContainer.appendChild(prevBtn);
  } else {
    const spacer = document.createElement("div");
    navContainer.appendChild(spacer);
  }

  if (currentQuestionIndex < currentQuestions.length - 1) {
    const nextBtn = document.createElement("button");
    nextBtn.innerText = "Sonraki Soru →";
    nextBtn.className = "styled-button";
    nextBtn.onclick = nextQuestion;
    navContainer.appendChild(nextBtn);
  }

  options.appendChild(navContainer);
}

function checkAnswer(btn, selected, correct) {
  if (!(currentQuestionIndex in answeredCorrectlyInitially)) {
    answeredCorrectlyInitially[currentQuestionIndex] = (selected === correct);
  }

  userAnswers[currentQuestionIndex] = selected;
  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach(b => {
    b.style.backgroundColor = "";
    if (cleanWord(b.innerText) === cleanWord(correct)) b.style.backgroundColor = "#4CAF50";
    else if (cleanWord(b.innerText) === cleanWord(selected)) b.style.backgroundColor = "#f44336";
  });
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < currentQuestions.length) {
    showQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  const info = document.getElementById("info");
  const container = document.getElementById("question-container");
  const options = document.getElementById("options");

  let score = 0;
  for (let i = 0; i < totalQuestionsThisQuiz; i++) {
    if (answeredCorrectlyInitially[i]) score++;
  }

  score = Math.round((score / totalQuestionsThisQuiz) * 100);

  const savedLevel = parseInt(localStorage.getItem("currentLevel") || "1");
  let nextLevel = Math.max(currentLevel + 1, savedLevel);

  if (score >= 80) {
    if (currentLevel >= savedLevel) {
      localStorage.setItem("currentLevel", nextLevel);
      maxUnlockedLevel = nextLevel;
      renderLevelSelector();
      info.innerText = `✅ Tebrikler! ${score}% başarı ile Seviye ${currentLevel} tamamlandı.`;
      setTimeout(() => startQuiz(nextLevel), 2000);
    } else {
      info.innerText = `✅ ${score}% başarı! Bu bölümü tekrar ettiniz.`;
    }
  } else {
    info.innerText = `❌ Başarısız: ${score}%. Bu bölümü tekrar etmeniz gerekiyor.`;
  }

  container.innerHTML = "";
  options.innerHTML = `<button class="styled-button" onclick="startQuiz(${currentLevel})">Bölümü Yeniden Başlat</button>`;
}

function shuffle(array) {
  return array.map(a => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
}
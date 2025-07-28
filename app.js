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

let currentMode = "kelime"; // "kelime" veya "esanlam"

// Her modun (kelime/esanlam) kendi ilerlemesini ayrı tutmak için localStorage anahtarlarını ve değişkenleri ayırıyoruz
let kelimeCurrentLevel = 1;
let kelimeMaxUnlockedLevel = 1;
let esanlamCurrentLevel = 1;
let esanlamMaxUnlockedLevel = 1;

window.onload = () => {
  initializeApp();
};

function initializeApp() {
  // Tüm app içeriğini temizle
  const appDiv = document.getElementById("app");
  appDiv.innerHTML = "";
  // Tabları ekle
  renderTabs();
  // Info, question-container, options alanlarını ekle
  const infoDiv = document.createElement("div");
  infoDiv.id = "info";
  appDiv.appendChild(infoDiv);
  const questionDiv = document.createElement("div");
  questionDiv.id = "question-container";
  appDiv.appendChild(questionDiv);
  const optionsDiv = document.createElement("div");
  optionsDiv.id = "options";
  appDiv.appendChild(optionsDiv);

  // Her modun kendi ilerlemesini oku
  kelimeCurrentLevel = parseInt(localStorage.getItem("kelimeCurrentLevel")) || 1;
  kelimeMaxUnlockedLevel = parseInt(localStorage.getItem("kelimeMaxUnlockedLevel")) || kelimeCurrentLevel;
  esanlamCurrentLevel = parseInt(localStorage.getItem("esanlamCurrentLevel")) || 1;
  esanlamMaxUnlockedLevel = parseInt(localStorage.getItem("esanlamMaxUnlockedLevel")) || esanlamCurrentLevel;

  fetch("kelimeler.json")
    .then(res => res.json())
    .then(data => {
      allWords = data.vocabulary;
      totalLevels = Math.ceil(allWords.length / WORDS_PER_LEVEL);
      renderLevelSelector();
      addResetButton();
      if (currentMode === "kelime") {
        startQuiz(kelimeCurrentLevel);
      } else {
        startSynonymQuiz(esanlamCurrentLevel);
      }
    });
}

function renderTabs() {
  // Her zaman en başa ekle
  const appDiv = document.getElementById("app");
  let tabContainer = document.getElementById("tab-container");
  if (tabContainer) tabContainer.remove();
  tabContainer = document.createElement("div");
  tabContainer.id = "tab-container";
  tabContainer.style.display = "flex";
  tabContainer.style.gap = "10px";
  tabContainer.style.marginBottom = "10px";
  tabContainer.style.marginTop = "10px";
  tabContainer.innerHTML = `
    <button id="tab-kelime" class="tab-btn styled-button">Kelime Çalış</button>
    <button id="tab-esanlam" class="tab-btn styled-button">Eş Anlamlı Kelime Çalış</button>
  `;
  appDiv.prepend(tabContainer);
  document.getElementById("tab-kelime").onclick = () => switchMode("kelime");
  document.getElementById("tab-esanlam").onclick = () => switchMode("esanlam");
  updateTabActive();
}

function updateTabActive() {
  document.getElementById("tab-kelime").style.backgroundColor = currentMode === "kelime" ? "#1976d2" : "";
  document.getElementById("tab-kelime").style.color = currentMode === "kelime" ? "#fff" : "";
  document.getElementById("tab-esanlam").style.backgroundColor = currentMode === "esanlam" ? "#1976d2" : "";
  document.getElementById("tab-esanlam").style.color = currentMode === "esanlam" ? "#fff" : "";
}

function switchMode(mode) {
  if (currentMode !== mode) {
    currentMode = mode;
    updateTabActive();
    // Tüm app içeriğini temizle ve baştan oluştur
    initializeApp();
  }
}

function renderLevelSelector() {
  // Eski levelSelector varsa sil
  const appDiv = document.getElementById("app");
  let old = document.getElementById("level-selector");
  if (old) old.remove();
  let levelSelector = document.createElement("div");
  levelSelector.id = "level-selector";
  levelSelector.innerHTML = `<h3>Geçtiğiniz Bölümler:</h3>`;
  appDiv.insertBefore(levelSelector, appDiv.children[1] || null); // tab-container'dan sonra ekle

  const start = (currentPage - 1) * levelsPerPage + 1;
  const end = Math.min(start + levelsPerPage - 1, totalLevels);

  // Her modun kendi unlockedLevel'ı
  let unlockedLevel = currentMode === "kelime" ? kelimeMaxUnlockedLevel : esanlamMaxUnlockedLevel;

  for (let i = start; i <= end; i++) {
    const btn = document.createElement("button");
    btn.innerText = `Bölüm ${i}`;
    btn.className = "level-btn styled-button";
    btn.disabled = i > unlockedLevel;
    btn.onclick = () => {
      if (currentMode === "kelime") {
        startQuiz(i);
      } else {
        startSynonymQuiz(i);
      }
    };
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

function addResetButton() {
  const appDiv = document.getElementById("app");
  let old = document.getElementById("reset-container");
  if (old) old.remove();
  const resetContainer = document.createElement("div");
  resetContainer.id = "reset-container";
  resetContainer.innerHTML = `<button class="styled-button" onclick="resetProgress()">🔄 Sıfırla ve Baştan Başla</button>`;
  appDiv.insertBefore(resetContainer, appDiv.firstChild.nextSibling || null); // tab-container'dan hemen sonra ekle
}

function finishSynonymQuiz() {
  const info = document.getElementById("info");
  const container = document.getElementById("question-container");
  const options = document.getElementById("options");

  let score = 0;
  for (let i = 0; i < totalQuestionsThisQuiz; i++) {
    const question = currentQuestions[i];
    const correctSynonyms = Array.isArray(question.synonyms) ? question.synonyms : [];
    const userSelected = Array.isArray(userAnswers[i]) ? userAnswers[i] : [];
    // Sırasız ve fazladan işaret kontrolü: sadece doğru synonyms işaretlenmişse doğru kabul et
    const correctSet = new Set(correctSynonyms);
    const userSet = new Set(userSelected);
    let isCorrect = true;
    // Kullanıcı tüm doğru şıkları işaretlemiş mi?
    for (const s of correctSet) {
      if (!userSet.has(s)) {
        isCorrect = false;
        break;
      }
    }
    // Kullanıcı fazladan yanlış şık işaretlemiş mi?
    if (isCorrect) {
      for (const s of userSet) {
        if (!correctSet.has(s)) {
          isCorrect = false;
          break;
        }
      }
    }
    if (correctSynonyms.length > 0 && isCorrect) {
      score++;
      answeredCorrectlyInitially[i] = true;
    } else {
      answeredCorrectlyInitially[i] = false;
    }
  }

  score = Math.round((score / totalQuestionsThisQuiz) * 100);

  let savedLevel = parseInt(localStorage.getItem("esanlamMaxUnlockedLevel") || "1");
  let nextLevel = Math.max(esanlamCurrentLevel + 1, savedLevel);

  if (score >= 80) {
    if (esanlamCurrentLevel >= savedLevel) {
      localStorage.setItem("esanlamMaxUnlockedLevel", nextLevel);
      esanlamMaxUnlockedLevel = nextLevel;
      renderLevelSelector();
      info.innerText = `✅ Tebrikler! ${score}% başarı ile Seviye ${esanlamCurrentLevel} tamamlandı.`;
      setTimeout(() => startSynonymQuiz(nextLevel), 2000);
    } else {
      info.innerText = `✅ ${score}% başarı! Bu bölümü tekrar ettiniz.`;
    }
  } else {
    info.innerText = `❌ Başarısız: ${score}%. Bu bölümü tekrar etmeniz gerekiyor.`;
  }

  container.innerHTML = "";
  options.innerHTML = `<button class="styled-button" onclick="startSynonymQuiz(${esanlamCurrentLevel})">Bölümü Yeniden Başlat</button>`;
}
// Eş Anlamlı Quiz Başlatıcı
function startSynonymQuiz(level) {
  esanlamCurrentLevel = level;
  localStorage.setItem("esanlamCurrentLevel", esanlamCurrentLevel);
  correctAnswers = 0;
  currentQuestionIndex = 0;
  userAnswers = {};
  answeredCorrectlyInitially = {};

  const info = document.getElementById("info");
  info.innerText = `Seviye ${esanlamCurrentLevel} | %80 başarı ile bir sonraki bölüme geçebilirsin.`;

  const startIdx = (esanlamCurrentLevel - 1) * WORDS_PER_LEVEL;
  let quizPool = allWords.slice(startIdx, startIdx + WORDS_PER_LEVEL);

  const seenQuestions = new Set();
  currentQuestions = quizPool.filter(q => {
    const key = q.word + "|" + (q.synonyms ? q.synonyms.join(",") : "");
    if (seenQuestions.has(key)) return false;
    seenQuestions.add(key);
    return true;
  });

  localStorage.setItem(`synquiz_${esanlamCurrentLevel}`, JSON.stringify(currentQuestions));
  totalQuestionsThisQuiz = currentQuestions.length;
  showSynonymQuestion();
}

// Eş Anlamlı Soru Gösterici
function showSynonymQuestion() {
  const question = currentQuestions[currentQuestionIndex];
  const container = document.getElementById("question-container");
  const options = document.getElementById("options");

  container.innerHTML = `<div class="card" style="font-size: 20px;"><strong>${currentQuestionIndex + 1}. Soru:</strong><br><span class="word">\"${cleanWord(question.word)}\"</span> kelimesinin eş anlamlıları aşağıdakilerden hangileridir?</div>`;

  // Doğru şıklar: question.synonyms (dizi)
  const correctSynonyms = Array.isArray(question.synonyms) ? question.synonyms : [];
  // Yanlış şıklar: Diğer kelimelerden rastgele, doğru şıklarda olmayanlar
  let wrongs = [];
  allWords.forEach(w => {
    if (w.word !== question.word) {
      if (Array.isArray(w.synonyms)) {
        wrongs = wrongs.concat(w.synonyms.filter(s => !correctSynonyms.includes(s)));
      }
      if (!correctSynonyms.includes(w.word)) wrongs.push(w.word);
    }
  });
  // Eşsiz ve doğru şıklarda olmayanlardan rastgele seç
  let uniqueWrongs = Array.from(new Set(wrongs)).filter(w => !correctSynonyms.includes(w));
  // En az 3 yanlış şık ekle, toplam şık sayısı 7+3=10 olabilir
  let numWrong = Math.max(3, 10 - correctSynonyms.length);
  let selectedWrongs = [];
  while (selectedWrongs.length < numWrong && uniqueWrongs.length > 0) {
    const idx = Math.floor(Math.random() * uniqueWrongs.length);
    const candidate = uniqueWrongs.splice(idx, 1)[0];
    if (!selectedWrongs.includes(candidate)) {
      selectedWrongs.push(candidate);
    }
  }
  // Şıkları karıştır
  let choices = correctSynonyms.concat(selectedWrongs);
  choices = shuffle(choices);

  options.innerHTML = "";
  const choiceContainer = document.createElement("div");
  choiceContainer.style.display = "flex";
  choiceContainer.style.flexWrap = "wrap";
  choiceContainer.style.justifyContent = "center";
  choiceContainer.style.gap = "10px";

  // Çoklu seçim için checkbox butonları
  let selectedSet = new Set(userAnswers[currentQuestionIndex] || []);
  choices.forEach(choice => {
    const displayChoice = cleanWord(choice);
    const label = document.createElement("label");
    label.style.margin = "5px";
    label.style.fontSize = "18px";
    label.style.display = "flex";
    label.style.alignItems = "center";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = choice;
    checkbox.checked = selectedSet.has(choice);
    checkbox.onchange = () => {
      if (checkbox.checked) selectedSet.add(choice);
      else selectedSet.delete(choice);
      userAnswers[currentQuestionIndex] = Array.from(selectedSet);
    };
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + displayChoice));
    choiceContainer.appendChild(label);
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
      showSynonymQuestion();
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
    nextBtn.onclick = nextSynonymQuestion;
    navContainer.appendChild(nextBtn);
  } else {
    // Son sorudayız, Bitir butonu ekle
    const finishBtn = document.createElement("button");
    finishBtn.innerText = "Bitir";
    finishBtn.className = "styled-button";
    finishBtn.onclick = finishSynonymQuiz;
    navContainer.appendChild(finishBtn);
  }

  options.appendChild(navContainer);
}

function nextSynonymQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < currentQuestions.length) {
    showSynonymQuestion();
  } else {
    finishSynonymQuiz();
  }
}

function finishSynonymQuiz() {
  const info = document.getElementById("info");
  const container = document.getElementById("question-container");
  const options = document.getElementById("options");

  let score = 0;
  for (let i = 0; i < totalQuestionsThisQuiz; i++) {
    const question = currentQuestions[i];
    const correctSynonyms = Array.isArray(question.synonyms) ? question.synonyms : [];
    const userSelected = Array.isArray(userAnswers[i]) ? userAnswers[i] : [];
    // Doğru şıkların tamamı işaretlenmiş ve yanlış işaret yoksa doğru kabul et
    if (
      correctSynonyms.length > 0 &&
      correctSynonyms.every(s => userSelected.includes(s)) &&
      userSelected.every(s => correctSynonyms.includes(s))
    ) {
      score++;
      answeredCorrectlyInitially[i] = true;
    } else {
      answeredCorrectlyInitially[i] = false;
    }
  }

  score = Math.round((score / totalQuestionsThisQuiz) * 100);

  let savedLevel = parseInt(localStorage.getItem("esanlamMaxUnlockedLevel") || "1");
  let nextLevel = Math.max(esanlamCurrentLevel + 1, savedLevel);

  if (score >= 80) {
    if (esanlamCurrentLevel >= savedLevel) {
      localStorage.setItem("esanlamMaxUnlockedLevel", nextLevel);
      esanlamMaxUnlockedLevel = nextLevel;
      renderLevelSelector();
      info.innerText = `✅ Tebrikler! ${score}% başarı ile Seviye ${esanlamCurrentLevel} tamamlandı.`;
      setTimeout(() => startSynonymQuiz(nextLevel), 2000);
    } else {
      info.innerText = `✅ ${score}% başarı! Bu bölümü tekrar ettiniz.`;
    }
  } else {
    info.innerText = `❌ Başarısız: ${score}%. Bu bölümü tekrar etmeniz gerekiyor.`;
  }

  container.innerHTML = "";
  options.innerHTML = `<button class="styled-button" onclick="startSynonymQuiz(${esanlamCurrentLevel})">Bölümü Yeniden Başlat</button>`;
}

function startQuiz(level) {
  kelimeCurrentLevel = level;
  localStorage.setItem("kelimeCurrentLevel", kelimeCurrentLevel);
  correctAnswers = 0;
  currentQuestionIndex = 0;
  userAnswers = {};
  answeredCorrectlyInitially = {};

  const info = document.getElementById("info");
  info.innerText = `Seviye ${kelimeCurrentLevel} | %80 başarı ile bir sonraki bölüme geçebilirsin.`;

  const startIdx = (kelimeCurrentLevel - 1) * WORDS_PER_LEVEL;
  let quizPool = allWords.slice(startIdx, startIdx + WORDS_PER_LEVEL);

  const seenQuestions = new Set();
  currentQuestions = quizPool.filter(q => {
    const key = q.word + "|" + q.translation;
    if (seenQuestions.has(key)) return false;
    seenQuestions.add(key);
    return true;
  });

  localStorage.setItem(`quiz_${kelimeCurrentLevel}`, JSON.stringify(currentQuestions));
  totalQuestionsThisQuiz = currentQuestions.length;
  showQuestion();
}

function cleanWord(word) {
  return word.replace(/_[0-9]+$/, "");
}

// Yeni yapıya göre yanlış şıklar: Diğer kelimelerin translation veya synonyms'lerinden alınabilir
function getRandomWrongAnswers(correct, count = 3) {
  // Sadece diğer kelimelerin translation (Türkçe) karşılıklarını topla
  let wrongs = allWords
    .map(w => w.translation)
    .filter(w => w !== correct);
  // Eşsiz ve doğru cevabı içermeyenlerden rastgele seç
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

  container.innerHTML = `<div class="card" style="font-size: 20px;"><strong>${currentQuestionIndex + 1}. Soru:</strong><br><span class="word">"${cleanWord(question.word)}"</span> kelimesinin Türkçesi nedir?</div>`;

  // Şıklar: Sadece Türkçe karşılıklar (translation)
  let choices = [question.translation];
  const wrongAnswers = getRandomWrongAnswers(question.translation);
  choices = choices.concat(wrongAnswers);
  // Eşsiz ve maksimum 4 şık
  const uniqueChoices = Array.from(new Set(choices)).slice(0, 4);
  const shuffledChoices = shuffle(uniqueChoices);

  options.innerHTML = "";
  const choiceContainer = document.createElement("div");
  choiceContainer.style.display = "flex";
  choiceContainer.style.flexWrap = "wrap";
  choiceContainer.style.justifyContent = "center";
  choiceContainer.style.gap = "10px";

  shuffledChoices.forEach(choice => {
    // Türkçe karakterlerin doğru görünmesi için innerText kullanılıyor
    const displayChoice = cleanWord(choice);
    const btn = document.createElement("button");
    btn.innerText = displayChoice;
    btn.className = "option-btn styled-button";
    btn.style.fontSize = "18px";
    btn.onclick = () => checkAnswer(btn, choice, question.translation);

    if (userAnswers[currentQuestionIndex] !== undefined) {
      if (userAnswers[currentQuestionIndex] === choice) {
        btn.style.backgroundColor = (choice === question.translation) ? "#4CAF50" : "#f44336";
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
  } else {
    // Son sorudayız, Bitir butonu ekle
    const finishBtn = document.createElement("button");
    finishBtn.innerText = "Bitir";
    finishBtn.className = "styled-button";
    finishBtn.onclick = finishQuiz;
    navContainer.appendChild(finishBtn);
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

  let savedLevel = parseInt(localStorage.getItem("kelimeMaxUnlockedLevel") || "1");
  let nextLevel = Math.max(kelimeCurrentLevel + 1, savedLevel);

  if (score >= 80) {
    if (kelimeCurrentLevel >= savedLevel) {
      localStorage.setItem("kelimeMaxUnlockedLevel", nextLevel);
      kelimeMaxUnlockedLevel = nextLevel;
      renderLevelSelector();
      info.innerText = `✅ Tebrikler! ${score}% başarı ile Seviye ${kelimeCurrentLevel} tamamlandı.`;
      setTimeout(() => startQuiz(nextLevel), 2000);
    } else {
      info.innerText = `✅ ${score}% başarı! Bu bölümü tekrar ettiniz.`;
    }
  } else {
    info.innerText = `❌ Başarısız: ${score}%. Bu bölümü tekrar etmeniz gerekiyor.`;
  }

  container.innerHTML = "";
  options.innerHTML = `<button class="styled-button" onclick="startQuiz(${kelimeCurrentLevel})">Bölümü Yeniden Başlat</button>`;
}

function shuffle(array) {
  return array.map(a => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
}

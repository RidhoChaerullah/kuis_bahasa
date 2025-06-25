document.addEventListener('DOMContentLoaded', () => {
    // Variabel untuk menyimpan state kuis
    let quizData;
    let currentMode;
    let currentLevelIndex = 0;
    let currentStep = 1; // 1: content, 2: written, 3: spoken
    let score = 0;

    // Elemen DOM yang akan dimanipulasi
    const quizTitle = document.getElementById('quiz-title');
    const levelIndicator = document.getElementById('level-indicator');
    const allSteps = document.querySelectorAll('.quiz-step');
    const contentTitle = document.getElementById('content-title');
    const dynamicContent = document.getElementById('dynamic-content');
    const writtenForm = document.getElementById('written-form');
    const spokenSentence = document.getElementById('spoken-sentence');
    const finishButton = document.getElementById('finish-button');

    // Fungsi utama untuk memulai kuis
    async function init() {
        try {
            const response = await fetch('soal.json');
            if (!response.ok) throw new Error('Gagal memuat file soal.json');
            quizData = await response.json();

            const urlParams = new URLSearchParams(window.location.search);
            currentMode = urlParams.get('mode');

            if (!quizData[currentMode]) {
                window.location.href = 'pilih-mode.html'; // Kembali jika mode salah
                return;
            }

            quizTitle.textContent = `Kuis Mode: ${currentMode.toUpperCase()}`;
            loadLevel(currentLevelIndex);

        } catch (error) {
            console.error('Error:', error);
            dynamicContent.innerHTML = `<div class="alert alert-danger">Terjadi kesalahan saat memuat kuis. Coba lagi nanti.</div>`;
        }
    }

    // Fungsi untuk memuat level tertentu (misal: Teks 1, Video 1, dst)
    function loadLevel(levelIndex) {
        currentStep = 1;
        const levelData = quizData[currentMode][levelIndex];

        // Reset tampilan
        document.getElementById('spoken-answer').value = '';
        levelIndicator.textContent = `Level ${levelData.level} dari ${quizData[currentMode].length}`;

        // Load konten (Step 1)
        contentTitle.textContent = `Langkah 1: ${levelData.tipe}`;
        if (currentMode === 'easy') {
            dynamicContent.innerHTML = `
                <p><strong>Teks ${levelData.level}:</strong></p>
                <p>${levelData.konten.teks}</p>
                <hr>
                <p>Dengarkan audionya:</p>
                <audio controls class="w-100">
                    <source src="${levelData.konten.audioSrc}" type="audio/mpeg">
                    Browser Anda tidak mendukung elemen audio.
                </audio>`;
        } else { // Hard mode
            dynamicContent.innerHTML = `
                <p>Tonton video berikut dengan saksama untuk menjawab pertanyaan nanti.</p>
                <div class="ratio ratio-16x9">
                    <iframe src="${levelData.konten.videoSrc}" title="YouTube video player" allowfullscreen></iframe>
                </div>`;
        }

        // Load Kuis Tulis (Step 2)
        let writtenHTML = '';
        levelData.kuisTulis.forEach((q, index) => {
            let optionsHTML = '';
            q.pilihan.forEach(option => {
                optionsHTML += `
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="q${index}" id="q${index}-${option}" value="${option}">
                        <label class="form-check-label" for="q${index}-${option}">${option}</label>
                    </div>`;
            });
            writtenHTML += `<div class="mb-3"><label class="form-label">${index + 1}. ${q.pertanyaan}</label>${optionsHTML}</div>`;
        });
        writtenForm.innerHTML = writtenHTML;

        // Load Kuis Lisan (Step 3)
        spokenSentence.textContent = `"${levelData.kuisLisan.kalimat}"`;

        // Update tombol finish
        if (currentLevelIndex === quizData[currentMode].length - 1) {
            finishButton.textContent = 'Selesaikan Kuis & Lihat Hasil';
        } else {
            finishButton.textContent = 'Lanjut ke Level Berikutnya';
        }

        showStep(1);
    }

    // Fungsi untuk menampilkan langkah yang aktif
    function showStep(stepNum) {
        allSteps.forEach(step => step.classList.add('d-none'));
        document.getElementById(`step-${stepNum === 1 ? 'content' : (stepNum === 2 ? 'written-quiz' : 'spoken-quiz')}`).classList.remove('d-none');
    }
    
    // Fungsi untuk pindah ke langkah berikutnya dalam satu level
    window.nextStep = function() {
        currentStep++;
        showStep(currentStep);
    }

    // Fungsi yang dipanggil saat tombol finish di level terakhir ditekan
    window.finishLevel = function() {
        calculateScoreForCurrentLevel();

        if (currentLevelIndex < quizData[currentMode].length - 1) {
            // Lanjut ke level berikutnya
            currentLevelIndex++;
            loadLevel(currentLevelIndex);
        } else {
            // Kuis selesai, redirect ke halaman hasil
            window.location.href = `hasil.html?score=${score}`;
        }
    }

    function calculateScoreForCurrentLevel() {
        const levelData = quizData[currentMode][currentLevelIndex];
        const pointPerQuestion = 50; // Asumsi 2 soal per level = 100 poin

        // Hitung skor kuis tulis
        levelData.kuisTulis.forEach((q, index) => {
            const userAnswer = writtenForm.querySelector(`input[name="q${index}"]:checked`);
            if (userAnswer && userAnswer.value === q.jawabanBenar) {
                score += pointPerQuestion / levelData.kuisTulis.length;
            }
        });

        // Hitung skor kuis lisan (simulasi)
        const spokenAnswer = document.getElementById('spoken-answer').value;
        if (spokenAnswer.trim().toLowerCase() === levelData.kuisLisan.kalimat.toLowerCase().replace(/["'.]/g, '')) {
            score += 50; // Poin untuk kuis lisan
        }
    }

    // Mulai kuis saat halaman siap
    init();
});
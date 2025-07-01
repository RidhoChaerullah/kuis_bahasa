document.addEventListener('DOMContentLoaded', () => {
    // Variabel untuk menyimpan state kuis
    let quizData;
    let currentMode;
    let currentLevelIndex = 0;
    let score = 0;

    // Elemen DOM yang akan dimanipulasi
    const quizTitle = document.getElementById('quiz-title');
    const levelIndicator = document.getElementById('level-indicator');
    const stepContent = document.getElementById('step-content');
    const stepWrittenQuiz = document.getElementById('step-written-quiz');
    const contentTitle = document.getElementById('content-title');
    const dynamicContent = document.getElementById('dynamic-content');
    const writtenForm = document.getElementById('written-form');
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
                window.location.href = 'pilih-mode.html';
                return;
            }

            quizTitle.textContent = `Kuis Mode: ${currentMode.toUpperCase()}`;
            loadLevel(currentLevelIndex);

        } catch (error) {
            console.error('Error:', error);
            dynamicContent.innerHTML = `<div class="alert alert-danger">Terjadi kesalahan saat memuat kuis. Coba lagi nanti.</div>`;
        }
    }

    // Fungsi untuk memuat level tertentu
    function loadLevel(levelIndex) {
        const levelData = quizData[currentMode][levelIndex];

        levelIndicator.textContent = `Level ${levelData.level} dari ${quizData[currentMode].length}`;
        
        contentTitle.textContent = `Langkah 1: Materi (${levelData.tipe})`;
        
        let contentHTML = '';

        if (levelData.konten.teks) {
            contentHTML += `<p>${levelData.konten.teks}</p>`;
        }

        if (levelData.konten.audioSrc) {
            if (contentHTML !== '') {
                contentHTML += '<hr>';
            }
            contentHTML += `
                <p>Dengarkan audionya:</p>
                <audio controls class="w-100" src="${levelData.konten.audioSrc}">
                    Browser Anda tidak mendukung elemen audio.
                </audio>`;
        }
        
        if (levelData.konten.videoSrc) {
            contentHTML += `
                <p>Tonton video berikut dengan saksama untuk menjawab pertanyaan nanti.</p>
                <div class="ratio ratio-16x9">
                    <iframe src="${levelData.konten.videoSrc}" title="YouTube video player" allowfullscreen></iframe>
                </div>`;
        }

        dynamicContent.innerHTML = contentHTML;
        
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

        if (currentLevelIndex === quizData[currentMode].length - 1) {
            finishButton.textContent = 'Selesaikan Kuis & Lihat Hasil';
        } else {
            finishButton.textContent = 'Lanjut ke Level Berikutnya';
        }

        stepContent.classList.remove('d-none');
        stepWrittenQuiz.classList.add('d-none');
    }

    window.goToWrittenQuiz = function() {
        stepContent.classList.add('d-none');
        stepWrittenQuiz.classList.remove('d-none');
    }
    
    window.finishLevel = function() {
        calculateScoreForCurrentLevel();

        if (currentLevelIndex < quizData[currentMode].length - 1) {
            currentLevelIndex++;
            loadLevel(currentLevelIndex);
        } else {
            window.location.href = `hasil.html?score=${Math.round(score)}`;
        }
    }

    // =================================================================
    // FUNGSI INI DIUBAH UNTUK SKOR BERBEDA
    // =================================================================
    function calculateScoreForCurrentLevel() {
        const levelData = quizData[currentMode][currentLevelIndex];
        
        // Tentukan poin per level berdasarkan mode
        let pointPerLevel;
        if (currentMode === 'easy') {
            pointPerLevel = 50;
        } else { // 'hard'
            pointPerLevel = 100;
        }

        const totalQuestions = levelData.kuisTulis.length;
        const pointPerQuestion = pointPerLevel / totalQuestions;

        levelData.kuisTulis.forEach((q, index) => {
            const userAnswer = writtenForm.querySelector(`input[name="q${index}"]:checked`);
            if (userAnswer && userAnswer.value === q.jawabanBenar) {
                score += pointPerQuestion;
            }
        });
    }
    // =================================================================
    // AKHIR DARI BAGIAN YANG DIUBAH
    // =================================================================

    // Mulai kuis saat halaman siap
    init();
});
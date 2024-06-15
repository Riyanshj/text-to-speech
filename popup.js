document.addEventListener('DOMContentLoaded', function() {
    const textArea = document.getElementById('text');
    const speakButton = document.getElementById('speak');
    const pauseButton = document.getElementById('pause');
    const resumeButton = document.getElementById('resume');
    const voiceSelect = document.getElementById('voices');
    const rateRange = document.getElementById('rate');
    const volumeRange = document.getElementById('volume');
    const fileInput = document.getElementById('fileInput');
    const uploadFileButton = document.getElementById('uploadFile');
    const extractTextButton = document.getElementById('extractText');
    const downloadAudioButton = document.getElementById('downloadAudio');
    const removeTextButton = document.getElementById('removeText');
    const resetButton = document.getElementById('reset');
    let utterance;
    let audioChunks = [];
    let mediaRecorder;
  
    // Function to initialize speech synthesis
    function initializeSpeech() {
      if (utterance) {
        window.speechSynthesis.cancel();
        utterance = null;
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      audioChunks = [];
      textArea.value = '';
      // Reset download audio button if needed
      downloadAudioButton.onclick = null;
    }
  
    // Populate voice options
    function populateVoices() {
      const voices = window.speechSynthesis.getVoices();
      voiceSelect.innerHTML = '';
      voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
      });
    }
  
    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;
  
    // Create SpeechSynthesisUtterance object
    function createUtterance(text) {
      const newUtterance = new SpeechSynthesisUtterance(text);
      const selectedVoice = window.speechSynthesis.getVoices()[voiceSelect.value];
      newUtterance.voice = selectedVoice;
      newUtterance.rate = rateRange.value;
      newUtterance.volume = volumeRange.value;
      return newUtterance;
    }
  
    // Function to start audio recording
    function startRecording() {
      audioChunks = [];
      const stream = audioContext.createMediaStreamDestination().stream;
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      mediaRecorder.start();
    }
  
    // Function to stop audio recording and return audio URL
    function stopRecording() {
      return new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          resolve(audioUrl);
        };
        mediaRecorder.stop();
      });
    }
  
    // Function to speak the provided text
    function speak(text) {
      utterance = createUtterance(text);
      window.speechSynthesis.speak(utterance);
  
      startRecording();
      utterance.onend = async () => {
        const audioUrl = await stopRecording();
        downloadAudioButton.onclick = () => {
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = audioUrl;
          a.download = 'speech.wav';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a); // Cleanup
          window.URL.revokeObjectURL(audioUrl);
        };
      };
    }
  
    // Event listeners for buttons and input ranges
  
    speakButton.addEventListener('click', () => {
      const text = textArea.value;
      speak(text);
    });
  
    pauseButton.addEventListener('click', () => {
      window.speechSynthesis.pause();
    });
  
    resumeButton.addEventListener('click', () => {
      window.speechSynthesis.resume();
    });
  
    removeTextButton.addEventListener('click', () => {
      textArea.value = '';
    });
  
    resetButton.addEventListener('click', () => {
      initializeSpeech();
    });
  
    rateRange.addEventListener('input', () => {
      if (utterance) {
        utterance.rate = rateRange.value;
      }
    });
  
    volumeRange.addEventListener('input', () => {
      if (utterance) {
        utterance.volume = volumeRange.value;
      }
    });
  
    voiceSelect.addEventListener('change', () => {
      if (utterance) {
        utterance.voice = window.speechSynthesis.getVoices()[voiceSelect.value];
      }
    });
  
    uploadFileButton.addEventListener('click', () => {
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          const text = event.target.result;
          textArea.value = text;
          speak(text);
        };
        reader.readAsText(file);
      }
    });
    
  
    extractTextButton.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            function: () => document.body.innerText
          },
          (results) => {
            const text = results[0].result;
            textArea.value = text;
            speak(text);
          }
        );
      });
    });
  });
  
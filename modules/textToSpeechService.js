const TextToSpeechService = {
    isPlaying: false,
    isPaused: false,
    currentUtterance: null,
    selectedVoiceURI: '',
    utteranceQueue: [],
    playbackId: 0,
    currentOptions: {},

    init() {
        if (!('speechSynthesis' in window)) return;
        const handleVoicesChanged = () => {
            this.dispatch('tts-voices-changed');
        };
        if (window.speechSynthesis.addEventListener) {
            window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        } else {
            window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
        }
        this.loadVoicePreference();
        this.dispatch('tts-voices-changed');
    },

    getAvailableVoices() {
        if (!('speechSynthesis' in window)) return [];
        return window.speechSynthesis.getVoices()
            .filter(voice => voice.lang.toLowerCase().startsWith('en'))
            .sort((first, second) => first.name.localeCompare(second.name));
    },

    getPreferredVoice() {
        const voices = this.getAvailableVoices();
        if (this.selectedVoiceURI) {
            const selectedVoice = voices.find(voice => voice.voiceURI === this.selectedVoiceURI);
            if (selectedVoice) return selectedVoice;
        }

        const scoreVoice = voice => {
            const name = voice.name.toLowerCase();
            let score = voice.lang.toLowerCase() === 'en-us' ? 20 : 0;
            if (/neural|natural|enhanced|premium/.test(name)) score += 100;
            if (/aria|jenny|guy|samantha|ava|google us english/.test(name)) score += 40;
            if (/microsoft|google/.test(name)) score += 20;
            if (voice.default) score += 5;
            return score;
        };

        return voices.sort((first, second) => scoreVoice(second) - scoreVoice(first))[0] || null;
    },

    setVoice(voiceURI) {
        const normalizedURI = voiceURI || '';
        if (normalizedURI && !this.getAvailableVoices().some(voice => voice.voiceURI === normalizedURI)) {
            return false;
        }

        this.selectedVoiceURI = normalizedURI;
        try {
            if (normalizedURI) {
                localStorage.setItem('lesson_voice_preference', normalizedURI);
            } else {
                localStorage.removeItem('lesson_voice_preference');
            }
        } catch (error) {
            console.warn('[Speech] Could not save voice preference:', error);
        }
        return true;
    },

    loadVoicePreference() {
        try {
            const savedURI = localStorage.getItem('lesson_voice_preference');
            if (savedURI && this.getAvailableVoices().some(voice => voice.voiceURI === savedURI)) {
                this.selectedVoiceURI = savedURI;
            }
        } catch (error) {
            console.warn('[Speech] Could not load voice preference:', error);
        }
    },

    speak(text, options = {}) {
        const normalizedText = String(text || '').trim();
        if (!normalizedText) return false;
        if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') {
            this.dispatch('tts-error', { message: 'Speech synthesis is not available in this browser.' });
            options.onError?.(new Error('Speech synthesis is not available in this browser.'));
            return false;
        }

        this.stop();
        this.utteranceQueue = this.splitText(normalizedText);
        this.currentOptions = options;
        this.isPlaying = true;
        this.playNext(this.playbackId);
        return true;
    },

    splitText(text, maxLength = 220) {
        const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;
            if (trimmedSentence.length > maxLength) {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = '';
                let longChunk = '';
                for (const word of trimmedSentence.split(/\s+/)) {
                    const candidate = longChunk ? `${longChunk} ${word}` : word;
                    if (candidate.length > maxLength && longChunk) {
                        chunks.push(longChunk);
                        longChunk = word;
                    } else {
                        longChunk = candidate;
                    }
                }
                currentChunk = longChunk;
                continue;
            }

            const candidate = currentChunk ? `${currentChunk} ${trimmedSentence}` : trimmedSentence;
            if (candidate.length > maxLength && currentChunk) {
                chunks.push(currentChunk);
                currentChunk = trimmedSentence;
            } else {
                currentChunk = candidate;
            }
        }

        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    },

    playNext(playbackId) {
        if (playbackId !== this.playbackId || this.isPaused) return;
        const text = this.utteranceQueue.shift();
        if (!text) {
            this.isPlaying = false;
            this.currentUtterance = null;
            this.dispatch('tts-ended');
            return;
        }

        const utterance = new window.SpeechSynthesisUtterance(text);
        const voice = this.getPreferredVoice();
        utterance.lang = voice?.lang || 'en-US';
        utterance.rate = this.currentOptions.rate ?? 0.9;
        utterance.pitch = this.currentOptions.pitch ?? 1;
        utterance.volume = this.currentOptions.volume ?? 1;
        if (voice) utterance.voice = voice;

        utterance.onend = () => {
            if (playbackId === this.playbackId) this.playNext(playbackId);
        };
        utterance.onerror = event => {
            if (playbackId !== this.playbackId || event.error === 'canceled' || event.error === 'interrupted') return;
            this.isPlaying = false;
            this.currentUtterance = null;
            const error = new Error(`Speech playback failed: ${event.error || 'unknown error'}`);
            this.dispatch('tts-error', { message: error.message });
            this.currentOptions.onError?.(error);
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    },

    pause() {
        if (!this.isPlaying || this.isPaused) return;
        window.speechSynthesis.pause();
        this.isPaused = true;
    },

    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        window.speechSynthesis.resume();
    },

    stop() {
        this.playbackId++;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentUtterance = null;
        this.utteranceQueue = [];
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },

    isCurrentlyPlaying() {
        return this.isPlaying && !this.isPaused;
    },

    dispatch(name, detail = {}) {
        document.dispatchEvent(new CustomEvent(name, { detail }));
    }
};

if (typeof window !== 'undefined') {
    window.TextToSpeechService = TextToSpeechService;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TextToSpeechService.init(), { once: true });
    } else {
        TextToSpeechService.init();
    }
}

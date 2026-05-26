// modules/textToSpeechService.js
/**
 * Text-to-Speech Service using ElevenLabs API
 * Provides modern, high-quality neural voices for lesson audio
 */

const TextToSpeechService = {
    // ElevenLabs API configuration
    ELEVENLABS_API_KEY: null,
    ELEVENLABS_BASE_URL: 'https://api.elevenlabs.io/v1',
    VOICE_ID: 'EXAVITQu4vr4xnSDxMaL', // Default: English US voice (Rachel) - professional, clear
    
    // Available voices (high-quality English voices)
    VOICES: {
        'rachel': {
            id: 'EXAVITQu4vr4xnSDxMaL',
            name: 'Rachel (Female)',
            description: 'Clear, professional female voice'
        },
        'sam': {
            id: 'pFZP5JQG7iQjIQuC4Iy7',
            name: 'Sam (Male)',
            description: 'Clear, professional male voice'
        },
        'bella': {
            id: 'EXAVITQu4vr4xnSDxMaL',
            name: 'Bella (Female)',
            description: 'Warm, engaging female voice'
        }
    },

    // State
    isPlaying: false,
    currentAudio: null,
    currentUtterance: null,

    /**
     * Initialize the TTS service
     * Tries to load API key from localStorage, falls back to Web Speech API
     */
    init: function () {
        const apiKey = localStorage.getItem('elevenlabs_api_key');
        if (apiKey) {
            this.ELEVENLABS_API_KEY = apiKey;
            console.log('✅ ElevenLabs API key loaded from localStorage');
        } else {
            console.log('ℹ️ No ElevenLabs API key found. Web Speech API will be used as fallback.');
            console.log('To use ElevenLabs: localStorage.setItem("elevenlabs_api_key", "YOUR_KEY")');
        }
    },

    /**
     * Set API key (can be called from browser console)
     */
    setApiKey: function (apiKey) {
        if (!apiKey) {
            console.error('❌ API key is required');
            return false;
        }
        this.ELEVENLABS_API_KEY = apiKey;
        localStorage.setItem('elevenlabs_api_key', apiKey);
        console.log('✅ ElevenLabs API key saved to localStorage');
        return true;
    },

    /**
     * Set voice by name
     */
    setVoice: function (voiceName) {
        if (!this.VOICES[voiceName]) {
            console.warn(`Unknown voice: ${voiceName}. Using default (rachel).`);
            return false;
        }
        this.VOICE_ID = this.VOICES[voiceName].id;
        localStorage.setItem('tts_voice_preference', voiceName);
        console.log(`✅ Voice set to: ${this.VOICES[voiceName].name}`);
        return true;
    },

    /**
     * Load voice preference from localStorage
     */
    loadVoicePreference: function () {
        const savedVoice = localStorage.getItem('tts_voice_preference');
        if (savedVoice && this.VOICES[savedVoice]) {
            this.setVoice(savedVoice);
        }
    },

    /**
     * Speak text using ElevenLabs or fallback to Web Speech API
     */
    speak: function (text, options = {}) {
        if (!text) {
            console.warn('No text provided to speak');
            return;
        }

        // Stop any existing audio
        this.stop();

        // Try ElevenLabs first if API key is available
        if (this.ELEVENLABS_API_KEY) {
            this.speakWithElevenLabs(text, options);
        } else {
            // Fallback to improved Web Speech API
            console.log('Using Web Speech API fallback');
            this.speakWithWebSpeechAPI(text, options);
        }
    },

    /**
     * Speak using ElevenLabs API
     */
    speakWithElevenLabs: function (text, options = {}) {
        const voiceId = options.voiceId || this.VOICE_ID;
        const url = `${this.ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`;

        const payload = {
            text: text,
            model_id: options.modelId || 'eleven_monolingual_v1', // Latest model for English
            voice_settings: {
                stability: options.stability || 0.5,
                similarity_boost: options.similarityBoost || 0.75,
                style: options.style || 0,
                use_speaker_boost: options.useSpeakerBoost || true
            }
        };

        this.isPlaying = true;

        fetch(url, {
            method: 'POST',
            headers: {
                'xi-api-key': this.ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Invalid ElevenLabs API key');
                    } else if (response.status === 429) {
                        throw new Error('Rate limit exceeded. Try again later.');
                    }
                    throw new Error(`API error: ${response.status}`);
                }
                return response.arrayBuffer();
            })
            .then(audioBuffer => {
                const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                this.currentAudio = new Audio(audioUrl);
                this.currentAudio.onended = () => this.onAudioEnd();
                this.currentAudio.onerror = () => this.onAudioError();
                
                this.currentAudio.play().catch(error => {
                    console.error('Failed to play audio:', error);
                    this.isPlaying = false;
                    if (options.onError) options.onError(error);
                });
            })
            .catch(error => {
                console.warn('❌ ElevenLabs error:', error.message);
                console.log('Falling back to Web Speech API...');
                this.isPlaying = false;
                // Fallback to Web Speech API
                this.speakWithWebSpeechAPI(text, options);
            });
    },

    /**
     * Improved Web Speech API fallback with better voice selection
     */
    speakWithWebSpeechAPI: function (text, options = {}) {
        const speechSynthesis = window.speechSynthesis;
        if (!speechSynthesis) {
            console.error('Speech Synthesis not supported in this browser');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = options.rate || 0.95;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;

        // Get available voices and select the best one
        const voices = speechSynthesis.getVoices();
        
        // Priority: Look for specific high-quality voices
        const preferredVoiceNames = [
            'Google US English',
            'Microsoft Zira Desktop',
            'Samantha',
            'Victoria',
            'Alex'
        ];

        let selectedVoice = null;
        for (const preferredName of preferredVoiceNames) {
            selectedVoice = voices.find(v => 
                v.lang.startsWith('en') && v.name.includes(preferredName)
            );
            if (selectedVoice) {
                console.log(`Using voice: ${selectedVoice.name}`);
                break;
            }
        }

        // Fallback to any English voice
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.startsWith('en-US'));
        }

        // Last resort: use any voice
        if (!selectedVoice) {
            selectedVoice = voices[0];
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.onend = () => this.onAudioEnd();
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.isPlaying = false;
            if (options.onError) options.onError(event.error);
        };

        this.currentUtterance = utterance;
        this.isPlaying = true;
        speechSynthesis.speak(utterance);
    },

    /**
     * Stop current playback
     */
    stop: function () {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }

        if (this.currentUtterance) {
            window.speechSynthesis?.cancel();
            this.currentUtterance = null;
        }

        this.isPlaying = false;
    },

    /**
     * Pause current playback
     */
    pause: function () {
        if (this.currentAudio) {
            this.currentAudio.pause();
        }
        // Note: Web Speech API doesn't have pause, only cancel
        this.isPlaying = false;
    },

    /**
     * Resume current playback
     */
    resume: function () {
        if (this.currentAudio) {
            this.currentAudio.play();
            this.isPlaying = true;
        }
    },

    /**
     * Check if currently playing
     */
    isCurrentlyPlaying: function () {
        return this.isPlaying;
    },

    /**
     * Callback when audio ends
     */
    onAudioEnd: function () {
        this.isPlaying = false;
        // Dispatch custom event for UI updates
        document.dispatchEvent(new CustomEvent('tts-ended'));
    },

    /**
     * Callback when audio has error
     */
    onAudioError: function () {
        this.isPlaying = false;
        console.error('Audio playback error');
        document.dispatchEvent(new CustomEvent('tts-error'));
    },

    /**
     * Get list of available voices
     */
    getAvailableVoices: function () {
        return Object.entries(this.VOICES).map(([key, voice]) => ({
            id: key,
            ...voice
        }));
    }
};

// Initialize on script load
window.addEventListener('DOMContentLoaded', () => {
    TextToSpeechService.init();
    TextToSpeechService.loadVoicePreference();
});

window.TextToSpeechService = TextToSpeechService;

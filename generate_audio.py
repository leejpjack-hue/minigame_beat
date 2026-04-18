import wave
import struct
import math
import os
import random

os.makedirs('public/assets/audio', exist_ok=True)

SAMPLE_RATE = 44100

def generate_rock_segment(duration, base_freq, intensity=1.0, drum_style='standard'):
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    
    # Tempo/Beats
    tempo = 140 if drum_style != 'fast' else 170
    if drum_style == 'slow_heavy': tempo = 100
    
    samples_per_beat = int(SAMPLE_RATE * (60 / tempo))
    
    for i in range(num_samples):
        t = float(i) / SAMPLE_RATE
        beat_idx = i // samples_per_beat
        pos_in_beat = i % samples_per_beat
        
        # --- GUITAR (Detuned Sawtooths) ---
        freqs = [base_freq, base_freq * 1.5, base_freq * 2.0]
        val_guitar = 0
        for f in freqs:
            val_guitar += (2.0 * ( (t * f * 1.005) % 1.0) - 1.0) * 0.3
            val_guitar += (2.0 * ( (t * f * 0.995) % 1.0) - 1.0) * 0.3
        
        # Distortion
        val_guitar = max(-0.5, min(0.5, val_guitar * 2.0))
        
        # --- DRUMS ---
        val_drums = 0
        # Kick
        if beat_idx % 2 == 0 and pos_in_beat < 2500:
            kick_t = pos_in_beat / 2500
            val_drums += math.sin(2.0 * math.pi * 50 * (1.0 - kick_t)) * (1.0 - kick_t) * 0.9
            
        # Snare
        if beat_idx % 2 == 1 and pos_in_beat < 3500:
            snare_t = pos_in_beat / 3500
            val_drums += (random.uniform(-1.0, 1.0)) * (1.0 - snare_t) * 0.6
            
        # Hi-hat
        if pos_in_beat % (samples_per_beat // (4 if drum_style == 'fast' else 2)) < 600:
            val_drums += (random.uniform(-1.0, 1.0)) * 0.2

        val_total = (val_guitar * 0.6 + val_drums * 0.4) * intensity
        samples.append(val_total)
        
    return samples

def save_wav(filename, samples):
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        for s in samples:
            packed_value = struct.pack('h', int(max(-1.0, min(1.0, s)) * 32767.0))
            wav_file.writeframes(packed_value)

print("Generating 4 distinct thematic stage BGMs...")

# Stage 1: Xianyang Streets - Upbeat & Busy (E Mixolydian feel)
s1 = []
for f in [164.81, 196.00, 220.00, 164.81]: # E, G, A, E
    s1.extend(generate_rock_segment(0.5, f))
save_wav('public/assets/audio/bgm_stage1.wav', s1 * 8)

# Stage 2: Zhao Palace - Tense & Driving (A Minor feel)
s2 = []
for f in [220.00, 261.63, 293.66, 220.00]: # A, C, D, A
    s2.extend(generate_rock_segment(0.4, f, intensity=1.1))
save_wav('public/assets/audio/bgm_stage2.wav', s2 * 10)

# Stage 3: Qin Border Wall - Fast & Aggressive (D Phrygian feel)
s3 = []
for f in [146.83, 155.56, 174.61, 146.83]: # D, Eb, F, D
    s3.extend(generate_rock_segment(0.3, f, intensity=1.3, drum_style='fast'))
save_wav('public/assets/audio/bgm_stage3.wav', s3 * 16)

# Stage 4: Qin Throne Room - Epic & Heavy (B Phrygian feel)
s4 = []
for f in [123.47, 130.81, 146.83, 123.47]: # B, C, D, B
    s4.extend(generate_rock_segment(0.8, f, intensity=1.5, drum_style='slow_heavy'))
save_wav('public/assets/audio/bgm_stage4.wav', s4 * 6)

# Menu: Lighter rock
sm = []
for f in [196.00, 146.83, 164.81, 130.81]: # G, D, E, C
    sm.extend(generate_rock_segment(1.0, f, intensity=0.6))
save_wav('public/assets/audio/bgm_menu.wav', sm * 4)

# Regenerate UI/SFX to be sure
def generate_simple_tone(filename, freq, duration, volume=0.5, wave_type='sine'):
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = float(i) / SAMPLE_RATE
        if wave_type == 'sine': value = math.sin(2.0 * math.pi * freq * t)
        elif wave_type == 'square': value = 1.0 if math.sin(2.0 * math.pi * freq * t) > 0 else -1.0
        elif wave_type == 'noise': value = random.uniform(-1.0, 1.0)
        envelope = 1.0 - (i / num_samples)
        samples.append(value * volume * envelope)
    save_wav(filename, samples)

generate_simple_tone('public/assets/audio/sfx_punch.wav', 150, 0.1, wave_type='noise')
generate_simple_tone('public/assets/audio/sfx_kick.wav', 100, 0.15, wave_type='noise')
generate_simple_tone('public/assets/audio/sfx_slash.wav', 800, 0.1, wave_type='noise')
generate_simple_tone('public/assets/audio/sfx_special.wav', 440, 0.5, wave_type='square')
generate_simple_tone('public/assets/audio/voice_shout1.wav', 300, 0.3, wave_type='sine')
generate_simple_tone('public/assets/audio/voice_shout2.wav', 350, 0.3, wave_type='sine')
generate_simple_tone('public/assets/audio/voice_ko.wav', 150, 1.0, wave_type='square')
generate_simple_tone('public/assets/audio/ui_select.wav', 600, 0.1, wave_type='sine')
generate_simple_tone('public/assets/audio/ui_confirm.wav', 800, 0.15, wave_type='sine')
generate_simple_tone('public/assets/audio/ui_wave_start.wav', 440, 0.5, wave_type='sine')

print("Thematic stage BGMs generated.")

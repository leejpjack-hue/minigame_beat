import wave
import struct
import math
import os

os.makedirs('public/assets/audio', exist_ok=True)

def generate_tone(filename, freq, duration, volume=0.5, wave_type='sine'):
    sample_rate = 44100
    num_samples = int(sample_rate * duration)
    
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        for i in range(num_samples):
            t = float(i) / sample_rate
            if wave_type == 'sine':
                value = math.sin(2.0 * math.pi * freq * t)
            elif wave_type == 'square':
                value = 1.0 if math.sin(2.0 * math.pi * freq * t) > 0 else -1.0
            elif wave_type == 'noise':
                import random
                value = random.uniform(-1.0, 1.0)
            
            # Fade out
            envelope = 1.0 - (i / num_samples)
            
            packed_value = struct.pack('h', int(value * volume * envelope * 32767.0))
            wav_file.writeframes(packed_value)

# Generate BGM placeholders (just a long low tone for now)
generate_tone('public/assets/audio/bgm_menu.wav', 220, 2.0, wave_type='sine')
generate_tone('public/assets/audio/bgm_stage1.wav', 261.63, 2.0, wave_type='sine')
generate_tone('public/assets/audio/bgm_stage2.wav', 293.66, 2.0, wave_type='sine')
generate_tone('public/assets/audio/bgm_stage3.wav', 329.63, 2.0, wave_type='sine')

# Generate Hit Sounds
generate_tone('public/assets/audio/sfx_punch.wav', 150, 0.1, wave_type='noise')
generate_tone('public/assets/audio/sfx_kick.wav', 100, 0.15, wave_type='noise')
generate_tone('public/assets/audio/sfx_slash.wav', 800, 0.1, wave_type='noise')
generate_tone('public/assets/audio/sfx_special.wav', 440, 0.5, wave_type='square')

# Voice Clips (shouts)
generate_tone('public/assets/audio/voice_shout1.wav', 300, 0.3, wave_type='sine')
generate_tone('public/assets/audio/voice_shout2.wav', 350, 0.3, wave_type='sine')
generate_tone('public/assets/audio/voice_ko.wav', 150, 1.0, wave_type='square')

# UI Sounds
generate_tone('public/assets/audio/ui_select.wav', 600, 0.1, wave_type='sine')
generate_tone('public/assets/audio/ui_confirm.wav', 800, 0.15, wave_type='sine')
generate_tone('public/assets/audio/ui_wave_start.wav', 440, 0.5, wave_type='sine')

print("Audio placeholders generated.")

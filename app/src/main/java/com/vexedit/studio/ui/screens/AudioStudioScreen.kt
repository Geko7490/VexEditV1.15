package com.vexedit.studio.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexedit.studio.ui.components.AudioWaveformCanvas
import com.vexedit.studio.ui.theme.*

@Composable
fun AudioStudioScreen(
    onBack: () -> Unit
) {
    var isPlaying by remember { mutableStateOf(false) }

    // State for dB Faders
    val faderValues = remember {
        mutableStateListOf(2f, -5f, -2f, -2f, -3f, -5f)
    }

    val muteStates = remember {
        mutableStateListOf(false, false, false, false, false, false)
    }

    val soloStates = remember {
        mutableStateListOf(false, false, false, false, false, false)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(VexBackground)
            .verticalScroll(rememberScrollState())
    ) {
        // Top App Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Text(
                    text = "Audio Studio",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = VexTextPrimary
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { }) {
                    Icon(Icons.Default.Undo, contentDescription = "Undo", tint = Color.White)
                }
                IconButton(onClick = { }) {
                    Icon(Icons.Default.Redo, contentDescription = "Redo", tint = Color.White)
                }
                IconButton(onClick = { }) {
                    Icon(Icons.Default.Save, contentDescription = "Save", tint = Color.White)
                }
            }
        }

        // Preview Video Thumbnail
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(110.dp)
                .background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight(0.9f)
                    .aspectRatio(16f / 9f)
                    .background(Color(0xFF0F172A))
            )
        }

        // Multi-Track Audio Timeline
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(VexPanel)
                .padding(vertical = 8.dp)
        ) {
            // MUSIC
            AudioTrackLane(
                label = "MUSIC",
                waveformColor = VexWaveformGreen
            )
            Spacer(modifier = Modifier.height(6.dp))
            // VOICE
            AudioTrackLane(
                label = "VOICE",
                waveformColor = VexWaveformYellow
            )
            Spacer(modifier = Modifier.height(6.dp))
            // SOUND FX
            AudioTrackLane(
                label = "SOUND FX",
                waveformColor = VexWaveformCyan
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // dB Faders Row (6 Channels)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            faderValues.indices.forEach { index ->
                AudioMixerChannel(
                    dbValue = faderValues[index],
                    isMuted = muteStates[index],
                    isSolo = soloStates[index],
                    onMuteToggle = { muteStates[index] = !muteStates[index] },
                    onSoloToggle = { soloStates[index] = !soloStates[index] },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Audio Editing Tools Grid
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(VexPanel)
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Row 1
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) {
                AudioToolButton("Trim", Icons.Default.ContentCut)
                AudioToolButton("Fade", Icons.Default.Gradient)
                AudioToolButton("Volume", Icons.Default.VolumeUp)
                AudioToolButton("EQ", Icons.Default.GraphicEq)
                AudioToolButton("Effects", Icons.Default.AutoAwesome)
                AudioToolButton("Noise Gate", Icons.Default.Hearing)
            }
            // Row 2
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) {
                AudioToolButton("Compressor", Icons.Default.LinearScale)
                AudioToolButton("Reverb", Icons.Default.SurroundSound)
                AudioToolButton("Delay", Icons.Default.Speed)
                AudioToolButton("Limiter", Icons.Default.VerticalAlignTop)
            }
            // Row 3: Action Buttons & Transport
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                AudioToolButton("Split", Icons.Default.CallSplit)
                AudioToolButton("Duplicate", Icons.Default.ContentCopy)
                AudioToolButton("Delete", Icons.Default.Delete)
                AudioToolButton("Apply", Icons.Default.Check)

                // Play / Pause
                IconButton(onClick = { isPlaying = !isPlaying }) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = "Play",
                        tint = Color.White
                    )
                }
            }
        }
    }
}

@Composable
fun AudioTrackLane(
    label: String,
    waveformColor: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(36.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .width(84.dp)
                .fillMaxHeight()
                .background(VexBackground)
                .padding(horizontal = 8.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            Text(label, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight()
                .border(1.dp, VexBorder, VexShapes.small)
                .background(VexPanelLight)
                .padding(horizontal = 6.dp)
        ) {
            AudioWaveformCanvas(barColor = waveformColor)
        }
    }
}

@Composable
fun AudioMixerChannel(
    dbValue: Float,
    isMuted: Boolean,
    isSolo: Boolean,
    onMuteToggle: () -> Unit,
    onSoloToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .padding(horizontal = 2.dp)
            .background(VexPanel, VexShapes.small)
            .padding(vertical = 6.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "${if (dbValue >= 0) "+" else ""}${dbValue.toInt()} dB",
            fontSize = 10.sp,
            color = VexTextSecondary
        )
        Spacer(modifier = Modifier.height(4.dp))

        // Fader Slider representation
        Box(
            modifier = Modifier
                .width(18.dp)
                .height(64.dp)
                .background(VexBackground, VexShapes.small),
            contentAlignment = Alignment.Center
        ) {
            // Slider Knob in Vex Purple
            Box(
                modifier = Modifier
                    .width(16.dp)
                    .height(8.dp)
                    .background(VexPurple, VexShapes.small)
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        // M / S buttons
        Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            Box(
                modifier = Modifier
                    .size(16.dp)
                    .background(if (isMuted) Color(0xFFEF4444) else VexPanelLight, VexShapes.small)
                    .clickable(onClick = onMuteToggle),
                contentAlignment = Alignment.Center
            ) {
                Text("M", fontSize = 9.sp, color = Color.White)
            }
            Box(
                modifier = Modifier
                    .size(16.dp)
                    .background(if (isSolo) VexPurple else VexPanelLight, VexShapes.small)
                    .clickable(onClick = onSoloToggle),
                contentAlignment = Alignment.Center
            ) {
                Text("S", fontSize = 9.sp, color = Color.White)
            }
        }
    }
}

@Composable
fun AudioToolButton(label: String, icon: ImageVector) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable { }
            .padding(4.dp)
    ) {
        Icon(icon, contentDescription = label, tint = Color.White, modifier = Modifier.size(18.dp))
        Spacer(modifier = Modifier.height(2.dp))
        Text(label, fontSize = 10.sp, color = VexTextSecondary)
    }
}

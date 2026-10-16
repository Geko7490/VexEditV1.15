package com.vexedit.studio.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Undo
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexedit.studio.ui.components.DiamondKeyframeIcon
import com.vexedit.studio.ui.theme.*

@Composable
fun KeyframeEditorScreen(
    onBack: () -> Unit,
    onSave: () -> Unit
) {
    var posX by remember { mutableFloatStateOf(25.5f) }
    var posY by remember { mutableFloatStateOf(-10.0f) }
    var scale by remember { mutableFloatStateOf(100f) }
    var rotation by remember { mutableFloatStateOf(0.0f) }
    var opacity by remember { mutableFloatStateOf(85f) }

    var selectedCurve by remember { mutableStateOf("Ease In-Out") }
    val curves = listOf("Linear", "Ease Out", "Ease In", "Ease In-Out")

    var selectedSubTool by remember { mutableStateOf("Curves") }
    val subTools = listOf("Transform", "Motion", "Opacity", "Curves")

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
                    text = "Keyframe Editor",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = VexTextPrimary
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { }) {
                    Icon(Icons.Default.Undo, contentDescription = "Undo", tint = Color.White)
                }
                TextButton(onClick = onSave) {
                    Text("Save", color = VexPurple, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Preview & Parameter Control Split Area
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 6.dp)
        ) {
            // Stage on Left with Bounding Box "TITLES"
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(210.dp)
                    .background(Color.Black),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .border(2.dp, VexPurple, VexShapes.small)
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = "TITLES",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }

            Spacer(modifier = Modifier.width(10.dp))

            // Parameter Inputs on Right
            Column(
                modifier = Modifier
                    .weight(1f)
                    .background(VexPanel, VexShapes.small)
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                KeyframeParamRow("Position X", "${posX}")
                KeyframeParamRow("Position Y", "${posY}")
                KeyframeParamRow("Scale", "${scale.toInt()}%")
                KeyframeParamRow("Rotation", "${rotation}°")
                KeyframeParamRow("Opacity", "${opacity.toInt()}%", isFilled = true)

                Spacer(modifier = Modifier.height(4.dp))

                // Bezier Curve Canvas
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(60.dp)
                        .background(VexPanelLight, VexShapes.small)
                        .border(1.dp, VexBorder, VexShapes.small)
                ) {
                    Canvas(modifier = Modifier.fillMaxSize().padding(6.dp)) {
                        val path = Path().apply {
                            moveTo(0f, size.height)
                            cubicTo(
                                size.width * 0.4f, size.height,
                                size.width * 0.6f, 0f,
                                size.width, 0f
                            )
                        }
                        drawPath(path, color = VexPurple, style = Stroke(width = 3.dp.toPx()))
                    }
                }

                // Curve options 2x2 grid
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    CurveButton("Linear", selectedCurve == "Linear", Modifier.weight(1f)) { selectedCurve = "Linear" }
                    CurveButton("Ease Out", selectedCurve == "Ease Out", Modifier.weight(1f)) { selectedCurve = "Ease Out" }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    CurveButton("Ease In", selectedCurve == "Ease In", Modifier.weight(1f)) { selectedCurve = "Ease In" }
                    CurveButton("Ease In-Out", selectedCurve == "Ease In-Out", Modifier.weight(1f)) { selectedCurve = "Ease In-Out" }
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Keyframe Diamond Timeline Tracks
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(VexPanel)
                .padding(vertical = 8.dp)
        ) {
            KeyframeTrackRow("Video 1")
            KeyframeTrackRow("Transform", showDiamonds = true)
            KeyframeTrackRow("Transform", showDiamonds = true)
            KeyframeTrackRow("Opacity", showDiamonds = true)
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Previous / Add Keyframe / Next Keyframe Button Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(VexPanel)
                .padding(horizontal = 8.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Button(
                onClick = { },
                shape = VexShapes.small,
                colors = ButtonDefaults.buttonColors(containerColor = VexPanelLight)
            ) {
                Icon(Icons.Default.ChevronLeft, contentDescription = null, tint = Color.White)
                Text("Previous Keyframe", fontSize = 11.sp, color = Color.White)
            }

            Button(
                onClick = { },
                shape = VexShapes.small,
                colors = ButtonDefaults.buttonColors(containerColor = VexPanelLight)
            ) {
                DiamondKeyframeIcon(isFilled = true, color = Color.White, sizeDp = 12)
                Spacer(modifier = Modifier.width(4.dp))
                Text("+ Add Keyframe", fontSize = 11.sp, color = Color.White)
            }

            Button(
                onClick = { },
                shape = VexShapes.small,
                colors = ButtonDefaults.buttonColors(containerColor = VexPanelLight)
            ) {
                Text("Next Keyframe", fontSize = 11.sp, color = Color.White)
                Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Color.White)
            }
        }

        // Sub Tools Row: Transform, Motion, Opacity, Curves
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(VexBackground)
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            subTools.forEach { tool ->
                val isSelected = tool == selectedSubTool
                Column(
                    modifier = Modifier.clickable { selectedSubTool = tool },
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = tool,
                        fontSize = 12.sp,
                        color = if (isSelected) VexPurple else VexTextSecondary,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                    )
                }
            }
        }
    }
}

@Composable
fun KeyframeParamRow(label: String, value: String, isFilled: Boolean = false) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 11.sp, color = VexTextSecondary)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(value, fontSize = 11.sp, color = Color.White)
            Spacer(modifier = Modifier.width(6.dp))
            DiamondKeyframeIcon(isFilled = isFilled, sizeDp = 12)
        }
    }
}

@Composable
fun CurveButton(label: String, isSelected: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Box(
        modifier = modifier
            .background(if (isSelected) VexPurpleDark else VexPanelLight, VexShapes.small)
            .clickable(onClick = onClick)
            .padding(vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(label, fontSize = 10.sp, color = Color.White)
    }
}

@Composable
fun KeyframeTrackRow(label: String, showDiamonds: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(26.dp)
            .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 10.sp, color = VexTextSecondary, modifier = Modifier.width(70.dp))
        Box(
            modifier = Modifier
                .weight(1f)
                .height(1.dp)
                .background(VexBorder),
            contentAlignment = Alignment.Center
        ) {
            if (showDiamonds) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    DiamondKeyframeIcon(isFilled = true, sizeDp = 10)
                    DiamondKeyframeIcon(isFilled = false, sizeDp = 10)
                    DiamondKeyframeIcon(isFilled = true, sizeDp = 10)
                }
            }
        }
    }
}

package com.vexedit.studio.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexedit.studio.model.EffectType
import com.vexedit.studio.ui.theme.*

@Composable
fun EffectsLabScreen(
    onBack: () -> Unit,
    onApplyEffect: (EffectType, Float) -> Unit
) {
    var showBefore by remember { mutableStateOf(false) }
    var selectedCategory by remember { mutableStateOf("Light") }
    var selectedEffect by remember { mutableStateOf(EffectType.VIOLET_GLOW) }

    var intensity by remember { mutableFloatStateOf(1.0f) }
    var radius by remember { mutableFloatStateOf(0.0f) }
    var opacity by remember { mutableFloatStateOf(100f) }
    var blend by remember { mutableFloatStateOf(0.0f) }

    val categories = listOf("Cinematic", "Color", "Blur", "Glitch", "Light", "Distortion", "Audio")

    val effectsList = listOf(
        EffectType.VIOLET_GLOW,
        EffectType.FILM_GRAIN,
        EffectType.RGB_SPLIT,
        EffectType.CINEMATIC,
        EffectType.WARM,
        EffectType.COOL,
        EffectType.NOIR
    )

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
                    text = "Effects Lab",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = VexTextPrimary
                )
            }
            Row {
                TextButton(onClick = {
                    intensity = 1.0f
                    radius = 0f
                    opacity = 100f
                    blend = 0f
                }) {
                    Text("Reset", color = VexTextSecondary, fontSize = 13.sp)
                }
                TextButton(onClick = { }) {
                    Text("Save Preset", color = VexTextPrimary, fontSize = 13.sp)
                }
            }
        }

        // Preview Video Surface
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(170.dp)
                .background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight(0.95f)
                    .aspectRatio(16f / 9f)
                    .background(Color(0xFF0F172A)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (showBefore) "BEFORE (Original)" else "AFTER (${selectedEffect.label})",
                    fontSize = 14.sp,
                    color = if (showBefore) Color.White else VexPurple
                )
            }
        }

        // Before | After Toggle
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(VexPanel)
                .padding(vertical = 6.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Before", fontSize = 12.sp, color = VexTextSecondary)
            Spacer(modifier = Modifier.width(8.dp))
            Switch(
                checked = !showBefore,
                onCheckedChange = { showBefore = !it },
                colors = SwitchDefaults.colors(
                    checkedThumbColor = Color.White,
                    checkedTrackColor = VexPurple,
                    uncheckedThumbColor = Color.White,
                    uncheckedTrackColor = VexBorder
                )
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text("After", fontSize = 12.sp, color = VexPurple)
        }

        // Categories Scrollable Row
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp, horizontal = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(categories.size) { idx ->
                val cat = categories[idx]
                val isSelected = cat == selectedCategory
                Column(
                    modifier = Modifier.clickable { selectedCategory = cat },
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = cat,
                        fontSize = 13.sp,
                        color = if (isSelected) Color.White else VexTextSecondary,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Box(
                        modifier = Modifier
                            .height(2.dp)
                            .width(28.dp)
                            .background(if (isSelected) VexPurple else Color.Transparent)
                    )
                }
            }
        }

        // Effect Cards Grid (2 rows)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            effectsList.take(4).forEach { fx ->
                val isSelected = fx == selectedEffect
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { selectedEffect = fx },
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp)
                            .background(VexPanelLight, VexShapes.small)
                            .border(
                                width = if (isSelected) 2.dp else 1.dp,
                                color = if (isSelected) VexPurple else VexBorder,
                                shape = VexShapes.small
                            )
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = fx.label,
                        fontSize = 10.sp,
                        color = VexTextPrimary,
                        maxLines = 1
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Sliders container
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            EffectSliderRow(label = "Intensity", value = intensity, onValueChange = { intensity = it }, valueDisplay = String.format(java.util.Locale.US, "%.2f", intensity))
            EffectSliderRow(label = "Radius", value = radius, onValueChange = { radius = it }, valueDisplay = String.format(java.util.Locale.US, "%.2f", radius))
            EffectSliderRow(label = "Opacity", value = opacity / 100f, onValueChange = { opacity = it * 100f }, valueDisplay = "${opacity.toInt()}%")
            EffectSliderRow(label = "Blend", value = blend, onValueChange = { blend = it }, valueDisplay = String.format(java.util.Locale.US, "%.2f", blend))
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Action Buttons: Cancel / Apply
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedButton(
                onClick = onBack,
                shape = VexShapes.small,
                modifier = Modifier
                    .weight(1f)
                    .height(44.dp),
                colors = ButtonDefaults.outlinedButtonColors(
                    containerColor = VexPanel,
                    contentColor = VexTextPrimary
                )
            ) {
                Text("Cancel", fontSize = 14.sp)
            }
            Button(
                onClick = { onApplyEffect(selectedEffect, intensity * 100f) },
                shape = VexShapes.small,
                colors = ButtonDefaults.buttonColors(containerColor = VexPurple),
                modifier = Modifier
                    .weight(1f)
                    .height(44.dp)
            ) {
                Text("Apply", fontSize = 14.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun EffectSliderRow(
    label: String,
    value: Float,
    onValueChange: (Float) -> Unit,
    valueDisplay: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            color = VexTextSecondary,
            modifier = Modifier.width(68.dp)
        )
        Slider(
            value = value,
            onValueChange = onValueChange,
            colors = SliderDefaults.colors(
                thumbColor = VexPurple,
                activeTrackColor = VexPurple,
                inactiveTrackColor = VexBorder
            ),
            modifier = Modifier.weight(1f)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = valueDisplay,
            fontSize = 12.sp,
            color = VexTextPrimary,
            modifier = Modifier.width(44.dp)
        )
    }
}

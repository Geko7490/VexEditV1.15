package com.vexedit.studio.ui.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.graphics.Color

val VexBackground = Color(0xFF101014)
val VexPanel = Color(0xFF1C1B23)
val VexPanelLight = Color(0xFF25242E)
val VexBorder = Color(0xFF2E2D38)
val VexPurple = Color(0xFFA855F7)
val VexPurpleDark = Color(0xFF7E22CE)
val VexPurpleLight = Color(0xFFC084FC)
val VexTextPrimary = Color(0xFFFFFFFF)
val VexTextSecondary = Color(0xFF9CA3AF)
val VexWaveformGreen = Color(0xFF34D399)
val VexWaveformYellow = Color(0xFFFBBF24)
val VexWaveformCyan = Color(0xFF22D3EE)

val VexColorScheme = darkColorScheme(
    primary = VexPurple,
    onPrimary = Color.White,
    primaryContainer = VexPanel,
    onPrimaryContainer = VexTextPrimary,
    background = VexBackground,
    onBackground = VexTextPrimary,
    surface = VexPanel,
    onSurface = VexTextPrimary,
    surfaceVariant = VexPanelLight,
    onSurfaceVariant = VexTextSecondary,
    outline = VexBorder
)

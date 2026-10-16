package com.vexedit.studio.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexedit.studio.ui.theme.VexPurple

@Composable
fun VexBrandLogo(modifier: Modifier = Modifier, sizeDp: Int = 36) {
    Canvas(modifier = modifier.size(sizeDp.dp)) {
        val w = size.width
        val h = size.height

        val path1 = Path().apply {
            moveTo(w * 0.1f, h * 0.1f)
            lineTo(w * 0.5f, h * 0.85f)
            lineTo(w * 0.9f, h * 0.1f)
            lineTo(w * 0.65f, h * 0.22f)
            lineTo(w * 0.5f, h * 0.55f)
            lineTo(w * 0.35f, h * 0.28f)
            close()
        }

        val path2 = Path().apply {
            moveTo(w * 0.45f, h * 0.22f)
            lineTo(w * 0.85f, h * 0.40f)
            lineTo(w * 0.65f, h * 0.50f)
            lineTo(w * 0.90f, h * 0.68f)
            lineTo(w * 0.52f, h * 0.95f)
            lineTo(w * 0.32f, h * 0.60f)
        }

        drawPath(path1, color = VexPurple, style = Stroke(width = w * 0.07f))
        drawPath(path2, color = Color(0xFFC084FC), style = Stroke(width = w * 0.07f))
    }
}

@Composable
fun DiamondKeyframeIcon(
    isFilled: Boolean = false,
    color: Color = VexPurple,
    modifier: Modifier = Modifier,
    sizeDp: Int = 14
) {
    Canvas(modifier = modifier.size(sizeDp.dp)) {
        val w = size.width
        val h = size.height
        val path = Path().apply {
            moveTo(w / 2f, 0f)
            lineTo(w, h / 2f)
            lineTo(w / 2f, h)
            lineTo(0f, h / 2f)
            close()
        }
        if (isFilled) {
            drawPath(path, color = color)
        } else {
            drawPath(path, color = color, style = Stroke(width = 2.dp.toPx()))
        }
    }
}

@Composable
fun AudioWaveformCanvas(
    modifier: Modifier = Modifier,
    barColor: Color = Color(0xFF34D399),
    barsCount: Int = 40
) {
    Canvas(modifier = modifier.fillMaxSize()) {
        val barWidth = size.width / (barsCount * 1.5f)
        val spacing = barWidth * 0.5f
        val midY = size.height / 2f

        for (i in 0 until barsCount) {
            // Generate clean wave shapes
            val normalized = kotlin.math.sin(i * 0.35) * 0.4 + kotlin.math.cos(i * 0.8) * 0.3
            val heightFraction = (kotlin.math.abs(normalized) + 0.2).coerceIn(0.1, 0.95).toFloat()
            val barH = size.height * heightFraction

            val x = i * (barWidth + spacing)
            drawLine(
                color = barColor,
                start = Offset(x, midY - barH / 2f),
                end = Offset(x, midY + barH / 2f),
                strokeWidth = barWidth
            )
        }
    }
}

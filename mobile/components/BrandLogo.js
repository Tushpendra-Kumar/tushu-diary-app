import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { 
  Path, 
  Circle, 
  Defs, 
  LinearGradient, 
  Stop, 
  G, 
  Rect 
} from 'react-native-svg';

/**
 * BrandLogo — Official TushuDiary Monogram (T+D Fusion)
 * Seamlessly integrates the letters 'T' and 'D' in a luxury golden emblem.
 * 
 * @param {number} size - Outer diameter of the logo (default 72)
 * @param {boolean} showGlow - Whether to render subtle gold glow ring
 */
export default function BrandLogo({ size = 72, showGlow = true, style }) {
  const vbSize = 120; // 120x120 internal vector coordinate space

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${vbSize} ${vbSize}`}>
        <Defs>
          {/* Main Luxury Gold Gradient */}
          <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFE066" stopOpacity="1" />
            <Stop offset="30%" stopColor="#F59E0B" stopOpacity="1" />
            <Stop offset="70%" stopColor="#D97706" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FBBF24" stopOpacity="1" />
          </LinearGradient>

          {/* Deep Radial Glow for Background Disc */}
          <LinearGradient id="bgDisc" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#1C1810" stopOpacity="1" />
            <Stop offset="100%" stopColor="#08080A" stopOpacity="1" />
          </LinearGradient>

          {/* Subtle Outer Ring Gradient */}
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
            <Stop offset="50%" stopColor="#78350F" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#FBBF24" stopOpacity="0.85" />
          </LinearGradient>

          {/* Highlight Shimmer for D-curve */}
          <LinearGradient id="curveShimmer" x1="0%" y1="0%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor="#FFF3A1" />
            <Stop offset="40%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#B45309" />
          </LinearGradient>
        </Defs>

        {/* Outer Subtle Ambient Ring (Glow) */}
        {showGlow && (
          <Circle
            cx="60"
            cy="60"
            r="56"
            stroke="rgba(245, 158, 11, 0.15)"
            strokeWidth="1.5"
            fill="none"
          />
        )}

        {/* Dark Obsidian Luxury Shield Base */}
        <Circle
          cx="60"
          cy="60"
          r="51"
          fill="url(#bgDisc)"
          stroke="url(#ringGrad)"
          strokeWidth="2.5"
        />

        {/* Concentric Inner Dashed Tech/Diary Ring */}
        <Circle
          cx="60"
          cy="60"
          r="45.5"
          stroke="rgba(245, 158, 11, 0.28)"
          strokeWidth="1"
          strokeDasharray="4 3"
          fill="none"
        />

        {/* ── Monogram: T + D Interlinked Geometric Signature ── */}
        <G>
          {/* 
            LETTER 'T' TOP HORIZONTAL BAR:
            Spans from x=28 to x=72 at y=32. Left side has elegant beveled wing, 
            right side gracefully anchors the top start of the 'D' loop.
          */}
          <Path
            d="M 28 35.5 
               C 28 32.5, 30.5 30, 34 30 
               L 68 30 
               C 71 30, 73 32, 73 34.5
               C 73 37, 71 39, 68 39
               L 54 39
               L 54 44
               L 42 44
               L 42 39
               L 34 39
               C 30.5 39, 28 37.5, 28 35.5 Z"
            fill="url(#goldGrad)"
          />

          {/*
            VERTICAL SHARED SPINE (The Stem of T and the Spine of D):
            From y=36 down to y=88, width ~10px (x=41 to x=51).
            T-stem and D-backbone united.
          */}
          <Path
            d="M 42 38
               L 53 38
               L 53 84
               C 53 87, 50.5 89, 47.5 89
               L 44.5 89
               C 42 89, 42 87, 42 84
               Z"
            fill="url(#goldGrad)"
          />

          {/*
            LETTER 'D' SWEEPING LUXURY ARCH:
            Starts from top of spine (x=48, y=36), arcs out boldly to x=88 (apex at y=61),
            and sweeps back down to meet base of spine at x=48, y=86.
            With inner cutout creating crisp legible letter D!
          */}
          <Path
            d="M 50 36.5
               C 66 36.5, 87 46, 87 61.5
               C 87 77, 66 86.5, 50 86.5
               L 50 76.5
               C 60 76.5, 75 70, 75 61.5
               C 75 53, 60 46.5, 50 46.5
               Z"
            fill="url(#curveShimmer)"
          />

          {/* Left Wing Jewel Dot (Monogram accent) */}
          <Circle
            cx="33"
            cy="34.5"
            r="1.8"
            fill="#FFFFFF"
            opacity="0.85"
          />

          {/* Center Intersection Light Accent */}
          <Circle
            cx="60"
            cy="60"
            r="2.2"
            fill="url(#goldGrad)"
          />

          {/* Bottom Anchor Step for 'T' */}
          <Rect
            x="36"
            y="85"
            width="17"
            height="4"
            rx="2"
            fill="url(#goldGrad)"
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({});
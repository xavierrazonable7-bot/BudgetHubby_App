import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const useND = Platform.OS !== "web";

export function LoadingScreen() {
  const pulse   = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: useND }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: useND }),
        Animated.timing(pulse, { toValue: 0.85, duration: 900, useNativeDriver: useND }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity }]}>
        {/* Glow ring */}
        <Animated.View style={[styles.glowRing, { transform: [{ scale: pulse }] }]}>
          <LinearGradient
            colors={["#C0394D", "#E05A6D", "#8B1A2E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          >
            <Ionicons name="wallet" size={40} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.appName}>Timpla</Text>
        <Text style={styles.tagline}>Preparing your workspace…</Text>

        {/* Dot loader */}
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <DotPulse key={i} delay={i * 220} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function DotPulse({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const run = () =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: useND }),
        Animated.timing(anim, { toValue: 0.3, duration: 500, useNativeDriver: useND }),
      ]);
    Animated.loop(run()).start();
  }, []);

  return (
    <Animated.View style={[styles.dot, { opacity: anim }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E0E0E",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { alignItems: "center", gap: 14 },
  glowRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: "#E05A6D30",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E05A6D",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 14,
  },
  appName: {
    fontSize: 36,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 13,
    color: "#6B7280",
    letterSpacing: 0.2,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#E05A6D",
  },
});

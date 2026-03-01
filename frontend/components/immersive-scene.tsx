"use client";

import { Float, Sphere, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";

function CoreOrb() {
  return (
    <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1.2}>
      <Sphere args={[1.2, 48, 48]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#7b2cff" emissive="#8f37ff" emissiveIntensity={0.8} roughness={0.15} metalness={0.7} />
      </Sphere>
    </Float>
  );
}

export function ImmersiveScene() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative h-[280px] overflow-hidden rounded-3xl border border-white/15 bg-black/30"
    >
      <Canvas camera={{ position: [0, 0, 4.2], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[3, 4, 5]} intensity={16} color="#5de4ff" />
        <pointLight position={[-5, -2, -2]} intensity={8} color="#ba72ff" />
        <Stars radius={50} depth={12} count={400} factor={2} saturation={0.4} fade />
        <CoreOrb />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(173,255,47,0.2),transparent_40%),radial-gradient(circle_at_90%_90%,rgba(93,228,255,0.2),transparent_40%)]" />
    </motion.div>
  );
}

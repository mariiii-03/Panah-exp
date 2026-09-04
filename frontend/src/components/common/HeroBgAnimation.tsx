import React, { useEffect, useRef } from 'react';

const HeroBgAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // PANAH color palette
    const colors = {
      bg: '#A8B89A',
      layerLight: '#C9D4C0',
      layerDark: '#8A9880',
      terracotta: '#C89968',
      cream: '#F5F1E8',
      navy: '#3B4A5C',
      floral: '#E8D7C3',
      accent: '#B08968',
    };

    let time = 0;
    const speed = 0.0003;

    class FloatingShape {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      color: string;
      layer: number;
      speed: number;
      rotation: number;

      constructor(x: number, y: number, size: number, color: string, layer: number, spd: number) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = size;
        this.color = color;
        this.layer = layer;
        this.speed = spd;
        this.rotation = Math.random() * Math.PI * 2;
      }

      update(t: number) {
        this.x = this.baseX + Math.sin(t * this.speed) * (20 + this.layer * 5);
        this.y = this.baseY + Math.cos(t * this.speed * 0.7) * (15 + this.layer * 3);
        this.rotation += this.speed * 0.3;
      }

      draw(c: CanvasRenderingContext2D, t: number) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.rotation);
        c.fillStyle = this.color;
        c.globalAlpha = 0.6 + Math.sin(t * 0.0002) * 0.15;
        c.beginPath();
        c.arc(0, 0, this.size, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    const shapes: FloatingShape[] = [];
    const palette = [colors.terracotta, colors.cream, colors.floral, colors.accent];
    for (let i = 0; i < 12; i++) {
      shapes.push(
        new FloatingShape(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 40 + 20,
          palette[Math.floor(Math.random() * 4)],
          Math.random() * 3,
          0.0001 + Math.random() * 0.0003
        )
      );
    }

    const drawWave = (y: number, amplitude: number, frequency: number, phase: number, color: string, alpha: number) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= canvas.width; x += 10) {
        const waveY = y + Math.sin((x * frequency + phase) * 0.01) * amplitude;
        ctx.lineTo(x, waveY);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();
    };

    const drawLayeredShapes = () => {
      const layerHeight = canvas.height * 0.25;
      const offset1 = Math.sin(time * speed * 0.5) * 8;
      const offset2 = Math.cos(time * speed * 0.7) * 6;
      const offset3 = Math.sin(time * speed * 0.3) * 10;
      ctx.fillStyle = colors.layerDark;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(0, canvas.height * 0.3 + offset1, canvas.width, layerHeight * 0.8);
      ctx.fillStyle = colors.navy;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(0, canvas.height * 0.5 + offset2, canvas.width, layerHeight * 0.6);
      ctx.fillStyle = colors.terracotta;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(0, canvas.height * 0.65 + offset3, canvas.width, layerHeight * 0.5);
    };

    const drawOrganicElements = () => {
      const t = time * speed;
      for (let i = 0; i < 3; i++) {
        const yPos = canvas.height * (0.2 + i * 0.3) + Math.sin(t + i) * 15;
        const widthVar = canvas.width * (0.6 + Math.sin(t * 1.5 + i) * 0.2);
        ctx.fillStyle = colors.cream;
        ctx.globalAlpha = 0.15 + Math.sin(t + i * 0.5) * 0.08;
        ctx.beginPath();
        ctx.ellipse(
          canvas.width * 0.5 + Math.sin(t + i) * 100,
          yPos,
          widthVar * 0.4,
          canvas.height * 0.15,
          Math.sin(t + i) * 0.3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    };

    const drawLighting = () => {
      const lightX = canvas.width * (0.3 + Math.sin(time * speed * 0.3) * 0.2);
      const lightY = canvas.height * (0.2 + Math.cos(time * speed * 0.25) * 0.15);
      const gradient = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, canvas.width * 0.6);
      gradient.addColorStop(0, 'rgba(248, 241, 232, 0.08)');
      gradient.addColorStop(0.5, 'rgba(248, 241, 232, 0.02)');
      gradient.addColorStop(1, 'rgba(248, 241, 232, 0)');
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    let animationFrameId: number;
    const animate = () => {
      time += 1;

      // Background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, '#B5C4A8');
      bgGradient.addColorStop(0.5, '#A8B89A');
      bgGradient.addColorStop(1, '#9FA890');
      ctx.fillStyle = bgGradient;
      ctx.globalAlpha = 1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawLayeredShapes();
      drawOrganicElements();

      drawWave(canvas.height * 0.35, 20, 0.8, time * speed * 100, colors.layerLight, 0.1);
      drawWave(canvas.height * 0.55, 25, 0.6, time * speed * 80, colors.terracotta, 0.08);
      drawWave(canvas.height * 0.7, 30, 0.4, time * speed * 120, colors.cream, 0.06);

      shapes.forEach((shape) => {
        shape.update(time);
        shape.draw(ctx, time);
      });

      drawLighting();

      // Vignette
      const vignetteGradient = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, 0,
        canvas.width * 0.5, canvas.height * 0.5,
        Math.max(canvas.width, canvas.height) * 0.8
      );
      vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.08)');
      ctx.fillStyle = vignetteGradient;
      ctx.globalAlpha = 1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
  );
};

export default HeroBgAnimation;
